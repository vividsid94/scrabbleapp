import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { createRack } from '../../../functions/rackFunctions.js';
import { markBlanksLowercase } from '../../../functions/play/boardApiUtils';
import { ThemeContext } from '../../../App';
import FoxIcon from '../../../components/icons/FoxIcon';
import styles from '../Viewer.module.css';

const TopMoves = ({
  boardCoords,
  blankTiles,

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
  const scoreBgColor = lightMode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.15)';
  const leaveValueBgColor = lightMode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(37, 99, 235, 0.15)';
  const panelBackground = lightMode === 'dark' 
    ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%)';
  const panelShadow = lightMode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)';
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
            board: markBlanksLowercase(boardCoords, blankTiles),
            letters: apiRack,
            pool: pool.length
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
      
      // Moves are already leave-scored and sorted server-side (word plays +
      // exchanges, exchanges only present when pool.length >= 7 was sent).
      const movesWithValues = data.moves
        .map(move => ({ ...move, currentRack }))
        .slice(0, 15); // Go already sorted by totalValue

      setTopMoves(movesWithValues);
    } catch (error) {
      console.error('Error getting top moves:', error);
      // You could add a snackbar or toast notification here
    } finally {
      setIsLoadingTopMoves(false);
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
        <Box className={styles.topMoveRank} style={{ color: secondaryTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>{index + 1}</Box>
        <Box className={styles.topMoveLocation} style={{ color: mutedTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>{location || ''}</Box>
        <Box className={styles.topMoveWord} style={{ color: textColor }}>{move.word}</Box>
        <Box className={styles.topMoveDetails}>
          <Box className={styles.topMoveScore}>{move.score}</Box>
          {leaveString && (
            <Tooltip title="Leave">
              <Box className={styles.topMoveLeaveValue} sx={{ color: textColor, background: leaveValueBgColor, border: `1px solid ${borderColor}` }}>
                {Math.round(leaveValue)} ({leaveString})
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  const topScore = topMoves && topMoves.length > 0 ? topMoves[0].score : 0;

  if (isLoadingTopMoves || isDictionaryLoading) {
    return (
      <Box sx={{ width: '100%', padding: 0, margin: 0, marginTop: '8px' }}>
        <Box 
          onClick={handleGetTopMoves}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            background: panelBackground,
            borderRadius: '8px',
            boxShadow: panelShadow,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
            boxSizing: 'border-box',
            '&:hover': {
              boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <Box sx={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FoxIcon size={14} color={textColor} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box sx={{ fontSize: '13px', fontWeight: '600', color: textColor }}>
                Ask Theo
              </Box>
              {(isLoadingTopMoves || isDictionaryLoading) && (
                <Box sx={{ fontSize: '12px', color: mutedTextColor }}>
                  {isDictionaryLoading ? 'Loading dictionary...' : (
                    <Box className={styles.thinkingDots}>
                      <div></div>
                      <div></div>
                      <div></div>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!topMoves || topMoves.length === 0) {
    return (
      <Box sx={{ width: '100%', padding: 0, margin: 0, marginTop: '8px' }}>
        <Box 
          onClick={handleGetTopMoves}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            background: panelBackground,
            borderRadius: '8px',
            boxShadow: panelShadow,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
            boxSizing: 'border-box',
            '&:hover': {
              boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <Box sx={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FoxIcon size={14} color={textColor} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box sx={{ fontSize: '13px', fontWeight: '600', color: textColor }}>
                Ask Theo
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', padding: 0, margin: 0, marginTop: '8px' }}>
      <Box sx={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: mutedTextColor, opacity: 0.7, marginBottom: '4px', paddingLeft: '2px' }}>
        Candidates
      </Box>
      {/* Card Header */}
      <Box
        onClick={topMoves && topMoves.length > 0 ? handleExpandClick : handleGetTopMoves}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px',
          background: panelBackground,
          borderRadius: '8px',
          boxShadow: panelShadow,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          width: '100%',
          boxSizing: 'border-box',
          '&:hover': {
            boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
          },
          marginBottom: isExpanded ? '8px' : '0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          {topMoves && topMoves.length > 0 ? (
            <>
              <Box className={styles.topMoveRank} style={{ color: secondaryTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>
                1
              </Box>
              {formatLocation(topMoves[0]) && (
                <Box className={styles.topMoveLocation} style={{ color: mutedTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>
                  {formatLocation(topMoves[0])}
                </Box>
              )}
              <Box className={styles.topMoveWord} style={{ color: textColor }}>
                {topMoves[0].word}
              </Box>
              <Box className={styles.topMoveDetails}>
                <Box className={styles.topMoveScore}>{topScore}</Box>
                {topMoves[0].leave && (
                  <Tooltip title="Leave">
                    <Box className={styles.topMoveLeaveValue} sx={{ color: textColor, background: leaveValueBgColor, border: `1px solid ${borderColor}` }}>
                      {Math.round(topMoves[0].leaveValue || 0)} ({topMoves[0].leave})
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </>
          ) : (
            <>
              <Box sx={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FoxIcon size={14} color={textColor} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box sx={{ fontSize: '13px', fontWeight: '600', color: textColor }}>
                  Ask Theo
                </Box>
              </Box>
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {topMoves && topMoves.length > 0 && (
            <Box sx={{ color: secondaryTextColor, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {isExpanded ? <ExpandLessIcon style={{ fontSize: 18 }} /> : <ExpandMoreIcon style={{ fontSize: 18 }} />}
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Expanded Content */}
      {isExpanded && topMoves && topMoves.length > 0 && (
        <Box className={styles.topMovesList}>
          {topMoves.slice(1).map((move, index) => renderMoveItem(move, index + 1))}
        </Box>
      )}
    </Box>
  );
};

export default TopMoves; 