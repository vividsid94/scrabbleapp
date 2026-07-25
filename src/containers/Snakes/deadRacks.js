/**
 * Runtime side of the Dead Racks feature: given a probability range the
 * user picked (1-indexed ranks into the real word list) and the
 * precomputed dead-rack pool (see scripts/generateDeadRacks.js /
 * loadDeadRackData in snakesData.js), pick a fake alphagram whose own
 * probability falls inside that same range - no combinatorics recomputed
 * here, just lookups against the precomputed favorable-draw counts.
 */

import { alphagram } from './snakesData';

function realFavorableAtRank(kind, snakesData, deadData, rank) {
  const list = kind === 'seven' ? snakesData.sevens : snakesData.eights;
  const alphaFavorable = kind === 'seven' ? deadData.sevenAlphaFavorable : deadData.eightAlphaFavorable;
  const word = list[rank - 1];
  if (!word) return null;
  return alphaFavorable.get(alphagram(word));
}

// deadList is sorted descending by favorable (see generateDeadRacks.js) -
// these binary-search it instead of scanning, since a linear .filter() over
// up to ~816,000 entries, repeated once per puzzle slot that rolls
// dead-eligible, is what was freezing the page on large ranges.

// First index whose favorable is <= value (start of the "at or below the
// upper bound" region).
function lowerBoundDesc(deadList, value) {
  let lo = 0;
  let hi = deadList.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (deadList[mid].favorable > value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// First index whose favorable is < value (one past the last index that's
// still >= the lower bound).
function upperBoundDesc(deadList, value) {
  let lo = 0;
  let hi = deadList.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (deadList[mid].favorable >= value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Picks a random dead alphagram whose favorable-draw count falls between
// the range's two boundary words' counts (inclusive). Returns null if the
// range has no dead candidate available (expected for very narrow ranges,
// especially near the very top of the eights list) - callers should just
// keep the real alphagram for that slot in that case, not treat it as an
// error.
export function pickDeadRack(kind, snakesData, deadData, minRank, maxRank, exclude) {
  const upperFavorable = realFavorableAtRank(kind, snakesData, deadData, minRank);
  const lowerFavorable = realFavorableAtRank(kind, snakesData, deadData, maxRank);
  if (upperFavorable == null || lowerFavorable == null) return null;

  const deadList = kind === 'seven' ? deadData.sevenDead : deadData.eightDead;
  const startIndex = lowerBoundDesc(deadList, upperFavorable);
  const endIndex = upperBoundDesc(deadList, lowerFavorable); // exclusive
  const rangeSize = endIndex - startIndex;
  if (rangeSize <= 0) return null;

  // Small qualifying range (common for narrow/high-probability ranges,
  // e.g. rank 1-50 can have well under a hundred candidates): check it
  // exhaustively, in random order, so an available candidate is always
  // found if one exists - a bounded number of random draws WITH
  // replacement (the large-range branch below) can whiff on a small,
  // partly-`exclude`d pool purely by bad luck.
  if (rangeSize <= 200) {
    const offsets = Array.from({ length: rangeSize }, (_, i) => i);
    for (let i = offsets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [offsets[i], offsets[j]] = [offsets[j], offsets[i]];
    }
    for (const offset of offsets) {
      const candidate = deadList[startIndex + offset];
      if (!exclude || !exclude.has(candidate.alpha)) return candidate;
    }
    return null;
  }

  // Large range: collision with `exclude` is negligible, so a handful of
  // random draws (with replacement) is far cheaper than shuffling or
  // materializing a range that can be tens of thousands of entries wide.
  for (let i = 0; i < 20; i++) {
    const candidate = deadList[startIndex + Math.floor(Math.random() * rangeSize)];
    if (!exclude || !exclude.has(candidate.alpha)) return candidate;
  }
  return null;
}

// How many real alphagrams on either side of the estimated rank to sample
// the fake solution-count from - see the comment in estimateRankAndCount
// for why this can't just be the single nearest neighbor.
const COUNT_SAMPLE_WINDOW = 25;

// For display only: finds where a dead rack's favorable count would slot
// into the real, rank-ordered list (for the fake "Prob #"), and samples a
// plausible fake solution-count from a WINDOW of nearby real alphagrams -
// not just the single nearest one. ~85% of real alphagrams have exactly
// one solution, so always borrowing the closest neighbor's count made a
// fake's badge read "1" almost every time; any badge above 1 was then a
// reliable tell that it was real. Sampling across a window reproduces the
// true local mix of counts (mostly 1, but sometimes 2, 3+) instead, so a
// higher badge no longer gives the fake away.
export function estimateRankAndCount(kind, snakesData, deadData, favorable) {
  const list = kind === 'seven' ? snakesData.sevens : snakesData.eights;
  const alphagramToWords = kind === 'seven' ? snakesData.sevenAlphagramToWords : snakesData.eightAlphagramToWords;
  const alphaFavorable = kind === 'seven' ? deadData.sevenAlphaFavorable : deadData.eightAlphaFavorable;

  // list is sorted descending by favorable - binary search for the first
  // index whose favorable is <= the dead rack's (its "insertion point").
  let lo = 0;
  let hi = list.length - 1;
  let insertionIndex = list.length;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const midFavorable = alphaFavorable.get(alphagram(list[mid]));
    if (midFavorable <= favorable) {
      insertionIndex = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  const clampedIndex = Math.min(insertionIndex, list.length - 1);
  const windowStart = Math.max(0, clampedIndex - COUNT_SAMPLE_WINDOW);
  const windowEnd = Math.min(list.length, clampedIndex + COUNT_SAMPLE_WINDOW + 1); // exclusive
  const sampleIndex = windowStart + Math.floor(Math.random() * (windowEnd - windowStart));
  const sampledEntries = alphagramToWords.get(alphagram(list[sampleIndex])) || [];

  return {
    rank: insertionIndex + 1,
    count: sampledEntries.length || 1,
  };
}
