const { letterScores, boardMultipliers } = require('./gameLogic');

function generateMoves(board, rack, anchors, trie) {
  const moves = [];
  
  console.log('Board empty check:', isBoardEmpty(board));
  console.log('Board:', JSON.stringify(board));
  
  // First move must use center square
  if (isBoardEmpty(board)) {
    console.log('Generating first move');
    generateFirstMove(board, rack, trie, moves);
    console.log('First move moves:', moves);
    return moves;
  }
  
  // For each anchor point, generate moves in both directions
  for (const anchor of anchors) {
    // Generate horizontal moves
    generateMovesForAnchor(board, rack, anchor, 'right', trie, moves);
    
    // Generate vertical moves
    generateMovesForAnchor(board, rack, anchor, 'down', trie, moves);
  }
  
  return moves;
}

function generateFirstMove(board, rack, trie, moves) {
  const centerRow = 7;
  const centerCol = 7;
  
  console.log('Generating first move with rack:', rack);
  
  // Try placing each letter from the rack at the center
  for (let i = 0; i < rack.length; i++) {
    const letter = rack[i];
    console.log('Trying letter:', letter);
    
    const node = trie.root.children.get(letter);
    if (!node) {
      console.log('No node for letter:', letter);
      continue;
    }
    
    // Create a move with just the center tile
    const tiles = [{
      row: centerRow,
      col: centerCol,
      letter,
      isNew: true
    }];
    
    // Check if this single letter is a valid word
    if (node.isTerminal) {
      console.log('Found single-letter word:', letter);
      moves.push({
        word: letter,
        tiles,
        score: calculateScore(tiles, boardMultipliers)
      });
    }
    
    // Try extending right
    console.log('Trying to extend right from:', letter);
    generateMovesFromPosition(
      board,
      [...rack.slice(0, i), ...rack.slice(i + 1)],
      node,
      letter,
      centerRow,
      centerCol + 1,
      'right',
      moves,
      trie
    );
    
    // Try extending down
    console.log('Trying to extend down from:', letter);
    generateMovesFromPosition(
      board,
      [...rack.slice(0, i), ...rack.slice(i + 1)],
      node,
      letter,
      centerRow + 1,
      centerCol,
      'down',
      moves,
      trie
    );
  }
  
  console.log('Generated moves:', moves.length);
}

function generateMovesForAnchor(board, rack, anchor, direction, trie, moves) {
  const { row, col } = anchor;
  
  // Try placing tiles before the anchor
  for (let offset = 0; offset <= 7; offset++) {
    const startRow = direction === 'right' ? row : row - offset;
    const startCol = direction === 'right' ? col - offset : col;
    
    if (startRow < 0 || startCol < 0) continue;
    
    // Build prefix from existing tiles
    const prefix = buildPrefix(board, startRow, startCol, direction);
    console.log('Trying prefix:', prefix, 'at', startRow, startCol);
    
    // Generate moves starting at this position
    generateMovesFromPosition(
      board,
      rack,
      trie.root,
      prefix,
      startRow,
      startCol,
      direction,
      moves,
      trie
    );
  }
}

function generateMovesFromPosition(board, rack, node, prefix, row, col, direction, moves, trie) {
  // Check if we've reached the end of the board
  if (row >= 15 || col >= 15) return;
  
  const cell = board[row][col];
  
  if (cell !== null) {
    // Existing letter on board
    const nextNode = node.children.get(cell);
    if (!nextNode) return;
    
    const newWord = prefix + cell;
    console.log('Found existing letter:', cell, 'New word:', newWord);
    
    if (nextNode.isTerminal && newWord.length > 1) {
      console.log('Found valid word:', newWord);
      const tiles = getTilesForWord(board, row, col, direction, newWord);
      if (validateMove(board, tiles, trie)) {
        moves.push({
          word: newWord,
          tiles,
          score: calculateScore(tiles, boardMultipliers)
        });
      }
    }
    
    // Continue extending the word
    const nextRow = direction === 'right' ? row : row + 1;
    const nextCol = direction === 'right' ? col + 1 : col;
    generateMovesFromPosition(
      board,
      rack,
      nextNode,
      newWord,
      nextRow,
      nextCol,
      direction,
      moves,
      trie
    );
    return;
  }
  
  // Try placing each letter from the rack
  const used = new Set();
  for (let i = 0; i < rack.length; i++) {
    const letter = rack[i];
    if (used.has(letter)) continue;
    used.add(letter);
    
    const nextNode = node.children.get(letter);
    if (!nextNode) {
      console.log('No valid continuation for letter:', letter);
      continue;
    }
    
    const newWord = prefix + letter;
    console.log('Trying new word:', newWord);
    
    // Check if this is a valid word
    if (nextNode.isTerminal && newWord.length > 1) {
      console.log('Found valid word:', newWord);
      const tiles = getTilesForWord(board, row, col, direction, newWord);
      if (validateMove(board, tiles, trie)) {
        moves.push({
          word: newWord,
          tiles,
          score: calculateScore(tiles, boardMultipliers)
        });
      }
    }
    
    // Try extending the word with remaining letters
    const remainingRack = [...rack.slice(0, i), ...rack.slice(i + 1)];
    for (let j = 0; j < remainingRack.length; j++) {
      const nextLetter = remainingRack[j];
      const nextNextNode = nextNode.children.get(nextLetter);
      if (!nextNextNode) continue;
      
      const extendedWord = newWord + nextLetter;
      console.log('Trying extended word:', extendedWord);
      
      if (nextNextNode.isTerminal && extendedWord.length > 1) {
        console.log('Found valid extended word:', extendedWord);
        const tiles = getTilesForWord(board, row, col, direction, extendedWord);
        if (validateMove(board, tiles, trie)) {
          moves.push({
            word: extendedWord,
            tiles,
            score: calculateScore(tiles, boardMultipliers)
          });
        }
      }
    }
    
    // Continue extending the word
    const nextRow = direction === 'right' ? row : row + 1;
    const nextCol = direction === 'right' ? col + 1 : col;
    const newRack = [...rack.slice(0, i), ...rack.slice(i + 1)];
    generateMovesFromPosition(
      board,
      newRack,
      nextNode,
      newWord,
      nextRow,
      nextCol,
      direction,
      moves,
      trie
    );
  }
}

function buildPrefix(board, startRow, startCol, direction) {
  let prefix = '';
  let row = startRow;
  let col = startCol;
  
  while (row >= 0 && col >= 0 && board[row][col] !== null) {
    prefix = board[row][col] + prefix;
    if (direction === 'right') col--;
    else row--;
  }
  
  return prefix;
}

function getTilesForWord(board, startRow, startCol, direction, word) {
  const tiles = [];
  
  // For first move, we need to include the center tile
  if (isBoardEmpty(board)) {
    // Place first letter at center
    tiles.push({
      row: 7,
      col: 7,
      letter: word[0],
      isNew: true
    });
    
    // Place subsequent letters consecutively
    let row = 7;
    let col = 7;
    for (let i = 1; i < word.length; i++) {
      if (direction === 'right') col++;
      else row++;
      
      if (row >= 15 || col >= 15) break;
      
      tiles.push({
        row,
        col,
        letter: word[i],
        isNew: true
      });
    }
    return tiles;
  }
  
  // For non-first moves
  let row = startRow;
  let col = startCol;
  
  // Check if starting position is valid
  if (row < 0 || row >= 15 || col < 0 || col >= 15) {
    return tiles;
  }
  
  for (const letter of word) {
    // Check if current position is valid
    if (row >= 15 || col >= 15) {
      return tiles;
    }
    
    if (!board[row][col]) {
      tiles.push({
        row,
        col,
        letter,
        isNew: true
      });
    }
    
    if (direction === 'right') col++;
    else row++;
  }
  
  return tiles;
}

function validateMove(board, tiles, trie) {
  // Check if tiles are connected to existing tiles
  if (!isConnected(board, tiles)) return false;
  
  // Get all words formed by the move
  const words = getAllWords(board, tiles);
  console.log('Words to validate:', words);
  
  // Check if all words are valid
  for (const word of words) {
    if (!trie.contains(word)) {
      console.log('Invalid word:', word);
      return false;
    }
  }
  
  return true;
}

function getAllWords(board, tiles) {
  const words = new Set();
  
  // Get the main word
  const mainWord = getMainWord(board, tiles);
  if (mainWord && mainWord.word) {
    console.log('Main word:', mainWord.word);
    words.add(mainWord.word);
  }
  
  // Get all cross-words
  for (const tile of tiles) {
    // Check cross-word in the opposite direction of the main word
    const crossDirection = mainWord.direction === 'right' ? 'down' : 'right';
    const crossWord = getCrossWord(board, tile.row, tile.col, crossDirection, tiles);
    if (crossWord) {
      console.log('Cross word:', crossWord);
      words.add(crossWord);
    }
  }
  
  return Array.from(words);
}

function getMainWord(board, tiles) {
  if (tiles.length === 0) return null;
  
  // Determine direction
  const firstTile = tiles[0];
  const lastTile = tiles[tiles.length - 1];
  const direction = firstTile.row === lastTile.row ? 'right' : 'down';
  
  // Find start of word
  let row = firstTile.row;
  let col = firstTile.col;
  
  if (direction === 'right') {
    while (col > 0 && (board[row][col - 1] || tiles.some(t => t.row === row && t.col === col - 1))) {
      col--;
    }
  } else {
    while (row > 0 && (board[row - 1][col] || tiles.some(t => t.row === row - 1 && t.col === col))) {
      row--;
    }
  }
  
  // Build word
  let word = '';
  const startRow = row;
  const startCol = col;
  
  while (row < 15 && col < 15) {
    const tile = tiles.find(t => t.row === row && t.col === col);
    if (tile) {
      word += tile.letter;
    } else if (board[row][col]) {
      word += board[row][col];
    } else {
      break;
    }
    
    if (direction === 'right') col++;
    else row++;
  }
  
  return {
    word,
    direction,
    startRow,
    startCol
  };
}

function getCrossWord(board, row, col, direction, tiles) {
  // Find start of word
  let startRow = row;
  let startCol = col;
  
  if (direction === 'right') {
    while (startCol > 0 && (board[startRow][startCol - 1] || tiles.some(t => t.row === startRow && t.col === startCol - 1))) {
      startCol--;
    }
  } else {
    while (startRow > 0 && (board[startRow - 1][startCol] || tiles.some(t => t.row === startRow - 1 && t.col === startCol))) {
      startRow--;
    }
  }
  
  // Build word
  let word = '';
  let r = startRow;
  let c = startCol;
  
  while (r < 15 && c < 15) {
    const tile = tiles.find(t => t.row === r && t.col === c);
    if (tile) {
      word += tile.letter;
    } else if (board[r][c]) {
      word += board[r][c];
    } else {
      break;
    }
    
    if (direction === 'right') c++;
    else r++;
  }
  
  return word.length > 1 ? word : null;
}

function isConnected(board, tiles) {
  // First move must use center square
  if (isBoardEmpty(board)) {
    return tiles.some(tile => tile.row === 7 && tile.col === 7);
  }
  
  // Otherwise, must be connected to existing tiles
  return tiles.some(tile => {
    const { row, col } = tile;
    return (
      (row > 0 && board[row - 1][col]) ||
      (row < 14 && board[row + 1][col]) ||
      (col > 0 && board[row][col - 1]) ||
      (col < 14 && board[row][col + 1])
    );
  });
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

function calculateScore(tiles, boardMultipliers) {
  let score = 0;
  let wordMultiplier = 1;
  
  for (const tile of tiles) {
    const letterScore = letterScores[tile.letter] || 0;
    const multiplier = boardMultipliers[tile.row][tile.col];
    
    if (multiplier === 1) { // Double letter
      score += letterScore * 2;
    } else if (multiplier === 2) { // Triple letter
      score += letterScore * 3;
    } else if (multiplier === 3) { // Double word
      score += letterScore;
      wordMultiplier *= 2;
    } else if (multiplier === 4) { // Triple word
      score += letterScore;
      wordMultiplier *= 3;
    } else {
      score += letterScore;
    }
  }
  
  // Apply word multipliers
  score *= wordMultiplier;
  
  // Add bingo bonus
  if (tiles.length === 7) {
    score += 50;
  }
  
  return score;
}

module.exports = { 
  generateMoves,
  validateMove,
  isConnected,
  isBoardEmpty,
  calculateScore
};
