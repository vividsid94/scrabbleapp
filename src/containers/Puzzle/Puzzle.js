import React, { useEffect, useRef, useMemo, useState } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Puzzle.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import PlayPool from "../../components/AppContent/Board/PlayPool.js";
import { formatTime } from '../../functions/play/timeUtils';
import { usePuzzleStore } from '../../stores/puzzleStore';
import Confetti from '../../components/Confetti/Confetti';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";
import { TEST_RACKS } from "../../components/AppContent/References/testRacks.js";
import { createBoard } from "../../functions/boardFunctions.js";
import { initializeSounds, updateSoundType } from '../../functions/play/soundFunctions';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Tooltip } from "@mui/material";
import Rack from '../../components/AppContent/Board/Rack.js';
import LatestMove from '../Play/components/LatestMove.js';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function Puzzle() {
  // Refs (keep these local like Play.js)
  const color = useRef('#b064af');
  const complementaryColor = useRef('#9F7A83');
  const timerRef = useRef(null);
  const botMoveMadeRef = useRef(false);

  // Initialize sounds (simplified) - only once
  const [sounds, setSounds] = useState(null);
  
  useEffect(() => {
    const soundObjects = initializeSounds() || {};
    setSounds(soundObjects);
  }, []);

  const { gameStartSound, playerMoveSound, botMoveSound } = sounds || {};

  const {
    boardCoords,
    tempBoardCoords,
    player1points,
    player2points,
    player1Rack,
    player2Rack,
    player1Name,
    player2Name,
    currentPlayer,
    pool,
    gameStarted,
    gameEnded,
    isBotMode,
    isBotThinking,
    player1Time,
    player2Time,
    timerActive,
    gameTime,
    moveHistory,
    topMoves,
    isLoadingTopMoves,
    winner,
    theme,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showTimeSlider,
    showConfetti,
    showVictoryOverlay,
    isPausedForBingo,
    setIsPausedForBingo,
    bingoMove,
    setBingoMove,
    setTopMoves,
    setIsLoadingTopMoves,
    setGameStarted,
    setGameEnded,
    setWinner,
    setPlayer1Rack,
    setPlayer2Rack,
    setBoardCoords,
    setTempBoardCoords,
    setPool,
    setCurrentPlayer,
    setPlayer1points,
    setPlayer2points,
    setMoveHistory,
    setOrigBoardCoords,
    blankTiles,
    makeBotMove,
    startBotGame,
    handleBotModeToggle,
    selectedTiles,
    setSelectedTiles,
    tilesToExchange,
    setTilesToExchange,
    selectedBoardPosition,
    setSelectedBoardPosition,
    initializePuzzle,
    continueBingoMove,
    setLeaveValues,
    fetchLeaveValuesForTopMoves,
  } = usePuzzleStore();

  // Add manual pause state
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  // Helper: check if a move is a bingo
  const isBingo = (move) => move && move.tiles && move.tiles.length === 7;

  // Initialize puzzle to clean state on mount
  useEffect(() => {
    initializePuzzle();
  }, []);

  // Initialize game using store action
  useEffect(() => {
    if (sounds) {
      // Initialize board
      let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
      setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      
      // Initialize pool
      setPool(origPool);
    }
  }, [sounds]);

  // Fetch leave values for top moves
  useEffect(() => {
    fetchLeaveValuesForTopMoves();
  }, [topMoves]);

  // Start new game function - use the same as Play.js
  const startNewGame = () => {
    handleBotModeToggle(gameStartSound, botMoveSound);
  };

  // Update the useEffect for bot turns to use the new makeBotMove
  useEffect(() => { 
    
    // Add a small delay to ensure state updates are processed
    const timeoutId = setTimeout(() => {
      if (isBotMode && gameStarted && (currentPlayer === 1 || currentPlayer === 2) && !isBotThinking && !gameEnded && !botMoveMadeRef.current && !isPausedForBingo && !isManuallyPaused) {
        botMoveMadeRef.current = true;
        makeBotMove(botMoveSound);
      } else {
        console.log('❌ Bot move conditions not met');
      }
    }, 10); // Small delay to ensure state updates are processed

    return () => clearTimeout(timeoutId);
  }, [currentPlayer, isBotMode, gameStarted, isBotThinking, gameEnded, isPausedForBingo, isManuallyPaused]);

  // Reset bot move flag when player changes
  useEffect(() => {
    if (currentPlayer === 1 || currentPlayer === 2) {
      botMoveMadeRef.current = false;
    }
  }, [currentPlayer]);

  // Reset bot move flag when game starts
  useEffect(() => {
    if (gameStarted) {
      botMoveMadeRef.current = false;
    }
  }, [gameStarted]);

  // Reset bot move flag when manual pause is toggled
  useEffect(() => {
    if (!isManuallyPaused) {
      botMoveMadeRef.current = false;
    }
  }, [isManuallyPaused]);

  // Reset bot move flag when bingo pause is cleared
  useEffect(() => {
    console.log('🔄 Bingo pause useEffect', { isPausedForBingo, botMoveMadeRef: botMoveMadeRef.current });
    if (!isPausedForBingo) {
      console.log('✅ Resetting bot move flag after bingo pause');
      botMoveMadeRef.current = false;
    }
  }, [isPausedForBingo]);

  // Check for bingos in top moves
  useEffect(() => {
    if (topMoves && topMoves.length > 0 && !isPausedForBingo && gameStarted && !gameEnded) {
      const topMove = topMoves[0];
      if (isBingo(topMove)) {
        setIsPausedForBingo(true);
        setBingoMove(topMove);
      }
    }
  }, [topMoves, isPausedForBingo, gameStarted, gameEnded]);

  // Get the latest move from move history
  const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  // Extract coordinates of the last played move for highlighting
  const lastMoveCoordinates = useMemo(() => {
    if (!latestMove || !latestMove.boardDiff) {
      return [];
    }
    
    // Extract coordinates from boardDiff
    return latestMove.boardDiff.map(tile => ({
      row: tile.row,
      col: tile.col
    }));
  }, [latestMove]);

  // Memoized board rendering - copy from Play.js
  const board = useMemo(() => {
    // Safety check for null/undefined board coordinates
    if (!tempBoardCoords || !boardCoords) {
      return [];
    }
    
    return createBoard(
      tempBoardCoords.map((row, rowIndex) => 
        row.map((col, colIndex) => {
          // If there's a temporary move, use that
          if (typeof col === 'string') {
            return col;
          }
          // Otherwise use the committed board state
          return boardCoords[rowIndex][colIndex];
        })
      ),
      [], 
      "PROTILES", 
      theme, 
      color.current, 
      complementaryColor.current, 
      blankTiles,
      lastMoveCoordinates
    );
  }, [tempBoardCoords, boardCoords, theme, blankTiles, lastMoveCoordinates]);

  // Resume after bingo challenge
  const handleResume = () => {
    console.log('🔄 handleResume called', { bingoMove, isPausedForBingo });
    
    if (bingoMove) {
      // Continue the bingo move
      console.log('🎯 Continuing bingo move');
      continueBingoMove();
    } else {
      // Resume from manual pause
      console.log('⏸️ Resuming from manual pause');
      setIsPausedForBingo(false);
      setBingoMove(null);
    }
  };

  // Empty function for tile clicking (no tile clicking in puzzle mode)
  const handleTileClick = () => {};

  // Custom PlayerInfo component for puzzle mode that shows current player's rack
  const PuzzlePlayerInfo = () => {
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
          <Tooltip title={gameStarted ? "Start New Bot vs Bot Game" : "Start Bot vs Bot Game"}>
            <Box
              onClick={startNewGame}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
                cursor: 'pointer'
              }}
            >
              <SmartToyIcon 
                className={`${styles.keyBtn} ${styles.botIcon} ${styles.startIcon} ${gameStarted ? styles.active : ''} ${isBotMode && currentPlayer === 2 ? styles.thinking : ''}`}
                style={{ 
                  fontSize: 24, 
                  cursor: 'pointer',
                  color: gameStarted ? '#FF9800' : '#4CAF50'
                }}
              />
            </Box>
          </Tooltip>
          {gameStarted && (
            <Tooltip title={isManuallyPaused ? "Resume Game" : "Pause Game"}>
              <Box
                onClick={() => setIsManuallyPaused(!isManuallyPaused)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '30px',
                  cursor: 'pointer'
                }}
              >
                {isManuallyPaused ? (
                  <PlayArrowIcon 
                    style={{ 
                      fontSize: 24, 
                      cursor: 'pointer',
                      color: '#4CAF50'
                    }}
                  />
                ) : (
                  <PauseIcon 
                    style={{ 
                      fontSize: 24, 
                      cursor: 'pointer',
                      color: '#FF9800'
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          )}
          {gameStarted && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              <Box sx={{ color: '#4CAF50' }}>
                {player1points}
              </Box>
              <Box sx={{ color: '#666' }}>
                -
              </Box>
              <Box sx={{ color: '#FF9800' }}>
                {player2points}
              </Box>
            </Box>
          )}
        </Box>

        {gameStarted && (
          <Box className={styles.playerPanel}>
            <Box className={styles.playerInfo}>
              <Box className={styles.playerName}>
                {isBotThinking ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {currentName}
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
                      transition: 'all 0.3s ease'
                    }}>
                      <Box className={styles.thinkingDots}>
                        <div></div>
                        <div></div>
                        <div></div>
                      </Box>
                    </Box>
                  </Box>
                ) : currentName}
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
                  transition: 'all 0.3s ease'
                }}
              >
                {formatTime(currentTime || 0)}
              </Box>
            </Box>
            {currentRack && currentRack.length > 0 && (
              <Box className={styles.Rack}>
                <Rack 
                  rack={currentRack} 
                  color={color.current} 
                  onTileClick={handleTileClick}
                  selectedTiles={tilesToExchange}
                />
              </Box>
            )}
          </Box>
        )}

        <LatestMove 
          latestMove={latestMove} 
          player1Name={player1Name} 
          player2Name={player2Name}
          allMoves={moveHistory}
          boardCoords={boardCoords}
          pool={pool}
        />

        {/* Bingo challenge section */}
        {isPausedForBingo && bingoMove && (
          <Box className={styles.playerPanel} style={{ 
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <Box style={{ textAlign: 'center', marginBottom: '12px' }}>
              <Box style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                Bingo Challenge!
              </Box>
              <Box style={{ fontSize: '14px', marginBottom: '8px' }}>
                {currentPlayer === 1 ? player1Name : player2Name} found a bingo!
              </Box>
              <Box style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.8 }}>
                Can you find where to place all 7 tiles?
              </Box>
              <button onClick={handleResume} style={{ 
                fontSize: 14, 
                padding: '6px 16px', 
                borderRadius: 6, 
                cursor: 'pointer',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                fontWeight: 'bold'
              }}>
                Show Answer & Continue
              </button>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box className={styles.container}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.mainPanel}>
          <Box className={styles.title}>
            <Box className={styles.gameTitle}>
              <Box className={styles.playModeTitle}>
                Puzzle+
              </Box>
            </Box>
          </Box>
          
          <Box className={styles.leftContainer}>
            <Box className={`${styles.mainBox} ${styles.mainBoxContent}`} component="main">
              <Board 
                board={board}
                boardMode={theme}
                animate={false}
                showSlip={false}
                showDictionary={false}
                dictionary=""
                previewScore={null}
                previewScorePosition={null}
                lastMoveCoordinates={lastMoveCoordinates}
              />   
            </Box>
          </Box>
          <Box className={styles.rightPanel}>
            {/* Player Info Panel */}
            <PuzzlePlayerInfo />
            
            {/* Player info and pool */}
            <Box className={styles.playerPanel}>
              <Box className={styles.poolBox}>
                <PlayPool 
                  pool={pool} 
                  player1Rack={player1Rack} 
                  player2Rack={player2Rack}
                  gameStarted={gameStarted}
                />  
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Confetti and victory overlays */}
        <Confetti
          winner={winner}
          isVisible={showConfetti}
          onComplete={() => {}}
        />
        {showVictoryOverlay && (
          <Box className={styles.victoryOverlay}>
            <Box className={`${styles.victoryCard} ${winner === 'player' ? styles.victoryCardPlayer : styles.victoryCardBot}`}>
              <Box className={styles.victoryIcon}>
                {winner === 'player' ? '🏆' : '🤖'}
              </Box>
              <Box className={styles.victoryTitle}>
                {winner === 'player' ? 'It\'s a huge, huge win!' : 'The bot got the best of you!'}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
} 