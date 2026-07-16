/**
 * Converts scripts/bot-training/dataset.jsonl (raw parsed examples) into the
 * {text_input, output} shape Gemini's tuning API expects.
 *
 * Usage:
 *   node scripts/bot-training/formatForTuning.js
 */

const fs = require('fs');
const path = require('path');

const IN_FILE = path.join(__dirname, 'dataset.jsonl');
const OUT_FILE = path.join(__dirname, 'tuning-data.jsonl');

const PREMIUM_CODES = { 1: 'dl', 2: 'tl', 3: 'dw', 4: 'tw' };

function renderBoard(board) {
  return board.map(row =>
    row.map(cell => (typeof cell === 'string' ? cell : (PREMIUM_CODES[cell] || '.'))).join(' ')
  ).join('\n');
}

function renderMove(record) {
  if (record.type === 'play') {
    return `Play ${record.word} at ${record.location} for ${record.score} points.`;
  }
  if (record.type === 'exchange') {
    return `Exchange tiles: ${record.exchangedTiles}.`;
  }
  return 'Pass.';
}

function buildExample(record) {
  const textInput = [
    `You are an expert Scrabble player. Board (row 1-15, col A-O; dl/tl/dw/tw = premium squares, . = empty):`,
    renderBoard(record.boardBefore),
    ``,
    `Your rack: ${record.rack}`,
    `Your score: ${record.playerTotalAfter - (record.score || 0)} | Opponent's score: ${record.opponentTotalBefore}`,
    `Tiles remaining in bag: ${record.poolRemainingBeforeMove}`,
    ``,
    `What would you play, and why?`
  ].join('\n');

  const output = `${renderMove(record)} ${record.note}`;

  return { text_input: textInput, output };
}

function run() {
  const lines = fs.readFileSync(IN_FILE, 'utf8').trim().split('\n');
  const outStream = fs.createWriteStream(OUT_FILE, { flags: 'w' });

  let written = 0;
  let skipped = 0;

  lines.forEach(line => {
    const record = JSON.parse(line);
    if (record.type === 'endgame_adjustment') {
      skipped++;
      return;
    }
    const example = buildExample(record);
    outStream.write(JSON.stringify(example) + '\n');
    written++;
  });

  outStream.end(() => {
    console.log(`Written: ${written} tuning examples. Skipped (endgame adjustments): ${skipped}.`);
    console.log(`Output: ${OUT_FILE}`);
  });
}

run();
