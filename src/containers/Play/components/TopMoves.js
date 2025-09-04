import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  gameStarted,
  onOpenSimulationModal,
  onAnalyzeDefense
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const defenseButtonClicked = useRef(false);

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

  const handleSeeDefenseClick = (e, move) => {
    e.stopPropagation(); // Prevent the row click from triggering
    e.preventDefault(); // Prevent any default behavior
    defenseButtonClicked.current = true; // Mark that defense button was clicked

    // Reset the flag after a short delay
    setTimeout(() => {
      defenseButtonClicked.current = false;
    }, 100);

    if (onAnalyzeDefense) {
      onAnalyzeDefense(move);
    }
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

    // Get leave value
    const leaveValue = move.leaveValue || 0;

    return (
      <Box 
        key={index} 
        className={styles.topMoveItem}
        onClick={(e) => {
          // Check if the defense button was clicked
          if (defenseButtonClicked.current) {
            return;
          }
          handleMoveSelect(move);
        }}
        style={{ cursor: 'pointer' }}
      >
        <Box className={styles.topMoveRank}>{index + 1}</Box>
        <Box className={styles.topMoveLocation}>{location || ''}</Box>
        <Box className={styles.topMoveWord}>{move.word}</Box>
        <Box className={styles.topMoveDetails}>
          <Box className={styles.topMoveScore}>{move.score}</Box>
          <Tooltip title="Leave">
            <Box className={styles.topMoveLeaveValue}>{Math.round(leaveValue)}</Box>
          </Tooltip>
          <Box 
            className={styles.seeDefenseButton}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleSeeDefenseClick(e, move);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
            }}
            style={{ 
              position: 'relative', 
              zIndex: 10,
              pointerEvents: 'auto'
            }}
          >
            see defense
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
            <Box sx={{ fontSize: '10px', marginLeft: '2px' }}>(15)</Box>
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
            <Box sx={{ fontSize: '10px', marginLeft: '2px' }}>(15)</Box>
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
          <Box sx={{ fontSize: '10px', marginLeft: '2px' }}>(15)</Box>
        </Box>
        {topMoves.length >= 15 && (
          <Box 
            className={styles.topMovesButton} 
            onClick={() => onOpenSimulationModal()}
            sx={{
              height: '16px', // Keep height fixed
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingRight: 0 // Remove right padding
            }}
          >
            <Box sx={{ fontSize: '11px' }}>Metrics</Box>
            <Box sx={{ fontSize: '10px' }}></Box>
          </Box>
        )}
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