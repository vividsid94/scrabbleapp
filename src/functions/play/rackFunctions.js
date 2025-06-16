// Utility functions for rack management in Play.js

export const alphabetizeRack = (rack) => {
  return [...rack].sort((a, b) => {
    // Handle both string tiles and tile objects
    const tileA = typeof a === 'string' ? a : a.tile;
    const tileB = typeof b === 'string' ? b : b.tile;
    return tileA.localeCompare(tileB);
  });
};

// Add more rack-related functions here as needed 