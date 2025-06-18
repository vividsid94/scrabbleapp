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

  const { score, player, word } = latestMove;
  
  // Handle special cases
  let displayWord = word;
  if (score === 0 && player.includes('exchanged')) {
    displayWord = 'Exchange';
  } else if (score === 0 && (!displayWord || displayWord === '')) {
    displayWord = 'Pass';
  }

  return (
    <Box className={styles.latestMovePanel}>
      <Box className={`${styles.latestMoveContent} ${animationClass}`}>
        <HistoryIcon className={styles.moveHistoryIcon} style={{ fontSize: 16 }} onClick={handleHistoryClick} />
        <Box className={styles.latestMovePlayer}>{displayWord}</Box>
        <Box className={styles.latestMoveDetails}>
          <Box className={styles.latestMoveScore}>{score} pts</Box>
          <Box className={styles.latestMovePlayer}>{player}</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LatestMove; 