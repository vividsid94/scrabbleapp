export const calculatePoolFromBoard = (boardCoords, origPool) => {
  let pool = origPool;
  
  // Go through the board and remove tiles that are placed
  for (let row = 0; row < boardCoords.length; row++) {
    for (let col = 0; col < boardCoords[row].length; col++) {
      const cell = boardCoords[row][col];
      if (typeof cell === 'string' && cell !== '') {
        // This is a tile on the board, remove it from pool
        if (cell === '?') {
          pool = pool.replace("?", "");
        } else {
          pool = pool.replace(cell, "");
        }
      }
    }
  }
  
  return pool;
}
