const { letterScores, boardMultipliers } = require('./gameLogic');

function generateMoves(board, rack, anchors, trie) {
  const allMoves = [
    ...generateForDirection(board, rack, anchors, trie, 'right'),
    ...generateForDirection(board, rack, anchors, trie, 'down')
  ];

  console.log(`\n🏁 Total valid moves generated: ${allMoves.length}`);
  return allMoves;
}

function generateForDirection(board, rack, anchors, trie, direction) {
  console.log(`\n=== GENERATING ${direction.toUpperCase()} MOVES ===`);
  console.log(`➡️ Using ${anchors.length} anchors`);

  const moves = [];

  for (const anchor of anchors) {
    const row = anchor.row;
    const col = anchor.col;

    for (let maxOffset = 0; maxOffset <= 7; maxOffset++) {
      const start = (direction === 'right' ? col : row) - maxOffset;
      if (start < 0) break;

      const prefix = buildPrefix(board, row, col, start, direction);
      const path = {
        tiles: [],
        word: prefix,
        row,
        col,
        used: [],
        rack,
        direction,
        startRow: direction === 'down' ? start : row,
        startCol: direction === 'right' ? start : col
      };

      extend(board, path, trie.root, trie, moves);
    }
  }

  return moves;
}

function buildPrefix(board, row, col, start, direction) {
  let prefix = '';
  for (let i = start; i < (direction === 'right' ? col : row); i++) {
    const r = direction === 'down' ? i : row;
    const c = direction === 'right' ? i : col;
    const cell = board[r][c];
    if (cell === null) break;
    prefix += cell;
  }
  return prefix;
}

function extend(board, path, node, trie, moves) {
  const { row, col, direction } = path;

  const r = direction === 'right' ? row : path.startRow + path.word.length;
  const c = direction === 'right' ? path.startCol + path.word.length : col;

  if (r >= 15 || c >= 15) return;

  const cell = board[r][c];

  if (cell !== null) {
    const nextNode = node.children.get(cell);
    if (!nextNode) return;

    const newWord = path.word + cell;
    if (nextNode.isTerminal && path.tiles.length > 0 && validateCrossWords(board, r, c, direction, cell, trie)) {
      moves.push({
        word: newWord,
        tiles: [...path.tiles],
        score: calculateScore([...path.tiles], boardMultipliers)
      });
    }

    extend(board, { ...path, word: newWord }, nextNode, trie, moves);
    return;
  }

  const used = new Set();
  for (let i = 0; i < path.rack.length; i++) {
    const tile = path.rack[i];
    if (used.has(tile)) continue;
    used.add(tile);

    const nextNode = node.children.get(tile);
    if (!nextNode) continue;

    const newWord = path.word + tile;
    const newTiles = [...path.tiles, { row: r, col: c, letter: tile, isNew: true }];
    const newRack = [...path.rack.slice(0, i), ...path.rack.slice(i + 1)];

    if (nextNode.isTerminal && validateCrossWords(board, r, c, direction, tile, trie)) {
      moves.push({
        word: newWord,
        tiles: newTiles,
        score: calculateScore(newTiles, boardMultipliers)
      });
    }

    extend(board, {
      ...path,
      word: newWord,
      tiles: newTiles,
      rack: newRack
    }, nextNode, trie, moves);
  }
}

function calculateScore(tiles, boardMultipliers) {
  // Create before and after board states
  const beforeBoard = Array(15).fill().map(() => Array(15).fill(null));
  const afterBoard = Array(15).fill().map(() => Array(15).fill(null));
  
  // Fill the before board with existing tiles
  for (const tile of tiles) {
    if (!tile.isNew) {
      beforeBoard[tile.row][tile.col] = tile.letter;
      afterBoard[tile.row][tile.col] = tile.letter;
    }
  }
  
  // Fill the after board with all tiles (including new ones)
  for (const tile of tiles) {
    afterBoard[tile.row][tile.col] = tile.letter;
  }

  // Find all newly placed tiles
  const placedTiles = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/) &&
          (typeof beforeBoard[r][c] !== 'string' || !beforeBoard[r][c].match(/[A-Z]/))) {
        placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
      }
    }
  }

  if (placedTiles.length === 0) {
    return 0;
  }

  // Helper function to get word at position
  function getWordAt(board, row, col, direction) {
    let word = "";
    let r = row;
    let c = col;

    if (direction === "horizontal") {
      while (c >= 0 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
        c--;
      }
      c++;
      while (c < 15 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
        word += board[r][c];
        c++;
      }
    } else if (direction === "vertical") {
      while (r >= 0 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
        r--;
      }
      r++;
      while (r < 15 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
        word += board[r][c];
        r++;
      }
    }
    return word.length > 1 ? word : null;
  }

  // Find all new words
  const newWords = new Set();
  for (const tile of placedTiles) {
    const { row, col } = tile;

    const horizontalWord = getWordAt(afterBoard, row, col, "horizontal");
    if (horizontalWord) {
      newWords.add(horizontalWord);
    }

    const verticalWord = getWordAt(afterBoard, row, col, "vertical");
    if (verticalWord) {
      newWords.add(verticalWord);
    }
  }

  // Helper function to find complete word
  function findWord(board, startRow, startCol, direction) {
    let wordTiles = [];
    let currentRow = startRow;
    let currentCol = startCol;

    if (direction === 'horizontal') {
      // Move left to find start of word
      while (currentCol >= 0 && typeof board[currentRow][currentCol] === 'string' && 
             board[currentRow][currentCol].match(/[A-Z]/)) {
        currentCol--;
      }
      currentCol++;
      // Collect word tiles
      while (currentCol < 15 && typeof board[currentRow][currentCol] === 'string' && 
             board[currentRow][currentCol].match(/[A-Z]/)) {
        wordTiles.push({
          letter: board[currentRow][currentCol],
          row: currentRow,
          col: currentCol,
          isNew: placedTiles.some(t => t.row === currentRow && t.col === currentCol)
        });
        currentCol++;
      }
    } else {
      // Move up to find start of word
      while (currentRow >= 0 && typeof board[currentRow][currentCol] === 'string' && 
             board[currentRow][currentCol].match(/[A-Z]/)) {
        currentRow--;
      }
      currentRow++;
      // Collect word tiles
      while (currentRow < 15 && typeof board[currentRow][currentCol] === 'string' && 
             board[currentRow][currentCol].match(/[A-Z]/)) {
        wordTiles.push({
          letter: board[currentRow][currentCol],
          row: currentRow,
          col: currentCol,
          isNew: placedTiles.some(t => t.row === currentRow && t.col === currentCol)
        });
        currentRow++;
      }
    }

    return wordTiles.length > 1 ? wordTiles : [];
  }

  // Helper function to get word score
  function getWordScore(wordTiles) {
    let wordScore = 0;
    let wordMultiplier = 1;
    const usedPremiumSquares = new Set();

    for (const tile of wordTiles) {
      const letter = tile.letter;
      const row = tile.row;
      const col = tile.col;
      const letterScore = letterScores[letter];
      let letterMultiplier = 1;

      if (tile.isNew) {
        const premiumType = boardMultipliers[row][col];
        if (premiumType === 3) { // Double word
          if (!usedPremiumSquares.has(`DW-${row}-${col}`)) {
            wordMultiplier *= 2;
            usedPremiumSquares.add(`DW-${row}-${col}`);
          }
        } else if (premiumType === 1) { // Double letter
          letterMultiplier = 2;
        } else if (premiumType === 2) { // Triple letter
          letterMultiplier = 3;
        } else if (premiumType === 4) { // Triple word
          if (!usedPremiumSquares.has(`TW-${row}-${col}`)) {
            wordMultiplier *= 3;
            usedPremiumSquares.add(`TW-${row}-${col}`);
          }
        }
      }

      wordScore += letterScore * letterMultiplier;
    }

    return wordScore * wordMultiplier;
  }

  // Score each word
  let totalScore = 0;
  for (const word of newWords) {
    // Find all tiles in the word
    let wordTiles = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/)) {
          const hWord = getWordAt(afterBoard, r, c, "horizontal");
          const vWord = getWordAt(afterBoard, r, c, "vertical");
          
          if (hWord === word) {
            wordTiles = findWord(afterBoard, r, c, "horizontal");
            break;
          } else if (vWord === word) {
            wordTiles = findWord(afterBoard, r, c, "vertical");
            break;
          }
        }
      }
      if (wordTiles.length > 0) break;
    }

    if (wordTiles.length > 0) {
      totalScore += getWordScore(wordTiles);
    }
  }

  // Add bingo bonus if all 7 tiles are new
  if (placedTiles.length === 7) {
    totalScore += 50;
  }

  return totalScore;
}

function validateCrossWords(board, row, col, direction, letter, trie) {
  const perp = direction === 'right' ? 'down' : 'right';
  const word = buildCrossWord(board, row, col, perp, letter);
  if (word && word.length > 1 && !trie.contains(word)) {
    return false;
  }
  return true;
}

function buildCrossWord(board, row, col, direction, letter) {
  let word = '';
  let r = row;
  let c = col;

  while (
    (direction === 'down' && r > 0 && board[r - 1][c]) ||
    (direction === 'right' && c > 0 && board[r][c - 1])
  ) {
    if (direction === 'down') r--;
    else c--;
  }

  while (r < 15 && c < 15 && (board[r][c] || (r === row && c === col))) {
    word += (r === row && c === col) ? letter : board[r][c];
    if (direction === 'down') r++;
    else c++;
  }

  return word.length > 1 ? word : null;
}

module.exports = { generateMoves };
