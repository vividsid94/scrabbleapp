/**
 * Loads the retrieval index into memory and answers nearest-neighbor
 * queries against it. Brute-force linear scan over ~148K small feature
 * vectors - fast enough for now (sub-100ms in practice); revisit with a
 * proper spatial index (k-d tree, or push into Supabase) if this becomes
 * the bottleneck once wired into the live bot.
 */

const fs = require('fs');
const path = require('path');
const { featureDistance } = require('./features');

const INDEX_FILE = path.join(__dirname, 'retrieval-index.jsonl');

let cachedIndex = null;

function loadIndex() {
  if (cachedIndex) return cachedIndex;
  const lines = fs.readFileSync(INDEX_FILE, 'utf8').trim().split('\n');
  cachedIndex = lines.map(l => JSON.parse(l));
  return cachedIndex;
}

/**
 * @param {Object} queryFeatures - from computeFeatures()
 * @param {Object} opts
 * @param {number} opts.k - how many neighbors to return
 * @param {string} [opts.excludeGameId] - skip entries from this game (avoid trivial self-match in demos/eval)
 */
function findSimilar(queryFeatures, opts = {}) {
  const { k = 5, excludeGameId = null } = opts;
  const index = loadIndex();

  const scored = [];
  for (const entry of index) {
    if (excludeGameId && entry.gameId === excludeGameId) continue;
    const dist = featureDistance(queryFeatures, entry.features);
    if (dist === Infinity) continue;
    scored.push({ entry, dist });
  }

  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, k).map(s => ({ ...s.entry, distance: s.dist }));
}

module.exports = { findSimilar, loadIndex };
