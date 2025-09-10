// Different types of puzzles for the escape room
export const PUZZLE_TYPES = {
  WORD_LOCK: 'word_lock',
  ANAGRAM: 'anagram',
  WORD_CHAIN: 'word_chain',
  CROSSWORD: 'crossword',
  WORD_SEARCH: 'word_search',
  RIDDLE: 'riddle',
  PATTERN: 'pattern'
};

// Puzzle generators for different room themes
export const generateMysteryPuzzles = () => [
  {
    id: 'ancient_door',
    type: PUZZLE_TYPES.WORD_LOCK,
    title: 'The Ancient Door',
    description: 'A massive stone door blocks your path. Carved into its surface are seven empty slots. You must form a 7-letter word using the provided tiles to unlock it.',
    tiles: ['M', 'Y', 'S', 'T', 'E', 'R', 'Y'],
    solution: 'MYSTERY',
    hint: 'The word describes something unknown or puzzling',
    position: { x: 200, y: 300 },
    unlocked: false,
    points: 100
  },
  {
    id: 'bookshelf_clue',
    type: PUZZLE_TYPES.ANAGRAM,
    title: 'The Hidden Clue',
    description: 'Among the dusty tomes, you find a scroll with scrambled letters. Rearrange them to reveal the secret word:',
    tiles: ['L', 'I', 'B', 'R', 'A', 'R', 'Y'],
    solution: 'LIBRARY',
    hint: 'Where knowledge is stored',
    position: { x: 400, y: 200 },
    unlocked: false,
    points: 150
  },
  {
    id: 'crystal_orb',
    type: PUZZLE_TYPES.WORD_CHAIN,
    title: 'The Crystal Orb',
    description: 'The crystal orb pulses with energy. Create a word chain starting with the given letter. Each word must be at least 4 letters long.',
    startLetter: 'S',
    minLength: 4,
    words: ['STAR', 'TAR', 'ART', 'RAT', 'AT'],
    position: { x: 600, y: 400 },
    unlocked: false,
    points: 200
  },
  {
    id: 'secret_passage',
    type: PUZZLE_TYPES.RIDDLE,
    title: 'The Secret Passage',
    description: 'A riddle is inscribed on the wall: "I am a word that means to escape, but I also mean to be free. What am I?"',
    solution: 'BREAK',
    hint: 'Think of breaking free or breaking out',
    position: { x: 300, y: 500 },
    unlocked: false,
    points: 250
  }
];

export const generateSciFiPuzzles = () => [
  {
    id: 'quantum_lock',
    type: PUZZLE_TYPES.WORD_LOCK,
    title: 'Quantum Lock',
    description: 'The quantum field requires a specific word frequency to stabilize. Enter a 6-letter word to unlock the containment field.',
    tiles: ['Q', 'U', 'A', 'N', 'T', 'U', 'M'],
    solution: 'QUANTUM',
    hint: 'The fundamental unit of energy',
    position: { x: 150, y: 250 },
    unlocked: false,
    points: 150
  },
  {
    id: 'ai_interface',
    type: PUZZLE_TYPES.PATTERN,
    title: 'AI Interface',
    description: 'The AI requires a specific word pattern. Create a word that starts and ends with the same letter.',
    pattern: 'SAME_START_END',
    example: 'LEVEL',
    position: { x: 400, y: 350 },
    unlocked: false,
    points: 200
  },
  {
    id: 'dimensional_portal',
    type: PUZZLE_TYPES.WORD_CHAIN,
    title: 'Dimensional Portal',
    description: 'The portal requires a word chain that forms a complete cycle. Start with any letter and end with the same letter.',
    startLetter: 'A',
    minLength: 5,
    words: ['APPLE', 'EAGLE', 'EVERY', 'YACHT', 'TIGER', 'RADIO', 'OCEAN', 'NIGHT', 'TRAIN', 'NIGHT'],
    position: { x: 650, y: 200 },
    unlocked: false,
    points: 300
  }
];

export const generateHorrorPuzzles = () => [
  {
    id: 'crypt_door',
    type: PUZZLE_TYPES.WORD_LOCK,
    title: 'The Crypt Door',
    description: 'The ancient crypt door is sealed with a word of power. Form a 5-letter word to break the seal.',
    tiles: ['G', 'H', 'O', 'S', 'T'],
    solution: 'GHOST',
    hint: 'A spirit that haunts the living',
    position: { x: 250, y: 300 },
    unlocked: false,
    points: 100
  },
  {
    id: 'haunted_mirror',
    type: PUZZLE_TYPES.ANAGRAM,
    title: 'The Haunted Mirror',
    description: 'The mirror shows scrambled letters that form a word of protection. Rearrange them quickly!',
    tiles: ['S', 'P', 'I', 'R', 'I', 'T'],
    solution: 'SPIRIT',
    hint: 'A supernatural being',
    position: { x: 500, y: 400 },
    unlocked: false,
    points: 150
  },
  {
    id: 'cursed_tome',
    type: PUZZLE_TYPES.RIDDLE,
    title: 'The Cursed Tome',
    description: 'The cursed book asks: "I am a word that means to be afraid, but I also mean to be cautious. What am I?"',
    solution: 'FEAR',
    hint: 'An emotion that protects us from danger',
    position: { x: 350, y: 500 },
    unlocked: false,
    points: 200
  }
];

// Puzzle validation functions
export const validateWordLock = (submittedWord, solution) => {
  return submittedWord.toUpperCase() === solution.toUpperCase();
};

export const validateAnagram = (submittedWord, solution, availableTiles) => {
  const word = submittedWord.toUpperCase();
  const target = solution.toUpperCase();
  
  // Check if the word matches the solution
  if (word !== target) return false;
  
  // Check if all letters are available
  const availableLetters = [...availableTiles];
  for (let letter of word) {
    const index = availableLetters.indexOf(letter);
    if (index === -1) return false;
    availableLetters.splice(index, 1);
  }
  
  return true;
};

export const validateWordChain = (submittedWords, startLetter, minLength) => {
  if (submittedWords.length === 0) return false;
  
  // Check if first word starts with startLetter
  if (submittedWords[0][0].toUpperCase() !== startLetter.toUpperCase()) return false;
  
  // Check if all words meet minimum length
  if (submittedWords.some(word => word.length < minLength)) return false;
  
  // Check if words form a chain (last letter of one word is first letter of next)
  for (let i = 0; i < submittedWords.length - 1; i++) {
    const currentWord = submittedWords[i].toUpperCase();
    const nextWord = submittedWords[i + 1].toUpperCase();
    if (currentWord[currentWord.length - 1] !== nextWord[0]) return false;
  }
  
  return true;
};

export const validateRiddle = (submittedWord, solution) => {
  return submittedWord.toUpperCase() === solution.toUpperCase();
};

export const validatePattern = (submittedWord, pattern) => {
  const word = submittedWord.toUpperCase();
  
  switch (pattern) {
    case 'SAME_START_END':
      return word.length > 1 && word[0] === word[word.length - 1];
    case 'PALINDROME':
      return word === word.split('').reverse().join('');
    case 'DOUBLE_LETTER':
      for (let i = 0; i < word.length - 1; i++) {
        if (word[i] === word[i + 1]) return true;
      }
      return false;
    default:
      return false;
  }
};

// Get puzzle by type
export const getPuzzleByType = (type) => {
  switch (type) {
    case PUZZLE_TYPES.WORD_LOCK:
      return {
        validate: validateWordLock,
        instructions: 'Form a word using the provided tiles to unlock the door.'
      };
    case PUZZLE_TYPES.ANAGRAM:
      return {
        validate: validateAnagram,
        instructions: 'Rearrange the letters to form the correct word.'
      };
    case PUZZLE_TYPES.WORD_CHAIN:
      return {
        validate: validateWordChain,
        instructions: 'Create a chain of words where each word starts with the last letter of the previous word.'
      };
    case PUZZLE_TYPES.RIDDLE:
      return {
        validate: validateRiddle,
        instructions: 'Answer the riddle with a single word.'
      };
    case PUZZLE_TYPES.PATTERN:
      return {
        validate: validatePattern,
        instructions: 'Create a word that follows the specified pattern.'
      };
    default:
      return null;
  }
};
