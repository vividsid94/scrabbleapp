import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Cube } from '@phosphor-icons/react';
import styles from '../Viewer.module.css';
import { processParsedMove } from '../../../functions/boardFunctions';
import { ThemeContext } from '../../../App';


const LatestMove = ({ 
  currentMoveRef, 
  name1, 
  name2, 
  boardCoords, 
  pool = [],
  onMoveHistoryClick,
  currentMoveCoords = [],
  onTurnClick,
  parsedMoves = [],
  gameNum = null,
  lightMode = 'dark'
}) => {
  const textColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
  const mutedTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#6B7280';
  const secondaryTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4B5563';
  const borderColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const bgColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const scoreBgColor = lightMode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.15)';
  const panelBackground = lightMode === 'dark' 
    ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%)';
  const panelShadow = lightMode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)';
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [processedWords, setProcessedWords] = useState([]);
  const [is3DHovered, setIs3DHovered] = useState(false);



  // Helper function to get player icon
  const getPlayerIcon = (playerName) => {
    const iconColor = lightMode === 'dark' ? '#fff' : '#1F2937';
    if (!playerName) return <PersonIcon style={{ fontSize: 16, color: iconColor }} />;
    
    if (playerName === 'Theo' || playerName === 'Bot' || playerName.includes('Bot')) {
      return <SmartToyIcon style={{ fontSize: 16, color: iconColor }} />;
    } else {
      return <PersonIcon style={{ fontSize: 16, color: iconColor }} />;
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

  // Update processed words when current move changes
  useEffect(() => {
    if (parsedMoves.length > 0 && currentMoveRef.current >= 0) {
      const currentMove = parsedMoves[currentMoveRef.current];
      if (currentMove) {
        const processedWord = processParsedMove(currentMove, currentMoveCoords);
        setProcessedWords(prev => {
          const newWords = [...prev];
          newWords[currentMoveRef.current] = processedWord;
          return newWords;
        });
      }
    }
  }, [currentMoveRef.current, currentMoveCoords, parsedMoves]);



  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  const renderMoveItem = (move, index) => {
    if (!move) return null;
    
    const playerName = move.player;
    const turnIndex = currentMoveIndex - index - 1; // Calculate the actual turn index
    const processedWord = processedWords[turnIndex] || move.word || 'Pass';
    const score = move.score || 0;
    const location = move.location === '--' ? null : move.location;
    const turnNumber = index + 1;

    return (
      <Box key={index} className={styles.moveHistoryItem} sx={{ borderBottom: `1px solid ${borderColor}` }}>
        <Box 
          className={styles.moveHistoryTurnNumber}
          onClick={() => onTurnClick && onTurnClick(turnIndex)}
          sx={{ 
            cursor: onTurnClick ? 'pointer' : 'default',
            color: textColor,
            background: bgColor,
            border: `1px solid ${borderColor}`
          }}
        >
          {turnNumber}
        </Box>
        <Box className={styles.moveHistoryLocation} sx={{ color: mutedTextColor }}>{location || ''}</Box>
        <Box className={styles.moveHistoryWord} sx={{ color: textColor }}>{processedWord || 'Pass'}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore} sx={{ color: textColor, background: scoreBgColor, border: `1px solid ${borderColor}` }}>{score || 0}</Box>
          <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(playerName)}</Box>
        </Box>
      </Box>
    );
  };

  if (parsedMoves.length === 0) {
    return null;
  }

  // Get the current move (based on currentMoveRef)
  const currentMoveIndex = currentMoveRef.current;
  const currentMove = currentMoveIndex >= 0 && currentMoveIndex < parsedMoves.length ? parsedMoves[currentMoveIndex] : null;
  
  if (!currentMove) {
    return null;
  }

  const playerName = currentMove.player;
  const processedWord = processedWords[currentMoveIndex] || processParsedMove(currentMove, currentMoveCoords);
  const score = currentMove.score || 0;
  const location = currentMove.location === '--' ? null : currentMove.location;
  const turnNumber = currentMoveIndex + 1;

  return (
    <Box sx={{ width: '100%', padding: 0, margin: 0, marginTop: '16px' }}>
      <Box 
        onClick={parsedMoves.length > 1 ? handleExpandClick : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px',
          background: panelBackground,
          borderRadius: '8px',
          boxShadow: panelShadow,
          cursor: parsedMoves.length > 1 ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          width: '100%',
          boxSizing: 'border-box',
          '&:hover': parsedMoves.length > 1 ? {
            boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
          } : {},
          marginBottom: isExpanded ? '8px' : '0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <Box 
            className={styles.moveHistoryTurnNumber}
            onClick={(e) => {
              e.stopPropagation();
              if (onTurnClick) onTurnClick(currentMoveIndex);
            }}
            style={{ color: secondaryTextColor }}
          >
            {turnNumber}
          </Box>
          {location && (
            <Box className={styles.moveHistoryLocation} style={{ color: mutedTextColor }}>
              {location}
            </Box>
          )}
          <Box className={styles.moveHistoryWord} style={{ color: textColor }}>
            {processedWord || 'Pass'}
          </Box>
          <Box className={styles.moveHistoryDetails}>
            <Box className={styles.moveHistoryScore}>{score || 0}</Box>
            <Box className={styles.moveHistoryPlayer}>{getPlayerIcon(playerName)}</Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {parsedMoves.length > 1 && (
            <Box sx={{ color: secondaryTextColor, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {isExpanded ? <ExpandLessIcon style={{ fontSize: 18 }} /> : <ExpandMoreIcon style={{ fontSize: 18 }} />}
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