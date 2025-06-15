import React, { useState } from 'react';
import Box from '@mui/material/Box';
import styles from '../Play.module.css';
import Rack from '../../../components/AppContent/Board/Rack.js';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Tooltip, Collapse } from '@mui/material';
import { BOT_RACK_VISIBILITY } from '../../../components/AppContent/References/testRacks';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import HistoryIcon from '@mui/icons-material/History';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

const actionButtonStyle = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const PlayerInfoSection = ({ name, time, points, rack, color, onTileClick, selectedTiles, isBot, currentPlayer, sx }) => (
  <Box className={styles.playerPanel} sx={sx}>
    <Box className={styles.playerInfo}>
      <Box className={styles.playerName}>{name}</Box>
      <Box className={styles.timer}>{time}</Box>
    </Box>
    <Box 
      className={styles.points} 
      sx={{
        fontSize: '24px',
        fontWeight: 'bold'
      }}
    >
      {points}
    </Box>
    {rack && ((!isBot) || (isBot && (BOT_RACK_VISIBILITY.enabled || currentPlayer === 2))) && (
      <Box className={styles.Rack}>
        {isBot ? (
          <Box sx={{ 
            display: 'flex', 
            gap: '4px', 
            justifyContent: 'center',
            padding: '8px',
            fontSize: '20px'
          }}>
            {rack.map((emoji, index) => (
              <Box key={index} sx={{ 
                width: '24px', 
                height: '24px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: color.current,
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.2)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: '16px',
                color: 'white',
                transform: 'scale(1.3)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: 'thinking 2s ease-in-out infinite',
                '@keyframes thinking': {
                  '0%': { 
                    transform: 'scale(1.3)'
                  },
                  '50%': { 
                    transform: 'scale(1.35)'
                  },
                  '100%': { 
                    transform: 'scale(1.3)'
                  }
                },
                '&:hover': {
                  transform: 'scale(1.5)',
                  animation: 'none'
                }
              }}>
                {emoji}
              </Box>
            ))}
          </Box>
        ) : (
          <Rack 
            rack={rack} 
            color={color.current} 
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
          />
        )}
      </Box>
    )}
  </Box>
);

export default function PlayerInfo({
  player1Name,
  player2Name,
  player1Points,
  player2Points,
  player1Time,
  player2Time,
  currentPlayer,
  player1Rack,
  player2Rack,
  color,
  onTileClick,
  selectedTiles,
  isBotMode,
  gameStarted,
  isDictionaryLoading,
  isLoadingTopMoves,
  onSettingsOpen,
  onColorSchemeOpen,
  onBotModeToggle,
  onGetTopMoves,
  onWordSubmit,
  onPass,
  onExchange,
  onPlayTopMove,
  selectedBoardPosition,
  tilesToExchange,
  setShowMoveHistory,
  icons,
  isBotThinking
}) {
  const [showBestMove, setShowBestMove] = useState(false);
  const isSubmitDisabled = !gameStarted || !selectedBoardPosition || selectedTiles.length === 0;
  const isExchangeDisabled = !gameStarted || tilesToExchange.length === 0;

  return (
    <Box className={styles.playerPanel}>
      <Box className={styles.playerToggle}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icons.time}
        </Box>
        <Tooltip title={isDictionaryLoading ? "Loading dictionary..." : (isBotMode ? "New Game" : "Play")}>
          <Box
            onClick={() => {
              if (isDictionaryLoading) return;
              onBotModeToggle();
            }}
            sx={{
              opacity: isDictionaryLoading ? 0.5 : 1,
              cursor: isDictionaryLoading ? 'not-allowed' : 'pointer',
              pointerEvents: isDictionaryLoading ? 'none' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '30px'
            }}
          >
            {icons.botMode}
          </Box>
        </Tooltip>
        <Tooltip title={showBestMove ? "Hide Options" : "Show Options"}>
          <Box
            className={styles.keyBtn}
            onClick={() => setShowBestMove(!showBestMove)}
            sx={{ 
              ...actionButtonStyle,
              opacity: !gameStarted ? 0.3 : 1,
              cursor: !gameStarted ? 'not-allowed' : 'pointer',
              pointerEvents: !gameStarted ? 'none' : 'auto',
              transform: showBestMove ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease'
            }}
          >
            <MoreHorizIcon sx={{ fontSize: 20 }} />
          </Box>
        </Tooltip>
      </Box>

      <Collapse in={showBestMove}>
        <Box className={styles.bestMoveSection} sx={{ display: 'flex', gap: '50px', padding: '8px 0' }}>
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <Tooltip title="Play Best Move">
              <Box
                className={styles.bestMoveButton}
                onClick={onPlayTopMove}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : (isLoadingTopMoves || isDictionaryLoading ? 0.5 : 1),
                  cursor: !gameStarted ? 'not-allowed' : (isLoadingTopMoves || isDictionaryLoading ? 'not-allowed' : 'pointer'),
                  pointerEvents: !gameStarted ? 'none' : 'auto'
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 20 }} />
              </Box>
            </Tooltip>
            <Tooltip title="View Move History">
              <Box
                className={styles.bestMoveButton}
                onClick={() => setShowMoveHistory(true)}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : 1,
                  cursor: !gameStarted ? 'not-allowed' : 'pointer',
                  pointerEvents: !gameStarted ? 'none' : 'auto'
                }}
              >
                <HistoryIcon sx={{ fontSize: 20 }} />
              </Box>
            </Tooltip>
            <Tooltip title="View Top Moves">
              <Box
                className={styles.bestMoveButton}
                onClick={onGetTopMoves}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : (isLoadingTopMoves ? 0.5 : 1),
                  cursor: !gameStarted ? 'not-allowed' : 'pointer',
                  pointerEvents: !gameStarted ? 'none' : 'auto'
                }}
              >
                <LightbulbIcon sx={{ fontSize: 20 }} />
              </Box>
            </Tooltip>
            <Tooltip title="Pass">
              <Box
                className={styles.bestMoveButton}
                onClick={onPass}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : 1,
                  cursor: !gameStarted ? 'not-allowed' : 'pointer',
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative'
                }}
              >
                <CancelIcon sx={{ fontSize: 20 }} />
              </Box>
            </Tooltip>
            <Tooltip title="Exchange">
              <Box
                className={styles.bestMoveButton}
                onClick={onExchange}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : (isExchangeDisabled ? 0.5 : 1),
                  cursor: !gameStarted ? 'not-allowed' : (isExchangeDisabled ? 'not-allowed' : 'pointer'),
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative'
                }}
              >
                <SwapHorizIcon sx={{ fontSize: 20 }} />
              </Box>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <Tooltip title="Settings">
              <Box 
                className={styles.bestMoveButton}
                onClick={onSettingsOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {icons.settings}
              </Box>
            </Tooltip>
            <Tooltip title="Color Scheme">
              <Box
                className={styles.bestMoveButton}
                onClick={onColorSchemeOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {icons.colorScheme}
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Collapse>

      {currentPlayer === 2 ? (
        <>
          <PlayerInfoSection
            name={isBotMode && isBotThinking ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {player2Name}
                <Box sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '4px 12px',
                  fontSize: '0.9em',
                  fontWeight: 500,
                  color: 'rgb(255, 255, 255)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 3px 6px rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 8px rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-1px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '2px',
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '-100%',
                    height: '2px',
                    width: '50%',
                    backgroundColor: 'rgb(255, 255, 255)',
                    animation: 'progress 2s infinite linear',
                    '@keyframes progress': {
                      '0%': { left: '-100%' },
                      '100%': { left: '100%' }
                    }
                  }
                }}>
                  is thinking
                </Box>
              </Box>
            ) : player2Name}
            time={player2Time}
            points={player2Points}
            rack={isBotMode ? ['🤖', '👾', '🤖', '👾', '🤖', '👾', '🤖'] : player2Rack}
            color={color}
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
            isBot={isBotMode}
            currentPlayer={currentPlayer}
            sx={{
              '& .rack': {
                background: 'linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1))',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.1)',
                '& > div': {
                  transform: 'scale(1.3)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: 'thinking 2s ease-in-out infinite',
                  '@keyframes thinking': {
                    '0%': { 
                      transform: 'scale(1.3)'
                    },
                    '50%': { 
                      transform: 'scale(1.35)'
                    },
                    '100%': { 
                      transform: 'scale(1.3)'
                    }
                  },
                  '&:hover': {
                    transform: 'scale(1.5)',
                    animation: 'none'
                  }
                }
              }
            }}
          />
          <PlayerInfoSection
            name={player1Name}
            time={player1Time}
            points={player1Points}
            rack={player1Rack}
            color={color}
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
            isBot={false}
            currentPlayer={currentPlayer}
          />
        </>
      ) : (
        <>
          <PlayerInfoSection
            name={player1Name}
            time={player1Time}
            points={player1Points}
            rack={player1Rack}
            color={color}
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
            isBot={false}
            currentPlayer={currentPlayer}
          />
          <PlayerInfoSection
            name={isBotMode && isBotThinking ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {player2Name}
                <Box sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '4px 12px',
                  fontSize: '0.9em',
                  fontWeight: 500,
                  color: 'rgb(255, 255, 255)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 3px 6px rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 8px rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-1px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '2px',
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '-100%',
                    height: '2px',
                    width: '50%',
                    backgroundColor: 'rgb(255, 255, 255)',
                    animation: 'progress 2s infinite linear',
                    '@keyframes progress': {
                      '0%': { left: '-100%' },
                      '100%': { left: '100%' }
                    }
                  }
                }}>
                  is thinking
                </Box>
              </Box>
            ) : player2Name}
            time={player2Time}
            points={player2Points}
            rack={isBotMode ? ['🤖', '👾', '🤖', '👾', '🤖', '👾', '🤖'] : player2Rack}
            color={color}
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
            isBot={isBotMode}
            currentPlayer={currentPlayer}
            sx={{
              '& .rack': {
                background: 'linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1))',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.1)',
                '& > div': {
                  transform: 'scale(1.3)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: 'thinking 2s ease-in-out infinite',
                  '@keyframes thinking': {
                    '0%': { 
                      transform: 'scale(1.3)'
                    },
                    '50%': { 
                      transform: 'scale(1.35)'
                    },
                    '100%': { 
                      transform: 'scale(1.3)'
                    }
                  },
                  '&:hover': {
                    transform: 'scale(1.5)',
                    animation: 'none'
                  }
                }
              }
            }}
          />
        </>
      )}
    </Box>
  );
} 