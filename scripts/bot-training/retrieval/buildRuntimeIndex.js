/**
 * Builds a trimmed, bundle-friendly version of the retrieval index for the
 * live Tope bot (netlify_functions/topeBot.js). The full dataset.jsonl-derived
 * index is ~52MB across 148K entries; a Netlify function needs something far
 * smaller to bundle and load at cold start, so this keeps only the more
 * substantive commentary (note length > 40 chars) and caps the total count.
 *
 * Output is a plain JSON array (not JSONL) so the function can just
 * require() it directly, same pattern as leaves.json/dictionary loading.
 *
 * Usage: node scripts/bot-training/retrieval/buildRuntimeIndex.js
 */

const fs = require('fs');
const path = require('path');
const { computeFeatures } = require('./features');

const IN_FILE = path.join(__dirname, '..', 'dataset.jsonl');
const OUT_FILE = path.join(__dirname, '..', '..', '..', 'netlify_functions', 'topeRetrievalIndex.json');
const MAX_ENTRIES = 20000;
const MIN_NOTE_LENGTH = 40;

function renderMove(record) {
  if (record.type === 'play') {
    return `Played ${record.word} at ${record.location} for ${record.score} points`;
  }
  if (record.type === 'exchange') {
    return `Exchanged: ${record.exchangedTiles}`;
  }
  return 'Passed';
}

function run() {
  const lines = fs.readFileSync(IN_FILE, 'utf8').trim().split('\n');

  const candidates = [];
  lines.forEach(line => {
    const record = JSON.parse(line);
    if (record.type === 'endgame_adjustment') return;
    if (!record.note || record.note.length < MIN_NOTE_LENGTH) return;

    const ownScoreBefore = record.playerTotalAfter - (record.score || 0);
    const features = computeFeatures({
      board: record.boardBefore,
      rack: record.rack,
      ownScoreBefore,
      opponentScoreBefore: record.opponentTotalBefore,
      poolRemaining: record.poolRemainingBeforeMove,
      moveType: record.type
    });

    candidates.push({
      gameId: record.gameId,
      moveIndex: record.moveIndex,
      features,
      rack: record.rack,
      moveSummary: renderMove(record),
      note: record.note,
      noteLength: record.note.length
    });
  });

  // Prefer longer/richer commentary when trimming down to MAX_ENTRIES
  candidates.sort((a, b) => b.noteLength - a.noteLength);
  const trimmed = candidates.slice(0, MAX_ENTRIES).map(({ noteLength, ...rest }) => rest);

  fs.writeFileSync(OUT_FILE, JSON.stringify(trimmed), 'utf8');
  console.log(`Runtime index: ${trimmed.length} entries (from ${candidates.length} eligible, ${lines.length} total) -> ${OUT_FILE}`);
  const stats = fs.statSync(OUT_FILE);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
}

run();
