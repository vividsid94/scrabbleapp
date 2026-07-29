import React from 'react';
import styles from './Pool.module.css';

const PlayPool = React.memo(({ pool, player1Rack, player2Rack, gameStarted, lightMode = 'dark' }) => {
  const textColor = lightMode === 'dark' ? '#fff' : '#1F2937';
  
  if (!gameStarted) {
    return (
      <div 
        className={styles.poolTbl}
        style={{ color: textColor }}
      >
        Bag is collapsed in a wrinkled heap on the table.
      </div>
    );
  }

  // Convert pool to array if it's a string
  const poolTiles = typeof pool === 'string' ? pool.split('') : pool;
  
  // Create a map of tiles in the pool
  const tileCounts = {};
  poolTiles.forEach(tile => {
    tileCounts[tile] = (tileCounts[tile] || 0) + 1;
  });

  // Add bot's tiles to the display
  player2Rack.forEach(tile => {
    tileCounts[tile] = (tileCounts[tile] || 0) + 1;
  });

  // Sort tiles alphabetically (with blank tiles at the end)
  const sortedTiles = Object.keys(tileCounts).sort((a, b) => {
    if (a === '?') return 1;
    if (b === '?') return -1;
    return a.localeCompare(b);
  });

  // Create the display elements
  const tileDisplay = sortedTiles.map(tile => (
    <span key={tile} className={styles.charGroup}>
      {tile.repeat(tileCounts[tile])}
    </span>
  ));

  // Calculate total tiles shown (pool + bot's tiles)
  const totalTilesShown = poolTiles.length + player2Rack.length;

  return (
    <div
      className={styles.poolTbl}
      style={{ color: textColor }}
    >
      {tileDisplay} <br/>({totalTilesShown} unseen to you)
    </div>
  );
});

export default PlayPool; 