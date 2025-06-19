// Utility functions for tile management in Play.js

/**
 * Handles dropping a tile onto the board, updating racks, selected tiles, and temp board.
 * @param {Object} params - All necessary state and setters.
 * @param {string} tile - The tile being dropped.
 * @param {number} index - The index of the tile in the rack.
 * @param {number} row - Row index of the drop.
 * @param {number} col - Column index of the drop.
 * @param {Array} player1Rack
 * @param {Function} setPlayer1Rack
 * @param {Array} player2Rack
 * @param {Function} setPlayer2Rack
 * @param {Array} selectedTiles
 * @param {Function} setSelectedTiles
 * @param {Function} setSelectedBoardPosition
 * @param {Array} tempBoardCoords
 * @param {Function} setTempBoardCoords
 */
export function handleTileDrop({
  tile,
  index,
  row,
  col,
  player1Rack,
  setPlayer1Rack,
  player2Rack,
  setPlayer2Rack,
  selectedTiles,
  setSelectedTiles,
  setSelectedBoardPosition,
  tempBoardCoords,
  setTempBoardCoords
}) {
  const player1Index = player1Rack.indexOf(tile);
  const player2Index = player2Rack.indexOf(tile);

  if (player1Index !== -1) {
    const newRack = [...player1Rack];
    newRack.splice(player1Index, 1);
    setPlayer1Rack(newRack.sort());
  } else if (player2Index !== -1) {
    const newRack = [...player2Rack];
    newRack.splice(player2Index, 1);
    setPlayer2Rack(newRack.sort());
  }

  setSelectedTiles([...selectedTiles, { tile, row, col }]);
  setSelectedBoardPosition({ row, col });

  const newTempBoard = [...tempBoardCoords];
  newTempBoard[row][col] = tile;
  setTempBoardCoords(newTempBoard);
}

/**
 * Handles clicking a tile in the rack for play or exchange mode.
 * @param {Object} params - All necessary state and setters.
 * @param {string} tile - The tile being clicked.
 * @param {number} index - The index of the tile in the rack.
 * @param {number} currentPlayer
 * @param {Array} player1Rack
 * @param {Array} player2Rack
 * @param {Array} selectedTiles
 * @param {Function} setSelectedTiles
 * @param {Array} tilesToExchange
 * @param {Function} setTilesToExchange
 */
export function handleTileClick({
  tile,
  index,
  currentPlayer,
  player1Rack,
  player2Rack,
  selectedTiles,
  setSelectedTiles,
  tilesToExchange,
  setTilesToExchange
}) {
  const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
  
  // If we're in exchange mode, handle tile selection for exchange
  if (tilesToExchange.length > 0 || selectedTiles.length === 0) {
    const tileIndex = tilesToExchange.findIndex(t => t.tile === tile && t.index === index);
    if (tileIndex === -1) {
      setTilesToExchange([...tilesToExchange, { tile, index }]);
    } else {
      const newTiles = [...tilesToExchange];
      newTiles.splice(tileIndex, 1);
      setTilesToExchange(newTiles);
    }
    return;
  }
  
  // Otherwise handle normal tile selection for play
  const tileIndex = selectedTiles.findIndex(t => t.tile === tile && t.index === index);
  if (tileIndex === -1) {
    setSelectedTiles([...selectedTiles, { tile, index }]);
  } else {
    const newTiles = [...selectedTiles];
    newTiles.splice(tileIndex, 1);
    setSelectedTiles(newTiles);
  }
}

// Add more tile-related functions here as needed 