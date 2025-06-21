import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DownloadIcon from '@mui/icons-material/Download';
import styles from '../Play.module.css';
import { generateGCGContent, downloadGCGFile } from '../../../functions/gcgUtils';

const LatestMove = ({ latestMove, player1Name, player2Name, onMoveHistoryClick, allMoves = [], boardCoords, player1Rack = [], player2Rack = [], pool = [] }) => {
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
    
    const gcgContent = generateGCGContent(moveHistory, player1Name, player2Name, boardCoords, player1Rack, player2Rack, pool);
    const filename = `scrabble_game_${new Date().toISOString().split('T')[0]}.gcg`;
    downloadGCGFile(gcgContent, filename);
  };

  useEffect(() => {
    // Handle new game (clear state)
    if (latestMove === null) {
      setAllMovesInternal([]);
      setDisplayMove(null);
      setIsExpanded(false);
      setAnimationClass('');
      return;
    }

    // If we have external allMoves, use those as the source of truth
    // Check if allMoves is a function (from Zustand) and call it to get the actual array
    const actualAllMoves = typeof allMoves === 'function' ? allMoves() : allMoves;
    
    if (actualAllMoves && actualAllMoves.length > 0) {
      const latestExternalMove = actualAllMoves[actualAllMoves.length - 1];
      
      // Check if this is a new move by comparing with our internal state
      const isNewMove = !(allMovesInternal && Array.isArray(allMovesInternal) && allMovesInternal.some(move => 
        move && latestExternalMove && // Add null checks
        move.score === latestExternalMove.score && 
        move.player === latestExternalMove.player && 
        move.word === latestExternalMove.word &&
        move.boardDiff && latestExternalMove.boardDiff &&
        JSON.stringify(move.boardDiff) === JSON.stringify(latestExternalMove.boardDiff)
      ));
      
      if (isNewMove) {
        // Determine if this is autoplay (multiple moves at once)
        const isAutoplay = actualAllMoves.length > allMovesInternal.length + 1;
        
        if (isAutoplay) {
          // During autoplay, update immediately without animations
          const movesWithTimestamps = actualAllMoves.map((move, index) => ({
            ...move,
            timestamp: Date.now() + (actualAllMoves.length - index)
          }));
          
          setAllMovesInternal(movesWithTimestamps.reverse());
          setDisplayMove({
            ...latestExternalMove,
            timestamp: Date.now()
          });
        } else {
          // Single move - use animation
          setIsAnimating(true);
          setAnimationClass(styles.slidingOut);
          
          const timer = setTimeout(() => {
            const moveWithTimestamp = {
              ...latestExternalMove,
              timestamp: Date.now()
            };
            
            setAllMovesInternal(prevMoves => [moveWithTimestamp, ...prevMoves]);
            setDisplayMove(moveWithTimestamp);
            setAnimationClass(styles.slidingIn);
            setIsAnimating(false);
          }, 300);
          
          return () => clearTimeout(timer);
        }
      }
    } else if (latestMove) {
      // Fallback to latestMove if no allMoves available
      const isNewMove = !(allMovesInternal && Array.isArray(allMovesInternal) && allMovesInternal.some(move => 
        move && latestMove && // Add null checks
        move.score === latestMove.score && 
        move.player === latestMove.player && 
        move.word === latestMove.word &&
        move.boardDiff && latestMove.boardDiff &&
        JSON.stringify(move.boardDiff) === JSON.stringify(latestMove.boardDiff)
      ));
      
      if (isNewMove) {
        setIsAnimating(true);
        setAnimationClass(styles.slidingOut);
        
        const timer = setTimeout(() => {
          const moveWithTimestamp = {
            ...latestMove,
            timestamp: Date.now()
          };
          
          setAllMovesInternal(prevMoves => [moveWithTimestamp, ...prevMoves]);
          setDisplayMove(moveWithTimestamp);
          setAnimationClass(styles.slidingIn);
          setIsAnimating(false);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    } else if (allMovesInternal && Array.isArray(allMovesInternal) && allMovesInternal.length > 0 && !displayMove) {
      // Initialize display move if we have moves but no display move
      setDisplayMove(allMovesInternal[0]);
    }
  }, [latestMove, allMoves, allMovesInternal.length, displayMove]);

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderMoveItem = (move, index) => {
    // Add null check for move
    if (!move) {
      return null;
    }
    
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
    const turnNumber = allMovesInternal && Array.isArray(allMovesInternal) && allMovesInternal.length ? allMovesInternal.length - index : 0; // Start from 1, not 0

    return (
      <Box key={index} className={styles.moveHistoryItem}>
        <Box className={styles.moveHistoryTurnNumber}>{turnNumber}</Box>
        <Box className={styles.moveHistoryLocation}>{location || ''}</Box>
        <Box className={styles.moveHistoryWord}>{displayWord}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score || 0}</Box>
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(player)}</Box>
        </Box>
      </Box>
    );
  };

  if (!displayMove && (!allMovesInternal || !Array.isArray(allMovesInternal) || allMovesInternal.length === 0)) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  // Add null check for displayMove and allMovesInternal[0]
  const moveToDisplay = displayMove || (allMovesInternal && Array.isArray(allMovesInternal) && allMovesInternal[0] ? allMovesInternal[0] : null);
  
  if (!moveToDisplay) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  const { score, player, word, boardDiff } = moveToDisplay;
  
  // Handle special cases
  let displayWord = word || '';
  
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
  const turnNumber = allMovesInternal && Array.isArray(allMovesInternal) && allMovesInternal.length ? allMovesInternal.length : 0;
  const actualAllMoves = typeof allMoves === 'function' ? allMoves() : allMoves;
  const moveHistory = actualAllMoves && actualAllMoves.length > 0 ? actualAllMoves : allMovesInternal;

  return (
    <Box className={styles.latestMovePanel}>
      <Box className={`${styles.latestMoveContent} ${animationClass}`}>
        <Box className={styles.moveHistoryTurnNumber}>{turnNumber}</Box>
        <Box className={styles.moveHistoryLocation}>{location || ''}</Box>
        <Box className={styles.moveHistoryWord}>{displayWord}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score || 0}</Box>
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
      
      {isExpanded && allMovesInternal && Array.isArray(allMovesInternal) && allMovesInternal.length > 1 && (
        <Box className={styles.moveHistoryList}>
          {allMovesInternal.slice(1).filter(move => move).map((move, index) => renderMoveItem(move, index + 1))}
        </Box>
      )}
    </Box>
  );
};

export default LatestMove; 