function findAnchors(board) {
    const anchors = [];
  
    const isFilled = (r, c) =>
      r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] !== null;
  
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] !== null) continue; // not empty
  
        // Check adjacent squares
        const hasAdjacent =
          isFilled(row - 1, col) || isFilled(row + 1, col) ||
          isFilled(row, col - 1) || isFilled(row, col + 1);
  
        // Check if this square is part of a word
        const isPartOfWord =
          (col > 0 && board[row][col - 1] !== null) || // left
          (col < 14 && board[row][col + 1] !== null) || // right
          (row > 0 && board[row - 1][col] !== null) || // up
          (row < 14 && board[row + 1][col] !== null); // down
  
        if (hasAdjacent || isPartOfWord) {
          anchors.push({ row, col });
        }
      }
    }
  
    // Special rule: if board is empty, center (7, 7) is anchor
    const isBoardEmpty = board.every(row => row.every(cell => cell === null));
    if (isBoardEmpty) anchors.push({ row: 7, col: 7 });
  
    return anchors;
  }
  
  module.exports = { findAnchors };
  