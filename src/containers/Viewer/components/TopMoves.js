import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { createRack } from '../../../functions/rackFunctions.js';
import { ThemeContext } from '../../../App';

import styles from '../Viewer.module.css';

const TopMoves = ({ 
  boardCoords,

  currentMoveRef,
  parsedMoves,
  pool,
  onMoveSelect,
  onSimulateMove,
  onGetTopMoves,
  simulatingMove,
  gameDictionary,
  lightMode = 'dark'
}) => {
  const textColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
  const mutedTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#6B7280';
  const secondaryTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4B5563';
  const borderColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const bgColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const buttonBgColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const scoreBgColor = lightMode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(5, 150, 105, 0.15)';
  const leaveValueBgColor = lightMode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(37, 99, 235, 0.15)';
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [topMoves, setTopMoves] = useState([]);
  const [isLoadingTopMoves, setIsLoadingTopMoves] = useState(false);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);

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

  // Close panel when move changes
  useEffect(() => {
    setIsExpanded(false);
    setTopMoves([]);
  }, [currentMoveRef.current]);

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
    if (onMoveSelect) {
      onMoveSelect(move);
    }
  };

  const handleSimulateMove = (move) => {
    if (onSimulateMove) {
      onSimulateMove(move);
    }
  };

  const handleGetTopMoves = async () => {
    if (isLoadingTopMoves || isDictionaryLoading) {
      return;
    }

    setIsLoadingTopMoves(true);
    try {
      // Determine which player's turn it is based on the current move
      const currentPlayer = currentMoveRef.current % 2 === 0 ? 1 : 2;
      
      // Get the current rack for the player whose turn it is
      const currentRack = createRack(currentMoveRef.current + 1, parsedMoves);
      
      // Convert any '?' in the rack to '*' for the API
      const apiRack = currentRack.map(tile => tile === '?' ? '*' : tile);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      let response;
      try {
        response = await fetch('/.netlify/functions/getTopMoves', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: boardCoords,
            letters: apiRack
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Move calculation timed out. Please try again.');
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse getTopMoves response:', jsonError);
        throw new Error('Move calculation returned invalid response. Please try again.');
      }
      
      // Check if this is the first load (dictionary loading)
      if (data.message && data.message.includes('Loading dictionary')) {
        setIsDictionaryLoading(true);
        // Retry after a short delay
        setTimeout(() => {
          setIsDictionaryLoading(false);
          handleGetTopMoves();
        }, 1000);
        return;
      }
      
      setIsDictionaryLoading(false);
      
      // Filter out moves with empty words
      if (data.moves) {
        data.moves = data.moves.filter(move => move.word && move.word.trim() !== '');
      }
      
      // Generate exchange moves only if we have enough tiles in the pool
      const exchangeMoves = (pool && pool.length >= 7) ? generateExchangeCombinations(currentRack).map(tiles => {
        const leave = calculateExchangeLeave(currentRack, tiles);
        return {
          word: `Exchange ${tiles.join('')}`,
          score: 0,
          tiles: tiles.map(tile => ({ letter: tile, isNew: false })),
          direction: 'exchange',
          startPosition: 'Exchange',
          leave: leave,
          isExchange: true,
          currentRack: currentRack
        };
      }) : [];

      // First, fetch leave values for all moves
      const allMoves = [...data.moves.map(move => ({ ...move, currentRack })), ...exchangeMoves];
      const updatedLeaveValues = await fetchLeaveValues(allMoves);

      // Then calculate total values and sort
      const movesWithValues = allMoves
        .map(move => {
          const leaveValue = updatedLeaveValues[move.leave] || 0;
          const totalValue = move.isExchange ? 
            leaveValue : // For exchanges, total value is just the leave value
            (move.score + leaveValue); // Just points + leave
          return {
            ...move,
            totalValue,
            leaveValue,
          };
        })
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 15); // Show top 15 moves

      setTopMoves(movesWithValues);
    } catch (error) {
      console.error('Error getting top moves:', error);
      // You could add a snackbar or toast notification here
    } finally {
      setIsLoadingTopMoves(false);
    }
  };

  // Helper function to generate exchange combinations
  const generateExchangeCombinations = (rack) => {
    const combinations = [];
    // Generate all possible combinations of 1-7 tiles
    for (let i = 1; i <= Math.min(rack.length, 7); i++) {
      const generateCombos = (current, start, remaining) => {
        if (current.length === i) {
          combinations.push([...current]);
          return;
        }
        for (let j = start; j < remaining.length; j++) {
          current.push(remaining[j]);
          generateCombos(current, j + 1, remaining);
          current.pop();
        }
      };
      generateCombos([], 0, rack);
    }
    return combinations.slice(0, 20); // Limit to 20 exchange options
  };

  // Helper function to calculate exchange leave
  const calculateExchangeLeave = (rack, tilesToExchange) => {
    // Convert any '*' to '?' for consistency
    const tilesToRemove = tilesToExchange.map(tile => tile === '*' ? '?' : tile);
    
    // Remove tiles using count method (similar to Play.js)
    const remainingTiles = rack.filter(tile => {
      const index = tilesToRemove.indexOf(tile);
      if (index !== -1) {
        tilesToRemove.splice(index, 1);
        return false;
      }
      return true;
    });
    
    return remainingTiles.sort().join('');
  };



  // Helper function to calculate leave for a move
  const calculateLeave = (move, currentRack) => {
    if (move.isExchange) {
      return move.leave;
    }
    
    // Create a copy of the current rack
    const rackCopy = [...currentRack];
    
    // Remove tiles used in the move
    for (const tile of move.tiles) {
      if (tile.isNew) {
        if (tile.isBlank) {
          // For blank tiles, we need to find the specific blank that was used
          // Look for the blank in the rack (could be '?' or '*')
          const blankIndex = rackCopy.indexOf('?') !== -1 ? rackCopy.indexOf('?') : rackCopy.indexOf('*');
          if (blankIndex !== -1) {
            rackCopy.splice(blankIndex, 1);
          }
        } else {
          // For regular tiles, find and remove the letter
          const tileIndex = rackCopy.indexOf(tile.letter);
          if (tileIndex !== -1) {
            rackCopy.splice(tileIndex, 1);
          }
        }
      }
    }
    
    // Convert any '*' to '?' for consistency and sort
    const leave = rackCopy.map(tile => tile === '*' ? '?' : tile).sort().join('');
    return leave;
  };

  // Helper function to fetch leave values
  const fetchLeaveValues = async (moves) => {
    try {
      // Calculate leave values for each move
      const leavesToFetch = new Map();
      const leavesArray = [];
      
      for (const move of moves) {
        // For regular moves, calculate the leave after playing the word
        const leaveStr = move.isExchange ? move.leave : calculateLeave(move, move.currentRack);
        move.leave = leaveStr; // Add leave to the move object
        
        // Only fetch if we don't already have this leave value
        if (!leavesToFetch.has(leaveStr)) {
          leavesToFetch.set(leaveStr, true);
          leavesArray.push(leaveStr);
        }
      }

      // Only make the API call if we have leaves to fetch
      if (leavesToFetch.size > 0) {
        const response = await fetch('/.netlify/functions/getLeaveValues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ leaves: leavesArray }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leave values');
        }

        const data = await response.json();
        
        // Return the leave values
        return data.leaveValues || {};
      }

      // If no leaves to fetch, return empty object
      return {};
    } catch (error) {
      console.error('Error fetching leave values:', error);
      return {};
    }
  };



  const renderMoveItem = (move, index) => {
    const location = formatLocation(move);
    const isSimulating = simulatingMove && simulatingMove.word === move.word;

    // Get leave value and leave string
    const leaveValue = move.leaveValue || 0;
    const leaveString = move.leave || '';

    return (
      <Box 
        key={index} 
        className={styles.topMoveItem}
        onClick={() => handleMoveSelect(move)}
        sx={{ 
          cursor: 'pointer',
          borderBottom: `1px solid ${borderColor}`,
          '&:hover': {
            background: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
          }
        }}
      >
        <Box className={styles.topMoveRank} sx={{ color: textColor, background: bgColor, border: `1px solid ${borderColor}` }}>{index + 1}</Box>
        <Box className={styles.topMoveLocation} sx={{ color: mutedTextColor }}>{location || ''}</Box>
        <Box className={styles.topMoveWord} sx={{ color: textColor }}>{move.word}</Box>
        <Box className={styles.topMoveDetails}>
          <Box className={styles.topMoveScore} sx={{ background: scoreBgColor, border: `1px solid ${borderColor}` }}>{move.score}</Box>
          <Tooltip title="Leave">
            <Box className={styles.topMoveLeaveValue} sx={{ background: leaveValueBgColor, border: `1px solid ${borderColor}` }}>
              {Math.round(leaveValue)} ({leaveString})
            </Box>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  if (isLoadingTopMoves || isDictionaryLoading) {
    return (
      <Box className={styles.topMovesPanel}>
        <Box className={styles.topMovesContent} sx={{ borderBottom: `1px solid ${borderColor}` }}>
          <Box className={styles.topMovesButton} onClick={handleGetTopMoves} sx={{ 
            background: buttonBgColor,
            color: textColor,
            '&:hover': {
              background: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'
            }
          }}>
            <img 
              src="/images/theomascot.png" 
              alt="Theo Fox" 
              style={{ 
                width: '24px', 
                height: '24px', 
                filter: 'grayscale(1) contrast(200%) brightness(0.5)',
                opacity: 0.6
              }} 
            />
            <Box sx={{ fontSize: '10px', marginLeft: '4px', color: textColor }}>Ask Theo</Box>
            <Box sx={{ fontSize: '10px', marginLeft: '2px', color: mutedTextColor }}>(15)</Box>
          </Box>
          <Box className={styles.loadingText} sx={{ color: mutedTextColor }}>
            {isDictionaryLoading ? 'Loading dictionary...' : (
              <Box className={styles.thinkingDots}>
                <div style={{ background: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)' }}></div>
                <div style={{ background: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)' }}></div>
                <div style={{ background: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)' }}></div>
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
        <Box className={styles.topMovesContent} sx={{ borderBottom: `1px solid ${borderColor}` }}>
          <Box className={styles.topMovesButton} onClick={handleGetTopMoves} sx={{ 
            background: buttonBgColor,
            color: textColor,
            '&:hover': {
              background: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'
            }
          }}>
            <img 
              src="/images/theomascot.png" 
              alt="Theo Fox" 
              style={{ 
                width: '24px', 
                height: '24px', 
                filter: 'grayscale(1) contrast(200%) brightness(0.5)',
                opacity: 0.6
              }} 
            />
            <Box sx={{ fontSize: '10px', marginLeft: '4px', color: textColor }}>Ask Theo</Box>
            <Box sx={{ fontSize: '10px', marginLeft: '2px', color: mutedTextColor }}>(15)</Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={styles.topMovesPanel}>
      <Box className={`${styles.topMovesContent} ${animationClass}`} sx={{ borderBottom: `1px solid ${borderColor}` }}>
        <Box className={styles.topMovesButton} onClick={handleGetTopMoves} sx={{ 
          background: buttonBgColor,
          color: textColor,
          '&:hover': {
            background: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)'
          }
        }}>
          <img 
            src="/images/theomascot.png" 
            alt="Theo Fox" 
            style={{ 
              width: '24px', 
              height: '24px', 
              filter: 'grayscale(1) contrast(200%) brightness(0.5)',
              opacity: 0.6
            }} 
          />
          <Box sx={{ fontSize: '10px', marginLeft: '4px', color: textColor }}>Ask Theo</Box>
          <Box sx={{ fontSize: '10px', marginLeft: '2px', color: mutedTextColor }}>(15)</Box>
        </Box>
        {topMoves.length > 0 && (
          <Box className={styles.expandIcon} onClick={handleExpandClick} sx={{ color: secondaryTextColor }}>
            {isExpanded ? <ExpandLessIcon style={{ fontSize: 16, color: lightMode === 'dark' ? '#fff' : '#1F2937' }} /> : <ExpandMoreIcon style={{ fontSize: 16, color: lightMode === 'dark' ? '#fff' : '#1F2937' }} />}
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