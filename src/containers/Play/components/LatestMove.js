import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import styles from '../Play.module.css';

const LatestMove = ({ latestMove, player1Name, player2Name, onMoveHistoryClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [allMoves, setAllMoves] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayMove, setDisplayMove] = useState(null);

  // Helper function to format move location
  const formatLocation = (boardDiff) => {
    if (!boardDiff || boardDiff.length === 0) {
      return null;
    }

    // Find the first changed tile
    const firstTile = boardDiff[0];
    let firstRow = firstTile.row;
    let firstCol = firstTile.col;
    
    // Determine if it's horizontal by checking if there are tiles in the same row
    const isHorizontal = boardDiff.some(d => d.row === firstRow && d.col === firstCol + 1);
    
    // Format the position (convert 0-14 to 1-15 for rows, 0-14 to A-O for columns)
    const row = firstRow + 1;
    const col = String.fromCharCode(65 + firstCol);
    const position = isHorizontal ? `${row}${col}` : `${col}${row}`;
    
    return position;
  };

  // Helper function to get player icon
  const getPlayerIcon = (playerName) => {
    if (playerName === 'SidBot' || playerName === 'Bot') {
      return <SmartToyIcon style={{ fontSize: 16 }} />;
    } else {
      return <PersonIcon style={{ fontSize: 16 }} />;
    }
  };

  useEffect(() => {
    if (latestMove) {
      // Start slide out animation with current move
      setIsAnimating(true);
      setAnimationClass(styles.slidingOut);
      
      // After slide out, update the move and slide in
      const timer = setTimeout(() => {
        // Add the new move to the moves array
        setAllMoves(prevMoves => {
          // Add timestamp to make each move unique, even if they're identical
          const moveWithTimestamp = {
            ...latestMove,
            timestamp: Date.now()
          };
          
          return [moveWithTimestamp, ...prevMoves];
        });
        
        // Update the display move
        setDisplayMove(latestMove);
        
        // Slide in with new move
        setAnimationClass(styles.slidingIn);
        setIsAnimating(false);
      }, 300); // Match the slideOutUp animation duration
      
      return () => clearTimeout(timer);
    } else if (allMoves.length > 0 && !displayMove) {
      // Initialize display move if we have moves but no display move
      setDisplayMove(allMoves[0]);
    }
  }, [latestMove]);

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderMoveItem = (move, index) => {
    const { score, player, word, boardDiff } = move;
    
    // Handle special cases
    let displayWord = word;
    if (score === 0 && player.includes('exchanged')) {
      displayWord = 'Exchange';
    } else if (score === 0 && (!displayWord || displayWord === '')) {
      displayWord = 'Pass';
    }

    const location = formatLocation(boardDiff);
    const turnNumber = allMoves.length - index; // Start from 1, not 0

    return (
      <Box key={index} className={styles.moveHistoryItem}>
        <Box className={styles.moveHistoryTurnNumber}>{turnNumber}</Box>
        <Box className={styles.moveHistoryWord}>{displayWord}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score} pts</Box>
          {location && (
            <Box className={styles.moveHistoryLocation}>{location}</Box>
          )}
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(player)}</Box>
        </Box>
      </Box>
    );
  };

  if (!displayMove && allMoves.length === 0) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  const { score, player, word, boardDiff } = displayMove || allMoves[0] || {};
  
  // Handle special cases
  let displayWord = word;
  if (score === 0 && player && player.includes('exchanged')) {
    displayWord = 'Exchange';
  } else if (score === 0 && (!displayWord || displayWord === '')) {
    displayWord = 'Pass';
  }

  const location = formatLocation(boardDiff);
  const turnNumber = allMoves.length;

  return (
    <Box className={styles.latestMovePanel}>
      <Box className={`${styles.latestMoveContent} ${animationClass}`}>
        <Box className={styles.turnNumber}>{turnNumber}</Box>
        <Box className={styles.latestMovePlayer}>{displayWord}</Box>
        <Box className={styles.latestMoveDetails}>
          <Box className={styles.latestMoveScore}>{score} pts</Box>
          {location && (
            <Box className={styles.latestMovePosition}>{location}</Box>
          )}
          <Box className={styles.latestMovePlayer}>{getPlayerIcon(player)}</Box>
        </Box>
        {allMoves.length > 1 && (
          <Box className={styles.expandIcon} onClick={handleExpandClick}>
            {isExpanded ? <ExpandLessIcon style={{ fontSize: 16 }} /> : <ExpandMoreIcon style={{ fontSize: 16 }} />}
          </Box>
        )}
      </Box>
      
      {isExpanded && allMoves.length > 1 && (
        <Box className={styles.moveHistoryList}>
          {allMoves.slice(1).map((move, index) => renderMoveItem(move, index + 1))}
        </Box>
      )}
    </Box>
  );
};

export default LatestMove; 