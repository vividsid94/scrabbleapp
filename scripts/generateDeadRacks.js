/**
 * Generates "dead rack" pools for the Snakes Dead Racks feature: alphagrams
 * that are letter-plausible (2-4 vowels, no J/Q/Z/X) and drawable from the
 * bag, but spell NO real 7- or 8-letter word - plus a probability
 * (favorable-draw count) for each, computed with the exact same math as the
 * real word lists, so a fake rack's probability can be compared directly
 * against any user-picked range of real ranks at runtime.
 *
 * Candidate generation: single-letter substitution on every real alphagram
 * (try replacing each of its k letters with each of the 22 non-J/Q/Z/X
 * letters). This deliberately stays close to real stems in letter-frequency
 * space, so the dead pool's probability distribution naturally tracks the
 * real list's shape instead of being random noise concentrated wherever.
 *
 * The real word lists (public/files/nwl2023sevens.txt / nwl2023eights.txt)
 * are read directly as the source of real alphagrams + their rank order,
 * rather than recomputing from nwl2023.txt - this guarantees the dead-rack
 * probabilities are ranked on the exact same list the app actually serves.
 *
 * Run: node scripts/generateDeadRacks.js
 * Writes (per length):
 *   public/files/nwl2023sevens_dead.txt              ALPHA,FAVORABLE (dead)
 *   public/files/nwl2023eights_dead.txt
 *   public/files/nwl2023sevens_alpha_favorable.txt    ALPHA,FAVORABLE (real, deduped)
 *   public/files/nwl2023eights_alpha_favorable.txt
 * Also prints a rank-decile coverage report to the console so thin regions
 * (especially the top of the list, where real words are densest) can be
 * spotted before the pool is wired into the app.
 */

const fs = require('fs');
const path = require('path');
const { favorableDraws, letterCounts, alphagram } = require('./scrabbleProbability');

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const FORBIDDEN = /[JQZX]/;
// 26 letters minus J/Q/Z/X.
const REPLACEMENT_LETTERS = 'ABCDEFGHIKLMNOPRSTUVWY'.split('');

function countVowels(alpha) {
  let n = 0;
  for (const ch of alpha) if (VOWELS.has(ch)) n++;
  return n;
}

function isPlausible(alpha) {
  if (FORBIDDEN.test(alpha)) return false;
  const vowels = countVowels(alpha);
  return vowels >= 2 && vowels <= 4;
}

// Reads a real word list (already rank-ordered) and collapses it to
// {alpha, favorable}[] in the same order, deduped to one entry per
// alphagram (consecutive anagram lines collapse to their first occurrence).
function loadRealAlphagrams(filePath, k) {
  const words = fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .map((w) => w.trim().toUpperCase())
    .filter(Boolean);

  const seen = new Set();
  const ranked = [];
  for (const word of words) {
    const alpha = alphagram(word);
    if (seen.has(alpha)) continue;
    seen.add(alpha);
    const favorable = favorableDraws(letterCounts(alpha), k);
    ranked.push({ alpha, favorable });
  }
  return ranked;
}

// Single-letter-substitution mutations of one alphagram, filtered to
// plausible (vowel count, no J/Q/Z/X) candidates. Does NOT check realness
// or dedupe against other words' mutations - caller does that globally.
function* mutations(alpha) {
  const letters = alpha.split('');
  for (let i = 0; i < letters.length; i++) {
    for (const replacement of REPLACEMENT_LETTERS) {
      if (replacement === letters[i]) continue;
      const candidate = letters.slice();
      candidate[i] = replacement;
      candidate.sort();
      const candidateAlpha = candidate.join('');
      if (isPlausible(candidateAlpha)) yield candidateAlpha;
    }
  }
}

function generateDeadPool(realRanked, realAlphaSet, k) {
  const dead = new Map(); // alpha -> favorable

  for (const { alpha } of realRanked) {
    for (const candidateAlpha of mutations(alpha)) {
      if (realAlphaSet.has(candidateAlpha)) continue;
      if (dead.has(candidateAlpha)) continue;
      const favorable = favorableDraws(letterCounts(candidateAlpha), k);
      if (favorable <= 0) continue;
      dead.set(candidateAlpha, favorable);
    }
  }

  return Array.from(dead, ([alpha, favorable]) => ({ alpha, favorable }))
    .sort((a, b) => b.favorable - a.favorable || a.alpha.localeCompare(b.alpha));
}

// Buckets the real list into 10 rank-deciles, then reports how many dead
// candidates have a favorable value landing in each decile's favorable
// range - this is the actual signal for "is the pool usable at every
// probability range", not just a total count.
function reportCoverage(label, realRanked, deadRanked) {
  const n = realRanked.length;
  const decileSize = Math.ceil(n / 10);
  console.log(`\n${label} coverage by real-rank decile (${n} real alphagrams, ${deadRanked.length} dead):`);
  for (let d = 0; d < 10; d++) {
    const startIdx = d * decileSize;
    const endIdx = Math.min(startIdx + decileSize, n) - 1;
    if (startIdx >= n) break;
    const upperFavorable = realRanked[startIdx].favorable; // more probable end
    const lowerFavorable = realRanked[endIdx].favorable; // less probable end
    const count = deadRanked.filter((d2) => d2.favorable <= upperFavorable && d2.favorable >= lowerFavorable).length;
    console.log(`  rank ${startIdx + 1}-${endIdx + 1}: ${count} dead candidates`);
  }
}

function writeCsv(filePath, rows) {
  const lines = rows.map((r) => `${r.alpha},${r.favorable}`);
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
  console.log(`Wrote ${filePath} (${rows.length} lines)`);
}

function main() {
  const filesDir = path.join(__dirname, '..', 'public', 'files');

  for (const [k, label] of [[7, 'nwl2023sevens'], [8, 'nwl2023eights']]) {
    console.log(`\n=== ${label} (k=${k}) ===`);
    const start = Date.now();

    const realRanked = loadRealAlphagrams(path.join(filesDir, `${label}.txt`), k);
    const realAlphaSet = new Set(realRanked.map((r) => r.alpha));
    console.log(`${realRanked.length} real alphagrams loaded`);

    const deadRanked = generateDeadPool(realRanked, realAlphaSet, k);
    console.log(`${deadRanked.length} dead alphagrams generated in ${((Date.now() - start) / 1000).toFixed(1)}s`);

    reportCoverage(label, realRanked, deadRanked);

    console.log(`\nSample dead alphagrams (top 10 by probability):`);
    deadRanked.slice(0, 10).forEach((d, i) => console.log(`  ${i + 1}. ${d.alpha}  favorable=${d.favorable}`));
    console.log(`Sample dead alphagrams (10 from the middle):`);
    const mid = Math.floor(deadRanked.length / 2);
    deadRanked.slice(mid, mid + 10).forEach((d, i) => console.log(`  ${mid + i + 1}. ${d.alpha}  favorable=${d.favorable}`));

    writeCsv(path.join(filesDir, `${label}_dead.txt`), deadRanked);
    writeCsv(path.join(filesDir, `${label}_alpha_favorable.txt`), realRanked);
  }
}

main();
