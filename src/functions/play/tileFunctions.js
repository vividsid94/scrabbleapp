// Utility functions for tile interactions in Play/Sandbox/Puzzle.
// Note: drag-and-drop has been removed; this module only handles
// click-based rack interactions (play vs. exchange selection).

/**
 * Handles clicking a tile in the rack for play or exchange mode.
 *
 * Params:
 * - tile: string           – the tile being clicked
 * - index: number          – index of the tile in the rack
 * - currentPlayer: number  – 1 or 2
 * - player1Rack: string[]  – rack for player 1
 * - player2Rack: string[]  – rack for player 2
 * - selectedTiles: Array<{ tile, index }>
 * - setSelectedTiles: (tiles) => void
 * - tilesToExchange: Array<{ tile, index }>
 * - setTilesToExchange: (tiles) => void
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

  // Add safety checks for undefined arrays
  const safeTilesToExchange = tilesToExchange || [];
  const safeSelectedTiles = selectedTiles || [];

  // If we're in exchange mode (some tiles already marked for exchange,
  // or no tiles currently selected for play), toggle exchange selection.
  if (safeTilesToExchange.length > 0 || safeSelectedTiles.length === 0) {
    const tileIndex = safeTilesToExchange.findIndex(
      (t) => t.tile === tile && t.index === index
    );
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
  const tileIndex = safeSelectedTiles.findIndex(
    (t) => t.tile === tile && t.index === index
  );
  if (tileIndex === -1) {
    setSelectedTiles([...safeSelectedTiles, { tile, index }]);
  } else {
    const newTiles = [...safeSelectedTiles];
    newTiles.splice(tileIndex, 1);
    setSelectedTiles(newTiles);
  }
}

