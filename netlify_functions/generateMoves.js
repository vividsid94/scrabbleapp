const { letterScores, boardMultipliers } = require('./gameLogic');

function generateMoves(board, rack, anchors, trie) {
  const moves = [];
  
  // First move must use center square
  if (isBoardEmpty(board)) {
    generateFirstMove(board, rack, trie, moves);
    return moves;
  }
  
  // For each anchor point, generate moves in both directions
  for (const anchor of anchors) {
    // Generate horizontal moves
    generateMovesInDirection(board, rack, anchor, 'right', trie, moves);
    
    // Generate vertical moves
    generateMovesInDirection(board, rack, anchor, 'down', trie, moves);
  }
  
  return moves;
}

function generateFirstMove(board, rack, trie, moves) {
  const centerRow = 7;
  const centerCol = 7;
  
  // For first move, we need to find all words that can be played through the center square
  
  // Try placing words horizontally through the center
  for (let startCol = Math.max(0, centerCol - 6); startCol <= centerCol; startCol++) {
    // Make sure we're covering the center square and not going off the board
    const maxWordLength = Math.min(15 - startCol, 7);
    if (centerCol >= startCol && centerCol < startCol + maxWordLength) {
      // Creating cross-check map (empty for first move)
      const crossChecks = new Map();
      
      // Try generating words starting from this position
      generateAllWords(
        board,
        [...rack], // Make a copy of the rack
        trie.root,
        '',
        centerRow,
        startCol,
        'right',
        moves,
        trie,
        [],
        true,
        centerCol,
        null,
        crossChecks
      );
    }
  }
  
  // Try placing words vertically through the center
  for (let startRow = Math.max(0, centerRow - 6); startRow <= centerRow; startRow++) {
    // Make sure we're covering the center square and not going off the board
    const maxWordLength = Math.min(15 - startRow, 7);
    if (centerRow >= startRow && centerRow < startRow + maxWordLength) {
      // Creating cross-check map (empty for first move)
      const crossChecks = new Map();
      
      // Try generating words starting from this position
      generateAllWords(
        board,
        [...rack], // Make a copy of the rack
        trie.root,
        '',
        startRow,
        centerCol,
        'down',
        moves,
        trie,
        [],
        true,
        centerRow,
        null,
        crossChecks
      );
    }
  }
  
  // Also try single letter placements in the center (if they are valid words)
  for (const letter of new Set(rack)) {
    const node = trie.root.children.get(letter);
    if (node && node.isTerminal) {
      const tile = {
        row: centerRow,
        col: centerCol,
        letter,
        isNew: true
      };
      
      const score = calculateScore(board, [tile], boardMultipliers, trie);
      moves.push({
        word: letter,
        tiles: [tile],
        score,
        direction: 'right' // Direction doesn't matter for single letter
      });
    }
  }
}

function generateMovesInDirection(board, rack, anchor, direction, trie, moves) {
  const { row, col } = anchor;

  // Precompute cross-checks for the whole board
  const horizontalCrossChecks = new Map();
  const verticalCrossChecks = new Map();
  
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] === null) {
        const hChecks = getValidLetters(board, r, c, 'down', trie);
        const vChecks = getValidLetters(board, r, c, 'right', trie);
        
        const key = `${r},${c}`;
        horizontalCrossChecks.set(key, hChecks);
        verticalCrossChecks.set(key, vChecks);
      }
    }
  }
  
  const crossChecks = direction === 'right' ? horizontalCrossChecks : verticalCrossChecks;

  const maxBackup = Math.min(7, direction === 'right' ? col : row);

  // Always try backing up up to 7 tiles before anchor
  for (let offset = 0; offset <= maxBackup; offset++) {
    const startRow = direction === 'right' ? row : row - offset;
    const startCol = direction === 'right' ? col - offset : col;

    if (startRow < 0 || startCol < 0) continue;

    // Only proceed if not starting in the middle of a word improperly
    const beforeRow = direction === 'right' ? startRow : startRow - 1;
    const beforeCol = direction === 'right' ? startCol - 1 : startCol;
    if ((beforeRow >= 0 && beforeCol >= 0 && board[beforeRow][beforeCol] !== null)) {
      continue;
    }

    // Now, follow any forced letters (already on board) starting at (startRow, startCol)
    let currentNode = trie.root;
    let valid = true;
    let r = startRow;
    let c = startCol;
    let prefix = '';

    while (r < 15 && c < 15) {
      const cell = board[r][c];
      if (cell === null) break; // Empty cell, we can place tiles here

      // Forced existing tile
      if (!currentNode.children.has(cell)) {
        valid = false;
        break;
      }

      currentNode = currentNode.children.get(cell);
      prefix += cell;

      if (direction === 'right') c++;
      else r++;
    }

    if (!valid) continue; // Can't start from here

    // Start building moves from this position
    generateAllWords(
      board,
      [...rack],
      currentNode,
      prefix,
      r,
      c,
      direction,
      moves,
      trie,
      [],
      false,
      null,
      anchor,
      crossChecks
    );
  }
}

// Get valid letters that can be placed at a position based on cross-check constraints
function getValidLetters(board, row, col, direction, trie) {
  // If there's already a letter here, return empty set (can't place)
  if (board[row][col] !== null) {
    return new Set();
  }
  
  // If no adjacent tiles in perpendicular direction, all letters are valid
  let hasPerpendicularTile = false;
  if (direction === 'right') {
    hasPerpendicularTile = (row > 0 && board[row-1][col] !== null) || 
                          (row < 14 && board[row+1][col] !== null);
  } else {
    hasPerpendicularTile = (col > 0 && board[row][col-1] !== null) || 
                          (col < 14 && board[row][col+1] !== null);
  }
  
  if (!hasPerpendicularTile) {
    // All letters are valid if no cross-word constraints
    return null; // null means all letters are allowed
  }
  
  // Find all letters that form valid cross-words
  const validLetters = new Set();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.toLowerCase();
  
  for (const letter of alphabet) {
    if (isValidCrossWord(board, row, col, letter, direction === 'right' ? 'down' : 'right', trie)) {
      validLetters.add(letter);
    }
  }
  
  return validLetters;
}

function generateAllWords(
  board, 
  rack, 
  node, 
  wordSoFar, 
  row, 
  col, 
  direction, 
  moves, 
  trie, 
  placedTiles = [], 
  isFirstMove = false,
  centerToCheck = null,
  anchor = null,
  crossChecks = null
) {
  // Stop if we've gone off the board
  if (row < 0 || row >= 15 || col < 0 || col >= 15) return;
  
  // Check what's on the board at this position
  const existingLetter = board[row][col];
  
  // Calculate next position
  const nextRow = direction === 'right' ? row : row + 1;
  const nextCol = direction === 'right' ? col + 1 : col;
  
  if (existingLetter !== null) {
    // There's already a letter here - we must use it
    const nextNode = node.children.get(existingLetter);
    if (!nextNode) return; // Can't extend with this letter
    
    const newWordSoFar = wordSoFar + existingLetter;
    
    // Continue extending the word
    generateAllWords(
      board,
      rack,
      nextNode,
      newWordSoFar,
      nextRow,
      nextCol,
      direction,
      moves,
      trie,
      placedTiles,
      isFirstMove,
      centerToCheck,
      anchor,
      crossChecks
    );
    
  } else {
    // This position is empty - try placing letters from our rack
    
    // First, check if we have a valid word so far and can stop here
    if (node.isTerminal && wordSoFar.length > 1) {
      // Check if this move meets requirements
      let isValid = true;
      
      if (isFirstMove) {
        isValid = isCoveringCenter(placedTiles, centerToCheck);
      } else if (anchor) {
        isValid = (placedTiles.length > 0 && 
                 (coversTile(placedTiles, anchor.row, anchor.col) || 
                  isConnected(board, placedTiles)));
      }
      
      if (isValid && validateMove(board, placedTiles, trie)) {
        const score = calculateScore(board, placedTiles, boardMultipliers, trie);
        
        // Only add this move if it's unique
        if (!moveExists(moves, placedTiles)) {
          moves.push({
            word: wordSoFar,
            tiles: [...placedTiles],
            score,
            direction
          });
        }
      }
    }
    
    // Check cross-word constraints
    const key = `${row},${col}`;
    const validLetters = crossChecks ? crossChecks.get(key) : null;
    
    // Try placing each available letter from the rack
    const uniqueLetters = getUniqueLetters(rack);
    
    for (const [letter, count] of uniqueLetters) {
      // Skip if letter doesn't satisfy cross-check
      if (validLetters && validLetters.size > 0 && !validLetters.has(letter)) {
        continue;
      }      
      
      // Check if this letter is valid in the trie
      const nextNode = node.children.get(letter);
      if (!nextNode) continue;
      
      // Create new tile and update word
      const newTile = { row, col, letter, isNew: true };
      const newPlacedTiles = [...placedTiles, newTile];
      const newWordSoFar = wordSoFar + letter;
      
      // Create updated rack without the used letter
      const newRack = [...rack];
      const letterIndex = newRack.indexOf(letter);
      if (letterIndex >= 0) {
        newRack.splice(letterIndex, 1);
      } else {
        // Handle blank tiles (implement if needed)
        continue;
      }
      
      // Continue extending the word
      generateAllWords(
        board,
        newRack,
        nextNode,
        newWordSoFar,
        nextRow,
        nextCol,
        direction,
        moves,
        trie,
        newPlacedTiles,
        isFirstMove,
        centerToCheck,
        anchor,
        crossChecks
      );
    }
    
    // Try stopping here as well (no letter placed at this position)
    // This allows for "gaps" in our word placement
    // But only if we already have placed at least one tile
    if (placedTiles.length > 0) {
      // Check if this is a valid anchor-covering move
      let isValid = true;
      
      if (isFirstMove) {
        isValid = isCoveringCenter(placedTiles, centerToCheck);
      } else if (anchor) {
        isValid = (coversTile(placedTiles, anchor.row, anchor.col) || 
                   isConnected(board, placedTiles));
      }
      
      if (isValid && validateMove(board, placedTiles, trie)) {
        // Find all words formed by the current placement
        const words = getAllWords(board, placedTiles);
        const allWordsValid = words.length > 0 && words.every(word => trie.contains(word));
        
        if (allWordsValid && wordSoFar.length > 1 && node.isTerminal) {
          const score = calculateScore(board, placedTiles, boardMultipliers, trie);
          
          // Only add this move if it's unique
          if (!moveExists(moves, placedTiles)) {
            moves.push({
              word: wordSoFar,
              tiles: [...placedTiles],
              score,
              direction
            });
          }
        }
      }
    }
  }
}

// Helper function to get unique letters and their counts from rack
function getUniqueLetters(rack) {
  const letterCounts = new Map();
  
  for (const letter of rack) {
    const count = letterCounts.get(letter) || 0;
    letterCounts.set(letter, count + 1);
  }
  
  return letterCounts;
}

// Check if a move already exists in the moves list
function moveExists(moves, tiles) {
  // Sort tiles to normalize the representation
  const sortedTiles = [...tiles].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
  
  const tileKey = sortedTiles.map(t => `${t.row},${t.col},${t.letter}`).join('|');
  
  return moves.some(move => {
    const moveTiles = [...move.tiles].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
    
    const moveKey = moveTiles.map(t => `${t.row},${t.col},${t.letter}`).join('|');
    return moveKey === tileKey;
  });
}

function isCoveringCenter(tiles, centerPos) {
  return tiles.some(tile => 
    (tile.row === 7 && tile.col === 7) || 
    (centerPos !== null && ((tile.row === 7 && tile.col === centerPos) || (tile.col === 7 && tile.row === centerPos)))
  );
}

function coversTile(tiles, row, col) {
  return tiles.some(tile => tile.row === row && tile.col === col);
}

function isValidCrossWord(board, row, col, letter, crossDirection, trie) {
  // Cross direction is the opposite of the main word direction
  // If we're building a word going right, cross direction is down
  // If we're building a word going down, cross direction is right
  
  // Check if there are any adjacent tiles in the cross direction
  let hasCrossAdjacent = false;
  if (crossDirection === 'down') {
    hasCrossAdjacent = (row > 0 && board[row - 1][col] !== null) || 
                       (row < 14 && board[row + 1][col] !== null);
  } else { // right
    hasCrossAdjacent = (col > 0 && board[row][col - 1] !== null) || 
                       (col < 14 && board[row][col + 1] !== null);
  }
  
  // If no adjacent tiles in cross direction, no cross-word is formed
  if (!hasCrossAdjacent) return true;
  
  // Find the start of the cross-word
  let startRow = row;
  let startCol = col;
  
  if (crossDirection === 'down') {
    while (startRow > 0 && board[startRow - 1][col] !== null) {
      startRow--;
    }
  } else { // right
    while (startCol > 0 && board[row][startCol - 1] !== null) {
      startCol--;
    }
  }
  
  // Build the cross-word
  let crossWord = '';
  let r = startRow;
  let c = startCol;
  
  while (r < 15 && c < 15) {
    let tileLetter;
    
    if (r === row && c === col) {
      tileLetter = letter; // This is our newly placed letter
    } else {
      tileLetter = board[r][c];
      if (tileLetter === null) break; // End of the word
    }
    
    crossWord += tileLetter;
    
    if (crossDirection === 'down') r++;
    else c++;
  }
  
  // Only validate if we formed a word of length > 1
  return crossWord.length <= 1 || trie.contains(crossWord);
}

function validateMove(board, tiles, trie) {
  if (tiles.length === 0) return false;
  
  // Check if all tiles are in a line
  if (!areInLine(tiles)) return false;
  
  // Check if the move is connected to existing tiles (unless it's the first move)
  if (!isBoardEmpty(board) && !isConnected(board, tiles)) {
    return false;
  }
  
  // Get all words formed by this move
  const words = getAllWords(board, tiles);
  
  // Validate each word in the dictionary
  for (const word of words) {
    if (!trie.contains(word)) {
      return false;
    }
  }
  
  return true;
}

function areInLine(tiles) {
  if (tiles.length <= 1) return true;
  
  // Check if all tiles are in the same row
  const allSameRow = tiles.every(tile => tile.row === tiles[0].row);
  
  // Check if all tiles are in the same column
  const allSameCol = tiles.every(tile => tile.col === tiles[0].col);
  
  // Check if the tiles form a continuous line
  if (allSameRow) {
    // Sort by column
    const sorted = [...tiles].sort((a, b) => a.col - b.col);
    // Check for gaps
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].col !== sorted[i-1].col + 1) {
        return false;
      }
    }
    return true;
  } else if (allSameCol) {
    // Sort by row
    const sorted = [...tiles].sort((a, b) => a.row - b.row);
    // Check for gaps
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].row !== sorted[i-1].row + 1) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}

function isConnected(board, tiles) {
  // First move must use center square
  if (isBoardEmpty(board)) {
    return tiles.some(tile => tile.row === 7 && tile.col === 7);
  }
  
  // Check if any placed tile is adjacent to an existing tile
  return tiles.some(tile => {
    const { row, col } = tile;
    return (
      (row > 0 && board[row - 1][col] !== null) ||
      (row < 14 && board[row + 1][col] !== null) ||
      (col > 0 && board[row][col - 1] !== null) ||
      (col < 14 && board[row][col + 1] !== null)
    );
  });
}

function getAllWords(board, tiles) {
  const words = [];
  
  if (tiles.length === 0) return words;
  
  // Determine main word direction
  const direction = tiles.length === 1 ? 'both' :
    tiles[0].row === tiles[1].row ? 'right' : 'down';
  
  // Get main word
  if (direction === 'right' || direction === 'both') {
    const mainWord = getWordAt(board, tiles[0].row, tiles[0].col, 'right', tiles);
    if (mainWord && mainWord.length > 1) {
      words.push(mainWord);
    }
  }
  
  if (direction === 'down' || direction === 'both') {
    const mainWord = getWordAt(board, tiles[0].row, tiles[0].col, 'down', tiles);
    if (mainWord && mainWord.length > 1) {
      words.push(mainWord);
    }
  }
  
  // Get cross words
  for (const tile of tiles) {
    const crossDirection = direction === 'right' ? 'down' : 
                          (direction === 'down' ? 'right' : 'both');
    
    if (crossDirection === 'right' || crossDirection === 'both') {
      const crossWord = getWordAt(board, tile.row, tile.col, 'right', tiles);
      if (crossWord && crossWord.length > 1 && !words.includes(crossWord)) {
        words.push(crossWord);
      }
    }
    
    if (crossDirection === 'down' || crossDirection === 'both') {
      const crossWord = getWordAt(board, tile.row, tile.col, 'down', tiles);
      if (crossWord && crossWord.length > 1 && !words.includes(crossWord)) {
        words.push(crossWord);
      }
    }
  }
  
  return words;
}

function getWordAt(board, row, col, direction, placedTiles) {
  // Find start of the word
  let startRow = row;
  let startCol = col;
  
  if (direction === 'right') {
    while (startCol > 0 && getLetterAt(board, startRow, startCol - 1, placedTiles) !== null) {
      startCol--;
    }
  } else { // down
    while (startRow > 0 && getLetterAt(board, startRow - 1, startCol, placedTiles) !== null) {
      startRow--;
    }
  }
  
  // Build the word
  let word = '';
  let r = startRow;
  let c = startCol;
  
  while (r < 15 && c < 15) {
    const letter = getLetterAt(board, r, c, placedTiles);
    if (letter === null) break;
    
    word += letter;
    
    if (direction === 'right') c++;
    else r++;
  }
  
  return word;
}

function getLetterAt(board, row, col, placedTiles) {
  // First check if there's a placed tile at this position
  const placedTile = placedTiles.find(t => t.row === row && t.col === col);
  if (placedTile) {
    return placedTile.letter;
  }
  
  // Otherwise check the board
  if (row >= 0 && row < 15 && col >= 0 && col < 15) {
    return board[row][col];
  }
  
  return null;
}

function isBoardEmpty(board) {
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col] !== null) {
        return false;
      }
    }
  }
  return true;
}

function calculateScore(board, tiles, boardMultipliers, trie) {
  let totalScore = 0;
  
  // Determine main word direction
  const direction = tiles.length === 1 ? 'both' : 
    tiles[0].row === tiles[1].row ? 'right' : 'down';
  
  // Score the main word
  if (direction === 'right' || direction === 'both') {
    const mainWordScore = calculateWordScore(board, tiles, 'right', boardMultipliers);
    totalScore += mainWordScore;
  }
  
  if (direction === 'down' || direction === 'both') {
    const mainWordScore = calculateWordScore(board, tiles, 'down', boardMultipliers);
    totalScore += mainWordScore;
  }
  
  // Score cross words
  for (const tile of tiles) {
    const crossDirection = direction === 'right' ? 'down' : 
                          (direction === 'down' ? 'right' : 
                           (direction === 'both' ? null : direction));
    
    if (!crossDirection) continue;
    
    const crossWordScore = calculateWordScore(board, [tile], crossDirection, boardMultipliers, true);
    totalScore += crossWordScore;
  }
  
  // Add bingo bonus
  if (tiles.length === 7) {
    totalScore += 50;
  }
  
  return totalScore;
}

function calculateWordScore(board, tiles, direction, boardMultipliers, isCrossWord = false) {
  // Find the start of the word
  let startRow = tiles[0].row;
  let startCol = tiles[0].col;
  
  if (direction === 'right') {
    while (startCol > 0 && board[startRow][startCol - 1] !== null) {
      startCol--;
    }
  } else { // down
    while (startRow > 0 && board[startRow - 1][startCol] !== null) {
      startRow--;
    }
  }
  
  // Calculate the score
  let wordScore = 0;
  let wordMultiplier = 1;
  let r = startRow;
  let c = startCol;
  let wordLength = 0;
  
  while (r < 15 && c < 15) {
    const tile = tiles.find(t => t.row === r && t.col === c);
    let letter;
    
    if (tile) {
      // This is a newly placed tile
      letter = tile.letter;
      const letterScore = letterScores[letter] || 1;
      const multiplier = boardMultipliers[r][c];
      
      // Apply letter multipliers
      if (multiplier === 1) { // Double letter score
        wordScore += letterScore * 2;
      } else if (multiplier === 2) { // Triple letter score
        wordScore += letterScore * 3;
      } else {
        wordScore += letterScore;
      }
      
      // Track word multipliers
      if (multiplier === 3) { // Double word score
        wordMultiplier *= 2;
      } else if (multiplier === 4) { // Triple word score
        wordMultiplier *= 3;
      }
    } else {
      // This is an existing tile on the board
      letter = board[r][c];
      if (letter === null) break;
      
      // No premium squares for existing tiles
      wordScore += letterScores[letter] || 1;
    }
    
    wordLength++;
    
    if (direction === 'right') c++;
    else r++;
  }
  
  // Only count words of length > 1
  if (wordLength <= 1) {
    return 0;
  }
  
  // Apply word multiplier
  return wordScore * wordMultiplier;
}

module.exports = { 
  generateMoves,
  validateMove,
  isConnected,
  isBoardEmpty,
  calculateScore,
  getAllWords
};