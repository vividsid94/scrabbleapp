// scrabbleBot.js - Optimized Scrabble bot using DAWG

const { createClient } = require('@supabase/supabase-js');
const letterScores = require('./gameLogic').letterScores;
const boardMultipliers = require('./gameLogic').boardMultipliers;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// DAWG Node class
class DawgNode {
  constructor() {
    this.isTerminal = false;
    this.children = new Map();
  }
}

// DAWG implementation
class Dawg {
  constructor() {
    this.root = new DawgNode();
  }

  insert(word) {
    let node = this.root;
    for (const letter of word) {
      if (!node.children.has(letter)) {
        node.children.set(letter, new DawgNode());
      }
      node = node.children.get(letter);
    }
    node.isTerminal = true;
  }

  contains(word) {
    let node = this.root;
    for (const letter of word) {
      if (!node.children.has(letter)) {
        return false;
      }
      node = node.children.get(letter);
    }
    return node.isTerminal;
  }

  findWords(letters, prefix = '', node = this.root, words = new Set()) {
    if (node.isTerminal) {
      words.add(prefix);
    }

    const letterCounts = {};
    letters.forEach(letter => {
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    });

    for (const [letter, child] of node.children) {
      if (letterCounts[letter] > 0) {
        letterCounts[letter]--;
        this.findWords(letters, prefix + letter, child, words);
        letterCounts[letter]++;
      }
    }

    return words;
  }
}

// Initialize DAWG
let dawg = null;
async function loadDictionary() {
  if (dawg) return dawg;
  
  try {
    // First get the total count
    const { count, error: countError } = await supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log('Total words in dictionary:', count);

    // Fetch all words in batches
    const batchSize = 5000;
    const batches = Math.ceil(count / batchSize);
    let allWords = [];

    for (let i = 0; i < batches; i++) {
      const { data, error } = await supabase
        .from('dictionary')
        .select('word')
        .range(i * batchSize, (i + 1) * batchSize - 1);

      if (error) throw error;
      allWords = allWords.concat(data.map(d => d.word.toUpperCase()));
      console.log(`Loaded batch ${i + 1}/${batches}`);
    }

    dawg = new Dawg();
    allWords.forEach(word => dawg.insert(word));
    console.log('Loaded dictionary into DAWG with', allWords.length, 'words');
    return dawg;
  } catch (err) {
    console.error('Error loading dictionary:', err);
    throw err;
  }
}

// Generate all possible words from given letters (with blanks)
const getPossibleWords = async (letters) => {
  try {
    const dawg = await loadDictionary();
    const normalizedLetters = letters.map(l => l.toUpperCase());
    const blanks = normalizedLetters.filter(l => l === '?').length;
    const nonBlankLetters = normalizedLetters.filter(l => l !== '?');
    
    console.log('Generating words for letters:', normalizedLetters);
    console.log('Blanks:', blanks);
    
    // Get all possible words from DAWG
    const possibleWords = new Set();
    
    // Function to generate all permutations of letters
    const generatePermutations = (currentLetters, remainingLetters) => {
      if (currentLetters.length > 0) {
        const word = currentLetters.join('');
        if (dawg.contains(word)) {
          possibleWords.add(word);
        }
      }
      
      if (remainingLetters.length === 0) return;
      
      for (let i = 0; i < remainingLetters.length; i++) {
        const newCurrent = [...currentLetters, remainingLetters[i]];
        const newRemaining = [...remainingLetters.slice(0, i), ...remainingLetters.slice(i + 1)];
        generatePermutations(newCurrent, newRemaining);
      }
    };
    
    // Generate all possible words
    generatePermutations([], nonBlankLetters);
    console.log('Found', possibleWords.size, 'words without blanks');
    
    // If we have blanks, we need to try all possible combinations
    if (blanks > 0) {
      const blankCombinations = new Set();
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      // Function to generate all possible combinations with blanks
      const generateCombinations = (currentLetters, remainingBlanks) => {
        if (remainingBlanks === 0) {
          blankCombinations.add(currentLetters.join(''));
          return;
        }
        
        for (const letter of alphabet) {
          const newLetters = [...currentLetters, letter];
          generateCombinations(newLetters, remainingBlanks - 1);
        }
      };
      
      generateCombinations(nonBlankLetters, blanks);
      console.log('Generated', blankCombinations.size, 'blank combinations');
      
      // Try all combinations with blanks
      for (const combination of blankCombinations) {
        const words = Array.from(dawg.findWords(combination.split('')));
        words.forEach(word => possibleWords.add(word));
      }
    }
    
    // Convert to array and sort
    const uniqueWords = Array.from(possibleWords);
    console.log('Total unique words found:', uniqueWords.length);
    
    return uniqueWords
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
  
  // Check if board is empty (first move)
  const isFirstMove = board.every(row => row.every(cell => cell === ''));
  console.log('Is first move:', isFirstMove);
  
  if (isFirstMove) {
    const center = 7;
    console.log('First move - trying center position:', center);
    
    // Try horizontal placement
    if (center + wordLength <= 15) {
      const tiles = word.split('').map((letter, i) => ({
        row: center,
        col: center + i,
        letter,
        isNew: true
      }));
      
      placements.push({
        row: center,
        col: center,
        direction: 'right',
        tiles
      });
      console.log('Added horizontal placement through center');
    }
    
    // Try vertical placement
    if (center + wordLength <= 15) {
      const tiles = word.split('').map((letter, i) => ({
        row: center + i,
        col: center,
        letter,
        isNew: true
      }));
      
      placements.push({
        row: center,
        col: center,
        direction: 'down',
        tiles
      });
      console.log('Added vertical placement through center');
    }
    
    return placements;
  }

  // For subsequent moves, check all positions
  console.log('Checking all positions for subsequent move');
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      // Try horizontal placement
      if (col + wordLength <= 15) {
        const tiles = [];
        let isValid = true;
        let hasExistingTile = false;
        let hasAdjacent = false;

        // Check if word connects to existing tiles
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
            // Check if this empty cell has any adjacent tiles
            if (hasAdjacentTile(board, currentRow, currentCol)) {
              hasAdjacent = true;
              console.log(`Found adjacent tile at ${currentRow},${currentCol}`);
            }
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: word[i],
              isNew: true
            });
          }
        }

        // Check if word forms valid connections
        if (isValid) {
          // Check if word connects to existing tiles horizontally
          const connectsHorizontally = hasExistingTile || 
            (col > 0 && board[row][col - 1] !== '') || 
            (col + wordLength < 15 && board[row][col + wordLength] !== '');

          // Check if word connects to existing tiles vertically
          let connectsVertically = false;
          for (let i = 0; i < wordLength; i++) {
            const currentRow = row;
            const currentCol = col + i;
            if ((currentRow > 0 && board[currentRow - 1][currentCol] !== '') ||
                (currentRow < 14 && board[currentRow + 1][currentCol] !== '')) {
              connectsVertically = true;
              break;
            }
          }

          if (connectsHorizontally || connectsVertically || hasAdjacent) {
            placements.push({
              row,
              col,
              direction: 'right',
              tiles
            });
            console.log(`Added horizontal placement at ${row},${col}`);
          }
        }
      }

      // Try vertical placement
      if (row + wordLength <= 15) {
        const tiles = [];
        let isValid = true;
        let hasExistingTile = false;
        let hasAdjacent = false;

        // Check if word connects to existing tiles
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
            // Check if this empty cell has any adjacent tiles
            if (hasAdjacentTile(board, currentRow, currentCol)) {
              hasAdjacent = true;
              console.log(`Found adjacent tile at ${currentRow},${currentCol}`);
            }
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: word[i],
              isNew: true
            });
          }
        }

        // Check if word forms valid connections
        if (isValid) {
          // Check if word connects to existing tiles vertically
          const connectsVertically = hasExistingTile || 
            (row > 0 && board[row - 1][col] !== '') || 
            (row + wordLength < 15 && board[row + wordLength][col] !== '');

          // Check if word connects to existing tiles horizontally
          let connectsHorizontally = false;
          for (let i = 0; i < wordLength; i++) {
            const currentRow = row + i;
            const currentCol = col;
            if ((currentCol > 0 && board[currentRow][currentCol - 1] !== '') ||
                (currentCol < 14 && board[currentRow][currentCol + 1] !== '')) {
              connectsHorizontally = true;
              break;
            }
          }

          if (connectsVertically || connectsHorizontally || hasAdjacent) {
            placements.push({
              row,
              col,
              direction: 'down',
              tiles
            });
            console.log(`Added vertical placement at ${row},${col}`);
          }
        }
      }
    }
  }

  console.log(`Found ${placements.length} valid placements for word "${word}"`);
  return placements;
};

// Helper function to check if a position has adjacent tiles
const hasAdjacentTile = (board, row, col) => {
  // Check all 8 surrounding positions
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],  // top left, top, top right
    [0, -1],           [0, 1],   // left, right
    [1, -1],  [1, 0],  [1, 1]    // bottom left, bottom, bottom right
  ];
  
  return directions.some(([dr, dc]) => {
    const newRow = row + dr;
    const newCol = col + dc;
    return newRow >= 0 && newRow < 15 && 
           newCol >= 0 && newCol < 15 && 
           board[newRow][newCol] !== '';
  });
};

// Netlify Functions handler
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { board, letters } = JSON.parse(event.body);
    console.log('Received request with letters:', letters);
    
    // Add a timeout to prevent premature switching
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    // Race between the move generation and timeout
    const move = await Promise.race([
      generateBotMove(board, letters),
      timeoutPromise
    ]);

    if (!move) {
      console.log('No valid move found');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No valid move found' })
      };
    }

    console.log('Sending move response:', move);
    return {
      statusCode: 200,
      body: JSON.stringify(move)
    };
  } catch (err) {
    console.error('Error in handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: err.message || 'Internal Error',
        details: err.stack
      })
    };
  }
};

// Helper function to check if a cell is empty
const isCellEmpty = (cell) => {
  return cell === '' || typeof cell === 'number';
};

// Find all possible anchor squares (squares adjacent to existing tiles)
const findAnchorSquares = (board) => {
  const anchors = [];
  
  // Check if board is empty (first move)
  const isFirstMove = board.every(row => row.every(cell => isCellEmpty(cell)));
  if (isFirstMove) {
    // For first move, only consider the center square
    anchors.push({ row: 7, col: 7 });
    return anchors;
  }
  
  // For subsequent moves, find all squares adjacent to existing tiles
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (isCellEmpty(board[row][col])) {
        // Check if this square is adjacent to any existing tile
        const directions = [
          [-1, -1], [-1, 0], [-1, 1],  // top left, top, top right
          [0, -1],           [0, 1],   // left, right
          [1, -1],  [1, 0],  [1, 1]    // bottom left, bottom, bottom right
        ];
        
        const hasAdjacent = directions.some(([dr, dc]) => {
          const newRow = row + dr;
          const newCol = col + dc;
          return newRow >= 0 && newRow < 15 && 
                 newCol >= 0 && newCol < 15 && 
                 !isCellEmpty(board[newRow][newCol]);
        });
        
        if (hasAdjacent) {
          anchors.push({ row, col });
        }
      }
    }
  }
  
  return anchors;
};

// Find possible word lengths for a given anchor square
const findPossibleLengths = (board, anchor, direction) => {
  const { row, col } = anchor;
  const lengths = [];
  
  // Check if board is empty (first move)
  const isFirstMove = board.every(row => row.every(cell => isCellEmpty(cell)));
  if (isFirstMove) {
    // For first move, try all lengths from 2 to 7
    for (let len = 2; len <= 7; len++) {
      lengths.push(len);
    }
    return lengths;
  }
  
  if (direction === 'right') {
    // Check left
    let left = col;
    while (left > 0 && !isCellEmpty(board[row][left - 1])) {
      left--;
    }
    
    // Check right
    let right = col;
    while (right < 14 && !isCellEmpty(board[row][right + 1])) {
      right++;
    }
    
    // Add all possible lengths
    for (let len = 2; len <= 7; len++) {
      if (col - left + len <= 15 && col >= left) {
        lengths.push(len);
      }
    }
  } else {
    // Check up
    let up = row;
    while (up > 0 && !isCellEmpty(board[up - 1][col])) {
      up--;
    }
    
    // Check down
    let down = row;
    while (down < 14 && !isCellEmpty(board[down + 1][col])) {
      down++;
    }
    
    // Add all possible lengths
    for (let len = 2; len <= 7; len++) {
      if (row - up + len <= 15 && row >= up) {
        lengths.push(len);
      }
    }
  }
  
  return [...new Set(lengths)]; // Remove duplicates
};

// Find all possible plays for a given anchor, length, and direction
const findPossiblePlays = (board, anchor, length, direction, letters) => {
  const { row, col } = anchor;
  const plays = [];
  
  // Generate all possible letter combinations of the given length
  const generateCombinations = (current, remaining, maxLength) => {
    if (current.length === maxLength) {
      return [current];
    }
    
    if (remaining.length === 0) {
      return [];
    }
    
    const combinations = [];
    for (let i = 0; i < remaining.length; i++) {
      const newCurrent = [...current, remaining[i]];
      const newRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
      combinations.push(...generateCombinations(newCurrent, newRemaining, maxLength));
    }
    return combinations;
  };
  
  // Get all possible letter combinations
  const letterCombinations = generateCombinations([], letters, length);
  console.log(`Generated ${letterCombinations.length} letter combinations of length ${length}`);
  
  if (direction === 'right') {
    // Try all possible starting positions
    for (let startCol = Math.max(0, col - length + 1); startCol <= col; startCol++) {
      if (startCol + length > 15) continue;
      
      // Try each letter combination
      for (const combination of letterCombinations) {
        const tiles = [];
        let isValid = true;
        let hasExistingTile = false;
        let hasAdjacent = false;
        let word = '';
        let newTilesCount = 0;
        
        // Check each position
        for (let i = 0; i < length; i++) {
          const currentRow = row;
          const currentCol = startCol + i;
          const currentCell = board[currentRow][currentCol];
          
          if (!isCellEmpty(currentCell)) {
            if (currentCell !== combination[i]) {
              isValid = false;
              break;
            }
            hasExistingTile = true;
            word += currentCell;
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: currentCell,
              isNew: false
            });
          } else {
            // Check if this empty cell has any adjacent tiles
            if (hasAdjacentTile(board, currentRow, currentCol)) {
              hasAdjacent = true;
            }
            word += combination[i];
            newTilesCount++;
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: combination[i],
              isNew: true
            });
          }
        }
        
        // Check if word forms valid connections
        if (isValid && newTilesCount > 0) {
          // Check if word connects to existing tiles horizontally
          const connectsHorizontally = hasExistingTile || 
            (startCol > 0 && !isCellEmpty(board[row][startCol - 1])) || 
            (startCol + length < 15 && !isCellEmpty(board[row][startCol + length]));

          // Check if word connects to existing tiles vertically
          let connectsVertically = false;
          for (let i = 0; i < length; i++) {
            const currentRow = row;
            const currentCol = startCol + i;
            if ((currentRow > 0 && !isCellEmpty(board[currentRow - 1][currentCol])) ||
                (currentRow < 14 && !isCellEmpty(board[currentRow + 1][currentCol]))) {
              connectsVertically = true;
              break;
            }
          }

          // Check if the word is valid in the dictionary and has at least one new tile
          if (dawg.contains(word) && (connectsHorizontally || connectsVertically || hasAdjacent)) {
            plays.push({
              row,
              col: startCol,
              direction: 'right',
              tiles,
              word
            });
          }
        }
      }
    }
  } else {
    // Try all possible starting positions
    for (let startRow = Math.max(0, row - length + 1); startRow <= row; startRow++) {
      if (startRow + length > 15) continue;
      
      // Try each letter combination
      for (const combination of letterCombinations) {
        const tiles = [];
        let isValid = true;
        let hasExistingTile = false;
        let hasAdjacent = false;
        let word = '';
        let newTilesCount = 0;
        
        // Check each position
        for (let i = 0; i < length; i++) {
          const currentRow = startRow + i;
          const currentCol = col;
          const currentCell = board[currentRow][currentCol];
          
          if (!isCellEmpty(currentCell)) {
            if (currentCell !== combination[i]) {
              isValid = false;
              break;
            }
            hasExistingTile = true;
            word += currentCell;
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: currentCell,
              isNew: false
            });
          } else {
            // Check if this empty cell has any adjacent tiles
            if (hasAdjacentTile(board, currentRow, currentCol)) {
              hasAdjacent = true;
            }
            word += combination[i];
            newTilesCount++;
            tiles.push({
              row: currentRow,
              col: currentCol,
              letter: combination[i],
              isNew: true
            });
          }
        }
        
        // Check if word forms valid connections
        if (isValid && newTilesCount > 0) {
          // Check if word connects to existing tiles vertically
          const connectsVertically = hasExistingTile || 
            (startRow > 0 && !isCellEmpty(board[startRow - 1][col])) || 
            (startRow + length < 15 && !isCellEmpty(board[startRow + length][col]));

          // Check if word connects to existing tiles horizontally
          let connectsHorizontally = false;
          for (let i = 0; i < length; i++) {
            const currentRow = startRow + i;
            const currentCol = col;
            if ((currentCol > 0 && !isCellEmpty(board[currentRow][currentCol - 1])) ||
                (currentCol < 14 && !isCellEmpty(board[currentRow][currentCol + 1]))) {
              connectsHorizontally = true;
              break;
            }
          }

          // Check if the word is valid in the dictionary and has at least one new tile
          if (dawg.contains(word) && (connectsVertically || connectsHorizontally || hasAdjacent)) {
            plays.push({
              row: startRow,
              col,
              direction: 'down',
              tiles,
              word
            });
          }
        }
      }
    }
  }
  
  return plays;
};

// Optimized bot move generation
async function generateBotMove(board, letters) {
  try {
    console.log('Generating move for board:');
    console.log(JSON.stringify(board, null, 2));
    console.log('With letters:', letters);
    
    // Load dictionary first
    console.log('Loading dictionary...');
    const dawg = await loadDictionary();
    console.log('Dictionary loaded successfully');
    
    // Find all anchor squares
    const anchors = findAnchorSquares(board);
    console.log('Found', anchors.length, 'anchor squares');
    
    let bestMove = null;
    let bestScore = 0;
    
    // Try each anchor square
    for (const anchor of anchors) {
      console.log(`\nTrying anchor at ${anchor.row},${anchor.col}`);
      
      // Try both directions
      for (const direction of ['right', 'down']) {
        // Find possible word lengths
        const lengths = findPossibleLengths(board, anchor, direction);
        console.log(`Possible lengths for ${direction}:`, lengths);
        
        // Try each length
        for (const length of lengths) {
          // Find possible plays
          const plays = findPossiblePlays(board, anchor, length, direction, letters);
          console.log(`Found ${plays.length} possible plays for length ${length}`);
          
          // Check each play
          for (const play of plays) {
            const word = play.tiles.map(t => t.letter).join('');
            if (dawg.contains(word)) {
              const score = calculateScore(play.tiles, boardMultipliers);
              console.log(`Valid word: "${word}" with score ${score}`);
              
              if (score > bestScore) {
                bestScore = score;
                bestMove = {
                  word,
                  placement: play,
                  score,
                  tiles: play.tiles.map(tile => ({
                    row: tile.row,
                    col: tile.col,
                    letter: tile.letter,
                    isNew: tile.isNew
                  }))
                };
                console.log(`Found better move: ${word} with score ${score}`);
                
                // If we found a high-scoring move, return early
                if (score >= 20) {
                  console.log('\nFound high-scoring move, returning early');
                  return bestMove;
                }
              }
            }
          }
        }
      }
    }
    
    if (bestMove) {
      console.log('\nBest move found:', bestMove);
      return {
        word: bestMove.word,
        score: bestMove.score,
        tiles: bestMove.tiles
      };
    } else {
      console.log('\nNo valid moves found');
      return null;
    }
  } catch (error) {
    console.error('Error generating bot move:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}
