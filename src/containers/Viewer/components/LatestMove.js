import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import styles from '../Viewer.module.css';
import { processParsedMove } from '../../../functions/boardFunctions';


const LatestMove = ({ 
  currentMoveRef, 
  name1, 
  name2, 
  boardCoords, 
  pool = [],
  onMoveHistoryClick,
  currentMoveCoords = [],
  onTurnClick,
  parsedMoves = []
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);



  // Helper function to get player icon
  const getPlayerIcon = (playerName) => {
    if (!playerName) return <PersonIcon style={{ fontSize: 16 }} />;
    
    if (playerName === 'T²' || playerName === 'Bot' || playerName.includes('Bot')) {
      return <SmartToyIcon style={{ fontSize: 16 }} />;
    } else {
      return <PersonIcon style={{ fontSize: 16 }} />;
    }
  };



  // Simple animation when moves change
  useEffect(() => {
    if (parsedMoves.length > 0) {
      setIsAnimating(true);
      setAnimationClass(styles.slidingIn);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setAnimationClass('');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentMoveRef.current]);



  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderMoveItem = (move, index) => {
    if (!move) return null;
    
    const playerName = move.player;
    const processedWord = processParsedMove(move, currentMoveCoords);
    const score = move.score || 0;
    const location = move.location === '--' ? null : move.location;
    const turnNumber = index + 1;
    const turnIndex = currentMoveIndex - index - 1; // Calculate the actual turn index

    return (
      <Box key={index} className={styles.moveHistoryItem}>
        <Box 
          className={styles.moveHistoryTurnNumber}
          onClick={() => onTurnClick && onTurnClick(turnIndex)}
          style={{ cursor: onTurnClick ? 'pointer' : 'default' }}
        >
          {turnNumber}
        </Box>
        <Box className={styles.moveHistoryLocation}>{location || ''}</Box>
        <Box className={styles.moveHistoryWord}>{processedWord || 'Pass'}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score || 0}</Box>
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(playerName)}</Box>
        </Box>
      </Box>
    );
  };

  if (parsedMoves.length === 0) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  // Get the current move (based on currentMoveRef)
  const currentMoveIndex = currentMoveRef.current;
  const currentMove = currentMoveIndex >= 0 && currentMoveIndex < parsedMoves.length ? parsedMoves[currentMoveIndex] : null;
  
  if (!currentMove) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  const playerName = currentMove.player;
  const processedWord = processParsedMove(currentMove, currentMoveCoords);
  const score = currentMove.score || 0;
  const location = currentMove.location === '--' ? null : currentMove.location;
  const turnNumber = currentMoveIndex + 1;

  return (
    <Box className={styles.latestMovePanel}>
      <Box className={`${styles.latestMoveContent} ${animationClass}`}>
        <Box 
          className={styles.moveHistoryTurnNumber}
          onClick={() => onTurnClick && onTurnClick(currentMoveIndex)}
          style={{ cursor: onTurnClick ? 'pointer' : 'default' }}
        >
          {turnNumber}
        </Box>
        <Box className={styles.moveHistoryLocation}>{location || ''}</Box>
        <Box className={styles.moveHistoryWord}>{processedWord || 'Pass'}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score || 0}</Box>
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(playerName)}</Box>
        </Box>
        <Box className={styles.moveHistoryActions}>
          {parsedMoves.length > 1 && (
            <Box className={styles.expandIcon} onClick={handleExpandClick}>
              {isExpanded ? <ExpandLessIcon style={{ fontSize: 16 }} /> : <ExpandMoreIcon style={{ fontSize: 16 }} />}
            </Box>
          )}
        </Box>
      </Box>
      
      {isExpanded && parsedMoves.length > 1 && (
        <Box className={styles.moveHistoryList}>
          {parsedMoves.slice(0, currentMoveIndex).reverse().map((move, index) => 
            renderMoveItem(move, currentMoveIndex - index - 1)
          )}
        </Box>
      )}
    </Box>
  );
};

export default LatestMove; 