import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import HistoryIcon from '@mui/icons-material/History';
import styles from '../Play.module.css';

const LatestMove = ({ latestMove, player1Name, player2Name, onMoveHistoryClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (latestMove) {
      // Start slide out animation
      setIsAnimating(true);
      setAnimationClass(styles.slidingOut);
      
      // After slide out, change content and slide in
      const timer = setTimeout(() => {
        setAnimationClass(styles.slidingIn);
        setIsAnimating(false);
      }, 300); // Match the slideOutUp animation duration
      
      return () => clearTimeout(timer);
    }
  }, [latestMove]);

  const handleHistoryClick = () => {
    if (onMoveHistoryClick) {
      onMoveHistoryClick();
    }
  };

  if (!latestMove) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  const { score, player, boardDiff } = latestMove;
  
  // Extract word from boardDiff if available
  let word = '';
  
  if (boardDiff && boardDiff.length > 0) {
    // Get all placed tiles (where value is a string/letter)
    const placedTiles = boardDiff.filter(tile => typeof tile.value === 'string');
    
    if (placedTiles.length > 0) {
      if (placedTiles.length === 1) {
        // Single tile
        word = placedTiles[0].value;
      } else {
        // Multiple tiles - determine if horizontal or vertical
        const rows = [...new Set(placedTiles.map(t => t.row))];
        const cols = [...new Set(placedTiles.map(t => t.col))];
        
        if (rows.length === 1) {
          // Horizontal word - sort by column
          const sortedTiles = placedTiles.sort((a, b) => a.col - b.col);
          word = sortedTiles.map(t => t.value).join('');
        } else if (cols.length === 1) {
          // Vertical word - sort by row
          const sortedTiles = placedTiles.sort((a, b) => a.row - b.row);
          word = sortedTiles.map(t => t.value).join('');
        } else {
          // Single tile (fallback)
          word = placedTiles[0].value;
        }
      }
    }
  }

  // Handle special cases
  if (score === 0 && player.includes('exchanged')) {
    word = 'Exchange';
  } else if (score === 0 && (word === '' || !word)) {
    word = 'Pass';
  }

  return (
    <Box className={styles.latestMovePanel}>
      <Box className={`${styles.latestMoveContent} ${animationClass}`}>
        <HistoryIcon className={styles.moveHistoryIcon} style={{ fontSize: 16 }} onClick={handleHistoryClick} />
        <Box className={styles.latestMovePlayer}>{word}</Box>
        <Box className={styles.latestMoveDetails}>
          <Box className={styles.latestMoveScore}>{score} pts</Box>
          <Box className={styles.latestMovePlayer}>{player}</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LatestMove; 