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
  
  // Try placing words horizontally through the center
  for (let startCol = Math.max(0, centerCol - 6); startCol <= centerCol; startCol++) {
    const prefix = '';
    const placedTiles = [];
    
    // Make sure we're covering the center square
    if (centerCol >= startCol && centerCol < startCol + Math.min(7, rack.length)) {
      generateWordsFromPosition(
        board,
        rack,
        trie.root,
        prefix,
        centerRow,
        startCol,
        'right',
        moves,
        trie,
        placedTiles,
        true,
        centerCol
      );
    }
  }
  
  // Try placing words vertically through the center
  for (let startRow = Math.max(0, centerRow - 6); startRow <= centerRow; startRow++) {
    const prefix = '';
    const placedTiles = [];
    
    // Make sure we're covering the center square
    if (centerRow >= startRow && centerRow < startRow + Math.min(7, rack.length)) {
      generateWordsFromPosition(
        board,
        rack,
        trie.root,
        prefix,
        startRow,
        centerCol,
        'down',
        moves,
        trie,
        placedTiles,
        true,
        centerRow
      );
    }
  }
}

function generateMovesInDirection(board, rack, anchor, direction, trie, moves) {
  const { row, col } = anchor;
  
  // Find the start of the potential word area
  let startRow, startCol;
  let maxBackup = Math.min(7, direction === 'right' ? col : row);
  
  // Check for existing prefix
  let prefix = '';
  let prefixStartRow, prefixStartCol;
  
  if (direction === 'right') {
    // Check for letters to the left of anchor
    prefixStartCol = col;
    while (prefixStartCol > 0 && board[row][prefixStartCol - 1] !== null) {
      prefixStartCol--;
    }
    
    // Build prefix if it exists
    for (let c = prefixStartCol; c < col; c++) {
      if (board[row][c] !== null) {
        prefix += board[row][c];
      }
    }
    
    // Calculate how many positions we can back up (max 7 - prefix length)
    maxBackup = Math.min(maxBackup, 7 - prefix.length);
    startRow = row;
    startCol = prefixStartCol;
  } else {
    // Check for letters above the anchor
    prefixStartRow = row;
    while (prefixStartRow > 0 && board[prefixStartRow - 1][col] !== null) {
      prefixStartRow--;
    }
    
    // Build prefix if it exists
    for (let r = prefixStartRow; r < row; r++) {
      if (board[r][col] !== null) {
        prefix += board[r][col];
      }
    }
    
    // Calculate how many positions we can back up (max 7 - prefix length)
    maxBackup = Math.min(maxBackup, 7 - prefix.length);
    startRow = prefixStartRow;
    startCol = col;
  }
  
  // If we have a prefix, we can't back up further
  if (prefix.length > 0) {
    maxBackup = 0;
  }
  
  // Try backing up 0 to maxBackup squares to find valid starting positions
  for (let offset = 0; offset <= maxBackup; offset++) {
    const posStartRow = direction === 'right' ? startRow : startRow - offset;
    const posStartCol = direction === 'right' ? startCol - offset : startCol;
    
    // Only proceed if starting position is valid
    if (posStartRow < 0 || posStartCol < 0) continue;
    
    // Check if the position immediately before our start is empty (or edge of board)
    const beforeRow = direction === 'right' ? posStartRow : posStartRow - 1;
    const beforeCol = direction === 'right' ? posStartCol - 1 : posStartCol;
    
    if ((beforeRow >= 0 && beforeCol >= 0 && board[beforeRow][beforeCol] !== null)) {
      // Can't start here as we'd be connecting to an existing word
      continue;
    }
    
    // Try extending from this position
    generateWordsFromPosition(
      board,
      rack,
      trie.root,
      '',
      posStartRow,
      posStartCol,
      direction,
      moves,
      trie,
      [],
      false,
      null,
      anchor
    );
  }
  
  // Handle the case with an existing prefix
  if (prefix.length > 0) {
    // Navigate the trie to the prefix node
    let node = trie.root;
    let validPrefix = true;
    
    for (const letter of prefix) {
      if (!node.children.has(letter)) {
        validPrefix = false;
        break;
      }
      node = node.children.get(letter);
    }
    
    if (validPrefix) {
      // Try extending from the anchor with the existing prefix
      generateWordsFromPosition(
        board,
        rack,
        node,
        prefix,
        row,
        col,
        direction,
        moves,
        trie,
        [],
        false,
        null,
        anchor
      );
    }
  }
}

function generateWordsFromPosition(
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
  anchor = null
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
    generateWordsFromPosition(
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
      anchor
    );
    
  } else {
    // This position is empty - try placing letters from our rack
    
    // First, check if we have a valid word so far and can stop here
    if (node.isTerminal && wordSoFar.length > 1) {
      // Check if this move meets requirements
      const isValid = isFirstMove ? 
        isCoveringCenter(placedTiles, centerToCheck) : 
        (anchor ? coversTile(placedTiles, anchor.row, anchor.col) : true);
      
      if (isValid && validateMove(board, placedTiles, trie)) {
        const score = calculateScore(board, placedTiles, boardMultipliers, trie);
        moves.push({
          word: wordSoFar,
          tiles: [...placedTiles],
          score,
          direction
        });
      }
    }
    
    // Try placing each available letter from the rack
    const usedLetters = new Set();
    for (let i = 0; i < rack.length; i++) {
      const letter = rack[i];
      
      // Skip if we've already tried this letter (avoid duplicates)
      if (usedLetters.has(letter)) continue;
      usedLetters.add(letter);
      
      // Check if this letter is valid in the trie
      const nextNode = node.children.get(letter);
      if (!nextNode) continue;
      
      // Create new tile and update word
      const newTile = { row, col, letter, isNew: true };
      const newPlacedTiles = [...placedTiles, newTile];
      const newWordSoFar = wordSoFar + letter;
      
      // Create updated rack without the used letter
      const newRack = [...rack];
      newRack.splice(i, 1);
      
      // Check if placing this letter forms a valid cross-word
      if (!isValidCrossWord(board, row, col, letter, direction, trie)) {
        continue;
      }
      
      // Continue extending the word
      generateWordsFromPosition(
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
        anchor
      );
    }
  }
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

function isValidCrossWord(board, row, col, letter, mainDirection, trie) {
  const crossDirection = mainDirection === 'right' ? 'down' : 'right';
  
  // Check if there are any adjacent tiles in the cross direction
  let hasCrossAdjacent = false;
  if (crossDirection === 'down') {
    hasCrossAdjacent = (row > 0 && board[row - 1][col] !== null) || 
                       (row < 14 && board[row + 1][col] !== null);
  } else {
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
  } else {
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