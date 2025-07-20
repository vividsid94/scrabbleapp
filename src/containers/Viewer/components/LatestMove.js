import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import styles from '../Viewer.module.css';
import { processParsedMove } from '../../../functions/boardFunctions';


const LatestMove = ({ 
  moveSet = [], 
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

  // Helper function to format move location from GCG format
  const formatLocation = (moveString) => {
    if (!moveString) return null;
    
    const parts = moveString.split(" ");
    if (parts.length < 4) return null;
    
    const location = parts[2];
    if (location === "--") return null;
    
    return location;
  };

  // Extract word from pre-parsed moves with through letter processing
  const extractWord = (moveString, moveIndex = 0) => {
    if (!parsedMoves || !parsedMoves[moveIndex]) {
      return "N/A";
    }
    
    const move = parsedMoves[moveIndex];
    const processedMove = processParsedMove(move, currentMoveCoords);
    
    // Extract just the word part from the processed move
    const processedParts = processedMove.split(" ");
    
    // If it's a challenge, return "Challenge"
    if (processedMove === "Challenge") {
      return "Challenge";
    }
    
    // If it's an exchange, return the exchange info
    if (processedMove.startsWith("Exchange")) {
      return processedMove;
    }
    
    // For normal plays, return the word part (second part after location)
    return processedParts.length >= 2 ? processedParts[1] : processedMove;
  };

  // Helper function to extract score from move string
  const extractScore = (moveString) => {
    if (!moveString) return 0;
    
    const parts = moveString.split(" ");
    if (parts.length < 5) return 0;
    
    return parseInt(parts[4]) || 0;
  };

  // Helper function to get player name from move string
  const getPlayerName = (moveString) => {
    if (!moveString) return null;
    
    const parts = moveString.split(" ");
    if (parts.length < 1) return null;
    
    return parts[0];
  };

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
    if (moveSet.length > 0) {
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
    
    const playerName = getPlayerName(move);
    const word = extractWord(move, index);
    const score = extractScore(move);
    const location = formatLocation(move);
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
        <Box className={styles.moveHistoryWord}>{word || 'Pass'}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score || 0}</Box>
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(playerName)}</Box>
        </Box>
      </Box>
    );
  };

  if (moveSet.length === 0) {
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
  const currentMove = currentMoveIndex >= 0 && currentMoveIndex < moveSet.length ? moveSet[currentMoveIndex] : null;
  
  if (!currentMove) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  const playerName = getPlayerName(currentMove);
  const word = extractWord(currentMove, currentMoveIndex);
  const score = extractScore(currentMove);
  const location = formatLocation(currentMove);
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
        <Box className={styles.moveHistoryWord}>{word || 'Pass'}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score || 0}</Box>
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(playerName)}</Box>
        </Box>
        <Box className={styles.moveHistoryActions}>
          {moveSet.length > 1 && (
            <Box className={styles.expandIcon} onClick={handleExpandClick}>
              {isExpanded ? <ExpandLessIcon style={{ fontSize: 16 }} /> : <ExpandMoreIcon style={{ fontSize: 16 }} />}
            </Box>
          )}
        </Box>
      </Box>
      
      {isExpanded && moveSet.length > 1 && (
        <Box className={styles.moveHistoryList}>
          {moveSet.slice(0, currentMoveIndex).reverse().map((move, index) => 
            renderMoveItem(move, currentMoveIndex - index - 1)
          )}
        </Box>
      )}
    </Box>
  );
};

export default LatestMove; 