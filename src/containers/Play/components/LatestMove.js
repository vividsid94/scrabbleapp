import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DownloadIcon from '@mui/icons-material/Download';
import styles from '../Play.module.css';
import { generateGCGContent, downloadGCGFile } from '../../../functions/gcgUtils';

const LatestMove = ({ latestMove, player1Name, player2Name, onMoveHistoryClick, allMoves = [] }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [allMovesInternal, setAllMovesInternal] = useState([]);
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

  // Helper function to extract word from boardDiff
  const extractWordFromBoardDiff = (boardDiff) => {
    if (!boardDiff || boardDiff.length === 0) {
      return null;
    }

    // Sort tiles by position to reconstruct the word
    const sortedTiles = [...boardDiff].sort((a, b) => {
      if (a.row !== b.row) {
        return a.row - b.row; // Sort by row first
      }
      return a.col - b.col; // Then by column
    });

    // Extract the letters and join them - use 'value' property
    return sortedTiles.map(tile => tile.value).join('');
  };

  // Handle download .gcg file
  const handleDownloadGCG = () => {
    const moveHistory = allMoves.length > 0 ? allMoves : allMovesInternal;
    if (moveHistory.length === 0) {
      return;
    }
    
    const gcgContent = generateGCGContent(moveHistory, player1Name, player2Name);
    const filename = `scrabble_game_${new Date().toISOString().split('T')[0]}.gcg`;
    downloadGCGFile(gcgContent, filename);
  };

  useEffect(() => {
    if (latestMove) {
      // Start slide out animation with current move
      setIsAnimating(true);
      setAnimationClass(styles.slidingOut);
      
      // After slide out, update the move and slide in
      const timer = setTimeout(() => {
        // Add the new move to the moves array
        setAllMovesInternal(prevMoves => {
          // Add timestamp to make each move unique, even if they're identical
          const moveWithTimestamp = {
            ...latestMove,
            timestamp: Date.now()
          };
          
          return [moveWithTimestamp, ...prevMoves];
        });
        
        // Update the display move with the same structure (including timestamp)
        const moveWithTimestamp = {
          ...latestMove,
          timestamp: Date.now()
        };
        setDisplayMove(moveWithTimestamp);
        
        // Slide in with new move
        setAnimationClass(styles.slidingIn);
        setIsAnimating(false);
      }, 300); // Match the slideOutUp animation duration
      
      return () => clearTimeout(timer);
    } else if (latestMove === null) {
      // Clear internal state when latestMove is null (new game started)
      setAllMovesInternal([]);
      setDisplayMove(null);
      setIsExpanded(false);
      setAnimationClass('');
    } else if (allMovesInternal.length > 0 && !displayMove) {
      // Initialize display move if we have moves but no display move
      setDisplayMove(allMovesInternal[0]);
    }
  }, [latestMove]);

  // Add a separate effect to handle moveHistory changes (for autoplay scenarios)
  useEffect(() => {
    if (allMoves && allMoves.length > 0) {
      // If we have external moveHistory, use it instead of internal state
      // This handles cases where moves are added rapidly (like during autoplay)
      const latestExternalMove = allMoves[allMoves.length - 1];
      
      // Only update if this is a new move (not already in our internal state)
      const isNewMove = !allMovesInternal.some(move => 
        move.score === latestExternalMove.score && 
        move.player === latestExternalMove.player && 
        move.word === latestExternalMove.word
      );
      
      if (isNewMove) {
        // For autoplay, we might want to skip animations to avoid overwhelming the UI
        const isAutoplay = allMoves.length > allMovesInternal.length + 1;
        
        if (isAutoplay) {
          // During autoplay, update immediately without animations
          // Convert allMoves to internal format with newest moves first (for display)
          const movesWithTimestamps = allMoves.map((move, index) => ({
            ...move,
            timestamp: Date.now() + (allMoves.length - index) // Reverse order for display
          }));
          
          // Reverse the array so newest moves are first (for display)
          setAllMovesInternal(movesWithTimestamps.reverse());
          setDisplayMove({
            ...latestExternalMove,
            timestamp: Date.now()
          });
        } else {
          // Normal single move - use animation
          setIsAnimating(true);
          setAnimationClass(styles.slidingOut);
          
          const timer = setTimeout(() => {
            // For single moves, add to the beginning (newest first for display)
            setAllMovesInternal(prevMoves => {
              const moveWithTimestamp = {
                ...latestExternalMove,
                timestamp: Date.now()
              };
              return [moveWithTimestamp, ...prevMoves];
            });
            setDisplayMove({
              ...latestExternalMove,
              timestamp: Date.now()
            });
            setAnimationClass(styles.slidingIn);
            setIsAnimating(false);
          }, 300);
          
          return () => clearTimeout(timer);
        }
      }
    }
  }, [allMoves, allMovesInternal.length]);

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderMoveItem = (move, index) => {
    const { score, player, word, boardDiff } = move;
    
    // Handle special cases
    let displayWord = word;
    
    if (!displayWord && boardDiff) {
      try {
        displayWord = extractWordFromBoardDiff(boardDiff);
      } catch (error) {
        displayWord = 'Error';
      }
    }
    if (score === 0 && player && player.includes('exchanged')) {
      displayWord = 'Exchange';
    } else if (score === 0 && (!displayWord || displayWord === '')) {
      displayWord = 'Pass';
    }

    const location = formatLocation(boardDiff);
    const turnNumber = allMovesInternal.length - index; // Start from 1, not 0

    return (
      <Box key={index} className={styles.moveHistoryItem}>
        <Box className={styles.moveHistoryTurnNumber}>{turnNumber}</Box>
        <Box className={styles.moveHistoryLocation}>{location || ''}</Box>
        <Box className={styles.moveHistoryWord}>{displayWord}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score}</Box>
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(player)}</Box>
        </Box>
      </Box>
    );
  };

  if (!displayMove && allMovesInternal.length === 0) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  const { score, player, word, boardDiff } = displayMove || allMovesInternal[0] || {};
  
  // Handle special cases
  let displayWord = word;
  
  if (!displayWord && boardDiff) {
    try {
      displayWord = extractWordFromBoardDiff(boardDiff);
    } catch (error) {
      displayWord = 'Error';
    }
  }
  if (score === 0 && player && player.includes('exchanged')) {
    displayWord = 'Exchange';
  } else if (score === 0 && (!displayWord || displayWord === '')) {
    displayWord = 'Pass';
  }

  const location = formatLocation(boardDiff);
  const turnNumber = allMovesInternal.length;
  const moveHistory = allMoves.length > 0 ? allMoves : allMovesInternal;

  return (
    <Box className={styles.latestMovePanel}>
      <Box className={`${styles.latestMoveContent} ${animationClass}`}>
        <Box className={styles.moveHistoryTurnNumber}>{turnNumber}</Box>
        <Box className={styles.moveHistoryLocation}>{location || ''}</Box>
        <Box className={styles.moveHistoryWord}>{displayWord}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score}</Box>
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(player)}</Box>
        </Box>
        <Box className={styles.moveHistoryActions}>
          {moveHistory.length > 1 && (
            <Box className={styles.expandIcon} onClick={handleExpandClick}>
              {isExpanded ? <ExpandLessIcon style={{ fontSize: 16 }} /> : <ExpandMoreIcon style={{ fontSize: 16 }} />}
            </Box>
          )}
          {moveHistory.length > 0 && (
            <Box className={styles.downloadIcon} onClick={handleDownloadGCG} title="Download .gcg file">
              <Box sx={{
                fontSize: '10px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <DownloadIcon style={{ fontSize: 14 }} />
                GCG
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      
      {isExpanded && allMovesInternal.length > 1 && (
        <Box className={styles.moveHistoryList}>
          {allMovesInternal.slice(1).map((move, index) => renderMoveItem(move, index + 1))}
        </Box>
      )}
    </Box>
  );
};

export default LatestMove; 