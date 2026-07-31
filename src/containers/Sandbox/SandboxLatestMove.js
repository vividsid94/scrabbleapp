import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import styles from '../Play/Play.module.css';

// Forked from Play/components/LatestMove.js rather than shared, since
// Sandbox's usage is already a different case (viewing a replayed past
// game, not a single live game in progress) and is expected to keep
// diverging - this way Sandbox-specific changes (like the "no moves
// played yet" empty state below) can't accidentally change Play/Puzzle's
// behavior, and vice versa. Keep an eye out for genuinely shared bug
// fixes/styling tweaks that should be ported to both copies by hand.
const SandboxLatestMove = ({ latestMove, player1Name, player2Name, onMoveHistoryClick, allMoves = [], boardCoords, player1Rack = [], player2Rack = [], blankTiles = [], pool = [], lightMode = 'dark' }) => {
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

  // Sandbox is always bot-vs-bot (no human player to distinguish with
  // PersonIcon, unlike Play's original version) - shows the bot icon plus
  // which side (1 or 2) in parentheses, since two bot icons alone
  // wouldn't tell you who played what.
  const renderPlayerBadge = (playerName) => {
    const iconColor = lightMode === 'dark' ? '#fff' : '#1F2937';
    const playerNumber = playerName === player1Name ? 1 : playerName === player2Name ? 2 : null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <SmartToyIcon style={{ fontSize: 16, color: iconColor }} />
        {playerNumber && (
          <Box component="span" sx={{ fontSize: '10px', color: iconColor }}>({playerNumber})</Box>
        )}
      </Box>
    );
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

  // A bot's exchange hides which tiles were swapped (matches real Scrabble -
  // you can't see your opponent's tray), showing just a count instead. The
  // player's own exchange (manual, or auto-played via "3") reveals the exact
  // tiles since it's the player's own turn. Falls back to plain "Exchange"
  // if tilesExchanged wasn't recorded (older history entries).
  const formatExchangeDisplay = (move) => {
    if (move.isBot) {
      return move.tilesExchanged ? `Exchange ${move.tilesExchanged.length}` : 'Exchange';
    }
    return move.tilesExchanged ? `Exchange ${move.tilesExchanged}` : 'Exchange';
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

  const textColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
  const mutedTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#6B7280';
  const secondaryTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4B5563';
  const borderColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.18)';
  const bgColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
  const panelBackground = lightMode === 'dark'
    ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
    : '#FFFFFF';
  const panelBorder = lightMode === 'dark'
    ? '1px solid rgba(255, 255, 255, 0.1)'
    : '1px solid rgba(140, 130, 110, 0.28)';
  const panelShadow = lightMode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 3px 10px rgba(100, 95, 80, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)';

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
    if (score === 0 && (word === 'Exchange' || (word && word.startsWith('Exchange')) || (player && player.includes('exchanged')))) {
      displayWord = formatExchangeDisplay(move);
    } else if (score === 0 && (!displayWord || displayWord === '')) {
      displayWord = 'Pass';
    }

    const location = formatLocation(boardDiff);
    const turnNumber = allMoves.length - index; // Start from 1, not 0

    return (
      <Box key={index} className={styles.moveHistoryItem} sx={{ borderBottom: `1px solid ${borderColor}` }}>
        <Box className={styles.moveHistoryTurnNumber} style={{ color: secondaryTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>{turnNumber}</Box>
        <Box className={styles.moveHistoryLocation} style={{ color: mutedTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>{location || ''}</Box>
        <Box className={styles.moveHistoryWord} style={{ color: textColor }}>{displayWord}</Box>
        <Box className={styles.moveHistoryDetails}>
          <Box className={styles.moveHistoryScore}>{score || 0}</Box>
          {/* Extra marginLeft on top of moveHistoryDetails' own 6px flex
              gap (shared with Play.module.css, left alone) - the bot icon
              sat too close to the score badge otherwise. */}
          <Box className={styles.moveHistoryPlayer} sx={{ marginLeft: '8px' }}>{renderPlayerBadge(player)}</Box>
        </Box>
      </Box>
    );
  };

  // Sandbox-specific: rather than disappearing entirely (the shared Play
  // version's behavior), show a neat placeholder - this is reachable in
  // Sandbox specifically because viewing a replayed game can be rewound to
  // its opening position (turnIndex -1, before any move), unlike Play's
  // always-in-progress single game.
  if (allMoves.length === 0) {
    return (
      <Box sx={{ width: '100%', padding: 0, margin: 0, marginTop: '16px' }}>
        <Box sx={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: mutedTextColor, opacity: 0.7, marginBottom: '4px', paddingLeft: '2px' }}>
          Move History
        </Box>
        <Box
          sx={{
            padding: '12px 10px',
            background: panelBackground,
            borderRadius: '8px',
            boxShadow: panelShadow,
            border: panelBorder,
            color: secondaryTextColor,
            fontSize: '14px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          No moves have been played yet
        </Box>
      </Box>
    );
  }

  // Get the latest move
  const latestMoveData = allMoves[allMoves.length - 1];

  if (!latestMoveData) {
    return null;
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
  if (score === 0 && (word === 'Exchange' || (word && word.startsWith('Exchange')) || (player && player.includes('exchanged')))) {
    displayWord = formatExchangeDisplay(latestMoveData);
  } else if (score === 0 && (!displayWord || displayWord === '')) {
    displayWord = 'Pass';
  }

  const location = formatLocation(boardDiff);
  const turnNumber = allMoves.length;

  return (
    <Box sx={{ width: '100%', padding: 0, margin: 0, marginTop: '16px' }}>
      <Box sx={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: mutedTextColor, opacity: 0.7, marginBottom: '4px', paddingLeft: '2px' }}>
        Move History
      </Box>
      {/* Card Header */}
      <Box
        onClick={allMoves.length > 1 ? handleExpandClick : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px',
          background: panelBackground,
          borderRadius: '8px',
          boxShadow: panelShadow,
          cursor: allMoves.length > 1 ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          width: '100%',
          boxSizing: 'border-box',
          '&:hover': allMoves.length > 1 ? {
            boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 5px 14px rgba(100, 95, 80, 0.2)'
          } : {},
          marginBottom: isExpanded ? '8px' : '0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <Box className={styles.moveHistoryTurnNumber} style={{ color: secondaryTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>
            {turnNumber}
          </Box>
          {location && (
            <Box className={styles.moveHistoryLocation} style={{ color: mutedTextColor, background: bgColor, border: `1px solid ${borderColor}` }}>
              {location}
            </Box>
          )}
          <Box className={styles.moveHistoryWord} style={{ color: textColor }}>
            {displayWord}
          </Box>
          <Box className={styles.moveHistoryDetails}>
            <Box className={styles.moveHistoryScore}>{score || 0}</Box>
            {/* Extra marginLeft on top of moveHistoryDetails' own 6px flex
              gap (shared with Play.module.css, left alone) - the bot icon
              sat too close to the score badge otherwise. */}
          <Box className={styles.moveHistoryPlayer} sx={{ marginLeft: '8px' }}>{renderPlayerBadge(player)}</Box>
          </Box>
        </Box>
        {/* No GCG download here - Sandbox already has a per-game GCG
            button in Series Results, so a second one in this mini-panel
            would just be redundant. */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {allMoves.length > 1 && (
            <Box sx={{ color: secondaryTextColor, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {isExpanded ? <ExpandLessIcon style={{ fontSize: 18 }} /> : <ExpandMoreIcon style={{ fontSize: 18 }} />}
            </Box>
          )}
        </Box>
      </Box>

      {/* Expanded Content */}
      {isExpanded && allMoves.length > 1 && (
        <Box className={styles.moveHistoryList} sx={{ marginTop: '8px' }}>
          {allMoves.slice(0, -1).reverse().filter(move => move).map((move, index) => renderMoveItem(move, index + 1))}
        </Box>
      )}
    </Box>
  );
};

export default SandboxLatestMove;
