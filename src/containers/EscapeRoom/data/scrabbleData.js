import { letterScores } from '../../../functions/scoreFunctions';

export { letterScores };

// Standard Scrabble tile distribution
export const letterDistribution = {
  'A': 9, 'B': 2, 'C': 2, 'D': 4, 'E': 12, 'F': 2, 'G': 3, 'H': 2, 'I': 9,
  'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2, 'Q': 1, 'R': 6,
  'S': 4, 'T': 6, 'U': 4, 'V': 2, 'W': 2, 'X': 1, 'Y': 2, 'Z': 1, '?': 2,
};

// Standard 15x15 board layout
// 0=normal, 1=DLS, 2=TLS, 3=DWS, 4=TWS
export const standardBoard = [
  [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
  [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
  [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
  [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
  [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
  [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
  [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
  [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4],
  [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
  [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
  [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
  [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
  [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
  [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
  [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
];

export const premiumLabels = {
  0: '',
  1: 'DL',
  2: 'TL',
  3: 'DW',
  4: 'TW',
};

export const premiumFullLabels = {
  0: 'Normal',
  1: 'Double Letter Score',
  2: 'Triple Letter Score',
  3: 'Double Word Score',
  4: 'Triple Word Score',
};

// Valid Scrabble words for puzzles (common + tricky)
export const validWords = [
  'QI', 'ZA', 'XU', 'JO', 'KA', 'XI', 'OX', 'AX', 'EX',
  'QUARTZ', 'JAZZ', 'FIZZ', 'BUZZ', 'JINX', 'WALTZ',
  'SYZYGY', 'ZEPHYR', 'SPHINX', 'GLYPH', 'NYMPH',
  'BINGO', 'EQUIP', 'QUICK', 'JEWEL', 'KAYAK',
  'AALII', 'ADZE', 'BHAJI', 'CWMS', 'DJINN',
  'ETUDE', 'FJORD', 'GHEE', 'HIJAB', 'IAMB',
  'JAMB', 'KNACK', 'LLANO', 'MYRRH', 'NAAN',
  'OUZO', 'PRAWN', 'QUEUE', 'RHYME', 'SCHWA',
  'THYME', 'UNFIX', 'VODKA', 'WRYLY', 'XEROX',
  'YACHT', 'ZILCH',
  'SATIRE', 'RETINA', 'NASTIER', 'ANTSIER', 'RETAINS',
  'STAINER', 'STEARIN', 'RETSINA',
  'AGROUND', 'BRAVEST', 'CLAIMED', 'DOLPHIN', 'EASTERN',
];

export const invalidWords = [
  'QA', 'ZX', 'VV', 'IQ', 'UZ',
  'KWYJIBO', 'FLURB', 'ZAXQP', 'BLARGH', 'SNURFL',
  'FLARB', 'GRINTO', 'XYLVZ', 'WUMPF', 'THRAK',
  'BLOOP', 'CRUNK', 'DWEEB', 'FLEEK', 'GLORP',
  'HMONG', 'JELLO', 'KLUGE', 'MIXUP', 'NERDZ',
];
