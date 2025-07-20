import React from 'react';
import Box from '@mui/material/Box';
import { Tooltip } from "@mui/material";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import FlashOnIcon from '@mui/icons-material/FlashOn';
import RefreshIcon from '@mui/icons-material/Refresh';

import LatestMove from '../Play/components/LatestMove.js';
import { useSandboxStore } from '../../stores/sandboxStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import styles from '../Puzzle/Puzzle.module.css';

// Memoized LatestMove component that only subscribes to what it needs
const MemoizedLatestMove = React.memo(() => {
  const moveHistory = useSandboxStore(state => state.moveHistory);
  const player1Name = useSandboxStore(state => state.player1Name);
  const player2Name = useSandboxStore(state => state.player2Name);
  const boardCoords = useSandboxStore(state => state.boardCoords);
  const player1Rack = useSandboxStore(state => state.player1Rack);
  const player2Rack = useSandboxStore(state => state.player2Rack);
  const pool = useSandboxStore(state => state.pool);

  const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  return (
    <LatestMove 
      latestMove={latestMove} 
      player1Name={player1Name} 
      player2Name={player2Name}
      allMoves={moveHistory}
      boardCoords={boardCoords}
      pool={pool}
    />
  );
});

const SandboxPlayerInfo = React.memo(() => {
  // Get global color scheme
  const color = useColorSchemeStore(state => state.color);
  
  // Subscribe to board-related state only where it's needed

  
  // Subscribe to other needed state
  const currentPlayer = useSandboxStore(state => state.currentPlayer);
  const player1Rack = useSandboxStore(state => state.player1Rack);
  const player2Rack = useSandboxStore(state => state.player2Rack);
  const player1Name = useSandboxStore(state => state.player1Name);
  const player2Name = useSandboxStore(state => state.player2Name);
  const player1points = useSandboxStore(state => state.player1points);
  const player2points = useSandboxStore(state => state.player2points);
  const player1Time = useSandboxStore(state => state.player1Time);
  const player2Time = useSandboxStore(state => state.player2Time);
  const gameStarted = useSandboxStore(state => state.gameStarted);
  const isBotThinking = useSandboxStore(state => state.isBotThinking);


  const isFastPlayMode = useSandboxStore(state => state.isFastPlayMode);
  const isExecutingFastPlay = useSandboxStore(state => state.isExecutingFastPlay);
  const gameEnded = useSandboxStore(state => state.gameEnded);
  const showAllBingos = useSandboxStore(state => state.showAllBingos);
  
  // Subscribe to actions
  const {
    clearPuzzlePlacement,
    setShowAllBingos,
    setIsFastPlayMode,
    setIsManuallyPaused,
    handleBotModeToggle,
    startBotGame,
  } = useSandboxStore();

  // Local state
  const [isManuallyPaused, setIsManuallyPausedLocal] = React.useState(false);

  const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const currentName = currentPlayer === 1 ? player1Name : player2Name;
  const currentPoints = currentPlayer === 1 ? player1points : player2points;
  const currentTime = currentPlayer === 1 ? player1Time : player2Time;
  




  return (
    <Box className={styles.playerPanel}>
      <Box className={styles.playerToggle}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {null} {/* No time icon in puzzle mode */}
        </Box>
        <Tooltip title={gameStarted ? "Start New T² vs T² Game" : "Start T² vs T² Game"}>
          <Box
            onClick={() => handleBotModeToggle()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '4px',
              cursor: 'pointer'
            }}
          >
            <SmartToyIcon 
              className={`${styles.keyBtn} ${styles.botIcon} ${styles.startIcon} ${gameStarted ? styles.active : ''} ${isBotThinking ? styles.thinking : ''}`}
              style={{ 
                fontSize: 24, 
                cursor: 'pointer',
                color: gameStarted ? '#FF9800' : '#4CAF50'
              }}
            />
          </Box>
        </Tooltip>
        <Tooltip title={isFastPlayMode ? "Fast Play On" : "Fast Play Off"}>
          <Box
            onClick={() => setIsFastPlayMode(!isFastPlayMode)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '4px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Box 
              className={`${styles.keyBtn} ${isFastPlayMode ? styles.active : ''}`}
              style={{ 
                fontSize: 24, 
                cursor: 'pointer',
                color: isFastPlayMode ? '#FF9800' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 'bold'
              }}
            >
              <FlashOnIcon style={{ fontSize: 24 }} />
            </Box>
            {isFastPlayMode && (
              <Box sx={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#FF9800',
                borderRadius: '50%',
                width: '12px',
                height: '12px'
              }} />
            )}
          </Box>
        </Tooltip>
        {gameStarted && (
          <Tooltip title={isManuallyPaused ? "Resume Game" : "Pause Game"}>
            <Box
              onClick={() => setIsManuallyPausedLocal(!isManuallyPaused)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '6px',
                cursor: 'pointer'
              }}
            >
              {isManuallyPaused ? (
                <PlayArrowIcon 
                  className={`${styles.keyBtn} ${styles.pauseIcon} ${styles.active}`}
                  style={{ 
                    fontSize: 24, 
                    cursor: 'pointer'
                  }}
                />
              ) : (
                <PauseIcon 
                  className={`${styles.keyBtn} ${styles.pauseIcon}`}
                  style={{ 
                    fontSize: 24, 
                    cursor: 'pointer'
                  }}
                />
              )}
            </Box>
          </Tooltip>
        )}
        {gameStarted && (
          <Tooltip title="Reset Rack">
            <Box
              onClick={() => {
                console.log(' Reset rack clicked');
                clearPuzzlePlacement();
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '6px',
                cursor: 'pointer'
              }}
            >
              <RefreshIcon 
                className={`${styles.keyBtn} ${styles.resetIcon}`}
                style={{ 
                  fontSize: 24, 
                  cursor: 'pointer'
                }}
              />
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Puzzle Instructions Banner */}
      <Box sx={{
        marginTop: '16px',
        padding: '8px 12px',
        backgroundColor: 'transparent',
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {gameStarted && !gameEnded ? (
          <><strong>Watch T² play itself</strong>
            <Box className={styles.thinkingDots}>
              <div></div>
              <div></div>
              <div></div>
            </Box>
          </>
        ) : (
          <><strong>Watch T² play itself</strong></>
        )}
      </Box>

      {gameStarted && (
        <Box className={styles.playerPanel}>
          {/* Player 1 Score */}
          <Box className={styles.playerInfo} style={{ marginBottom: '8px' }}>
            <Box className={styles.playerName} style={{ minWidth: '120px', textAlign: 'center' }}>
              {player1Name}
              <Box component="span" className={styles.thinkingEmoji} style={{ 
                visibility: (isBotThinking && currentPlayer === 1) ? 'visible' : 'hidden',
                marginLeft: '4px'
              }}>
                🤔
              </Box>
            </Box>
            <Box className={styles.points} style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {player1points}
            </Box>
          </Box>
          
          {/* Player 2 Score */}
          <Box className={styles.playerInfo}>
            <Box className={styles.playerName} style={{ minWidth: '120px', textAlign: 'center' }}>
              {player2Name}
              <Box component="span" className={styles.thinkingEmoji} style={{ 
                visibility: (isBotThinking && currentPlayer === 2) ? 'visible' : 'hidden',
                marginLeft: '4px'
              }}>
                🧠
              </Box>
            </Box>
            <Box className={styles.points} style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {player2points}
            </Box>
          </Box>
        </Box>
      )}

      <MemoizedLatestMove />



      {/* Game ended message */}
      {gameEnded && (
        <Box className={styles.playerPanel} style={{ 
          marginTop: '16px',
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: 'none'
        }}>
          <Box style={{ textAlign: 'center' }}>
            <Box style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              Game Ended
            </Box>
            <Box style={{ fontSize: '12px', opacity: 0.8 }}>
              Too few tiles left. There aren't any more matching puzzles for this game. Start a new one!
            </Box>
          </Box>
        </Box>
      )}


    </Box>
  );
});

export default SandboxPlayerInfo; 