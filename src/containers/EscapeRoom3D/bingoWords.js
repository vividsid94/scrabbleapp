/**
 * A hand-picked sample of genuinely low-probability 7s and 8s, pulled from
 * the tail (highest rank number = least likely to be drawn) of the same
 * probability-ordered NWL2023 word lists Snakes.js loads from
 * /files/nwl2023sevens.txt and /files/nwl2023eights.txt. Kept as a small
 * static list here rather than fetching the full ~25k/~32k-line files at
 * runtime for a 6-round demo puzzle.
 */
export const lowProbBingoRounds = [
  { scrambled: 'KAYRMLA', answer: 'MALARKY', clue: null, length: 7 },
  { scrambled: 'CIRIYTUC', answer: 'CIRCUITY', clue: null, length: 8 },
  { scrambled: 'EBULRFF', answer: 'BLUFFER', clue: null, length: 7 },
  { scrambled: 'SETEKKRR', answer: 'TREKKERS', clue: null, length: 8 },
  { scrambled: 'IUSSSTB', answer: 'SUBSIST', clue: null, length: 7 },
  { scrambled: 'CAHAUBKL', answer: 'BACKHAUL', clue: null, length: 8 },
];
