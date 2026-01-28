import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import styles from '../Play.module.css';
import Rack from '../../../components/AppContent/Board/Rack.js';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Tooltip, Collapse } from '@mui/material';
import { BOT_RACK_VISIBILITY } from '../../../components/AppContent/References/testRacks';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SyncIcon from '@mui/icons-material/Sync';
import LatestMove from './LatestMove';
import TopMoves from './TopMoves';
import ShakeableMascot from '../../../components/AppContent/ShakeableMascot';
import { UserCircle, DotsThree, ScribbleLoop } from '@phosphor-icons/react';

const actionButtonStyle = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const PlayerInfoSection = ({ name, time, points, rack, color, onTileClick, selectedTiles, isBot, currentPlayer, playerNumber, sx, mascotRef, botImage, lightMode = 'dark', moveStatus = null }) => {
  const panelBackground = lightMode === 'dark' 
    ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%)';
  
  const panelBorder = lightMode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(0, 0, 0, 0.12)';
  
  const panelShadow = lightMode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)';

  // Active turn indicator: small indicator light
  const isActive = currentPlayer === playerNumber;

  return (
  <Box 
    className={styles.playerPanel} 
    sx={{
      ...sx,
      background: panelBackground,
      border: panelBorder,
      boxShadow: panelShadow,
      backgroundImage: 'none'
    }}
  >
    <Box className={styles.playerInfo}>
      <Box 
        className={styles.playerName} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          color: lightMode === 'dark' ? '#fff' : '#1F2937'
        }}
      >
        {isActive ? (
          <Box
            key={`active-indicator-${playerNumber}-${currentPlayer}`}
            sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#D97706',
              boxShadow: '0 0 8px rgba(217, 119, 6, 0.8), 0 0 12px rgba(217, 119, 6, 0.5)',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                  transform: 'scale(1)'
                },
                '50%': {
                  opacity: 0.7,
                  transform: 'scale(1.1)'
                }
              }
            }}
          />
        ) : null}
        {name}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Box 
          className={styles.timer}
          sx={{
            backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
            padding: '2px 6px',
            fontSize: '12px',
            color: lightMode === 'dark' ? '#fff' : '#1F2937',
            fontFamily: 'monospace',
            boxShadow: lightMode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              borderColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-1px)',
              boxShadow: lightMode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          {time}
        </Box>
        {moveStatus && currentPlayer === playerNumber && (
          <Box 
            sx={{
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
              padding: '2px 6px',
              fontSize: '12px',
              color: lightMode === 'dark' ? '#fff' : '#1F2937',
              fontFamily: 'monospace',
              boxShadow: lightMode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                borderColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-1px)',
                boxShadow: lightMode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            {moveStatus}
          </Box>
        )}
      </Box>
    </Box>
    <Box 
      className={styles.points} 
      sx={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#D97706'
      }}
    >
      {points}
    </Box>
    {rack && !isBot && (
      <Box className={styles.Rack}>
        <Rack 
          rack={rack} 
          color={color.current} 
          onTileClick={onTileClick}
          selectedTiles={selectedTiles}
        />
      </Box>
    )}
  </Box>
  );
};

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
  isBotThinking,
  isPlayerThinking,
  latestMove,
  moveHistory,
  topMoves,
  onMoveSelect,
  onSimulateMove,
  onOpenSimulationModal,
  onOpenMetrics2Modal,
  simulatingMove,
  boardCoords,
  pool,
  icons,
  mascotRef,
  botImage,
  lightMode = 'dark',
  moveStatus = null,
  isMultiplayerMode,
  localPlayerNumber,
  opponentRackCount,
  telestratorEnabled,
  onToggleTelestrator
}) {
  const [showBestMove, setShowBestMove] = useState(false);
  const isSubmitDisabled = !gameStarted || !selectedBoardPosition || selectedTiles.length === 0;
  const isExchangeDisabled = !gameStarted || tilesToExchange.length === 0;

  const handlePassClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onPass();
  };

  const handleExchangeClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onExchange();
  };

  const handlePlayTopMoveClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onPlayTopMove();
  };

  const handleWordSubmitClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onWordSubmit();
  };

  const handleGetTopMovesClick = () => {
    if (isPlayerThinking || isBotThinking) return;
    onGetTopMoves();
  };

  return (
    <Box className={styles.playerPanel}>
      <Box className={styles.playerToggle}>
        {icons.time && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icons.time}
          </Box>
        )}
        <Tooltip title={isDictionaryLoading ? "Loading dictionary..." : (isBotMode ? "New Game" : "Play")}>
          <Box
            onClick={() => {
              if (isDictionaryLoading || isBotThinking || isPlayerThinking) return;
              onBotModeToggle();
            }}
            sx={{
              opacity: isDictionaryLoading || isBotThinking || isPlayerThinking ? 0.5 : 1,
              cursor: isDictionaryLoading || isBotThinking || isPlayerThinking ? 'not-allowed' : 'pointer',
              pointerEvents: isDictionaryLoading || isBotThinking || isPlayerThinking ? 'none' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '30px'
            }}
          >
            {icons.botMode}
          </Box>
        </Tooltip>
        <Tooltip title={telestratorEnabled ? "Disable drawing" : "Enable drawing"}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px',
              cursor: 'pointer'
            }}
            onClick={() => onToggleTelestrator && onToggleTelestrator(!telestratorEnabled)}
          >
            <ScribbleLoop
              size={20}
              color={telestratorEnabled
                ? (lightMode === 'dark' ? '#10B981' : '#059669')
                : (lightMode === 'dark' ? '#ffffff' : '#1F2937')
              }
              weight={telestratorEnabled ? 'fill' : 'regular'}
            />
          </Box>
        </Tooltip>
        <Tooltip title={showBestMove ? "Hide Options" : "Show Options"}>
          <Box
            onClick={() => setShowBestMove(!showBestMove)}
            sx={{ 
              opacity: !gameStarted ? 0.3 : 1,
              cursor: !gameStarted ? 'not-allowed' : 'pointer',
              pointerEvents: !gameStarted ? 'none' : 'auto',
              transform: showBestMove ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <DotsThree size={20} color={lightMode === 'dark' ? "white" : "#1F2937"} />
          </Box>
        </Tooltip>
      </Box>

      <Collapse in={showBestMove}>
        <Box className={styles.bestMoveSection} sx={{ 
          display: 'flex', 
          gap: '50px', 
          padding: '8px 0',
          backgroundColor: lightMode === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '8px',
          marginTop: '8px'
        }}>
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <Tooltip title="Play Best Move">
              <Box
                className={styles.bestMoveButton}
                onClick={handlePlayTopMoveClick}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : (isLoadingTopMoves || isDictionaryLoading ? 0.5 : 1),
                  cursor: !gameStarted ? 'not-allowed' : (isLoadingTopMoves || isDictionaryLoading ? 'not-allowed' : 'pointer'),
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative'
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 20 }} />
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  3
                </Box>
              </Box>
            </Tooltip>
            <Tooltip title="Pass">
              <Box
                className={styles.bestMoveButton}
                onClick={handlePassClick}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : 1,
                  cursor: !gameStarted ? 'not-allowed' : 'pointer',
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative'
                }}
              >
                <CancelIcon sx={{ fontSize: 20, color: lightMode === 'dark' ? '#fff' : '#1F2937' }} />
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  1
                </Box>
              </Box>
            </Tooltip>
            <Tooltip title="Exchange">
              <Box
                className={styles.bestMoveButton}
                onClick={handleExchangeClick}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : (isExchangeDisabled ? 0.5 : 1),
                  cursor: !gameStarted ? 'not-allowed' : (isExchangeDisabled ? 'not-allowed' : 'pointer'),
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative'
                }}
              >
                <SwapHorizIcon sx={{ fontSize: 20, color: lightMode === 'dark' ? '#fff' : '#1F2937', fontWeight: '700' }} />
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  2
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Collapse>

      {gameStarted && [
        {
          name: player1Name,
          time: player1Time,
          points: player1Points,
          rack: player1Rack,
          isBot: false,
          isThinking: currentPlayer === 1 && isPlayerThinking,
          playerNumber: 1 // Explicitly set player number
        },
        {
          name: player2Name,
          time: player2Time,
          points: player2Points,
          rack: isBotMode ? ['🤖', '👾', '🤖', '👾', '🤖', '👾', '🤖'] : player2Rack,
          isBot: isBotMode,
          isThinking: isBotMode && isBotThinking,
          botImage: botImage, // Pass botImage to PlayerInfoSection
          playerNumber: 2 // Explicitly set player number
        }
      ].sort((a, b) => {
        // If currentPlayer is 2, bot should be first
        return currentPlayer === 2 ? (a.isBot ? -1 : 1) : (a.isBot ? 1 : -1);
      }).map((player, index) => {
        // Use the explicitly set playerNumber from the player object
        const playerNumber = player.playerNumber;
        return (
        <PlayerInfoSection
          key={`player-${playerNumber}-${currentPlayer}`}
          playerNumber={playerNumber}
          name={player.isThinking ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {player.name}
              <Box sx={{
                backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(0, 0, 0, 0.15)',
                borderRadius: '12px',
                padding: '4px 12px',
                fontSize: '0.9em',
                fontWeight: 500,
                color: lightMode === 'dark' ? 'rgb(255, 255, 255)' : '#1F2937',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: lightMode === 'dark' ? '0 3px 6px rgba(255, 255, 255, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                  boxShadow: lightMode === 'dark' ? '0 4px 8px rgba(255, 255, 255, 0.25)' : '0 3px 6px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)'
                }
              }}>
                <Box className={styles.thinkingDots}>
                  <div></div>
                  <div></div>
                  <div></div>
                </Box>
              </Box>
            </Box>
          ) : player.name}
          time={player.time}
          points={player.points}
          rack={player.rack}
          color={color}
          onTileClick={onTileClick}
          selectedTiles={selectedTiles}
          isBot={player.isBot}
          currentPlayer={currentPlayer}
          lightMode={lightMode}
          sx={player.isBot ? {
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
          } : undefined}
          mascotRef={player.isBot ? mascotRef : undefined}
          botImage={player.botImage}
          moveStatus={moveStatus}
        />
      );
      })}

      <LatestMove 
        latestMove={latestMove} 
        player1Name={player1Name} 
        player2Name={player2Name}
        allMoves={moveHistory}
        boardCoords={boardCoords}
        pool={pool}
        lightMode={lightMode}
      />

      <TopMoves 
        topMoves={topMoves}
        isLoadingTopMoves={isLoadingTopMoves}
        isDictionaryLoading={isDictionaryLoading}
            onMoveSelect={onMoveSelect}
            onSimulateMove={onSimulateMove}
            onGetTopMoves={onGetTopMoves}
            onOpenSimulationModal={onOpenSimulationModal}
            onOpenMetrics2Modal={onOpenMetrics2Modal}
        simulatingMove={simulatingMove}
        currentPlayer={currentPlayer}
        gameStarted={gameStarted}
        lightMode={lightMode}
      />
    </Box>
  );
} 