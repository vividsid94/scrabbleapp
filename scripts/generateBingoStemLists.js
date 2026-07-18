/**
 * Regenerates the SNAKES bingo-stem word lists (sevens.txt / eights.txt)
 * from the app's current dictionary, ranked by true blank-aware draw
 * probability instead of the 2014 lists' (unknown, presumably simpler)
 * methodology.
 *
 * Methodology: for a word of length k, compute the probability that a
 * random k-tile draw from the standard 100-tile bag can spell it, where
 * the bag's 2 blanks may stand in for any letters the draw is short on.
 * Since |rack| = |word| = k exactly, a specific rack (some multiset of
 * non-blank letters L, plus b actual blanks, |L| + b = k) can spell the
 * word iff L is a sub-multiset of the word's letters - the blank count is
 * then automatically exactly the deficit (k - |L|), no separate check
 * needed. So:
 *
 *   favorable(word) = sum_{b=0..2} C(2, b) * [ways to draw exactly (k-b)
 *     non-blank tiles forming a sub-multiset of word's letters]
 *
 * The bracketed term is the coefficient of z^(k-b) in the product, over
 * each distinct letter x in the word, of the polynomial
 *   sum_{c=0}^{count_in_word(x)} C(bag_count(x), c) * z^c
 * (ways to draw exactly c tiles of letter x, capped at what the word
 * needs - drawing more would exceed the word's usable count for that
 * letter). This is standard generating-function convolution; each word
 * has at most ~8 distinct letters with small exponents, so it's cheap.
 *
 * P(word) = favorable(word) / C(100, k) - but since k is fixed within a
 * list, ranking only needs the (much smaller, exact-integer) favorable()
 * counts; the divide-by-C(100,k) is applied for display only.
 *
 * Run: node scripts/generateBingoStemLists.js
 * Reads: public/files/nwl2023.txt
 * Writes: public/files/nwl2023sevens_new.txt, public/files/nwl2023eights_new.txt
 * (staged under a "_new" suffix deliberately, for review before renaming
 * over the files the app actually reads: nwl2023sevens.txt / nwl2023eights.txt).
 */

const fs = require('fs');
const path = require('path');

const BAG = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4,
  M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1,
  Y: 2, Z: 1,
};
const BLANKS_IN_BAG = 2;
const BAG_SIZE = 100;

// Exact integer binomial coefficients (values here are tiny - bag counts
// max out at 12 - so plain BigInt-free arithmetic is fine).
const choose = (() => {
  const cache = new Map();
  return (n, r) => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    const key = `${n},${r}`;
    if (cache.has(key)) return cache.get(key);
    let result = 1;
    for (let i = 0; i < r; i++) {
      result = (result * (n - i)) / (i + 1);
    }
    cache.set(key, result);
    return result;
  };
})();

// Multiply two polynomials, represented as coefficient arrays (index = degree).
function polyMultiply(a, b) {
  const result = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 0) continue;
    for (let j = 0; j < b.length; j++) {
      if (b[j] === 0) continue;
      result[i + j] += a[i] * b[j];
    }
  }
  return result;
}

function letterCounts(word) {
  const counts = {};
  for (const ch of word) counts[ch] = (counts[ch] || 0) + 1;
  return counts;
}

// favorable() as derived above, for a given letter-count map and word length k.
function favorableDraws(counts, k) {
  let poly = [1]; // constant polynomial 1 (degree 0)
  for (const letter of Object.keys(counts)) {
    const need = counts[letter];
    const bagCount = BAG[letter] || 0;
    const termPoly = [];
    for (let c = 0; c <= need; c++) {
      termPoly.push(choose(bagCount, c));
    }
    poly = polyMultiply(poly, termPoly);
  }

  let total = 0;
  for (let b = 0; b <= BLANKS_IN_BAG; b++) {
    const degree = k - b;
    if (degree < 0 || degree >= poly.length) continue;
    total += choose(BLANKS_IN_BAG, b) * poly[degree];
  }
  return total;
}

function alphagram(word) {
  return word.split('').sort().join('');
}

function buildList(words, k) {
  // Group by alphagram (shared letters -> shared probability, computed once).
  const byAlphagram = new Map();
  for (const word of words) {
    const key = alphagram(word);
    if (!byAlphagram.has(key)) byAlphagram.set(key, []);
    byAlphagram.get(key).push(word);
  }

  const totalRacks = choose(BAG_SIZE, k);
  const ranked = [];
  for (const [alpha, wordsForAlpha] of byAlphagram) {
    const counts = letterCounts(alpha);
    const favorable = favorableDraws(counts, k);
    ranked.push({
      alpha,
      words: wordsForAlpha.sort(),
      favorable,
      probability: favorable / totalRacks,
    });
  }

  // Highest probability first; deterministic tiebreak by alphagram string
  // for the (rare) cases where two different letter combos land on the
  // exact same favorable-draw count.
  ranked.sort((a, b) => b.favorable - a.favorable || a.alpha.localeCompare(b.alpha));

  return ranked;
}

function main() {
  const dictPath = path.join(__dirname, '..', 'public', 'files', 'nwl2023.txt');
  const allWords = fs.readFileSync(dictPath, 'utf8')
    .split('\n')
    .map((w) => w.trim().toUpperCase())
    .filter(Boolean);

  for (const [k, label] of [[7, 'nwl2023sevens'], [8, 'nwl2023eights']]) {
    const words = allWords.filter((w) => w.length === k);
    console.log(`${label}: ${words.length} words from nwl2023.txt`);

    const ranked = buildList(words, k);
    console.log(`${label}: ${ranked.length} distinct alphagrams`);

    const lines = [];
    for (const entry of ranked) {
      for (const word of entry.words) lines.push(word);
    }

    const outPath = path.join(__dirname, '..', 'public', 'files', `${label}_new.txt`);
    fs.writeFileSync(outPath, lines.join('\n') + '\n');
    console.log(`Wrote ${outPath} (${lines.length} lines)`);

    console.log(`\nTop 15 ${label} by probability:`);
    ranked.slice(0, 15).forEach((entry, i) => {
      console.log(
        `  ${i + 1}. ${entry.alpha}  (${entry.words.join(', ')})  P=${(entry.probability * 100).toPrecision(4)}%`
      );
    });
    console.log('');
  }
}

main();
