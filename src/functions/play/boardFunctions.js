// Utility functions for board management in Play.js

/**
 * Handles a click on the board.
 * @param {Array} boardCoords - The current board coordinates.
 * @param {Object|null} selectedBoardPosition - The currently selected position.
 * @param {Function} setSelectedBoardPosition - Setter for selected position.
 * @param {string} arrowDirection - Current arrow direction.
 * @param {Function} setArrowDirection - Setter for arrow direction.
 * @param {number} row - Row index of the click.
 * @param {number} col - Column index of the click.
 */
export function handleBoardPositionSelect({
  row,
  col,
  boardCoords,
  selectedBoardPosition,
  setSelectedBoardPosition,
  arrowDirection,
  setArrowDirection
}) {
  if (!boardCoords || !boardCoords[row] || typeof boardCoords[row][col] !== 'number') {
    console.log('Invalid board position:', { row, col });
    return;
  }
  const isSamePosition =
    selectedBoardPosition?.row === row &&
    selectedBoardPosition?.col === col;
  setSelectedBoardPosition({ row, col });
  if (isSamePosition) {
    setArrowDirection(prev =>
      prev === 'right' ? 'down' : 'right'
    );
  }
}

// Add more board-related functions here as needed 