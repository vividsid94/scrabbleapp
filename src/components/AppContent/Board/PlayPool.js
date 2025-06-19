import React, { useState, useEffect } from 'react';
import styles from './Pool.module.css';

const PlayPool = React.memo(({ pool, player1Rack, player2Rack, gameStarted }) => {
  const [showSpillAnimation, setShowSpillAnimation] = useState(false);
  const [spillTiles, setSpillTiles] = useState([]);

  useEffect(() => {
    if (gameStarted && !showSpillAnimation) {
      setShowSpillAnimation(true);
      
      // Create initial pool tiles for animation
      const poolTiles = typeof pool === 'string' ? pool.split('') : pool;
      
      // Create a mix of random letters from the pool
      const randomTiles = [];
      for (let i = 0; i < 20; i++) {
        const randomIndex = Math.floor(Math.random() * poolTiles.length);
        randomTiles.push(poolTiles[randomIndex]);
      }
      
      setSpillTiles(randomTiles.map((tile, index) => ({
        tile,
        id: index,
        delay: index * 8, // Much faster stagger (was 20ms)
        left: Math.random() * 60 + 20, // Random horizontal position
        animationDuration: Math.random() * 200 + 200 // Way faster fall duration (was 400-800ms)
      })));
      
      // Hide animation after it completes
      setTimeout(() => {
        setShowSpillAnimation(false);
      }, 800); // Much shorter total time (was 1500ms)
    }
  }, [gameStarted, pool]);

  if (!gameStarted) {
    return (
      <div className={styles.poolTbl}>
        <div className={styles.cssBag}>
          <div className={styles.bagHandle}></div>
          <div className={styles.drawstring}></div>
          <div className={styles.bagBody}></div>
        </div>
      </div>
    );
  }

  if (showSpillAnimation) {
    return (
      <div className={`${styles.poolTbl} ${styles.animated}`}>
        {spillTiles.map(({ tile, id, delay, left, animationDuration }) => (
          <span
            key={id}
            className={styles.spillTile}
            style={{
              left: `${left}%`,
              animationDelay: `${delay}ms`,
              animationDuration: `${animationDuration}ms`
            }}
          >
            {tile}
          </span>
        ))}
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
    <div className={styles.poolTbl}>
      {tileDisplay} <br/>({totalTilesShown} unseen to you)
    </div>
  );
});

export default PlayPool; 