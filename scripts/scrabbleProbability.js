/**
 * Shared blank-aware Scrabble draw-probability math, used by both
 * generateBingoStemLists.js (ranks real words) and generateDeadRacks.js
 * (ranks fake alphagrams the same way, so the two are directly comparable).
 *
 * See generateBingoStemLists.js's header comment for the full derivation;
 * this file is just the extracted, reusable pieces.
 */

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

// favorable() - see generateBingoStemLists.js's header comment for the
// full derivation. Higher = more probable to draw.
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

module.exports = {
  BAG,
  BLANKS_IN_BAG,
  BAG_SIZE,
  choose,
  polyMultiply,
  letterCounts,
  favorableDraws,
  alphagram,
};
