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
    puzzleMode,
    setPuzzleMode,
    storedTopMoves,
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
        makeBotMove(botMoveSound, gameStartSound);
      } else {
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
    if (!isPausedForBingo) {
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
                {puzzleMode === 'bingo' ? '1' : '2'}
              </Box>
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
              <Box className={styles.playerName}>
                {currentName}
                {isBotThinking && (
                  <Box component="span" className={styles.thinkingEmoji}>
                    🤔
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
                    selectedTiles={tilesToExchange}
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
                {currentPlayer === 1 ? player1Name : player2Name} found a bingo!
              </Box>
              <Box style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.8 }}>
                {puzzleMode === 'only-bingo' 
                  ? 'There is only one. Can you find it?'
                  : 'Can you find the best one?'
                }
              </Box>
              <Box style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                    fontSize: 12, 
                    padding: '6px 12px', 
                    borderRadius: 0, 
                    cursor: 'pointer',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Syne, sans-serif'
                  }}
                >
                  Show Answer & Continue
                </button>
                {puzzleMode === 'bingo' && (
                  <Box style={{ position: 'relative' }}>
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
                        fontSize: 12, 
                        padding: '6px 12px', 
                        borderRadius: 0, 
                        cursor: 'pointer',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(5px)',
                        transition: 'all 0.3s ease',
                        fontFamily: 'Syne, sans-serif'
                      }}
                    >
                      {showAllBingos ? 'Hide All Bingos' : 'Show All Bingos'}
                    </button>
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
                  </Box>
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
                        {move.leave && (
                          <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '8px' }}>
                            Leave: {move.leave}
                          </span>
                        )}
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
                Too few tiles left.
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
                Bingo Challenge Mode
              </Box>
              <Box style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.8 }}>
                Choose when to pause for bingo challenges
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
                  fontSize: '14px'
                }}
              >
                <Box style={{ fontWeight: 'bold', marginBottom: '2px' }}>1) All Bingos</Box>
                <Box style={{ fontSize: '12px', opacity: 0.8 }}>Pause for every bingo found</Box>
              </Box>
              <Box 
                onClick={() => handlePuzzleModeChange('only-bingo')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: puzzleMode === 'only-bingo' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: puzzleMode === 'only-bingo' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '14px'
                }}
              >
                <Box style={{ fontWeight: 'bold', marginBottom: '2px' }}>2) Only Bingo</Box>
                <Box style={{ fontSize: '12px', opacity: 0.8 }}>Pause only when there's exactly 1 bingo available</Box>
              </Box>
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
    </Box>
  );
} 