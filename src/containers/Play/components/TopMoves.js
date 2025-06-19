import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import styles from '../Play.module.css';

const TopMoves = ({ 
  topMoves, 
  isLoadingTopMoves, 
  isDictionaryLoading, 
  onMoveSelect, 
  onSimulateMove, 
  onGetTopMoves,
  simulatingMove,
  currentPlayer,
  gameStarted
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  // Auto-expand when moves are loaded
  useEffect(() => {
    if (topMoves && topMoves.length > 0) {
      // Start slide out animation
      setAnimationClass(styles.slidingOut);
      
      // After slide out, slide in with new moves
      const timer = setTimeout(() => {
        setAnimationClass(styles.slidingIn);
      }, 300); // Match the slideOutUp animation duration
      
      return () => clearTimeout(timer);
    }
  }, [topMoves]);

  // Helper function to format move location
  const formatLocation = (move) => {
    if (!move.tiles || move.tiles.length === 0) {
      return null;
    }

    // Find the first tile
    const firstTile = move.tiles[0];
    let firstRow = firstTile.row;
    let firstCol = firstTile.col;
    
    // Determine if it's horizontal by checking if there are tiles in the same row
    const isHorizontal = move.tiles.some(t => t.row === firstRow && t.col === firstCol + 1);
    
    // Format the position (convert 0-14 to 1-15 for rows, 0-14 to A-O for columns)
    const row = firstRow + 1;
    const col = String.fromCharCode(65 + firstCol);
    const position = isHorizontal ? `${row}${col}` : `${col}${row}`;
    
    return position;
  };

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMoveSelect = (move) => {
    onMoveSelect(move);
  };

  const handleSimulateMove = (move) => {
    onSimulateMove(move);
  };

  const handleGetTopMoves = () => {
    if (onGetTopMoves) {
      onGetTopMoves();
    }
  };

  const renderMoveItem = (move, index) => {
    const location = formatLocation(move);
    const isSimulating = simulatingMove && simulatingMove.word === move.word;

    // Get leave value and control metrics
    const leaveValue = move.leaveValue || 0;
    const defensiveValue = move.defensiveValue || 0;
    const boardControl = move.boardControl || 0;

    return (
      <Box key={index} className={styles.topMoveItem}>
        <Box className={styles.topMoveRank}>{index + 1}</Box>
        <Box className={styles.topMoveLocation}>{location || ''}</Box>
        <Box className={styles.topMoveWord}>{move.word}</Box>
        <Box className={styles.topMoveDetails}>
          <Box className={styles.topMoveScore}>{move.score}</Box>
          <Tooltip title="Leave Value">
            <Box className={styles.topMoveLeaveValue}>{Math.round(leaveValue)}</Box>
          </Tooltip>
          <Tooltip title="Defensive Value">
            <Box className={styles.topMoveControl}>{Math.round(defensiveValue)}</Box>
          </Tooltip>
          <Box className={styles.topMoveActions}>
            <Tooltip title="Preview Move">
              <Box 
                className={styles.topMoveActionButton}
                onClick={() => handleMoveSelect(move)}
              >
                <VisibilityIcon style={{ fontSize: 14 }} />
              </Box>
            </Tooltip>
            <Tooltip title="Simulate Move">
              <Box 
                className={`${styles.topMoveActionButton} ${isSimulating ? styles.simulating : ''}`}
                onClick={() => handleSimulateMove(move)}
              >
                <PlayArrowIcon style={{ fontSize: 14 }} />
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    );
  };

  if (isLoadingTopMoves || isDictionaryLoading) {
    return (
      <Box className={styles.topMovesPanel}>
        <Box className={styles.topMovesContent}>
          <Box className={styles.topMovesButton} onClick={handleGetTopMoves}>
            <LightbulbIcon style={{ fontSize: 16 }} />
          </Box>
          <Box className={styles.loadingText}>
            {isDictionaryLoading ? 'Loading dictionary...' : (
              <Box className={styles.thinkingDots}>
                <div></div>
                <div></div>
                <div></div>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  if (!topMoves || topMoves.length === 0) {
    return (
      <Box className={styles.topMovesPanel}>
        <Box className={styles.topMovesContent}>
          <Box className={styles.topMovesButton} onClick={handleGetTopMoves}>
            <LightbulbIcon style={{ fontSize: 16 }} />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={styles.topMovesPanel}>
      <Box className={`${styles.topMovesContent} ${animationClass}`}>
        <Box className={styles.topMovesButton} onClick={handleGetTopMoves}>
          <LightbulbIcon style={{ fontSize: 16 }} />
        </Box>
        <Box className={styles.topMovesCount}>{topMoves.length} options</Box>
        {topMoves.length > 0 && (
          <Box className={styles.expandIcon} onClick={handleExpandClick}>
            {isExpanded ? <ExpandLessIcon style={{ fontSize: 16 }} /> : <ExpandMoreIcon style={{ fontSize: 16 }} />}
          </Box>
        )}
      </Box>
      
      {topMoves.length > 0 && (
        <>
          {/* Always show the top move */}
          {renderMoveItem(topMoves[0], 0)}
          
          {/* Show additional moves when expanded */}
          {isExpanded && (
            <Box className={styles.topMovesList}>
              {topMoves.slice(1).map((move, index) => renderMoveItem(move, index + 1))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TopMoves; 