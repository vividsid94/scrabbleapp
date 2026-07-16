/**
 * Tope's move logic: a retrieval-augmented LLM bot.
 *
 * Given the current position and a list of already-generated,
 * dictionary-validated candidate moves (from botLogic's movegen), this
 * retrieves similar historical situations from ~100K annotated expert-game
 * commentary examples and asks Gemini to pick ONE of the given candidates -
 * never to invent a word - and explain why.
 *
 * Feature-matching logic is intentionally duplicated (not required) from
 * scripts/bot-training/retrieval/features.js - that folder is an offline
 * data-prep tool, this is production code, and the overlap is small enough
 * that keeping them independent is simpler than coupling the two.
 */

const fs = require('fs');
const path = require('path');

// Tried in order - if the primary model is overloaded, rate-limited, or
// slow, fall through to the next rather than just retrying the same one.
// flash-lite goes first: in testing it was consistently fast and reliable,
// while 3.5-flash (heavier, does extended "thinking") was flaky - a 503
// once, a 12s hang another time. Keeping it second still gives it a shot
// without holding up the common case.
const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];
const PREMIUM_CODES = { 1: 'dl', 2: 'tl', 3: 'dw', 4: 'tw' };
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const PREMIUM_OPEN_CODES = new Set([3, 4]);

let cachedIndex = null;
function loadIndex() {
  if (cachedIndex) return cachedIndex;
  const indexPath = path.join(__dirname, 'topeRetrievalIndex.json');
  cachedIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  return cachedIndex;
}

function rackToChars(rack) {
  return Array.isArray(rack) ? rack : rack.split('');
}

function computeFeatures({ board, rack, ownScoreBefore, opponentScoreBefore, poolRemaining, moveType }) {
  const chars = rackToChars(rack);
  let vowelCount = 0;
  let consonantCount = 0;
  let hasBlank = false;
  let hasS = false;

  chars.forEach(ch => {
    const c = (ch || '').toUpperCase();
    if (c === '?' || c === '*') {
      hasBlank = true;
    } else if (VOWELS.has(c)) {
      vowelCount++;
    } else if (c === 'S') {
      hasS = true;
      consonantCount++;
    } else if (/[A-Z]/.test(c)) {
      consonantCount++;
    }
  });

  let openPremiumCount = 0;
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = board[r][c];
      if (typeof cell !== 'string' && PREMIUM_OPEN_CODES.has(cell)) {
        openPremiumCount++;
      }
    }
  }

  return {
    poolRemaining,
    scoreDiff: ownScoreBefore - opponentScoreBefore,
    vowelCount,
    consonantCount,
    hasBlank,
    hasS,
    openPremiumCount,
    moveType: moveType || 'play'
  };
}

function featureDistance(a, b) {
  if (a.moveType !== b.moveType) return Infinity;

  const poolDist = Math.abs(a.poolRemaining - b.poolRemaining) / 100;
  const scoreDist = Math.abs(a.scoreDiff - b.scoreDiff) / 100;
  const vowelDist = Math.abs(a.vowelCount - b.vowelCount) / 7;
  const consonantDist = Math.abs(a.consonantCount - b.consonantCount) / 7;
  const blankDist = a.hasBlank !== b.hasBlank ? 1 : 0;
  const sDist = a.hasS !== b.hasS ? 1 : 0;
  const opennessDist = Math.abs(a.openPremiumCount - b.openPremiumCount) / 40;

  return (
    poolDist * 2.0 +
    scoreDist * 1.0 +
    vowelDist * 1.0 +
    consonantDist * 1.0 +
    blankDist * 1.5 +
    sDist * 1.0 +
    opennessDist * 1.5
  );
}

function findSimilar(queryFeatures, index, k = 5) {
  const scored = [];
  for (const entry of index) {
    const dist = featureDistance(queryFeatures, entry.features);
    if (dist === Infinity) continue;
    scored.push({ entry, dist });
  }
  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, k).map(s => ({ ...s.entry, distance: s.dist }));
}

function renderBoard(board) {
  return board.map(row =>
    row.map(cell => (typeof cell === 'string' ? cell : (PREMIUM_CODES[cell] || '.'))).join(' ')
  ).join('\n');
}

function renderCandidate(move, i) {
  if (move.isExchange) {
    return `${i + 1}. Exchange tiles${move.leave ? ` (leave: ${move.leave})` : ''}`;
  }
  return `${i + 1}. ${move.word} at ${move.startPosition} for ${move.score} points${move.leave ? ` (leave: ${move.leave})` : ''}`;
}

function buildPrompt({ board, rack, ownScore, opponentScore, poolRemaining, candidateMoves, neighbors }) {
  const examplesText = neighbors.map((n, i) => (
    `Example ${i + 1} (a similar past situation - rack ${n.rack}):\n` +
    `  ${n.moveSummary}\n` +
    `  Reasoning: ${n.note}`
  )).join('\n\n');

  const candidatesText = candidateMoves.map(renderCandidate).join('\n');

  return [
    `You are an expert Scrabble player choosing between pre-generated candidate moves. All candidates below are already legal, dictionary-checked, and scored - you must choose ONE of them by number. Do not propose any other word or move.`,
    ``,
    `Here are some similar situations you've faced before, with your own reasoning at the time:`,
    ``,
    examplesText,
    ``,
    `---`,
    ``,
    `Current position:`,
    ``,
    `Board (row 1-15, col A-O; dl/tl/dw/tw = premium squares, . = empty):`,
    renderBoard(board),
    ``,
    `Your rack: ${rackToChars(rack).join('')}`,
    `Your score: ${ownScore} | Opponent's score: ${opponentScore}`,
    `Tiles remaining in bag: ${poolRemaining}`,
    ``,
    `Candidate moves:`,
    candidatesText,
    ``,
    `Using the same kind of thinking as in the examples above, which candidate would you choose, and why?`,
    ``,
    `Respond in exactly this format:`,
    `CHOICE: <candidate number>`,
    `REASONING: <your reasoning in 2-4 sentences>`
  ].join('\n');
}

const PER_MODEL_TIMEOUT_MS = 12000;

// Single attempt per model, no in-model retry - stacking retries *and*
// multiple fallback models was blowing past the function's execution
// timeout (that's what surfaced as "TimeoutError" instead of a real
// response). Resilience now comes from trying the next model quickly,
// not from hammering one that's already slow/overloaded. An AbortController
// caps how long any one model gets, so a hung request can't eat the whole
// budget either.
async function callGeminiModel(model, prompt, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PER_MODEL_TIMEOUT_MS);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Gemini API error (${res.status}) on ${model}: ${JSON.stringify(data)}`);
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } finally {
    clearTimeout(timeoutId);
  }
}

// Tries each model in GEMINI_MODELS in turn so a busy/overloaded/slow model
// doesn't take the whole request down - it just hands off to the next one.
async function callGemini(prompt, apiKey) {
  let lastError;
  for (const model of GEMINI_MODELS) {
    try {
      return await callGeminiModel(model, prompt, apiKey);
    } catch (err) {
      console.error(`=== TOPE SERVER: ${model} failed, trying next ===`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

function parseChoice(responseText, candidateCount) {
  const match = responseText.match(/CHOICE:\s*(\d+)/i);
  if (match) {
    const idx = parseInt(match[1], 10) - 1;
    if (idx >= 0 && idx < candidateCount) return idx;
  }
  return 0; // Safe fallback: highest-ranked candidate if parsing fails for any reason
}

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured on the server');
    }

    const { board, rack, ownScore, opponentScore, poolRemaining, candidateMoves } = JSON.parse(event.body || '{}');

    if (!Array.isArray(board) || board.length !== 15 || !Array.isArray(candidateMoves) || candidateMoves.length === 0) {
      throw new Error('Invalid input: board must be a 15x15 array and candidateMoves must be a non-empty array');
    }

    const ownScoreBefore = ownScore || 0;
    const opponentScoreBefore = opponentScore || 0;
    const poolRemainingSafe = poolRemaining || 0;

    const index = loadIndex();
    const queryFeatures = computeFeatures({
      board,
      rack,
      ownScoreBefore,
      opponentScoreBefore,
      poolRemaining: poolRemainingSafe,
      moveType: candidateMoves[0].isExchange ? 'exchange' : 'play'
    });
    const neighbors = findSimilar(queryFeatures, index, 8);

    const prompt = buildPrompt({
      board,
      rack,
      ownScore: ownScoreBefore,
      opponentScore: opponentScoreBefore,
      poolRemaining: poolRemainingSafe,
      candidateMoves,
      neighbors
    });

    const rawResponse = await callGemini(prompt, apiKey);
    const chosenIndex = parseChoice(rawResponse, candidateMoves.length);

    console.log('=== TOPE SERVER: LLM PROMPT ===');
    console.log(prompt);
    console.log('=== TOPE SERVER: LLM RESPONSE ===');
    console.log(rawResponse);
    console.log('=== TOPE SERVER: chose index ===', chosenIndex);

    return {
      statusCode: 200,
      body: JSON.stringify({ chosenIndex, prompt, rawResponse })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
