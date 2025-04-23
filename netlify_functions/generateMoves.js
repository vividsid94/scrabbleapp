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
  console.log('\n=== STARTING SCORE CALCULATION ===');
  console.log('Input tiles:', tiles);
  
  // Create board state
  const board = Array(15).fill().map(() => Array(15).fill(null));
  
  // Fill the board with tiles
  for (const tile of tiles) {
    board[tile.row][tile.col] = tile.letter;
  }

  // Find all newly placed tiles
  const placedTiles = tiles.filter(tile => tile.isNew);
  console.log('\n=== NEWLY PLACED TILES ===');
  console.log(placedTiles);

  if (placedTiles.length === 0) {
    console.log('No new tiles placed, returning score 0');
    return 0;
  }

  // Helper function to get word at position
  function getWordAt(row, col, direction) {
    let word = '';
    let tiles = [];
    let r = row;
    let c = col;

    if (direction === 'horizontal') {
      // Move left to find start of word
      while (c >= 0 && board[r][c]) {
        c--;
      }
      c++;
      // Collect word tiles
      while (c < 15 && board[r][c]) {
        word += board[r][c];
        tiles.push({
          letter: board[r][c],
          row: r,
          col: c,
          isNew: placedTiles.some(t => t.row === r && t.col === c)
        });
        c++;
      }
    } else {
      // Move up to find start of word
      while (r >= 0 && board[r][c]) {
        r--;
      }
      r++;
      // Collect word tiles
      while (r < 15 && board[r][c]) {
        word += board[r][c];
        tiles.push({
          letter: board[r][c],
          row: r,
          col: c,
          isNew: placedTiles.some(t => t.row === r && t.col === c)
        });
        r++;
      }
    }

    return word.length > 1 ? { word, tiles } : null;
  }

  // Find all words formed by the new tiles
  const words = new Set();
  const wordTiles = new Map();

  for (const tile of placedTiles) {
    // Check horizontal word
    const hWord = getWordAt(tile.row, tile.col, 'horizontal');
    if (hWord) {
      words.add(hWord.word);
      wordTiles.set(hWord.word, hWord.tiles);
    }

    // Check vertical word
    const vWord = getWordAt(tile.row, tile.col, 'vertical');
    if (vWord) {
      words.add(vWord.word);
      wordTiles.set(vWord.word, vWord.tiles);
    }
  }

  console.log('\n=== WORDS FOUND ===');
  console.log(Array.from(words));

  // Score each word
  let totalScore = 0;
  console.log('\n=== CALCULATING SCORES ===');

  for (const word of words) {
    const tiles = wordTiles.get(word);
    let wordScore = 0;
    let wordMultiplier = 1;
    const usedPremiumSquares = new Set();

    console.log(`\nScoring word: ${word}`);

    for (const tile of tiles) {
      const letterScore = letterScores[tile.letter];
      let letterMultiplier = 1;

      // Apply letter multipliers for new tiles
      if (tile.isNew) {
        const premiumType = boardMultipliers[tile.row][tile.col];
        if (premiumType === 1) { // Double letter
          letterMultiplier = 2;
          console.log(`DL on ${tile.letter}: ${letterScore} * 2`);
        } else if (premiumType === 2) { // Triple letter
          letterMultiplier = 3;
          console.log(`TL on ${tile.letter}: ${letterScore} * 3`);
        }
      }

      const tileScore = letterScore * letterMultiplier;
      wordScore += tileScore;
      console.log(`Tile ${tile.letter}: ${letterScore} * ${letterMultiplier} = ${tileScore} (Running total: ${wordScore})`);

      // Track word multipliers for new tiles
      if (tile.isNew) {
        const premiumType = boardMultipliers[tile.row][tile.col];
        if (premiumType === 3 && !usedPremiumSquares.has(`DW-${tile.row}-${tile.col}`)) {
          wordMultiplier *= 2;
          usedPremiumSquares.add(`DW-${tile.row}-${tile.col}`);
          console.log(`DW multiplier applied: ${wordScore} * 2`);
        } else if (premiumType === 4 && !usedPremiumSquares.has(`TW-${tile.row}-${tile.col}`)) {
          wordMultiplier *= 3;
          usedPremiumSquares.add(`TW-${tile.row}-${tile.col}`);
          console.log(`TW multiplier applied: ${wordScore} * 3`);
        }
      }
    }

    const finalWordScore = wordScore * wordMultiplier;
    console.log(`Final word score: ${wordScore} * ${wordMultiplier} = ${finalWordScore}`);
    totalScore += finalWordScore;
  }

  // Add bingo bonus if all 7 tiles are new
  if (placedTiles.length === 7) {
    console.log('\n=== BINGO BONUS ===');
    console.log('All 7 tiles are new! Adding 50 point bonus');
    totalScore += 50;
  }

  console.log('\n=== FINAL SCORE ===');
  console.log(`Total score: ${totalScore}`);
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
