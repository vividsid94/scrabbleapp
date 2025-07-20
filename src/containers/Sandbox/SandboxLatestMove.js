import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DownloadIcon from '@mui/icons-material/Download';
import styles from '../Play/Play.module.css';
import { generateGCGContentForBotMoves, downloadGCGFile } from '../../utils/gcgGenerator';

const SandboxLatestMove = ({ latestMove, player1Name, player2Name, onMoveHistoryClick, allMoves = [], boardCoords, player1Rack = [], player2Rack = [], pool = [] }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

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
    if (playerName === 'T²' || playerName === 'Bot') {
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

  // Handle download .gcg file - uses bot-specific generator
  const handleDownloadGCG = () => {
    if (allMoves.length === 0) {
      return;
    }
    
    const gcgContent = generateGCGContentForBotMoves(allMoves, player1Name, player2Name, player1Rack, player2Rack);
    const filename = `sandbox_game_${new Date().toISOString().split('T')[0]}.gcg`;
    downloadGCGFile(gcgContent, filename);
  };

  // Simple animation when new moves are added
  useEffect(() => {
    if (allMoves.length > 0) {
      setIsAnimating(true);
      setAnimationClass(styles.slidingIn);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setAnimationClass('');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [allMoves.length]);

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
    const turnNumber = allMoves.length - index; // Start from 1, not 0

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

  if (allMoves.length === 0) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  // Get the latest move
  const latestMoveData = allMoves[allMoves.length - 1];
  
  if (!latestMoveData) {
    return (
      <Box className={styles.latestMovePanel}>
        <Box className={`${styles.latestMoveContent} ${animationClass}`}>
          <Box className={styles.noMoveText}>No moves yet</Box>
        </Box>
      </Box>
    );
  }

  const { score, player, word, boardDiff } = latestMoveData;
  
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
  const turnNumber = allMoves.length;

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
          {allMoves.length > 1 && (
            <Box className={styles.expandIcon} onClick={handleExpandClick}>
              {isExpanded ? <ExpandLessIcon style={{ fontSize: 16 }} /> : <ExpandMoreIcon style={{ fontSize: 16 }} />}
            </Box>
          )}
          {allMoves.length > 0 && (
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
      
      {isExpanded && allMoves.length > 1 && (
        <Box className={styles.moveHistoryList}>
          {allMoves.slice(0, -1).reverse().filter(move => move).map((move, index) => renderMoveItem(move, index + 1))}
        </Box>
      )}
    </Box>
  );
};

export default SandboxLatestMove; 