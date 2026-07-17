import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import styles from '../Play.module.css';
import sidenavStyles from '../../../components/AppContent/Sidenav/Sidenav.module.css';

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
  onOpenMetrics2Modal,
  lightMode = 'dark'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  
  const textColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
  const secondaryTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4B5563';
  const mutedTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#6B7280';
  const borderColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.18)';
  const bgColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
  const leaveValueBgColor = lightMode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(37, 99, 235, 0.15)';
  const panelBackground = lightMode === 'dark'
    ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
    : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)';
  const panelBorder = lightMode === 'dark'
    ? '1px solid rgba(255, 255, 255, 0.1)'
    : '1px solid #D1D5DB';
  const panelShadow = lightMode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)';

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
          borderBottom: `1px solid ${borderColor}`
        }}
      >
        <Box
          className={styles.topMoveRank}
          style={{ color: secondaryTextColor, background: bgColor, border: `1px solid ${borderColor}` }}
        >
          {index + 1}
        </Box>
        <Box
          className={styles.topMoveLocation}
          style={{
            color: mutedTextColor,
            backgroundColor: bgColor,
            borderColor: borderColor
          }}
        >
          {location || ''}
        </Box>
        <Box
          className={styles.topMoveWord}
          style={{ color: textColor }}
        >
          {move.word}
        </Box>
        <Box className={styles.topMoveDetails}>
          <Box className={styles.topMoveScore}>{move.score}</Box>
          <Tooltip title="Leave">
            <Box className={styles.topMoveLeaveValue} sx={{ color: textColor, background: leaveValueBgColor, border: `1px solid ${borderColor}` }}>
              {Math.round(leaveValue)} ({leaveString})
            </Box>
          </Tooltip>
        </Box>
      </Box>
    );
  };


  const topScore = topMoves && topMoves.length > 0 ? topMoves[0].score : 0;
  const moveCount = topMoves ? topMoves.length : 0;

  return (
    <Box sx={{ width: '100%', padding: 0, margin: 0, marginTop: '8px' }}>
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
                {topMoves[0].leaveValue !== undefined && (
                  <Tooltip title="Leave">
                    <Box className={styles.topMoveLeaveValue} sx={{ color: textColor, background: leaveValueBgColor, border: `1px solid ${borderColor}` }}>
                      {Math.round(topMoves[0].leaveValue || 0)} ({topMoves[0].leave || ''})
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </>
          ) : (
            <>
              <Box sx={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                <img 
                  src="/images/theomascot.png" 
                  alt="Theo" 
                  className={sidenavStyles.sidenavFoxStencil}
                  style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                />
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
        <>
          {/* Metrics buttons when expanded */}
          {(topMoves.length >= 15 || topMoves.length >= 10) && (
            <Box sx={{ display: 'flex', gap: '6px', marginBottom: '8px', padding: '0 4px' }}>
              {topMoves.length >= 15 && (
                <Box 
                  onClick={() => onOpenSimulationModal()}
                  sx={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: secondaryTextColor,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.18)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      borderColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.18)'
                    }
                  }}
                >
                  Metrics
                </Box>
              )}
              {topMoves.length >= 10 && (
                <Box 
                  onClick={() => onOpenMetrics2Modal && onOpenMetrics2Modal()}
                  sx={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: secondaryTextColor,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.18)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      borderColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.18)'
                    }
                  }}
                >
                  Metrics (2)
                </Box>
              )}
            </Box>
          )}
          <Box className={styles.topMovesList}>
            {topMoves.map((move, index) => renderMoveItem(move, index))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default TopMoves; 