// Formats a move's board location for display (e.g. "8D" or "D8"), shared
// between TopMoves.js and AnalysisPanel.js's move lists.
export const formatMoveLocation = (move) => {
  if (!move.tiles || move.tiles.length === 0) {
    return null;
  }

  // Find the first tile
  const firstTile = move.tiles[0];
  let firstRow = firstTile.row;
  let firstCol = firstTile.col;

  // Determine if it's horizontal by checking if there are tiles in the same row
  const isHorizontal = move.tiles.some(t => t.row === firstRow && t.col === firstCol + 1);

  // Format the position (convert 0-14 to 1-15 for rows, 0-14 to A-O for columns)
  const row = firstRow + 1;
  const col = String.fromCharCode(65 + firstCol);
  const position = isHorizontal ? `${row}${col}` : `${col}${row}`;

  return position;
};
