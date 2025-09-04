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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SyncIcon from '@mui/icons-material/Sync';
import LatestMove from './LatestMove';
import TopMoves from './TopMoves';
import ShakeableMascot from '../../../components/AppContent/ShakeableMascot';
import { UserCircle, DotsThree } from '@phosphor-icons/react';

const actionButtonStyle = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const PlayerInfoSection = ({ name, time, points, rack, color, onTileClick, selectedTiles, isBot, currentPlayer, sx, mascotRef, botImage }) => (
  <Box className={styles.playerPanel} sx={sx}>
    <Box className={styles.playerInfo}>
      <Box className={styles.playerName} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {name}
      </Box>
      <Box 
        className={styles.timer}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '2px 6px',
          fontSize: '12px',
          color: '#fff',
          fontFamily: 'monospace',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        {time}
      </Box>
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
  autoPlayBest,
  setAutoPlayBest,
  isBotThinking,
  isPlayerThinking,
  latestMove,
  moveHistory,
  topMoves,
  onMoveSelect,
  onSimulateMove,
  onOpenSimulationModal,
  onAnalyzeDefense,
  onOpenMetrics2Modal,
  simulatingMove,
  boardCoords,
  pool,
  icons,
  mascotRef,
  botImage
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
            <DotsThree size={20} color="white" />
          </Box>
        </Tooltip>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '30px'
        }}>
          {icons.vs}
        </Box>
      </Box>

      <Collapse in={showBestMove}>
        <Box className={styles.bestMoveSection} sx={{ display: 'flex', gap: '50px', padding: '8px 0' }}>
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
            <Tooltip title="Auto-Play Whole Game">
              <Box
                className={styles.bestMoveButton}
                onClick={() => setAutoPlayBest(!autoPlayBest)}
                sx={{ 
                  opacity: !gameStarted ? 0.3 : 1,
                  cursor: !gameStarted ? 'not-allowed' : 'pointer',
                  pointerEvents: !gameStarted ? 'none' : 'auto',
                  position: 'relative',
                  backgroundColor: autoPlayBest ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                  border: autoPlayBest ? '1px solid #4CAF50' : 'none',
                  borderRadius: '4px'
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 20 }} />
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#FF9800',
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
                  4
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
                <CancelIcon sx={{ fontSize: 20 }} />
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
                <SwapHorizIcon sx={{ fontSize: 20 }} />
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

      {gameStarted && [
        {
          name: player1Name,
          time: player1Time,
          points: player1Points,
          rack: player1Rack,
          isBot: false,
          isThinking: currentPlayer === 1 && isPlayerThinking
        },
        {
          name: player2Name,
          time: player2Time,
          points: player2Points,
          rack: isBotMode ? ['🤖', '👾', '🤖', '👾', '🤖', '👾', '🤖'] : player2Rack,
          isBot: isBotMode,
          isThinking: isBotMode && isBotThinking,
          botImage: botImage // Pass botImage to PlayerInfoSection
        }
      ].sort((a, b) => {
        // If currentPlayer is 2, bot should be first
        return currentPlayer === 2 ? (a.isBot ? -1 : 1) : (a.isBot ? 1 : -1);
      }).map((player, index) => (
        <PlayerInfoSection
          key={index}
          name={player.isThinking ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {player.name}
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
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 8px rgba(255, 255, 255, 0.25)',
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
        />
      ))}

      <LatestMove 
        latestMove={latestMove} 
        player1Name={player1Name} 
        player2Name={player2Name}
        allMoves={moveHistory}
        boardCoords={boardCoords}
        pool={pool}
      />

      <TopMoves 
        topMoves={topMoves}
        isLoadingTopMoves={isLoadingTopMoves}
        isDictionaryLoading={isDictionaryLoading}
        onMoveSelect={onMoveSelect}
        onSimulateMove={onSimulateMove}
        onGetTopMoves={onGetTopMoves}
        onOpenSimulationModal={onOpenSimulationModal}
        onAnalyzeDefense={onAnalyzeDefense}
        onOpenMetrics2Modal={onOpenMetrics2Modal}
        simulatingMove={simulatingMove}
        currentPlayer={currentPlayer}
        gameStarted={gameStarted}
      />
    </Box>
  );
} 