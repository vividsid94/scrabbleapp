/**
 * Gets the differences between two board states
 * @param {Array<Array>} before - The previous board state
 * @param {Array<Array>} after - The new board state
 * @returns {Array<{row: number, col: number, value: string|number}>} Array of differences
 */
export const getBoardDiff = (before, after) => {
  const diff = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (before[row][col] !== after[row][col]) {
        diff.push({ row, col, value: after[row][col] });
      }
    }
  }
  return diff;
}; 