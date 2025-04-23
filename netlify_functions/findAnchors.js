function findAnchors(board) {
    const anchors = [];
  
    const isFilled = (r, c) =>
      r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] !== null;
  
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] !== null) continue; // not empty
  
        // Check adjacent squares
        if (
          isFilled(row - 1, col) || isFilled(row + 1, col) ||
          isFilled(row, col - 1) || isFilled(row, col + 1)
        ) {
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
  