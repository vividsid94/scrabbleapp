// scrabbleBot.js - Refactored and optimized Scrabble bot

const { createClient } = require('@supabase/supabase-js');
const letterScores = require('./gameLogic').letterScores;
const boardMultipliers = require('./gameLogic').boardMultipliers;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Fetch entire dictionary once for local validation
let dictionarySet = null;
async function loadDictionary() {
  if (dictionarySet) return dictionarySet;
  try {
    // First get the total count
    const { count, error: countError } = await supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log('Total words in dictionary:', count);

    // Fetch all words in batches
    const batchSize = 1000;
    const batches = Math.ceil(count / batchSize);
    let allWords = [];

    for (let i = 0; i < batches; i++) {
      const { data, error } = await supabase
        .from('dictionary')
        .select('word')
        .range(i * batchSize, (i + 1) * batchSize - 1);

      if (error) throw error;
      allWords = allWords.concat(data.map(d => d.word.toUpperCase()));
    }

    dictionarySet = new Set(allWords);
    console.log('Loaded dictionary with', dictionarySet.size, 'words');
    return dictionarySet;
  } catch (err) {
    console.error('Error loading dictionary:', err);
    throw err;
  }
}

// Generate all possible words from given letters (with blanks)
const getPossibleWords = async (letters) => {
  try {
    // Normalize letters to uppercase and check for blank tiles
    const normalizedLetters = letters.map(l => l.toUpperCase());
    const blanks = normalizedLetters.filter(l => l === '?').length;
    const nonBlankLetters = normalizedLetters.filter(l => l !== '?');
    
    // Count occurrences of each letter
    const letterCounts = {};
    nonBlankLetters.forEach(letter => {
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    });

    // Get words from database that contain any of our letters
    const { data: words, error } = await supabase
      .from('dictionary')
      .select('word')
      .or(nonBlankLetters.map(letter => `word.ilike.%${letter}%`).join(','))
      .limit(2000);

    if (error) throw error;

    // Filter words that can be formed with our letters
    const possibleWords = words.filter(word => {
      const wordLetters = word.word.toUpperCase().split('');
      const tempLetterCounts = { ...letterCounts };
      let blanksNeeded = 0;

      for (const letter of wordLetters) {
        if (tempLetterCounts[letter] > 0) {
          tempLetterCounts[letter]--;
        } else {
          blanksNeeded++;
        }
      }

      return blanksNeeded <= blanks;
    });

    // Sort by length and score
    return possibleWords
      .map(w => w.word)
      .sort((a, b) => {
        if (a.length !== b.length) return b.length - a.length;
        const scoreA = a.split('').reduce((sum, l) => sum + (letterScores[l] || 0), 0);
        const scoreB = b.split('').reduce((sum, l) => sum + (letterScores[l] || 0), 0);
        return scoreB - scoreA;
      });
  } catch (error) {
    console.error('Error in getPossibleWords:', error);
    return [];
  }
};

// Calculate score of a word placement
function calculateScore(tiles, boardMultipliers) {
  let score = 0;
  let wordMultiplier = 1;
  const usedPremiumSquares = new Set();

  for (const { row, col, letter, isNew } of tiles) {
    const letterScore = letterScores[letter] || 0;
    const premium = boardMultipliers[row][col];
    
    if (!isNew) {
      score += letterScore;
    } else {
      let mult = 1;
      if (premium === 1) mult = 2; // Double letter
      else if (premium === 2) mult = 3; // Triple letter
      else if (premium === 3) { // Double word
        if (!usedPremiumSquares.has(`DW-${row}-${col}`)) {
          wordMultiplier *= 2;
          usedPremiumSquares.add(`DW-${row}-${col}`);
        }
      }
      else if (premium === 4) { // Triple word
        if (!usedPremiumSquares.has(`TW-${row}-${col}`)) {
          wordMultiplier *= 3;
          usedPremiumSquares.add(`TW-${row}-${col}`);
        }
      }
      score += letterScore * mult;
    }
  }
  return score * wordMultiplier + (tiles.filter(t => t.isNew).length === 7 ? 50 : 0);
}

// Try all positions on board for horizontal/vertical placements
const findValidPlacements = (board, word) => {
  const placements = [];
  const wordLength = word.length;
  
  // If board is empty, only allow placement through center
  const isFirstMove = board.every(row => row.every(cell => cell === ''));
  if (isFirstMove) {
    const center = 7;
    // Try horizontal placement
    if (center + wordLength <= 15) {
      placements.push({
        row: center,
        col: center,
        direction: 'right',
        tiles: word.split('').map((letter, i) => ({
          row: center,
          col: center + i,
          letter,
          isNew: true
        }))
      });
    }
    // Try vertical placement
    if (center + wordLength <= 15) {
      placements.push({
        row: center,
        col: center,
        direction: 'down',
        tiles: word.split('').map((letter, i) => ({
          row: center + i,
          col: center,
          letter,
          isNew: true
        }))
      });
    }
    return placements;
  }

  // For subsequent moves, only check positions adjacent to existing tiles
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      // Skip if no adjacent tiles
      if (!hasAdjacentTile(board, row, col)) continue;

      // Try horizontal placement
      if (col + wordLength <= 15) {
        const tiles = [];
        let isValid = true;
        let hasExistingTile = false;

        for (let i = 0; i < wordLength; i++) {
          const currentRow = row;
          const currentCol = col + i;
          const currentCell = board[currentRow][currentCol];
          
          if (currentCell !== '') {
            if (currentCell !== word[i]) {
              isValid = false;
              break;
            }
            hasExistingTile = true;
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: currentCell,
              isNew: false
            });
          } else {
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: word[i],
              isNew: true
            });
          }
        }

        if (isValid && hasExistingTile) {
          placements.push({
            row,
            col,
            direction: 'right',
            tiles
          });
        }
      }

      // Try vertical placement
      if (row + wordLength <= 15) {
        const tiles = [];
        let isValid = true;
        let hasExistingTile = false;

        for (let i = 0; i < wordLength; i++) {
          const currentRow = row + i;
          const currentCol = col;
          const currentCell = board[currentRow][currentCol];
          
          if (currentCell !== '') {
            if (currentCell !== word[i]) {
              isValid = false;
              break;
            }
            hasExistingTile = true;
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: currentCell,
              isNew: false
            });
          } else {
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: word[i],
              isNew: true
            });
          }
        }

        if (isValid && hasExistingTile) {
          placements.push({
            row,
            col,
            direction: 'down',
            tiles
          });
        }
      }
    }
  }

  return placements;
};

// Helper function to check if a position has adjacent tiles
const hasAdjacentTile = (board, row, col) => {
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
  ];
  
  return directions.some(([dr, dc]) => {
    const newRow = row + dr;
    const newCol = col + dc;
    return newRow >= 0 && newRow < 15 && 
           newCol >= 0 && newCol < 15 && 
           board[newRow][newCol] !== '';
  });
};

// Choose best bot move
async function generateBotMove(board, letters) {
  try {
    console.log('Generating bot move with letters:', letters);
    const words = await getPossibleWords(letters);
    console.log('Found', words.length, 'possible words');
    
    if (words.length === 0) {
      console.log('No valid words found');
      return null;
    }

    // Try each word until we find a valid placement
    for (const word of words) {
      const placements = findValidPlacements(board, word);
      console.log('Found', placements.length, 'possible placements for word:', word);
      
      if (placements.length > 0) {
        // Choose the highest scoring placement
        const bestPlacement = placements.reduce((best, current) => {
          const currentScore = calculateScore(current.tiles, boardMultipliers);
          const bestScore = calculateScore(best.tiles, boardMultipliers);
          return currentScore > bestScore ? current : best;
        });
        
        console.log('Found legal move:', word);
        return bestPlacement;
      }
    }
    
    console.log('No legal moves found');
    return null;
  } catch (err) {
    console.error('Error in generateBotMove:', err);
    return null;
  }
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { board, letters } = JSON.parse(event.body);
    const move = await generateBotMove(board, letters);
    return {
      statusCode: 200,
      body: JSON.stringify(move || { message: 'No valid move found' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal Error' })
    };
  }
};
