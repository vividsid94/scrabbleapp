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

export { alphagram };
