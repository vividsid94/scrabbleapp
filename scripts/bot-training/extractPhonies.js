/**
 * Pulls phony (invalid-word) plays out of the annotated GCG corpus
 * (scripts/bot-training/raw-games/*.gcg) - see notes/puzzle-mode-ideas.md
 * in whiffers for why.
 *
 * v2 - scans EVERY played word in the whole corpus against a real
 * dictionary, not just plays that were challenged off. Two things forced
 * this rewrite, both found by hand-checking v1's output:
 *
 * 1. A challenge withdraws the WHOLE play, not necessarily the headline
 *    word - Matt_Canik played FATIGUE (a real word) but it hooked into
 *    existing tiles to form IMIDS (not a word), and the whole play got
 *    challenged off. v1's "same player twice, second line negates the
 *    first" pattern flagged FATIGUE as a phony, which is wrong - FATIGUE
 *    itself was fine.
 * 2. That same pattern only catches CHALLENGED phonies. A phony nobody
 *    challenged (opponent didn't notice, or wasn't confident enough to
 *    risk it) is logged exactly like any legitimate play - there's no
 *    marker in GCG notation for "this word was actually invalid but got
 *    away with it." Those are invisible to a withdrawal-pattern search
 *    entirely, and arguably the more interesting half of the data (they
 *    fooled a real opponent).
 *
 * Fix for both: check the word ITSELF against a real dictionary (the
 * union of whiffers' nwl2023.txt/csw24.txt - union, not either list alone,
 * so a word only counts as a definite phony if it's invalid under BOTH
 * rulesets, since these games could be either NASPA or international
 * events and there's no cheap way to tell which per-game).
 *
 * Dots (play-through tiles whose actual board letter isn't in the GCG
 * line - see v1's own comment) are handled without replay: a dotted word
 * is a DEFINITE phony only if NO possible letter in each dot position
 * could complete it into a real dictionary word - that's provable from
 * the dictionary alone, no board state needed. If at least one completion
 * WOULD be valid, it's AMBIGUOUS (probably a FATIGUE/IMIDS-style crossword
 * issue, or genuinely unresolvable without replay) and goes to a separate
 * file rather than being trusted as a phony.
 *
 * Usage:
 *   node scripts/bot-training/extractPhonies.js
 * Output:
 *   scripts/bot-training/phonies.txt    - definite phonies, sorted by
 *                                          word length (dots included)
 *                                          descending, tagged
 *                                          challenged/unchallenged
 *   scripts/bot-training/ambiguous.txt  - dotted words where a valid
 *                                          completion exists - excluded
 *                                          from phonies.txt, kept for
 *                                          visibility into what got
 *                                          filtered out and why
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'raw-games');
const OUT_FILE = path.join(__dirname, 'phonies.txt');
const AMBIGUOUS_FILE = path.join(__dirname, 'ambiguous.txt');
const NWL_PATH = path.join(__dirname, '..', '..', '..', 'whiffers', 'public', 'files', 'nwl2023.txt');
const CSW_PATH = path.join(__dirname, '..', '..', '..', 'whiffers', 'public', 'files', 'csw24.txt');

// --- Dictionary: union of NWL23 + CSW24, uppercase, deduped, grouped by
// length for the dotted-pattern search below.

function loadDictionary() {
  const words = new Set();
  for (const filePath of [NWL_PATH, CSW_PATH]) {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const line of text.split('\n')) {
      const w = line.trim().toUpperCase();
      if (w) words.add(w);
    }
  }
  const byLength = new Map();
  for (const w of words) {
    if (!byLength.has(w.length)) byLength.set(w.length, []);
    byLength.get(w.length).push(w);
  }
  return { words, byLength };
}

// Is there ANY dictionary word of pattern.length that matches pattern,
// treating '.' as a wildcard? Progressive filtering (one fixed position at
// a time, bailing the instant the candidate set is empty) rather than
// testing the full pattern against every same-length word - real letters
// are not uniformly distributed, so even one fixed position usually prunes
// a length bucket hard, and an empty-candidate bailout proves "no
// completion exists" without checking the remaining positions at all.
function hasValidCompletion(pattern, byLength) {
  let candidates = byLength.get(pattern.length);
  if (!candidates) return false;
  for (let i = 0; i < pattern.length && candidates.length > 0; i++) {
    const ch = pattern[i];
    if (ch === '.') continue;
    candidates = candidates.filter(w => w[i] === ch);
  }
  return candidates.length > 0;
}

// --- Line parsing, same as v1 (trimmed from parse.js's own proven
// parseMoveLine/parseRawGame) - board reconstruction still isn't needed.

function isLocationField(field) {
  return /^[A-O]\d+$|^\d+[A-O]$/.test(field);
}

function isExchangeField(field) {
  return /^-[A-Za-z?]+$/.test(field) && field !== '-';
}

function parseMoveLine(line) {
  const content = line.slice(1);
  const parts = content.split(' ').filter(p => p.trim() !== '');
  if (parts.length < 2) return null;

  const player = parts[0].endsWith(':') ? parts[0].slice(0, -1) : parts[0];
  const rest = parts.slice(1);

  if (rest.length > 0 && rest[0].startsWith('(')) return null; // endgame adjustment

  const rack = rest[0];
  const remaining = rest.slice(1);
  const total = parseInt(remaining[remaining.length - 1], 10);
  const score = parseInt(remaining[remaining.length - 2], 10);
  const middleFields = remaining.slice(0, remaining.length - 2);

  let type = 'pass';
  let location = null;
  let word = null;

  for (const field of middleFields) {
    if (isLocationField(field)) {
      type = 'play';
      location = field;
    } else if (field === '--') {
      // pass or challenge withdrawal
    } else if (isExchangeField(field)) {
      type = 'exchange';
    } else if (/^[A-Za-z.]+$/.test(field)) {
      word = field;
    }
  }

  return { player, type, rack, location, word, score, total };
}

function parseRawGame(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const moves = [];
  for (const line of lines) {
    if (line.startsWith('>')) {
      const move = parseMoveLine(line);
      if (move) moves.push(move);
    }
  }
  return moves;
}

// --- Phony detection: scan EVERY play, not just withdrawal-adjacent ones.
// Dot-free words check straight against the dictionary Set; dotted words
// go through hasValidCompletion - if a completion exists, the word is
// AMBIGUOUS (same "FATIGUE hooking IMIDS" shape - a completion being
// valid doesn't prove this specific play was fine, but it doesn't prove
// it was a phony either, so it goes to ambiguous.txt rather than being
// trusted as a phony). Only words with provably NO valid completion (or,
// dot-free, no dictionary entry at all) count as definite phonies.
function scanGame(gameId, moves, dict) {
  const phonies = [];
  const ambiguous = [];

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    if (move.type !== 'play' || !move.word) continue;

    const word = move.word.toUpperCase();
    const hasDots = word.includes('.');

    // A real play can place at most 7 tiles (max rack size) - a word with
    // more than 7 non-dot characters, or a rack longer than 7, is
    // physically impossible and provably corrupted/synthetic data (test
    // games, bot stress-tests uploaded under joke names like "Cheater"/
    // "New_Player_1"), not a real phony. Found by hand: QQQQQQQQQQQQQQQ
    // from a 7-tile rack, zero dots - 15 placed letters from 7 tiles.
    const placedCount = word.replace(/\./g, '').length;
    if (placedCount > 7 || move.rack.length > 7) continue;

    if (!hasDots) {
      if (dict.words.has(word)) continue; // real word, not a phony
      const next = moves[i + 1];
      const challenged = !!(
        next && next.player === move.player && next.type === 'pass' &&
        typeof next.score === 'number' && next.score === -move.score
      );
      phonies.push({ gameId, player: move.player, rack: move.rack, location: move.location, word, score: move.score, challenged });
      continue;
    }

    if (hasValidCompletion(word, dict.byLength)) {
      ambiguous.push({ gameId, player: move.player, rack: move.rack, location: move.location, word, score: move.score });
      continue;
    }

    const next = moves[i + 1];
    const challenged = !!(
      next && next.player === move.player && next.type === 'pass' &&
      typeof next.score === 'number' && next.score === -move.score
    );
    phonies.push({ gameId, player: move.player, rack: move.rack, location: move.location, word, score: move.score, challenged });
  }

  return { phonies, ambiguous };
}

function formatLine(p) {
  const len = String(p.word.length).padStart(2, ' ');
  const word = p.word.padEnd(15, ' ');
  const rack = p.rack.padEnd(9, ' ');
  const score = String(p.score).padStart(4, ' ');
  const tag = p.challenged ? 'challenged  ' : 'unchallenged';
  return `${len}  ${word} rack=${rack} score=${score} ${tag} game=${p.gameId} player=${p.player}`;
}

function run() {
  console.log('Loading dictionary (NWL23 + CSW24 union)...');
  const dict = loadDictionary();
  console.log(`Dictionary loaded: ${dict.words.size} unique words.`);

  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.gcg'));
  console.log(`Found ${files.length} raw game files. Scanning every play...`);

  const allPhonies = [];
  const allAmbiguous = [];

  files.forEach((file, idx) => {
    const gameId = path.basename(file, '.gcg');
    const rawText = fs.readFileSync(path.join(RAW_DIR, file), 'utf8');
    if (!rawText.trim()) return;

    let moves;
    try {
      moves = parseRawGame(rawText);
    } catch (err) {
      console.error(`Failed to parse game ${gameId}: ${err.message}`);
      return;
    }

    const { phonies, ambiguous } = scanGame(gameId, moves, dict);
    allPhonies.push(...phonies);
    allAmbiguous.push(...ambiguous);

    if (idx % 2000 === 0) {
      console.log(`Processed ${idx}/${files.length} files | phonies: ${allPhonies.length} | ambiguous: ${allAmbiguous.length}`);
    }
  });

  allPhonies.sort((a, b) => b.word.length - a.word.length);
  allAmbiguous.sort((a, b) => b.word.length - a.word.length);

  const challengedCount = allPhonies.filter(p => p.challenged).length;

  fs.writeFileSync(OUT_FILE, allPhonies.map(formatLine).join('\n') + '\n');
  fs.writeFileSync(AMBIGUOUS_FILE, allAmbiguous.map(formatLine).join('\n') + '\n');

  console.log(`\nDone.`);
  console.log(`Definite phonies: ${allPhonies.length} (${challengedCount} challenged, ${allPhonies.length - challengedCount} unchallenged) -> ${OUT_FILE}`);
  console.log(`Ambiguous (dotted, valid completion exists): ${allAmbiguous.length} -> ${AMBIGUOUS_FILE}`);
}

run();
