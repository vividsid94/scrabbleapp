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
import { preWarmGoService, stopPeriodicWarmup } from '../../functions/play/botFunctions';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Tooltip } from "@mui/material";
import Rack from '../../components/AppContent/Board/Rack.js';
import LatestMove from '../Play/components/LatestMove.js';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { Snackbar, Alert } from "@mui/material";

export default function Puzzle() {
  // Refs (keep these local like Play.js)
  const color = useRef('#7878a4');
  const complementaryColor = useRef('#9F7A83');
  const timerRef = useRef(null);
  const botMoveMadeRef = useRef(false);

  // Initialize sounds (simplified) - only once
  const [sounds, setSounds] = useState(null);
  
  useEffect(() => {
    const soundObjects = initializeSounds() || {};
    setSounds(soundObjects);
  }, []);

  // Update sounds to puzzle click sound for puzzle mode
  useEffect(() => {
    if (sounds) {
      // Use puzzle click sound for bot moves in puzzle mode
      const botMoveSoundRef = { current: sounds.botMoveSound };
      botMoveSoundRef.current = { play: () => sounds.puzzleClickSound.play() };
      
      // Update the sound object
      Object.assign(sounds.botMoveSound, botMoveSoundRef.current);
    }
  }, [sounds]);

  const { gameStartSound, playerMoveSound, botMoveSound, puzzleClickSound } = sounds || {};

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
    setSnackbarOpen,
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
    selectedRackTiles,
    tilesToExchange,
    setTilesToExchange,
    selectedBoardPosition,
    setSelectedBoardPosition,
    arrowDirection,
    initializePuzzle,
    continueBingoMove,
    setLeaveValues,
    fetchLeaveValuesForTopMoves,
    puzzleMode,
    setPuzzleMode,
    storedTopMoves,
    isFastPlayMode,
    setIsFastPlayMode,
    makeFastBotMove,
    isExecutingFastPlay,
    fastPlayMoves,
    handleTileDrop,
    handlePuzzleTileClick,
    handleBoardPositionSelect,
    submitPuzzleGuess,
    clearPuzzlePlacement,
    handlePuzzleKeyDown,
  } = usePuzzleStore();

  // Add manual pause state
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  // Add settings panel state
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Add state to show all bingos
  const [showAllBingos, setShowAllBingos] = useState(false);

  // Helper: check if a move is a bingo
  const isBingo = (move) => move && move.tiles && move.tiles.length === 7;

  // Initialize puzzle to clean state on mount
  useEffect(() => {
    initializePuzzle();
  }, []);

  // Pre-warm the Go service when component mounts
  useEffect(() => {
    preWarmGoService();
    
    // Cleanup function to stop periodic warmup when component unmounts
    return () => {
      stopPeriodicWarmup();
    };
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
        
        // Use fast play mode if enabled, otherwise use regular bot move
        if (isFastPlayMode) {
          makeFastBotMove(botMoveSound, gameStartSound);
        } else {
          makeBotMove(botMoveSound, gameStartSound);
        }
      } else {
      }
    }, 10); // Small delay to ensure state updates are processed

    return () => clearTimeout(timeoutId);
  }, [currentPlayer, isBotMode, gameStarted, isBotThinking, gameEnded, isPausedForBingo, isManuallyPaused, isFastPlayMode]);

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
    if (!isPausedForBingo) {
      botMoveMadeRef.current = false;
    }
  }, [isPausedForBingo]);

  // Reset showAllBingos when a new puzzle challenge starts
  useEffect(() => {
    if (isPausedForBingo) {
      setShowAllBingos(false);
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
    
    // Hide the bingos list when resuming
    setShowAllBingos(false);
  };

  // Handle puzzle mode change
  const handlePuzzleModeChange = (newMode) => {
    if (newMode !== puzzleMode) {
      setPuzzleMode(newMode);
      setShowSettingsPanel(false);
      setIsManuallyPaused(false); // Resume game
      // Start a new game with the new mode
      startNewGame();
    }
  };

  // Custom PlayerInfo component for puzzle mode that shows current player's rack
  const PuzzlePlayerInfo = () => {
    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    const currentName = currentPlayer === 1 ? player1Name : player2Name;
    const currentPoints = currentPlayer === 1 ? player1points : player2points;
    const currentTime = currentPlayer === 1 ? player1Time : player2Time;
    
    // Conditional tile click handler - only allow when paused for puzzle
    const handleTileClick = (tile, index) => {
      console.log('🎯 Tile clicked:', { tile, index, isPausedForBingo });
      if (isPausedForBingo) {
        handlePuzzleTileClick(tile, index);
      }
    };

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
          <Tooltip title={gameStarted ? "Start New SidBot vs SidBot Game" : "Start SidBot vs SidBot Game"}>
            <Box
              onClick={startNewGame}
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
          <Tooltip title="Puzzle Mode">
            <Box
              onClick={() => {
                const newShowSettings = !showSettingsPanel;
                setShowSettingsPanel(newShowSettings);
                // Pause game when settings open, resume when closed
                setIsManuallyPaused(newShowSettings);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '4px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <ViewModuleIcon 
                className={`${styles.keyBtn} ${styles.settingsIcon} ${showSettingsPanel ? styles.active : ''}`}
                style={{ 
                  fontSize: 24, 
                  cursor: 'pointer'
                }}
              />
              <Box sx={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {puzzleMode === 'bingo' ? '1' : 
                 puzzleMode === 'only-bingo' ? '2' : 
                 puzzleMode === 'significant-best' ? '3' : '4'}
              </Box>
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
                onClick={() => setIsManuallyPaused(!isManuallyPaused)}
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
        </Box>

        {gameStarted && (
          <Box className={styles.playerPanel}>
            <Box className={styles.playerInfo}>
              <Box className={styles.playerName} style={{ minWidth: '120px', textAlign: 'center' }}>
                {currentName}
                <Box component="span" className={styles.thinkingEmoji} style={{ 
                  visibility: isBotThinking ? 'visible' : 'hidden',
                  marginLeft: '4px'
                }}>
                  {currentPlayer === 1 ? '🤔' : '🧠'}
                </Box>
                {isExecutingFastPlay && (
                  <Box component="span" style={{ 
                    marginLeft: '4px',
                    fontSize: '12px',
                    color: '#FF9800',
                    fontWeight: 'bold'
                  }}>
                    ⚡ Fast Playing...
                  </Box>
                )}
              </Box>
            </Box>
            <Box style={{ marginTop: '12px' }}>
              {currentRack && currentRack.length > 0 && (
                <Box className={styles.Rack}>
                  <Rack 
                    rack={currentRack} 
                    color={color.current} 
                    onTileClick={handleTileClick}
                    selectedTiles={isPausedForBingo ? selectedRackTiles : tilesToExchange}
                  />
                </Box>
              )}
            </Box>
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
              <Box style={{ fontSize: '14px', marginBottom: '8px' }}>
                {currentPlayer === 1 ? player1Name : player2Name} found a {puzzleMode === 'bingo' || puzzleMode === 'only-bingo' ? 'bingo' : 'significant play'}!
              </Box>
              <Box style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.8 }}>
                {puzzleMode === 'only-bingo' 
                  ? 'There is only one. Can you find it?'
                  : puzzleMode === 'bingo'
                  ? 'Can you find the best one?'
                  : puzzleMode === 'significant-best'
                  ? 'The best move is significant. Can you find it?'
                  : puzzleMode === 'non-bingo-significant'
                  ? 'The best non-bingo move is significant. Can you find it?'
                  : 'Can you find the best move?'
                }
              </Box>
              
              {/* Instructions */}
              <Box style={{ 
                fontSize: '11px', 
                marginBottom: '12px', 
                opacity: 0.7,
                padding: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px'
              }}>
                <Box style={{ marginBottom: '4px', fontWeight: 'bold' }}>How to play:</Box>
                <Box>• Place your guess on the board, or reveal the answer by clicking the button below.</Box>
              </Box>
              
              {/* Current guess indicator */}
              {selectedTiles.length > 0 && (
                <Box style={{ 
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <Box style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                    Your Guess:
                  </Box>
                  <Box style={{ 
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#4CAF50',
                    fontWeight: 'bold'
                  }}>
                    {selectedTiles
                      .sort((a, b) => {
                        if (a.row !== b.row) return a.row - b.row;
                        return a.col - b.col;
                      })
                      .map(tile => tile.tile)
                      .join('')
                    }
                  </Box>
                </Box>
              )}
              
              <Box style={{ 
                display: 'flex', 
                gap: '8px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={handleResume} 
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                    e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                    e.target.style.transform = 'scale(1) translateY(0)';
                  }}
                  style={{ 
                    flex: '1',
                    minWidth: '120px',
                    fontSize: 12, 
                    padding: '8px 12px', 
                    borderRadius: 0, 
                    cursor: 'pointer',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Syne, sans-serif',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Show Answer & Continue
                </button>
                <button 
                  onClick={() => {
                    console.log('🎯 Submit button clicked');
                    submitPuzzleGuess();
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(76,175,80,0.3), rgba(76,175,80,0.2))';
                    e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(76,175,80,0.2), rgba(76,175,80,0.1))';
                    e.target.style.transform = 'scale(1) translateY(0)';
                  }}
                  style={{ 
                    flex: '1',
                    minWidth: '120px',
                    fontSize: 12, 
                    padding: '8px 12px', 
                    borderRadius: 0, 
                    cursor: 'pointer',
                    background: 'linear-gradient(145deg, rgba(76,175,80,0.2), rgba(76,175,80,0.1))',
                    color: 'white',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Syne, sans-serif',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Submit Guess
                </button>
                <button 
                  onClick={clearPuzzlePlacement}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                    e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                    e.target.style.transform = 'scale(1) translateY(0)';
                  }}
                  style={{ 
                    flex: '1',
                    minWidth: '120px',
                    fontSize: 12, 
                    padding: '8px 12px', 
                    borderRadius: 0, 
                    cursor: 'pointer',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Syne, sans-serif',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Clear
                </button>
                {puzzleMode === 'bingo' && (
                  <button 
                    onClick={() => setShowAllBingos(!showAllBingos)}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                      e.target.style.transform = 'scale(1.05) translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                      e.target.style.transform = 'scale(1) translateY(0)';
                    }}
                    style={{ 
                      flex: '1',
                      minWidth: '120px',
                      fontSize: 12, 
                      padding: '8px 12px', 
                      borderRadius: 0, 
                      cursor: 'pointer',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(5px)',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Syne, sans-serif',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      position: 'relative'
                    }}
                  >
                    {showAllBingos ? 'Hide All Bingos' : 'Show All Bingos'}
                    <Box style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {storedTopMoves ? storedTopMoves.filter(move => move.tiles && move.tiles.length === 7 && !move.isExchange).length : 0}
                    </Box>
                  </button>
                )}
                {(puzzleMode === 'significant-best' || puzzleMode === 'non-bingo-significant') && (
                  <button 
                    onClick={() => setShowAllBingos(!showAllBingos)}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                      e.target.style.transform = 'scale(1.05) translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                      e.target.style.transform = 'scale(1) translateY(0)';
                    }}
                    style={{ 
                      flex: '1',
                      minWidth: '120px',
                      fontSize: 12, 
                      padding: '8px 12px', 
                      borderRadius: 0, 
                      cursor: 'pointer',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      fontWeight: 'bold',
                      backdropFilter: 'blur(5px)',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Syne, sans-serif',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      position: 'relative'
                    }}
                  >
                    {showAllBingos ? 'Hide Top 2 Plays' : 'Show Top 2 Moves'}
                    <Box style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      2
                    </Box>
                  </button>
                )}
              </Box>
            </Box>
            
            {/* All bingos list for mode 1 */}
            {puzzleMode === 'bingo' && showAllBingos && storedTopMoves && (
              <Box style={{ 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px'
              }}>
                <Box style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                  All Available Bingos:
                </Box>
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {storedTopMoves
                    .filter(move => move.tiles && move.tiles.length === 7 && !move.isExchange)
                    .map((move, index) => (
                      <Box key={index} style={{
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: 'normal'
                      }}>
                        {move.startPosition} {move.word} ({move.score} pts)
                      </Box>
                    ))}
                </Box>
              </Box>
            )}

            {/* Top 2 plays list for modes 3 and 4 */}
            {(puzzleMode === 'significant-best' || puzzleMode === 'non-bingo-significant') && showAllBingos && storedTopMoves && (
              <Box style={{ 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px'
              }}>
                <Box style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                  Top 2 Plays:
                </Box>
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {storedTopMoves.slice(0, 2).map((move, index) => (
                    <Box key={index} style={{
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: index === 0 ? 'bold' : 'normal',
                      padding: '4px 8px',
                      backgroundColor: index === 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: index === 0 ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px'
                    }}>
                      <Box style={{ marginBottom: '2px' }}>
                        {index + 1}. {move.startPosition} {move.word} ({move.score} pts)
                      </Box>
                      <Box style={{ fontSize: '11px', opacity: 0.8 }}>
                        Total Value: {move.totalValue && !isNaN(parseFloat(move.totalValue)) ? Math.round(parseFloat(move.totalValue)) : 'N/A'} | Leave: {move.leaveValue && !isNaN(parseFloat(move.leaveValue)) ? Math.round(parseFloat(move.leaveValue)) : 'N/A'}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Game ended message */}
        {gameEnded && (
          <Box className={styles.playerPanel} style={{ 
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
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

        {/* Settings panel */}
        {showSettingsPanel && (
          <Box className={styles.playerPanel} style={{ 
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <Box style={{ marginBottom: '12px' }}>
              <Box style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                Puzzle Challenge Mode
              </Box>
              <Box style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.8 }}>
                Choose when to pause for puzzle challenges
              </Box>
            </Box>
            
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Box 
                onClick={() => handlePuzzleModeChange('bingo')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: puzzleMode === 'bingo' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: puzzleMode === 'bingo' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '14px',
                  position: 'relative'
                }}
              >
                <Box style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  1
                </Box>
                <Box style={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>All Bingos</Box>
                <Box style={{ fontSize: '12px', opacity: 0.8, marginLeft: '40px' }}>Pause when a bingo is found</Box>
              </Box>
              <Box 
                onClick={() => handlePuzzleModeChange('only-bingo')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: puzzleMode === 'only-bingo' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: puzzleMode === 'only-bingo' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '14px',
                  position: 'relative'
                }}
              >
                <Box style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  2
                </Box>
                <Box style={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Only Bingo</Box>
                <Box style={{ fontSize: '12px', opacity: 0.8, marginLeft: '40px' }}>Pause when there's exactly 1 bingo available</Box>
              </Box>
              <Box 
                onClick={() => handlePuzzleModeChange('significant-best')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: puzzleMode === 'significant-best' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: puzzleMode === 'significant-best' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '14px',
                  position: 'relative'
                }}
              >
                <Box style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  3
                </Box>
                <Box style={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Significant Move</Box>
                <Box style={{ fontSize: '12px', opacity: 0.8, marginLeft: '40px' }}>Pause when the best move is 10+ equity better than next best move</Box>
              </Box>
              <Box 
                onClick={() => handlePuzzleModeChange('non-bingo-significant')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: puzzleMode === 'non-bingo-significant' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: puzzleMode === 'non-bingo-significant' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '14px',
                  position: 'relative'
                }}
              >
                <Box style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  4
                </Box>
                <Box style={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Significant Non-Bingo Move</Box>
                <Box style={{ fontSize: '12px', opacity: 0.8, marginLeft: '40px' }}>Pause when the best move is a non-bingo that is 10+ equity better than next best move</Box>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Keyboard event handling for puzzle mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPausedForBingo) {
        handlePuzzleKeyDown(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPausedForBingo, handlePuzzleKeyDown]);

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
              <Box style={{ 
                fontSize: '16px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                textAlign: 'center', 
                fontWeight: '600'
              }}>
                Solve puzzles on the spot as SidBot vs SidBot plays
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
                onBoardChildClick={isPausedForBingo ? handleBoardPositionSelect : undefined}
                onTileDrop={isPausedForBingo ? handleTileDrop : undefined}
                selectedPosition={isPausedForBingo ? selectedBoardPosition : null}
                arrowDirection={isPausedForBingo ? arrowDirection : 'right'}
              />   
            </Box>
          </Box>
          <Box className={styles.rightPanel}>
            {/* Player Info Panel */}
            <PuzzlePlayerInfo />
            
            {/* Player info and pool */}
            {/* <Box className={styles.playerPanel}>
              <Box className={styles.poolBox}>
                <PlayPool 
                  pool={pool} 
                  player1Rack={player1Rack} 
                  player2Rack={player2Rack}
                  gameStarted={gameStarted}
                />  
              </Box>
            </Box> */}
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
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={snackbarMessage === 'Loading dictionary.. (up to 30s)' ? null : 3000}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 