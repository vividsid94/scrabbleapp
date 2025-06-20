// Utility functions for rack management in Play.js

export const alphabetizeRack = (rack) => {
  return [...rack].sort((a, b) => {
    // Handle both string tiles and tile objects
    const tileA = typeof a === 'string' ? a : a.tile;
    const tileB = typeof b === 'string' ? b : b.tile;
    return tileA.localeCompare(tileB);
  });
};

/**
 * Removes tiles from a rack by count (handles duplicates correctly)
 * @param {Array} rack - The rack to remove tiles from
 * @param {Array} tilesToRemove - Array of tiles to remove
 * @returns {Array} The updated rack with tiles removed
 */
export const removeTilesByCount = (rack, tilesToRemove) => {
  const rackCopy = [...rack];
  
  // Create a map of how many of each tile to remove
  const tilesToRemoveCount = {};
  tilesToRemove.forEach(tile => {
    tilesToRemoveCount[tile] = (tilesToRemoveCount[tile] || 0) + 1;
  });
  
  console.log('🔧 removeTilesByCount:', {
    originalRack: rack,
    tilesToRemove: tilesToRemove,
    tilesToRemoveCount: tilesToRemoveCount
  });
  
  // Remove tiles by count
  Object.entries(tilesToRemoveCount).forEach(([tile, count]) => {
    let removed = 0;
    for (let i = 0; i < count && removed < count; i++) {
      const index = rackCopy.indexOf(tile);
      if (index !== -1) {
        rackCopy.splice(index, 1);
        removed++;
        console.log(`🔧 Removed ${tile} (${removed}/${count})`);
      }
    }
  });
  
  console.log('🔧 Final rack:', rackCopy);
  return rackCopy;
};

// Add more rack-related functions here as needed 