/**
 * "Fat-finger" typo correction for the on-screen mobile keyboard in Zyz,
 * Wind Up, and Rewind mode ONLY (not Lith - see LithMode.js, which never
 * imports this).
 *
 * The on-screen keyboard has no real per-pixel dead zones (see
 * MobileKeyboardOverlay's row-level hit testing), but a finger can still
 * land squarely on the WRONG adjacent key. Real phone keyboards paper over
 * this with autocorrect; we don't have a dictionary-wide autocorrect, but
 * we DO already know every letter the current round's still-unfound words
 * could possibly want next - so instead of guessing at English in general,
 * this only ever "corrects" a keystroke toward a letter that's physically
 * adjacent to the one actually pressed AND is what every still-live
 * candidate word agrees belongs at that exact position. If two live
 * candidates want two different corrections, or no live candidate is
 * adjacent to what was pressed, the raw key is kept as typed - a wrong
 * guess is safer than a confidently wrong "correction."
 */

// Physical QWERTY key-adjacency (directly up/down/left/right only, no
// diagonals). Row 2 (ASDFGHJKL) and row 3 (ZXCVBNM) each sit staggered
// relative to the row above, which is why the shape isn't a symmetric plus
// for every key: most row-2 keys (D, F, G, H, J) have TWO row-3
// down-neighbors, but S only has one (X) and K only has one (M) - S because
// its other geometric neighbor, Z, sits far enough left in practice to not
// read as adjacent, and K because there's nothing to its right in row 3 (M
// is J's neighbor, not K's). Checked symmetric (every A->B has a matching
// B->A) and verified against real fat-finger reports, not just derived
// from an abstract offset formula.
export const QWERTY_ADJACENCY = {
  Q: ['W', 'A'],
  W: ['Q', 'E', 'A', 'S'],
  E: ['W', 'R', 'S', 'D'],
  R: ['E', 'T', 'D', 'F'],
  T: ['R', 'Y', 'F', 'G'],
  Y: ['T', 'U', 'G', 'H'],
  U: ['Y', 'I', 'H', 'J'],
  I: ['U', 'O', 'J', 'K'],
  O: ['I', 'P', 'K', 'L'],
  P: ['O', 'L'],
  A: ['Q', 'W', 'S', 'Z'],
  S: ['A', 'W', 'E', 'D', 'X'],
  D: ['E', 'R', 'S', 'F', 'X', 'C'],
  F: ['R', 'T', 'D', 'G', 'C', 'V'],
  G: ['T', 'Y', 'F', 'H', 'V', 'B'],
  H: ['Y', 'U', 'G', 'J', 'B', 'N'],
  J: ['U', 'I', 'H', 'K', 'N', 'M'],
  K: ['I', 'O', 'J', 'L', 'M'],
  L: ['O', 'P', 'K'],
  Z: ['A', 'X'],
  X: ['Z', 'S', 'D', 'C'],
  C: ['D', 'X', 'F', 'V'],
  V: ['C', 'F', 'G', 'B'],
  B: ['V', 'G', 'H', 'N'],
  N: ['B', 'H', 'J', 'M'],
  M: ['N', 'J', 'K'],
};

// candidateWords: words for the current round that are still unfound AND
// unrevealed (the caller filters those out - already-guessed words are not
// candidates, so a correction never steers you back toward one you already
// found). prefix: the guess text typed so far (already-committed, possibly
// already-corrected letters). Returns the letter to actually insert and
// whether it was substituted for the one physically pressed.
export function resolveTypedKey(rawKey, candidateWords, prefix) {
  const pos = prefix.length;
  const live = candidateWords.filter((word) => word.length > pos && word.startsWith(prefix));

  // The pressed key is already correct for at least one live candidate -
  // nothing to fix, even though it may eliminate other candidates (that's
  // the "candidate word elimination" - handled implicitly, since `live` is
  // always recomputed fresh from the current prefix on every keystroke).
  if (live.some((word) => word[pos] === rawKey)) {
    return { letter: rawKey, corrected: false };
  }

  const neighbors = QWERTY_ADJACENCY[rawKey] || [];
  const corrections = new Set(live.filter((word) => neighbors.includes(word[pos])).map((word) => word[pos]));
  if (corrections.size === 1) {
    return { letter: [...corrections][0], corrected: true };
  }

  // No live candidate is adjacent either (or two disagree on what the
  // correction should be) - type it literally rather than guess wrong.
  return { letter: rawKey, corrected: false };
}
