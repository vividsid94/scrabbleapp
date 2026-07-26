/**
 * Word-list loading and alphagram precomputation for the SNAKES bingo-stem
 * drill. Ports the exact mechanic of the reference script (src/files/quiz.py):
 * probability-ranked sevens -> alphagram recall -> eight-letter extensions.
 *
 * Mirrors src/utils/localDictionary.js's load-once/cache/dedupe pattern, but
 * these word lists are feature-specific (not the app's general dictionary),
 * so they live alongside this component rather than in src/utils.
 */

let cache = null;
let loadPromise = null;

const alphagram = (word) => word.split('').sort().join('');

async function fetchLines(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  const text = await response.text();
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

// Parses the "ALPHA,FAVORABLE" CSV files the Dead Racks feature reads
// (see scripts/generateDeadRacks.js) into {alpha, favorable}[].
async function fetchAlphaFavorablePairs(path) {
  const lines = await fetchLines(path);
  return lines.map((line) => {
    const commaIndex = line.indexOf(',');
    return { alpha: line.slice(0, commaIndex), favorable: Number(line.slice(commaIndex + 1)) };
  });
}

// Builds alphagram -> [{word, rank}] from a probability-ordered word list
// (rank is the 1-indexed line number, matching quiz.py's "probs" display).
function buildAlphagramMap(words) {
  const map = new Map();
  words.forEach((word, i) => {
    const key = alphagram(word);
    const entry = { word, rank: i + 1 };
    if (map.has(key)) {
      map.get(key).push(entry);
    } else {
      map.set(key, [entry]);
    }
  });
  return map;
}

// For every eight-letter alphagram, remove one letter at a time to get its
// length-7 sub-multisets, and record each as an extension of that seven.
// Equivalent to quiz.py's per-pair multiset-containment check, done in the
// efficient direction (O(eights * 8) instead of O(sevens * eights)).
function buildExtensionMap(eightAlphagramToWords) {
  const map = new Map();
  for (const eightAlpha of eightAlphagramToWords.keys()) {
    const seen = new Set();
    for (let i = 0; i < eightAlpha.length; i++) {
      const sevenAlpha = eightAlpha.slice(0, i) + eightAlpha.slice(i + 1);
      if (seen.has(sevenAlpha)) continue;
      seen.add(sevenAlpha);
      if (map.has(sevenAlpha)) {
        map.get(sevenAlpha).push(eightAlpha);
      } else {
        map.set(sevenAlpha, [eightAlpha]);
      }
    }
  }
  return map;
}

// Rewind mode's core operation: given ONE eight-letter alphagram, its
// length-7 sub-multisets (remove one letter at a time, deduped - the same
// per-eight computation buildExtensionMap above does for every eight up
// front, just done on demand for a single stem instead of the whole list).
// Rewind looks each of these up directly in sevenAlphagramToWords rather
// than adding a tile and checking eight-letter solutions the way Wind Up
// does - fundamentally the reverse direction, not just a relabeled copy.
export function sevenSubAlphagramsOf(eightAlpha) {
  const seen = new Set();
  const result = [];
  for (let i = 0; i < eightAlpha.length; i++) {
    const sevenAlpha = eightAlpha.slice(0, i) + eightAlpha.slice(i + 1);
    if (seen.has(sevenAlpha)) continue;
    seen.add(sevenAlpha);
    result.push(sevenAlpha);
  }
  return result;
}

export async function loadSnakesData() {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const [sevens, eights] = await Promise.all([
      fetchLines('/files/nwl2023sevens.txt'),
      fetchLines('/files/nwl2023eights.txt'),
    ]);

    const sevenAlphagramToWords = buildAlphagramMap(sevens);
    const eightAlphagramToWords = buildAlphagramMap(eights);
    const sevenAlphagramToEightAlphagrams = buildExtensionMap(eightAlphagramToWords);

    cache = {
      sevens,
      eights,
      sevenAlphagramToWords,
      eightAlphagramToWords,
      sevenAlphagramToEightAlphagrams,
    };
    return cache;
  })();

  return loadPromise;
}

// Dead Racks data (fake, wordless alphagrams for the optional difficulty
// toggle) is loaded separately from - and lazily after - the main word
// lists, since the eights dead-rack pool alone is ~13MB: fetching it
// unconditionally on every visit to Lith/Zyz mode would penalize the (most
// likely majority of) users who never turn the toggle on. Call this only
// once the user actually starts a session with Dead Racks enabled.
let deadCache = null;
let deadLoadPromise = null;

export async function loadDeadRackData() {
  if (deadCache) return deadCache;
  if (deadLoadPromise) return deadLoadPromise;

  deadLoadPromise = (async () => {
    const [sevenAlphaFavorablePairs, eightAlphaFavorablePairs, sevenDead, eightDead] = await Promise.all([
      fetchAlphaFavorablePairs('/files/nwl2023sevens_alpha_favorable.txt'),
      fetchAlphaFavorablePairs('/files/nwl2023eights_alpha_favorable.txt'),
      fetchAlphaFavorablePairs('/files/nwl2023sevens_dead.txt'),
      fetchAlphaFavorablePairs('/files/nwl2023eights_dead.txt'),
    ]);

    deadCache = {
      sevenAlphaFavorable: new Map(sevenAlphaFavorablePairs.map((p) => [p.alpha, p.favorable])),
      eightAlphaFavorable: new Map(eightAlphaFavorablePairs.map((p) => [p.alpha, p.favorable])),
      sevenDead,
      eightDead,
    };
    return deadCache;
  })();

  return deadLoadPromise;
}

export { alphagram };
