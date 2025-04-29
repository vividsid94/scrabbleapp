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
    generateMovesForAnchor(board, rack, anchor, 'right', trie, moves);
    
    // Generate vertical moves
    generateMovesForAnchor(board, rack, anchor, 'down', trie, moves);
  }
  
  return moves;
}

function generateFirstMove(board, rack, trie, moves) {
  const centerRow = 7;
  const centerCol = 7;
  
  // Try placing each letter from the rack at the center
  for (let i = 0; i < rack.length; i++) {
    const letter = rack[i];
    
    const node = trie.root.children.get(letter);
    if (!node) {
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
      moves.push({
        word: letter,
        tiles,
        score: calculateScore(tiles, boardMultipliers)
      });
    }
    
    // Try extending right
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
}

function generateMovesForAnchor(board, rack, anchor, direction, trie, moves) {
  const { row, col } = anchor;

  // Build the maximum left (or upward) prefix from board tiles
  const maxPrefixInfo = buildPrefixAndNode(board, row, col, direction, trie);

  const { prefix, node, startRow, startCol } = maxPrefixInfo;

  if (!node) return; // Cannot extend from here (prefix doesn't exist in trie)

  // Now generate moves from the prefix
  generateMovesFromPosition(
    board,
    rack,
    node,
    prefix,
    startRow,
    startCol,
    direction,
    moves,
    trie,
    [],
    anchor
  );
}

function buildPrefixAndNode(board, anchorRow, anchorCol, direction, trie) {
  let prefix = '';
  let row = anchorRow;
  let col = anchorCol;

  if (direction === 'right') {
    // Move left
    while (col > 0 && board[row][col - 1] !== null) {
      col--;
    }
  } else {
    // Move up
    while (row > 0 && board[row - 1][col] !== null) {
      row--;
    }
  }

  const startRow = row;
  const startCol = col;

  // Now build prefix string
  let currRow = startRow;
  let currCol = startCol;
  let node = trie.root;

  while (currRow <= anchorRow && currCol <= anchorCol && currRow < 15 && currCol < 15) {
    const letter = board[currRow][currCol];
    if (letter === null) break;

    if (!node.children.has(letter)) {
      return { prefix: '', node: null, startRow, startCol };
    }

    node = node.children.get(letter);
    prefix += letter;

    if (direction === 'right') currCol++;
    else currRow++;
  }

  return { prefix, node, startRow, startCol };
}

function generateMovesFromPosition(board, rack, node, prefix, row, col, direction, moves, trie, placedTiles = []) {
  if (row >= 15 || col >= 15) return;

  const cell = board[row][col];

  if (cell !== null) {
    // Forced letter: must match board
    const nextNode = node.children.get(cell);
    if (!nextNode) return;

    const newWord = prefix + cell;

    // Only validate if newly formed word is terminal
    if (nextNode.isTerminal && newWord.length > 1) {
      const tiles = [...placedTiles];
      if (validateMove(board, tiles, trie)) {
        moves.push({
          word: newWord,
          tiles,
          score: calculateScore(board, tiles, boardMultipliers, trie)
        });
      }
    }

    const nextRow = direction === 'right' ? row : row + 1;
    const nextCol = direction === 'right' ? col + 1 : col;
    generateMovesFromPosition(board, rack, nextNode, newWord, nextRow, nextCol, direction, moves, trie, placedTiles);
    return;
  }

  // If empty, try placing letters from rack
  const used = new Set();
  for (let i = 0; i < rack.length; i++) {
    const letter = rack[i];
    if (used.has(letter)) continue;
    used.add(letter);

    const nextNode = node.children.get(letter);
    if (!nextNode) continue;

    const newWord = prefix + letter;
    const newTile = {
      row,
      col,
      letter,
      isNew: true
    };

    const tilesNow = [...placedTiles, newTile];

    if (nextNode.isTerminal && newWord.length > 1) {
      if (validateMove(board, tilesNow, trie)) {
        moves.push({
          word: newWord,
          tiles: tilesNow,
          score: calculateScore(board, tilesNow, boardMultipliers, trie)
        });
      }
    }

    const remainingRack = [...rack.slice(0, i), ...rack.slice(i + 1)];

    const nextRow = direction === 'right' ? row : row + 1;
    const nextCol = direction === 'right' ? col + 1 : col;
    generateMovesFromPosition(board, remainingRack, nextNode, newWord, nextRow, nextCol, direction, moves, trie, tilesNow);
  }
}

function validateMove(board, tiles, trie, anchor) {
  if (!isConnected(board, tiles)) return false;

  // If anchor is provided (i.e. not first move), check that move covers it
  if (anchor && !coversAnchor(tiles, anchor.row, anchor.col)) {
    return false;
  }

  const words = getAllWords(board, tiles);
  for (const word of words) {
    if (!trie.contains(word)) {
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
    words.add(mainWord.word);
  }
  
  // Get all cross-words
  for (const tile of tiles) {
    // Check cross-word in the opposite direction of the main word
    const crossDirection = mainWord.direction === 'right' ? 'down' : 'right';
    const crossWord = getCrossWord(board, tile.row, tile.col, crossDirection, tiles);
    if (crossWord) {
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

function coversAnchor(tiles, anchorRow, anchorCol) {
  return tiles.some(tile => tile.row === anchorRow && tile.col === anchorCol);
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
  let wordMultiplier = 1;
  
  const mainWord = getMainWord(board, tiles);
  if (!mainWord) return 0;

  // Score main word
  for (const tile of tiles) {
    const letterScore = letterScores[tile.letter] || 0;
    const premium = boardMultipliers[tile.row][tile.col];

    if (premium === 1) {
      totalScore += letterScore * 2;
    } else if (premium === 2) {
      totalScore += letterScore * 3;
    } else {
      totalScore += letterScore;
    }

    if (premium === 3) {
      wordMultiplier *= 2;
    } else if (premium === 4) {
      wordMultiplier *= 3;
    }
  }
  totalScore *= wordMultiplier;

  // Add score for each cross word
  for (const tile of tiles) {
    const crossDir = mainWord.direction === 'right' ? 'down' : 'right';
    const crossWord = getCrossWord(board, tile.row, tile.col, crossDir, tiles);

    if (crossWord && crossWord.length > 1 && trie.contains(crossWord)) {
      // Now score this cross word
      let crossScore = 0;
      let r = tile.row;
      let c = tile.col;

      if (crossDir === 'right') {
        while (c > 0 && (board[r][c - 1] || tiles.some(t => t.row === r && t.col === c - 1))) c--;
      } else {
        while (r > 0 && (board[r - 1][c] || tiles.some(t => t.row === r - 1 && t.col === c))) r--;
      }

      for (let i = 0; i < crossWord.length; i++) {
        const letter = board[r][c] || tiles.find(t => t.row === r && t.col === c).letter;
        const letterScore = letterScores[letter] || 0;

        // Only apply premiums on the *placed* tile
        if (r === tile.row && c === tile.col) {
          const premium = boardMultipliers[r][c];
          if (premium === 1) {
            crossScore += letterScore * 2;
          } else if (premium === 2) {
            crossScore += letterScore * 3;
          } else {
            crossScore += letterScore;
          }
        } else {
          crossScore += letterScore;
        }

        if (crossDir === 'right') c++;
        else r++;
      }
      totalScore += crossScore;
    }
  }

  // Add bingo bonus
  if (tiles.filter(t => t.isNew).length === 7) {
    totalScore += 50;
  }

  return totalScore;
}

module.exports = { 
  generateMoves,
  validateMove,
  isConnected,
  isBoardEmpty,
  calculateScore
};
