function validateMove(board, move, trie) {
    if (!move || !move.tiles || move.tiles.length === 0) {
      return { valid: false, reason: 'empty move' };
    }
  
    const newBoard = board.map(row => row.slice());
  
    for (const { row, col, letter } of move.tiles) {
      const current = newBoard[row][col];
      if (current && current !== letter) {
        return { valid: false, reason: `conflict at (${row},${col})` };
      }
      newBoard[row][col] = letter;
    }
  
    for (const tile of move.tiles) {
      const horiz = extractWord(newBoard, tile.row, tile.col, 'right');
      const vert = extractWord(newBoard, tile.row, tile.col, 'down');
  
      if (horiz.length > 1 && !trie.contains(horiz)) {
        return { valid: false, reason: `invalid horizontal word '${horiz}'` };
      }
      if (vert.length > 1 && !trie.contains(vert)) {
        return { valid: false, reason: `invalid vertical word '${vert}'` };
      }
    }
  
    const touchesExisting = move.tiles.some(({ row, col }) => hasAdjacent(board, row, col));
    const boardIsEmpty = board.flat().every(cell => cell === null || typeof cell === 'number');
  
    if (!boardIsEmpty && !touchesExisting) {
      return { valid: false, reason: 'move does not touch any existing tiles' };
    }
  
    return { valid: true };
  }
  
  function extractWord(board, row, col, direction) {
    let word = '';
    let r = row;
    let c = col;
  
    // Move to beginning of the word
    while (r > 0 && direction === 'down' && board[r - 1][c]) r--;
    while (c > 0 && direction === 'right' && board[r][c - 1]) c--;
  
    // Build the word
    while (r < 15 && c < 15 && board[r][c]) {
      word += board[r][c];
      if (direction === 'down') r++;
      else c++;
    }
  
    return word;
  }
  
  function hasAdjacent(board, row, col) {
    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];
    return dirs.some(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      return (
        r >= 0 && r < 15 &&
        c >= 0 && c < 15 &&
        board[r][c] && typeof board[r][c] === 'string'
      );
    });
  }
  
  module.exports = { validateMove };
  