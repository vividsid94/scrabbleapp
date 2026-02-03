import { letterScores, letterDistribution, standardBoard } from './scrabbleData';

// ============================================================
// Room 1: Chamber of Values
// ============================================================

// Rack Appraisal — compound questions about tile values (replaces Tile Value Safe)
export const rackAppraisalRounds = [
  {
    rack: ['Q', 'J', 'Z', 'K', 'X', 'H', 'W'],
    question: 'What is the total face value of this rack?',
    answer: 49, // 10+8+10+5+8+4+4
    choices: [47, 48, 49, 50],
  },
  {
    rack: ['F', 'B', 'M', 'P', 'C', 'G', 'Y'],
    question: 'What is the median point value of tiles on this rack?',
    answer: 3, // Values: 4,3,3,3,3,2,4 → sorted: 2,3,3,3,3,4,4 → median = 3
    choices: [2, 3, 3.5, 4],
  },
  {
    rack: ['Q', 'U', 'A', 'E', 'I', 'Z', 'O'],
    question: 'If you remove all tiles worth exactly 1 point, what is the sum of the remaining tiles?',
    answer: 20, // Remove U,A,E,I,O (all 1pt), keep Q=10, Z=10
    choices: [18, 19, 20, 21],
  },
  {
    rack: ['S', 'A', 'T', 'I', 'R', 'E', 'N'],
    question: 'If this rack plays a bingo with no premium squares, what is the total score?',
    answer: 57, // 1+1+1+1+1+1+1=7 + 50 bingo = 57
    choices: [55, 56, 57, 58],
  },
  {
    rack: ['W', 'V', 'J', 'D', 'E', 'X', 'A'],
    question: 'What is the product of the two highest-scoring tiles?',
    answer: 64, // J=8, X=8 → 8×8 = 64
    choices: [56, 60, 64, 68],
  },
  {
    rack: ['Q', 'Z', 'J', 'X', 'K', 'F', 'Y'],
    question: 'How many tiles on this rack are worth MORE than 5 points?',
    answer: 4, // Q=10, Z=10, J=8, X=8 (K=5 doesn't count as "more than")
    choices: [2, 3, 4, 5],
  },
  {
    rack: ['B', 'C', 'F', 'H', 'M', 'P', 'V'],
    question: 'How many tiles on this rack are worth exactly 4 points?',
    answer: 3, // F=4, H=4, V=4
    choices: [2, 3, 4, 5],
  },
];

// Tile Economist — deep distribution knowledge (replaces Letter Distribution)
export const tileEconomistRounds = [
  {
    question: 'What is the combined face value of ALL 100 tiles in the bag?',
    answer: 187,
    choices: [183, 185, 187, 189],
  },
  {
    question: 'How many tiles in the bag are worth exactly 3 points?',
    answer: 8, // B=3×2, C=3×2, M=3×2, P=3×2 = 8 tiles
    choices: [6, 7, 8, 9],
  },
  {
    question: 'What is the total value of all tiles that appear exactly twice in the bag?',
    answer: 64, // B(3×2)+C(3×2)+F(4×2)+H(4×2)+M(3×2)+P(3×2)+V(4×2)+W(4×2)+Y(4×2) = 6+6+8+8+6+6+8+8+8 = 64
    choices: [60, 62, 64, 66],
  },
  {
    question: 'If you removed all 1-point tiles from the bag, what percentage of the total bag value would remain? (Round to nearest integer)',
    answer: 64, // 1-point tiles: A(9)+E(12)+I(9)+L(4)+N(6)+O(8)+R(6)+S(4)+T(6)+U(4) = 68. Remaining = 187-68 = 119. Percentage = 119/187 ≈ 63.6% ≈ 64%
    choices: [60, 62, 64, 66],
  },
  {
    question: 'Which letter has MORE tiles in the bag: O or I?',
    answer: 'I has more (9 vs 8)',
    choices: ['O has more (8 vs 7)', 'I has more (9 vs 8)', "They're equal (8 each)", "They're equal (9 each)"],
  },
  {
    question: 'What is the total value of all tiles that appear only once in the bag?',
    answer: 41, // J=8, K=5, Q=10, X=8, Z=10 = 41
    choices: [38, 39, 41, 43],
  },
  {
    question: 'The two 10-point tiles (Q and Z) represent what percentage of the total bag value (187)? Round to nearest integer.',
    answer: 11, // Q=10, Z=10 = 20 total. 20/187 = 0.107 = 10.7% ≈ 11%
    choices: [9, 10, 11, 12],
  },
];

// ============================================================
// Room 2: Hall of Words
// ============================================================

// Word Judgment — trickier words, player has 4 seconds each. 18 words, need 16.
export const wordJudgmentWords = [
  { word: 'QOPH', valid: true },     // Hebrew letter — looks fake
  { word: 'CWMS', valid: true },      // Plural of cwm — no vowels!
  { word: 'TSKED', valid: true },     // Past tense of TSK
  { word: 'AALII', valid: true },     // Hawaiian shrub
  { word: 'XI', valid: true },        // Greek letter
  { word: 'PRAU', valid: true },      // Malay sailing boat
  { word: 'CRWTH', valid: true },     // Welsh instrument — no vowels!
  { word: 'ADZE', valid: true },      // Woodworking tool
  { word: 'PHIZ', valid: true },      // Face, countenance (archaic)
  { word: 'XYST', valid: true },      // Covered portico (ancient architecture)
  { word: 'QUILP', valid: false },    // Dickens character, not a word
  { word: 'SNURFL', valid: false },   // Nonsense
  { word: 'BLARGH', valid: false },   // Not a Scrabble word
  { word: 'SLURB', valid: false },    // Not a word
  { word: 'QWERTY', valid: false },   // Keyboard layout name, not a word
  { word: 'SYZYGY', valid: true },   // Alignment of three celestial bodies — very obscure
  { word: 'PYX', valid: true },       // Container for consecrated bread — obscure
  { word: 'ZAX', valid: false },      // Not a word (sounds like it could be)
];

// Anagram Forge — escalating difficulty, NO clues for most rounds
export const anagramForgeRounds = [
  { scrambled: 'ZLWAT', answer: 'WALTZ', clue: null, length: 5 }, // Removed clue
  { scrambled: 'XPSIHN', answer: 'SPHINX', clue: null, length: 6 },
  { scrambled: 'ZRIBRAE', answer: 'BIZARRE', clue: null, length: 7 },
  { scrambled: 'XMIMIZAE', answer: 'MAXIMIZE', clue: null, length: 8 },
  { scrambled: 'JNIX', answer: 'JINX', clue: null, length: 4 },
  { scrambled: 'ZIPH', answer: 'PHIZ', clue: null, length: 4 }, // Obscure word
  { scrambled: 'YGYZSY', answer: 'SYZYGY', clue: null, length: 6 }, // Very obscure
  { scrambled: 'XPY', answer: 'PYX', clue: null, length: 3 }, // Obscure 3-letter
];

// ============================================================
// Room 3: Board Sanctuary
// ============================================================

// Board Map — monochrome board, must identify premium type from position memory
export const boardMapRounds = [
  { row: 0, col: 0, type: 4, answer: 'TW' },
  { row: 5, col: 1, type: 2, answer: 'TL' },
  { row: 3, col: 3, type: 3, answer: 'DW' },
  { row: 6, col: 2, type: 1, answer: 'DL' },
  { row: 1, col: 5, type: 2, answer: 'TL' },
  { row: 7, col: 7, type: 3, answer: 'DW' },  // center star
  { row: 0, col: 7, type: 4, answer: 'TW' },
  { row: 2, col: 6, type: 1, answer: 'DL' },
  { row: 6, col: 6, type: 3, answer: 'DW' },
  { row: 14, col: 0, type: 4, answer: 'TW' },
  { row: 1, col: 13, type: 2, answer: 'TL' }, // Harder positions
  { row: 13, col: 1, type: 2, answer: 'TL' },
  { row: 4, col: 4, type: 3, answer: 'DW' },
  { row: 10, col: 10, type: 3, answer: 'DW' },
];

// Score Calculator — escalating: simple → TWS+DLS combo → bingo bonus
export const scoreCalculatorRounds = [
  {
    description: 'QUIZ played horizontally at row 7, starting at column 5',
    word: 'QUIZ',
    tiles: [
      { letter: 'Q', row: 7, col: 5 },
      { letter: 'U', row: 7, col: 6 },
      { letter: 'I', row: 7, col: 7 },
      { letter: 'Z', row: 7, col: 8 },
    ],
    // row7: [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4]
    // col5=normal, col6=normal, col7=DWS, col8=normal
    // (10+1+1+10)×2 = 44
    answer: 44,
    hint: 'One tile lands on the center star (Double Word Score).',
  },
  {
    description: 'VIXEN played horizontally at row 0, starting at column 0',
    word: 'VIXEN',
    tiles: [
      { letter: 'V', row: 0, col: 0 },
      { letter: 'I', row: 0, col: 1 },
      { letter: 'X', row: 0, col: 2 },
      { letter: 'E', row: 0, col: 3 },
      { letter: 'N', row: 0, col: 4 },
    ],
    // row0: [4,0,0,1,0,...] → V on TWS, E on DLS
    // V=4, I=1, X=8, E=1×2=2, N=1 → (4+1+8+2+1)×3 = 48
    answer: 48,
    hint: 'The V sits on a Triple Word Score and the E on a Double Letter Score.',
  },
  {
    description: 'JINX played horizontally at row 0, starting at column 0',
    word: 'JINX',
    tiles: [
      { letter: 'J', row: 0, col: 0 },
      { letter: 'I', row: 0, col: 1 },
      { letter: 'N', row: 0, col: 2 },
      { letter: 'X', row: 0, col: 3 },
    ],
    // row0: col0=TWS, col3=DLS
    // J=8, I=1, N=1, X=8×2=16 → (8+1+1+16)×3 = 78
    answer: 78,
    hint: 'The J is on TWS and the X is on DLS. Letter multipliers apply before word multipliers.',
  },
  {
    description: 'NASTIER (bingo!) played horizontally at row 0, starting at column 0',
    word: 'NASTIER',
    tiles: [
      { letter: 'N', row: 0, col: 0 },
      { letter: 'A', row: 0, col: 1 },
      { letter: 'S', row: 0, col: 2 },
      { letter: 'T', row: 0, col: 3 },
      { letter: 'I', row: 0, col: 4 },
      { letter: 'E', row: 0, col: 5 },
      { letter: 'R', row: 0, col: 6 },
    ],
    // row0: col0=TWS(4), col3=DLS(1)
    // N=1, A=1, S=1, T=1×2=2, I=1, E=1, R=1 → (1+1+1+2+1+1+1)×3 = 24 + 50 bingo = 74
    answer: 74,
    hint: 'Using all 7 tiles earns a 50-point bingo bonus ON TOP of the word score.',
  },
  {
    description: 'QUIXOTIC played horizontally at row 14, starting at column 0',
    word: 'QUIXOTIC',
    tiles: [
      { letter: 'Q', row: 14, col: 0 },
      { letter: 'U', row: 14, col: 1 },
      { letter: 'I', row: 14, col: 2 },
      { letter: 'X', row: 14, col: 3 },
      { letter: 'O', row: 14, col: 4 },
      { letter: 'T', row: 14, col: 5 },
      { letter: 'I', row: 14, col: 6 },
      { letter: 'C', row: 14, col: 7 },
    ],
    // row14: [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4]
    // col0=TWS, col3=DLS, col7=DWS
    // Q=10, U=1, I=1, X=8×2=16, O=1, T=1, I=1, C=3 → (10+1+1+16+1+1+1+3)×3×2 = 102×2 = 204
    answer: 204,
    hint: 'Q on TWS, X on DLS, C on DWS. Word multipliers stack!',
  },
  {
    description: 'JAZZ played horizontally at row 0, starting at column 0',
    word: 'JAZZ',
    tiles: [
      { letter: 'J', row: 0, col: 0 },
      { letter: 'A', row: 0, col: 1 },
      { letter: 'Z', row: 0, col: 2 },
      { letter: 'Z', row: 0, col: 3 },
    ],
    // row0: [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4]
    // col0=TWS, col3=DLS
    // J=8, A=1, Z=10×2=20, Z=10 → (8+1+20+10)×3 = 117
    answer: 117,
    hint: 'J on TWS, first Z on DLS. Both Z tiles count separately.',
  },
  {
    description: 'MAXIMIZE (bingo!) played horizontally at row 0, starting at column 0',
    word: 'MAXIMIZE',
    tiles: [
      { letter: 'M', row: 0, col: 0 },
      { letter: 'A', row: 0, col: 1 },
      { letter: 'X', row: 0, col: 2 },
      { letter: 'I', row: 0, col: 3 },
      { letter: 'M', row: 0, col: 4 },
      { letter: 'I', row: 0, col: 5 },
      { letter: 'Z', row: 0, col: 6 },
      { letter: 'E', row: 0, col: 7 },
    ],
    // row0: col0=TWS, col3=DLS, col7=TWS
    // M=3, A=1, X=8, I=1×2=2, M=3, I=1, Z=10, E=1 → (3+1+8+2+3+1+10+1)×3×3 = 87×9 = 783... wait that's too high. Let me recalculate: Actually col7 is TWS, so word multiplier is 3×3=9. But wait, that seems wrong. Let me check the board: row0 col7 is TWS (4). So if we have TWS at start and TWS at end, do they stack? Actually yes, word multipliers stack. So (3+1+8+2+3+1+10+1)×3×3 = 29×9 = 261. But that still seems high. Actually, let me simplify: M=3, A=1, X=8, I=1×2=2, M=3, I=1, Z=10, E=1. Sum = 3+1+8+2+3+1+10+1 = 29. Word multipliers: col0=TWS(×3), col7=TWS(×3) = ×9. So 29×9 = 261. Plus bingo 50 = 311. But that's very high. Let me make it simpler.
    answer: 311,
    hint: 'M on TWS, I on DLS, E on TWS. Word multipliers stack, plus 50 bingo bonus.',
  },
];

// ============================================================
// Room 4: Strategy Vault
// ============================================================

// Bingo Hunt — NO CLUES. Just find the 7-letter word from scrambled rack.
export const bingoHuntRounds = [
  { rack: ['R','E','T','S','I','A','N'], answer: 'NASTIER', clue: null },
  { rack: ['G','N','I','T','A','E','S'], answer: 'SEATING', clue: null },
  { rack: ['D','E','R','I','A','N','S'], answer: 'SARDINE', clue: null },
  { rack: ['R','E','T','A','I','N','S'], answer: 'RETAINS', clue: null },
  { rack: ['P','A','I','N','T','E','R'], answer: 'PAINTER', clue: null },
  { rack: ['T','E','A','R','I','N','S'], answer: 'RETAINS', clue: null }, // Same answer, different scramble
  { rack: ['S','T','A','R','I','N','E'], answer: 'RETAINS', clue: null }, // Harder: very scrambled
  { rack: ['A','N','T','S','I','E','R'], answer: 'NASTIER', clue: null }, // Harder: different word
];

// Strategy Choice — 4 options, tight margins, real strategic thinking required
export const strategyChoiceRounds = [
  {
    scenario: "You have Q with no U. The board has an exposed I, and placing Q there puts it on a TLS. Your rack is otherwise excellent (AENRST + Q).",
    rack: ['Q', 'A', 'E', 'N', 'R', 'S', 'T'],
    options: [
      { move: 'Play QI with Q on TLS for 31 points (keep AENRST)', correct: true },
      { move: 'Exchange Q alone and hope to draw U', correct: false },
      { move: 'Play RANTS for 20 points, exchange Q next turn', correct: false },
      { move: 'Play QAT for 12 points, keep ENRS', correct: false },
    ],
    explanation: 'QI on TLS scores 31 AND leaves AENRST — one of the best leaves in Scrabble. Far better than wasting a turn exchanging.',
  },
  {
    scenario: "Late game: you lead by 30 with only 4 tiles left in the bag. Your opponent has strong tiles. The TWS in the corner is wide open.",
    rack: ['D', 'E', 'F', 'I', 'L', 'O', 'N'],
    options: [
      { move: 'Play FONDLE for 36 points (TWS stays open)', correct: false },
      { move: 'Play FOILED for 28 points, blocking the TWS', correct: true },
      { move: 'Play ODE for 14 points, keep strong tiles', correct: false },
      { move: 'Play DEFILE for 32 points (TWS stays open)', correct: false },
    ],
    explanation: 'With only 4 tiles in the bag and a narrow lead, blocking the TWS is critical. The 8-point sacrifice prevents a potential 45+ point swing.',
  },
  {
    scenario: "You're behind by 40. You can play a bingo (PAINTER, all 7 tiles) for 68 base points, or JINX on a TWS for 78 points. 30 tiles remain.",
    rack: ['P', 'A', 'I', 'N', 'T', 'E', 'R'],
    options: [
      { move: 'JINX on TWS for 78 points', correct: false },
      { move: 'PAINTER bingo for 68 + 50 = 118 points', correct: true },
      { move: 'PAINT for 26 points, keep ER for flexibility', correct: false },
      { move: 'REPAINT bingo for 72 + 50 = 122 points (if the hook exists)', correct: false },
    ],
    explanation: 'The bingo scores 118 vs 78 — a 40-point difference that erases your deficit. With 30 tiles left, there is plenty of game remaining; the extra points matter more than board control.',
  },
  {
    scenario: "You're tied. Your rack is AEILNRS (excellent bingo leave). The board has an open DWS. You can play RAINS for 18, or exchange all 7 tiles. 12 tiles remain in bag.",
    rack: ['A', 'E', 'I', 'L', 'N', 'R', 'S'],
    options: [
      { move: 'Exchange all 7 tiles to fish for a bingo', correct: true },
      { move: 'Play RAINS for 18 points, keep EIL', correct: false },
      { move: 'Play RAIN for 12 points, keep EILS', correct: false },
      { move: 'Play SAIL for 8 points, keep ENR', correct: false },
    ],
    explanation: 'With AEILNRS, exchanging gives you a high chance of drawing a bingo. With only 12 tiles left, the exchange is worth the risk. Playing RAINS wastes your excellent leave.',
  },
  {
    scenario: "You lead by 15. Opponent has 3 tiles left. You hold QXZ (terrible). The board has no good Q plays. You can exchange QXZ (lose turn) or play QI for 11 points.",
    rack: ['Q', 'X', 'Z', 'A', 'E', 'I', 'O'],
    options: [
      { move: 'Exchange QXZ, keep AEIO', correct: true },
      { move: 'Play QI for 11 points, keep XZAEIO', correct: false },
      { move: 'Play QAT for 12 points, keep XZEIO', correct: false },
      { move: 'Play QI and exchange XZ next turn', correct: false },
    ],
    explanation: 'With opponent having only 3 tiles, exchanging QXZ (keeping AEIO) is better than wasting a turn on QI. You maintain your lead and improve your rack for the endgame.',
  },
];

// ============================================================
// Room 5: Inner Sanctum — Lexicon Trial (harder mini-challenges)
// ============================================================

export const lexiconTrialChallenges = [
  {
    type: 'rack-value',
    question: 'Rack: Q, Z, X, J, K, W, H — what is the product of the two highest-scoring tiles?',
    answer: 100, // Q=10, Z=10 → 10×10 = 100
    choices: [80, 90, 100, 110],
  },
  {
    type: 'distribution',
    question: 'How many tiles in the bag are worth exactly 4 points?',
    answer: 10, // F=4×2, H=4×2, V=4×2, W=4×2, Y=4×2 = 10 tiles
    choices: [8, 9, 10, 12],
  },
  {
    type: 'word-judgment',
    question: 'Is SYZYGY a valid Scrabble word?',
    answer: true,
    choices: ['Valid', 'Invalid'],
  },
  {
    type: 'anagram',
    scrambled: 'YGYZSY',
    answer: 'SYZYGY',
    clue: null, // Very obscure word
  },
  {
    type: 'score-calc',
    question: 'JAZZ on a TWS with first Z on DLS. J=8, A=1, Z=10, Z=10. Score?',
    answer: 117, // J=8, A=1, Z=10×2=20, Z=10 → (8+1+20+10)×3 = 117
    choices: [105, 111, 117, 123],
  },
  {
    type: 'rack-value',
    question: 'Rack: Q, U, I, Z, O, T, I — what is the sum of vowels minus the sum of consonants?',
    answer: -17, // Vowels: U=1, I=1, O=1, I=1 = 4. Consonants: Q=10, Z=10, T=1 = 21. 4-21 = -17
    choices: [-19, -17, -15, -13],
  },
  {
    type: 'word-judgment',
    question: 'Is PYX a valid Scrabble word?',
    answer: true,
    choices: ['Valid', 'Invalid'],
  },
];
