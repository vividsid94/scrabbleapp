/**
 * Shared feature extraction for the retrieval-augmented bot.
 *
 * Same function is used to (a) build the offline index from dataset.jsonl
 * and (b) compute features for a live in-game position at decision time -
 * both sides need to land in the same feature space for nearest-neighbor
 * matching to mean anything. Board representation (15x15 grid, numbers 0-4
 * for premium squares, strings for placed letters) matches the app's own
 * boardCoords shape, so this can be called directly with live game state.
 */

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const PREMIUM_OPEN_CODES = new Set([3, 4]); // double word / triple word

function rackToChars(rack) {
  if (Array.isArray(rack)) return rack;
  return rack.split('');
}

function computeFeatures({ board, rack, ownScoreBefore, opponentScoreBefore, poolRemaining, moveType }) {
  const chars = rackToChars(rack);
  let vowelCount = 0;
  let consonantCount = 0;
  let hasBlank = false;
  let hasS = false;

  chars.forEach(ch => {
    const c = ch.toUpperCase();
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

// Weighted distance between two feature vectors - lower is more similar.
// Heuristic v1 weights; expect to retune once we see retrieval quality.
function featureDistance(a, b) {
  if (a.moveType !== b.moveType) return Infinity; // hard filter: match decision type

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

module.exports = { computeFeatures, featureDistance };
