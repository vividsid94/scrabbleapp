import { removeTilesByCount } from './rackFunctions';

/**
 * Calculates the leave (remaining tiles) after a move
 * @param {Object} move - The move object containing tiles to be played
 * @param {Array} currentRack - The current player's rack
 * @returns {string} The sorted leave string
 */
export const calculateLeave = (move, currentRack) => {
  // Create a copy of the current rack
  const rackCopy = [...currentRack];
  
  // Get tiles to remove from the move
  const tilesToRemove = move.tiles
    .filter(tile => tile.isNew)
    .map(tile => tile.isBlank ? '?' : tile.letter);
  
  // Remove tiles using count method
  const remainingRack = removeTilesByCount(rackCopy, tilesToRemove);
  
  // Sort the remaining tiles to create the leave
  return remainingRack.sort().join('');
};

