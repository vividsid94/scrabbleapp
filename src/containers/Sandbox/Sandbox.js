import React, { useEffect, useRef, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from '../Puzzle/Puzzle.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import PlayPool from "../../components/AppContent/Board/PlayPool.js";
import { formatTime } from '../../functions/play/timeUtils';
import { useSandboxStore } from '../../stores/sandboxStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
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
import PuzzlePlayerInfo from './PuzzlePlayerInfo.js';

export default function Sandbox() {
  // Refs (keep these local like Play.js)
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

  // Use selective store subscriptions to prevent unnecessary re-renders
  const boardCoords = useSandboxStore(state => state.boardCoords);
  const tempBoardCoords = useSandboxStore(state => state.tempBoardCoords);
  const player1points = useSandboxStore(state => state.player1points);
  const player2points = useSandboxStore(state => state.player2points);
  const player1Rack = useSandboxStore(state => state.player1Rack);
  const player2Rack = useSandboxStore(state => state.player2Rack);
  const player1Name = useSandboxStore(state => state.player1Name);
  const player2Name = useSandboxStore(state => state.player2Name);
  const currentPlayer = useSandboxStore(state => state.currentPlayer);
  const pool = useSandboxStore(state => state.pool);
  const gameStarted = useSandboxStore(state => state.gameStarted);
  const gameEnded = useSandboxStore(state => state.gameEnded);
  const isBotMode = useSandboxStore(state => state.isBotMode);
  const isBotThinking = useSandboxStore(state => state.isBotThinking);
  const player1Time = useSandboxStore(state => state.player1Time);
  const player2Time = useSandboxStore(state => state.player2Time);
  const timerActive = useSandboxStore(state => state.timerActive);
  const gameTime = useSandboxStore(state => state.gameTime);
  const moveHistory = useSandboxStore(state => state.moveHistory);
  const topMoves = useSandboxStore(state => state.topMoves);
  const isLoadingTopMoves = useSandboxStore(state => state.isLoadingTopMoves);
  const winner = useSandboxStore(state => state.winner);
  const theme = useSandboxStore(state => state.theme);
  const snackbarOpen = useSandboxStore(state => state.snackbarOpen);
  const snackbarMessage = useSandboxStore(state => state.snackbarMessage);
  const snackbarSeverity = useSandboxStore(state => state.snackbarSeverity);
  const showTimeSlider = useSandboxStore(state => state.showTimeSlider);
  const showConfetti = useSandboxStore(state => state.showConfetti);
  const showVictoryOverlay = useSandboxStore(state => state.showVictoryOverlay);
  const isPausedForBingo = useSandboxStore(state => state.isPausedForBingo);
  const bingoMove = useSandboxStore(state => state.bingoMove);
  const selectedTiles = useSandboxStore(state => state.selectedTiles);
  const selectedRackTiles = useSandboxStore(state => state.selectedRackTiles);
  const tilesToExchange = useSandboxStore(state => state.tilesToExchange);
  const selectedBoardPosition = useSandboxStore(state => state.selectedBoardPosition);
  const arrowDirection = useSandboxStore(state => state.arrowDirection);
  const puzzleMode = useSandboxStore(state => state.puzzleMode);
  const storedTopMoves = useSandboxStore(state => state.storedTopMoves);
  const isFastPlayMode = useSandboxStore(state => state.isFastPlayMode);
  const isExecutingFastPlay = useSandboxStore(state => state.isExecutingFastPlay);
  const fastPlayMoves = useSandboxStore(state => state.fastPlayMoves);
  const blankTiles = useSandboxStore(state => state.blankTiles);

  // Actions - only subscribe to what we need
  const {
    setSnackbarOpen,
    setIsPausedForBingo,
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
    makeBotMove,
    startBotGame,
    handleBotModeToggle,
    setSelectedTiles,
    setTilesToExchange,
    setSelectedBoardPosition,
    initializePuzzle,
    continueBingoMove,
    setLeaveValues,
    fetchLeaveValuesForTopMoves,
    setPuzzleMode,
    setIsFastPlayMode,
    makeFastBotMove,
    handleTileDrop,
    handlePuzzleTileClick,
    handleBoardPositionSelect,
    submitPuzzleGuess,
    clearPuzzlePlacement,
    handlePuzzleKeyDown,
  } = useSandboxStore();

  // Get global color scheme - subscribe to the current value
  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);

  // Add manual pause state
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  // Add settings panel state
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Add state to show all bingos
  const [showAllBingos, setShowAllBingos] = useState(false);
  
  // Add state for dynamic hourglass
  const [hourglassIndex, setHourglassIndex] = useState(0);

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
      
      // Don't auto-start the game - let user control it
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

  // Animate hourglass when game is running
  useEffect(() => {
    if (gameStarted && !isPausedForBingo && !gameEnded) {
      const interval = setInterval(() => {
        setHourglassIndex(prev => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [gameStarted, isPausedForBingo, gameEnded]);



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
  }, [tempBoardCoords, boardCoords, theme, color.current, boardColor.current, blankTiles, lastMoveCoordinates]);

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