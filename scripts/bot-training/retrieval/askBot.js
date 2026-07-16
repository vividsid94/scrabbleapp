/**
 * End-to-end demo of the retrieval-augmented bot mechanism:
 *   1. Pick a real historical decision point from dataset.jsonl as the query.
 *   2. Compute its features, retrieve the most similar past examples
 *      (excluding the same game, so it can't just crib the answer).
 *   3. Build the full prompt (position + retrieved examples + question).
 *   4. Print that exact prompt (so you can see exactly what's being sent).
 *   5. Call Gemini's free-tier API with it, print the response.
 *   6. Show what the human expert actually played, for comparison.
 *
 * Usage:
 *   node scripts/bot-training/retrieval/askBot.js               # random position
 *   node scripts/bot-training/retrieval/askBot.js 58184 3        # specific gameId + moveIndex
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { computeFeatures } = require('./features');
const { findSimilar } = require('./retrieve');

const DATASET_FILE = path.join(__dirname, '..', 'dataset.jsonl');
const GEMINI_MODEL = 'gemini-3.5-flash';
const PREMIUM_CODES = { 1: 'dl', 2: 'tl', 3: 'dw', 4: 'tw' };

function renderBoard(board) {
  return board.map(row =>
    row.map(cell => (typeof cell === 'string' ? cell : (PREMIUM_CODES[cell] || '.'))).join(' ')
  ).join('\n');
}

function loadDataset() {
  return fs.readFileSync(DATASET_FILE, 'utf8').trim().split('\n').map(l => JSON.parse(l));
}

function pickQuery(dataset) {
  const targetGameId = process.argv[2];
  const targetMoveIndex = process.argv[3] !== undefined ? parseInt(process.argv[3], 10) : undefined;

  if (targetGameId) {
    const found = dataset.find(r => r.gameId === targetGameId && (targetMoveIndex === undefined || r.moveIndex === targetMoveIndex));
    if (!found) throw new Error(`No record found for gameId=${targetGameId} moveIndex=${targetMoveIndex}`);
    return found;
  }

  const plays = dataset.filter(r => r.type === 'play' && r.note && r.note.length > 60);
  return plays[Math.floor(Math.random() * plays.length)];
}

function buildPrompt(query, neighbors) {
  const ownScoreBefore = query.playerTotalAfter - (query.score || 0);

  const examplesText = neighbors.map((n, i) => (
    `Example ${i + 1} (a similar past situation - rack ${n.rack}, distance score ${n.distance.toFixed(2)}):\n` +
    `  ${n.moveSummary}\n` +
    `  Reasoning: ${n.note}`
  )).join('\n\n');

  return [
    `You are an expert Scrabble player. Here are some similar situations you've faced before, with your own reasoning at the time:`,
    ``,
    examplesText,
    ``,
    `---`,
    ``,
    `Now here is your current position:`,
    ``,
    `Board (row 1-15, col A-O; dl/tl/dw/tw = premium squares, . = empty):`,
    renderBoard(query.boardBefore),
    ``,
    `Your rack: ${query.rack}`,
    `Your score: ${ownScoreBefore} | Opponent's score: ${query.opponentTotalBefore}`,
    `Tiles remaining in bag: ${query.poolRemainingBeforeMove}`,
    ``,
    `Using the same kind of thinking as in the examples above, what would you play here, and why?`
  ].join('\n');
}

async function callGemini(prompt, apiKey, retriesLeft = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();

  if (!res.ok) {
    const retryable = res.status === 503 || res.status === 429;
    if (retryable && retriesLeft > 0) {
      const delayMs = (4 - retriesLeft) * 2000; // 2s, 4s, 6s backoff
      console.log(`Gemini busy (${res.status}), retrying in ${delayMs}ms... (${retriesLeft} left)`);
      await new Promise(r => setTimeout(r, delayMs));
      return callGemini(prompt, apiKey, retriesLeft - 1);
    }
    throw new Error(`Gemini API error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY in .env - add it and re-run.');
    process.exit(1);
  }

  const dataset = loadDataset();
  const query = pickQuery(dataset);

  const ownScoreBefore = query.playerTotalAfter - (query.score || 0);
  const queryFeatures = computeFeatures({
    board: query.boardBefore,
    rack: query.rack,
    ownScoreBefore,
    opponentScoreBefore: query.opponentTotalBefore,
    poolRemaining: query.poolRemainingBeforeMove,
    moveType: query.type
  });

  const neighbors = findSimilar(queryFeatures, { k: 5, excludeGameId: query.gameId });

  const prompt = buildPrompt(query, neighbors);

  console.log('='.repeat(80));
  console.log('EXACT PROMPT SENT TO GEMINI:');
  console.log('='.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80));

  console.log('\nCalling Gemini (free tier)...\n');
  const response = await callGemini(prompt, apiKey);

  console.log('='.repeat(80));
  console.log('GEMINI RESPONSE:');
  console.log('='.repeat(80));
  console.log(response);

  console.log('\n' + '='.repeat(80));
  console.log('WHAT THE HUMAN EXPERT ACTUALLY PLAYED:');
  console.log('='.repeat(80));
  console.log(`${query.type === 'play' ? `${query.word} at ${query.location} for ${query.score} points` : query.type}`);
  console.log(`Their own reasoning: ${query.note}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
