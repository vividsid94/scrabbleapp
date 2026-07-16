/**
 * Builds the retrieval index from dataset.jsonl: one compact entry per
 * commented move, with precomputed features + a short rendered summary
 * (no full board grids - those are only needed for the live query side,
 * not for the stored corpus, to keep the index small).
 *
 * Usage: node scripts/bot-training/retrieval/buildIndex.js
 */

const fs = require('fs');
const path = require('path');
const { computeFeatures } = require('./features');

const IN_FILE = path.join(__dirname, '..', 'dataset.jsonl');
const OUT_FILE = path.join(__dirname, 'retrieval-index.jsonl');

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
  const outStream = fs.createWriteStream(OUT_FILE, { flags: 'w' });

  let written = 0;
  lines.forEach(line => {
    const record = JSON.parse(line);
    if (record.type === 'endgame_adjustment') return;

    const ownScoreBefore = record.playerTotalAfter - (record.score || 0);
    const features = computeFeatures({
      board: record.boardBefore,
      rack: record.rack,
      ownScoreBefore,
      opponentScoreBefore: record.opponentTotalBefore,
      poolRemaining: record.poolRemainingBeforeMove,
      moveType: record.type
    });

    const entry = {
      gameId: record.gameId,
      moveIndex: record.moveIndex,
      features,
      rack: record.rack,
      moveSummary: renderMove(record),
      note: record.note
    };

    outStream.write(JSON.stringify(entry) + '\n');
    written++;
  });

  outStream.end(() => {
    console.log(`Index built: ${written} entries -> ${OUT_FILE}`);
  });
}

run();
