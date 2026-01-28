// Utility functions for tile management in Play.js

import { removeTilesByCount } from './rackFunctions';

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
  setTempBoardCoords,
  currentPlayer
}) {
  // Track dropped tile for submission and previews
  setSelectedTiles([...(selectedTiles || []), { tile, row, col }]);
  console.log('🔍 DEBUG - Tile dropped:', {
    tile: tile,
    row: row,
    col: col,
    selectedTilesAfter: [...(selectedTiles || []), { tile, row, col }]
  });
  setSelectedBoardPosition({ row, col });

  // Visually remove the tile from the correct rack immediately,
  // so the rack mirrors keyboard entry behaviour.
  const numericIndex = Number(index);
  if (!Number.isNaN(numericIndex)) {
    if (currentPlayer === 1 && Array.isArray(player1Rack) && setPlayer1Rack) {
      const newRack = [...player1Rack];
      if (newRack[numericIndex] === tile) {
        newRack.splice(numericIndex, 1);
        setPlayer1Rack(newRack);
      }
    } else if (currentPlayer === 2 && Array.isArray(player2Rack) && setPlayer2Rack) {
      const newRack = [...player2Rack];
      if (newRack[numericIndex] === tile) {
        newRack.splice(numericIndex, 1);
        setPlayer2Rack(newRack);
      }
    }
  }

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
  
  // Add safety check for undefined tilesToExchange
  const safeTilesToExchange = tilesToExchange || [];
  const safeSelectedTiles = selectedTiles || [];
  
  // If we're in exchange mode, handle tile selection for exchange
  if (safeTilesToExchange.length > 0 || safeSelectedTiles.length === 0) {
    const tileIndex = safeTilesToExchange.findIndex(t => t.tile === tile && t.index === index);
    if (tileIndex === -1) {
      setTilesToExchange([...safeTilesToExchange, { tile, index }]);
    } else {
      const newTiles = [...safeTilesToExchange];
      newTiles.splice(tileIndex, 1);
      setTilesToExchange(newTiles);
    }
    return;
  }
  
  // Otherwise handle normal tile selection for play
  const tileIndex = safeSelectedTiles.findIndex(t => t.tile === tile && t.index === index);
  if (tileIndex === -1) {
    setSelectedTiles([...safeSelectedTiles, { tile, index }]);
  } else {
    const newTiles = [...safeSelectedTiles];
    newTiles.splice(tileIndex, 1);
    setSelectedTiles(newTiles);
  }
}

// Add more tile-related functions here as needed 