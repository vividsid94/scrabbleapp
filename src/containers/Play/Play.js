import React, { useEffect, useRef, useMemo, useState, useContext } from "react";
import { Snackbar, Alert, Tooltip, Collapse, InputLabel, FormControlLabel, Checkbox, Box, Modal, Typography } from "@mui/material";
import TuneIcon from '@mui/icons-material/Tune';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Smiley, Robot, UserCircle, User, Gear, Lightbulb, DotsThree, Play as PlayIcon } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { loadActiveGameSnapshot } from '../../utils/activeGamePersistence';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import PlayPool from "../../components/AppContent/Board/PlayPool.js";
import GameModal from '../../components/Modals/GameModal';
import DefenseModal from '../../components/Modals/DefenseModal';
import MoveCoach from './components/MoveCoach';
import PlayerInfo from './components/PlayerInfo';
import Confetti from '../../components/Confetti/Confetti';
import ShakeableMascot from '../../components/AppContent/ShakeableMascot';
import { ThemeContext } from '../../App';
import { origPool, origBoard, letterLookup } from "../../components/AppContent/References/staticData.js";
import { createBoard } from "../../functions/boardFunctions.js";
import { handleTileClick } from '../../functions/play/tileFunctions';
import { handleBoardPositionSelect } from "../../functions/play/boardFunctions.js";
import { formatTime } from '../../functions/play/timeUtils';
import { initializeSounds, updateSoundType } from '../../functions/play/soundFunctions';
import { makeTheoYell } from '../../functions/play/theoYellFunctions';
import { initializeDictionary } from '../../utils/localDictionary';
import { useGameStore } from '../../stores/gameStore';
import { makeBotMove as runBotMove } from '../../functions/play/botFunctions';
import { buildGhostOverlayGrid } from '../../functions/analysisBoardFunctions';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import styles from './Play.module.css';
import MobileKeyboardOverlay from '../../components/MobileKeyboardOverlay';
import GameSetup from './components/GameSetup';

export default function Play({ isMultiplayer = false }) {
  const { lightMode } = useContext(ThemeContext);
  const location = useLocation();
  // Use Zustand Game Store
  const {
    // Board state
    boardCoords,
    tempBoardCoords,
    origBoardCoords,
    setBoardCoords,
    setTempBoardCoords,
    setOrigBoardCoords,
    
    // Player state
    player1points,
    player2points,
    player1Rack,
    player2Rack,
    player1Name,
    player2Name,
    currentPlayer,
    setPlayer1Rack,
    setPlayer2Rack,
    setPlayer1Name,
    setPlayer2Name,
    
    // Game state
    pool,
    gameStarted,
    setGameStarted,
    gameEnded,
    isBotMode,
    setGameEnded,
    
    // Tile and selection state
    selectedTiles: selectedTilesArray,
    selectedBoardPosition,
    arrowDirection,
    tilesToExchange,
    blankTiles,
    invalidWordCoords,
    setSelectedTiles,
    setSelectedBoardPosition,
    setArrowDirection,
    setTilesToExchange,
    
    // Bot state
    isBotThinking,
    isPlayerThinking,
    
    // Move status
    moveStatus,
    setMoveStatus,

    // Timer state
    player1Time,
    player2Time,
    timerActive,
    gameTime,
    setPlayer1Time,
    setPlayer2Time,
    setTimerActive,
    setGameTime,
    
    // Move history
    moveHistory,
    topMoves,
    isLoadingTopMoves,
    setMoveHistory,
    setTopMoves,
    
    // Dictionary loading
    isDictionaryLoading,
    
    
    // Victory state
    winner,
    
    // Live single-tile score preview
    previewScore,
    previewScorePosition,
    setLeaveValues,

    // UI state
    theme,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showTimeSlider,
    showConfetti,
    showVictoryOverlay,
    setSnackbarOpen,
    setShowTimeSlider,
    
    // Settings state
    playerMoveSoundType,
    botMoveSoundType,
    
    // New store actions
    initializeGame,
    restoreActiveGame,
    handleNewGame,
    startTimer,
    handleMoveSelectClick,
    handleConfettiComplete,

    // UI handler functions
    handleSettingsOpen,
    handleWordSubmitClick,
    handlePassClick,
    handleExchangeClick,
    handlePlayTopMoveClick,
    handleBotModeToggle,
    handleGetTopMovesForExpandable,
    
    // Utility functions
    limitMoveHistory,
    updatePreviewScore,
    fetchLeaveValuesForTopMoves,
    checkDictionary,
    
    // Keyboard event handlers
    handleKeyDownWrapper,
    handleKeyPressWrapper,
    
    // Time slider handler
    handleTimeSliderMouseDown,
    
    // Bot move handler
    makeBotMove,
    selectedBot,
    setSelectedBot,

    // Defense modal
    showDefenseModal,
    defenseMove,
    defenseResults,
    isDefenseLoading,
    updateDefenseResults,
    setShowDefenseModal,
    setDefenseMove,


    // Analysis Mode (board-based)
    analysis,
    enterAnalysisMode,
    exitAnalysisMode,
    setAnalysisState,
    runAnalysisMovePreview,
    runAnalysisHeatMap,
    runAnalysisOpponentResponses,
    
    // Move Coach
    showMoveCoach,
    moveCoachData,
    setShowMoveCoach,

    // Theo Yell
    theoYellEnabled,
    shouldTheoYell,
    setShouldTheoYell,
    theoYellIsBingoMiss,
    theoYellPhrase,
    setTheoYellPhrase,

    // Premium squares
    premiumSquares,
    setPremiumSquares,
    generateRandomPremiumSquares,

    // Game mode features
    randomizeBonusSquares,
    customBonusSquareDistribution,
    setCustomBonusSquareDistribution,
    twoTurnsPerPlayer,
    variablePool,
    setCustomPool,
    
    // Turn tracking
    playerTurnCount,
    switchToNextPlayer,

    // Multiplayer state
    isMultiplayerMode,
    multiplayerGameCode,
    localPlayerNumber,
    opponentRackCount,
    poolCount,
    isWaitingForOpponent,
    multiplayerConnectionStatus,
    isMyTurn,

    // Multiplayer handlers (set by MultiplayerGame wrapper)
    handleWordSubmitMultiplayer,
    handlePassMultiplayer,
    handleExchangeMultiplayer,
  } = useGameStore();

  // Dedicated selectors so Tope thinking updates always trigger a re-render
  const topeThinking = useGameStore(state => state.topeThinking);
  const setSnackbarMessage = useGameStore(state => state.setSnackbarMessage);
  const setSnackbarSeverity = useGameStore(state => state.setSnackbarSeverity);

  // Get global color scheme - subscribe to the current value
  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);


  // Refs (keep these local)
  const complementaryColor = useRef('#9F7A83');
  const timerRef = useRef(null);
  const botMoveMadeRef = useRef(false);
  const mascotRef = useRef();
  const theoYellMascotRef = useRef(); // Separate ref for Theo Yell mascot
  const [isMobile, setIsMobile] = useState(false);
  const [poolExpanded, setPoolExpanded] = useState(false);
  const [playNotes, setPlayNotes] = useState('');
  const [telestratorEnabled, setTelestratorEnabled] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  // Detect mobile viewport so we can reliably trigger the soft keyboard
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper to simulate keyboard input from a mobile on-screen keyboard
  const triggerKeyFromOverlay = (key) => {
    const event = {
      key,
      altKey: false,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      preventDefault: () => {}
    };
    handleKeyDownWrapper(event, playerMoveSound, origBoard);
  };
  // Bot icon mapping for the top panel
  const getBotIcon = (botName) => {
    switch (botName) {
      case 'Theo':
        return <img src="/images/theomascot.png" alt="Theo" width={20} height={20} />;
      case 'Tess':
        return <img src="/images/tessmascot.png" alt="Tess" width={20} height={20} />;
      case 'Tope':
        return <img src="/images/topemascot.png" alt="Tope" width={20} height={20} />;
      case 'Novice':
        return <Smiley size={20} color="#60A5FA" />;
      case 'Beginner':
        return <UserCircle size={20} color="#8B7355" />;
      case 'Intermediate':
        return <Robot size={20} color="#3D5A80" />;
      case 'Custom':
        return <Robot size={20} color="#9CA3AF" />;
      case 'Defense Bot':
        return <Robot size={20} color="#3D5A80" />;
      default:
        return <Robot size={20} color="#9CA3AF" />;
    }
  };
  // Initialize sounds (simplified) - only once
  const [sounds, setSounds] = useState(null);
  
  useEffect(() => {
    const soundObjects = initializeSounds() || {};
    setSounds(soundObjects);
  }, []);

  // Initialize local dictionary in background (non-blocking)
  useEffect(() => {
    initializeDictionary().catch(err => {
      console.warn('Dictionary initialization failed (will use API fallback):', err);
    });
  }, []);

  const { gameStartSound, playerMoveSound, botMoveSound } = sounds || {};

  // Set once we've restored a snapshot, so the board-initialization effect
  // below (which also runs whenever premiumSquares changes) knows to skip
  // the very next pass instead of wiping the just-restored board back to
  // blank.
  const restoredFromSnapshotRef = useRef(false);

  // Initialize game using store action - unless we arrived via the
  // homepage's "Continue" button, in which case restore the saved
  // single-player snapshot instead of resetting to a blank board.
  useEffect(() => {
    if (!sounds) return;
    const wantsContinue = new URLSearchParams(location.search).get('continue') === '1';
    if (wantsContinue) {
      const snapshot = loadActiveGameSnapshot();
      if (snapshot) {
        restoredFromSnapshotRef.current = true;
        restoreActiveGame(snapshot);
        return;
      }
    }
    // Arriving here any other way (e.g. the homepage's Classic/3D Play
    // buttons) should always land on the setup screen, even if the in-memory
    // store still has gameStarted from a game left in progress elsewhere —
    // only the "Resume last game" flow (continue=1) should drop back in.
    setGameStarted(false);
    initializeGame(origBoard, origPool, gameStartSound, botMoveSound);
  }, [sounds]);

  useEffect(() => {
    // Don't reset board in multiplayer mode - it's managed by syncGameState
    if (isMultiplayerMode) {
      return;
    }
    // Skip entirely when arriving via "Resume last game" - the effect above
    // owns board setup for that flow (restoring the snapshot, or falling
    // back to initializeGame if none is found). This runs on every fresh
    // mount regardless of what actually changed, so without this check it
    // would blank the board an instant before the restore reads it back -
    // and briefly having isBotMode/gameStarted true with a blank board is
    // enough for the snapshot subscriber below to persist that blank board,
    // corrupting the very save Resume depends on.
    const wantsContinue = new URLSearchParams(location.search).get('continue') === '1';
    if (wantsContinue) {
      return;
    }
    // Also skip the one pass immediately after a restore actually completes -
    // restoring sets premiumSquares too, which would otherwise re-trigger
    // this effect and wipe the tiles we just put back on the board.
    if (restoredFromSnapshotRef.current) {
      restoredFromSnapshotRef.current = false;
      return;
    }

    // Initialize board - if premiumSquares are set, use empty board (all zeros)
    // Otherwise use the standard board layout
    let parsedOrigBoardCoords;
    if (premiumSquares && premiumSquares.length > 0) {
      // Start with empty board (all zeros) when using randomized premium squares
      // The premiumSquares array will define where bonus squares are for rendering/scoring
      parsedOrigBoardCoords = Array(15).fill(null).map(() => Array(15).fill(0));
    } else {
      // Use standard board layout
      parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    }
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    
    // Check dictionary loading state on mount
    checkDictionary();
  }, [premiumSquares, isMultiplayerMode]);

  // Handle randomizeBonusSquares changes - generate premiumSquares when enabled
  useEffect(() => {
    if (randomizeBonusSquares) {
      const randomSquares = generateRandomPremiumSquares();
      setPremiumSquares(randomSquares);
    } else {
      // Clear premiumSquares when disabled
      setPremiumSquares(null);
    }
  }, [randomizeBonusSquares, customBonusSquareDistribution, generateRandomPremiumSquares, setPremiumSquares]);

  // Reset customBonusSquareDistribution when randomizeBonusSquares is disabled
  useEffect(() => {
    if (!randomizeBonusSquares) {
      setCustomBonusSquareDistribution(null);
    }
  }, [randomizeBonusSquares, setCustomBonusSquareDistribution]);

  // Reset turn count when twoTurnsPerPlayer changes
  useEffect(() => {
    const { setPlayerTurnCount } = useGameStore.getState();
    setPlayerTurnCount(1);
  }, [twoTurnsPerPlayer]);

  // Reset customPool when variablePool is disabled
  useEffect(() => {
    if (!variablePool) {
      setCustomPool(null);
    }
  }, [variablePool, setCustomPool]);

  // Update useEffect to handle keyboard events
  useEffect(() => {
    console.log('🎹 Adding keyboard event listener');
    const handleKeyDownWrapperWithParams = (e) => {
      // Key "2" opens exchange modal instead of triggering store exchange (which would show snackbar)
      if (e.key === '2' && gameStarted && !gameEnded && currentPlayer === 1 && !isBotThinking && !isPlayerThinking) {
        const target = e.target && e.target.closest ? e.target.closest('input, textarea, [contenteditable="true"]') : null;
        if (!target) {
          e.preventDefault();
          handleExchangeModalOpen();
          return;
        }
      }
      handleKeyDownWrapper(e, playerMoveSound, origBoard);
    };

    window.addEventListener('keydown', handleKeyDownWrapperWithParams);
    return () => {
      console.log('🎹 Removing keyboard event listener');
      window.removeEventListener('keydown', handleKeyDownWrapperWithParams);
    };
  }, [handleKeyDownWrapper, playerMoveSound, origBoard, gameStarted, gameEnded, currentPlayer, isBotThinking, isPlayerThinking]);

  // Handle keyboard shortcuts - integrated into handleKeyDownWrapper
  // Removed duplicate keydown listener to prevent double-press issues

  // Bot turns — call botFunctions directly (not via store dynamic import, which cached stale code)
  useEffect(() => {
    if (isBotMode && currentPlayer === 2 && !isBotThinking && !gameEnded && !botMoveMadeRef.current && !analysis.active) {
      botMoveMadeRef.current = true;
      runBotMove(botMoveSound);
    }
  }, [currentPlayer, isBotMode, isBotThinking, gameEnded, gameStarted, botMoveSound, analysis.active]);

  // Reset bot move flag when player changes to 1
  useEffect(() => {
    if (currentPlayer === 1) {
      botMoveMadeRef.current = false;
    }
  }, [currentPlayer]);

  // Reset bot move flag when game starts (for new games)
  useEffect(() => {
    if (gameStarted) {
      botMoveMadeRef.current = false;
    }
  }, [gameStarted, isBotMode, currentPlayer]);

  // Reset bot move flag when bot mode is enabled
  useEffect(() => {
    if (isBotMode) {
      botMoveMadeRef.current = false;
    }
  }, [isBotMode]);

  // Analysis Mode toggle - only usable in single-player bot mode (enforced
  // again in the store itself, this is just the UI-level guard)
  const handleToggleAnalysisMode = () => {
    if (isBotThinking || isPlayerThinking) return;
    if (analysis.active) {
      exitAnalysisMode();
    } else {
      enterAnalysisMode();
    }
  };

  // Show modal when toggling bot mode on
  const handleBotModeToggleWithSounds = () => {
    if (!isBotMode) {
      // Turning bot mode on mid-game re-shows the (already-started) game view,
      // not the setup screen, so there's nothing further to do here today.
    } else {
      handleBotModeToggle(gameStartSound, botMoveSound);
    }
  };

  // Multiplayer-aware action handlers
  const handleWordSubmitWithMultiplayer = (sound) => {
    // Get the handler dynamically from the store each time (in case it was set after render)
    const currentState = useGameStore.getState();
    const multiplayerHandler = currentState.handleWordSubmitMultiplayer;
    
    console.log('🎮 handleWordSubmitWithMultiplayer called:', {
      isMultiplayerMode,
      hasHandleWordSubmitMultiplayer: !!multiplayerHandler,
      willUseMultiplayer: isMultiplayerMode && multiplayerHandler
    });
    
    if (isMultiplayerMode && multiplayerHandler) {
      console.log('✅ Using multiplayer handler');
      multiplayerHandler(sound);
    } else {
      console.log('⚠️ Using regular handler (not multiplayer)');
      handleWordSubmitClick(sound);
    }
  };

  const handlePassWithMultiplayer = () => {
    const currentState = useGameStore.getState();
    const multiplayerHandler = currentState.handlePassMultiplayer;
    
    if (isMultiplayerMode && multiplayerHandler) {
      multiplayerHandler();
    } else {
      handlePassClick();
    }
  };

  const handleExchangeWithMultiplayer = () => {
    const currentState = useGameStore.getState();
    const multiplayerHandler = currentState.handleExchangeMultiplayer;
    
    if (isMultiplayerMode && multiplayerHandler) {
      multiplayerHandler();
    } else {
      handleExchangeClick();
    }
  };

  const handleExchangeModalOpen = () => {
    setTilesToExchange([]);
    setShowExchangeModal(true);
  };

  const handleExchangeTileToggle = (letter, index) => {
    const idx = tilesToExchange.findIndex((t) => t.tile === letter && t.index === index);
    if (idx === -1) {
      setTilesToExchange([...tilesToExchange, { tile: letter, index }]);
    } else {
      setTilesToExchange(tilesToExchange.filter((_, i) => i !== idx));
    }
  };

  const handleExchangeModalCancel = () => {
    setTilesToExchange([]);
    setShowExchangeModal(false);
  };

  const handleExchangeModalConfirm = () => {
    if (tilesToExchange.length > 0 && pool.length >= 7) {
      handleExchangeWithMultiplayer();
      setShowExchangeModal(false);
    }
  };

  // When a bot is selected, show time controls slideout
  const handleBotSelect = (bot) => {
    setSelectedBot(bot);
    setPlayer2Name(bot.name);
  };

  // Start the game after time controls are set
  const handleStartGame = () => {
    handleBotModeToggle(gameStartSound, botMoveSound);
  };

  // Update sound types when they change in settings
  useEffect(() => {
    if (playerMoveSound && playerMoveSoundType) {
      const playerMoveSoundRef = { current: playerMoveSound };
      updateSoundType(playerMoveSoundRef, playerMoveSoundType, 'player');
      // Update the local sound object
      Object.assign(playerMoveSound, playerMoveSoundRef.current);
    }
  }, [playerMoveSoundType]);

  useEffect(() => {
    if (botMoveSound && botMoveSoundType) {
      const botMoveSoundRef = { current: botMoveSound };
      updateSoundType(botMoveSoundRef, botMoveSoundType, 'bot');
      // Update the local sound object
      Object.assign(botMoveSound, botMoveSoundRef.current);
    }
  }, [botMoveSoundType]);

  // Update player names when bot mode changes (single-player only)
  // In multiplayer, names come from the server and should NOT be overridden
  useEffect(() => {
    if (isMultiplayerMode) return;
    setPlayer1Name(isBotMode ? 'You' : 'Player 1');
    setPlayer2Name(isBotMode ? (selectedBot?.name || 'Theo') : 'Player 2');
  }, [isBotMode, isMultiplayerMode, selectedBot]);

  // Start timer when game starts or player changes
  useEffect(() => {
    if (gameStarted) {
      setTimerActive(true);
    }
  }, [currentPlayer, gameStarted]);

  // Start timer when it's a player's turn - paused entirely while Analysis
  // Mode is active (no interval is started, so nothing needs to be
  // snapshotted/restored; re-running this effect on exit resumes normally).
  useEffect(() => {
    if (analysis.active) return;
    return startTimer(timerRef);
  }, [timerActive, currentPlayer, gameStarted, analysis.active]);

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
          // If there's a tile on the committed board, use that
          if (typeof boardCoords[rowIndex][colIndex] === 'string') {
            return boardCoords[rowIndex][colIndex];
          }
          // Otherwise, use origBoardCoords to show premium squares (for empty cells)
          if (origBoardCoords && origBoardCoords[rowIndex] && origBoardCoords[rowIndex][colIndex] !== undefined) {
            return origBoardCoords[rowIndex][colIndex];
          }
          // Fallback to 0
          return 0;
        })
      ),
      [], 
      "PROTILES", 
      theme, 
      color.current, 
      complementaryColor.current, 
      blankTiles,
      lastMoveCoordinates,
      lightMode,
      invalidWordCoords,
      premiumSquares
    );
  }, [tempBoardCoords, boardCoords, origBoardCoords, theme, color.current, boardColor.current, blankTiles, lastMoveCoordinates, lightMode, invalidWordCoords, premiumSquares]);

  // Ghost-tile overlay for Analysis Mode's move preview - built from the
  // current step's simulated frame, never from real board state, so it can
  // never leak into boardCoords/tempBoardCoords or the active-game snapshot.
  // Gated on the "preview" layer specifically so switching to another layer
  // doesn't leave stale ghost tiles showing alongside its overlay.
  const analysisGhostGrid = useMemo(() => {
    if (!analysis.active || analysis.layer !== 'preview' || !analysis.frames || analysis.frames.length === 0) {
      return null;
    }
    return buildGhostOverlayGrid(analysis.frames[analysis.stepIndex], boardCoords);
  }, [analysis.active, analysis.layer, analysis.frames, analysis.stepIndex, boardCoords]);

  // Heat-map tint overlay for Analysis Mode - same gating rule as the ghost
  // grid above, keyed to the "heatmap" layer.
  const analysisHeatGrid = useMemo(() => {
    if (!analysis.active || analysis.layer !== 'heatmap' || !analysis.heatMap) {
      return null;
    }
    return analysis.heatMap.grid;
  }, [analysis.active, analysis.layer, analysis.heatMap]);

  // Update player time states when gameTime changes
  useEffect(() => {
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
  }, [gameTime]);


  // Add cleanup effect for all temporary states
  useEffect(() => {
    return () => {
      // Clear all state
      // NOTE: deliberately NOT clearing boardCoords/tempBoardCoords/
      // origBoardCoords/moveHistory here. Those are watched by the
      // "active game" snapshot subscriber in gameStore.js - blanking them
      // on unmount (while isBotMode/gameStarted are still true, since
      // nothing resets those on the way out) was overwriting the saved
      // snapshot with a blank board every time this page was left, which
      // is what "Resume last game" reads from. They're already freshly
      // reset on the next arrival anyway (via initializeGame or
      // restoreActiveGame), so nothing needs to happen here.
      setTopMoves([]);
      setLeaveValues({}); // Clear leave values cache
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      setArrowDirection('right');
      setGameEnded(false); // Reset game ended state
    };
  }, []);

  // Modify the existing code that sets topMoves to also fetch leave values
  useEffect(() => {
    fetchLeaveValuesForTopMoves();
  }, [topMoves]);

  // Add effect to limit move history size more aggressively
  useEffect(() => {
    limitMoveHistory();
  }, [moveHistory]);

  // Add effect to calculate preview score when tiles are placed
  useEffect(() => {
    updatePreviewScore();
  }, [selectedTilesArray, tempBoardCoords]);

  useEffect(() => {
    if (
      snackbarSeverity === 'error' &&
      snackbarMessage &&
      (snackbarMessage.toLowerCase().includes('not valid') || snackbarMessage.toLowerCase().includes('invalid word'))
    ) {
      mascotRef.current?.shake();
      setMoveStatus(null); // Clear move status on error
    }
  }, [snackbarMessage, snackbarSeverity, setMoveStatus]);

  // State for dramatic effects
  const [isTheoYelling, setIsTheoYelling] = useState(false);

  // Trigger Theo yell when shouldTheoYell is set to true
  useEffect(() => {
    if (shouldTheoYell && theoYellEnabled) {
      console.log('🔊 Theo is about to yell!', { shouldTheoYell, theoYellEnabled, mascotRef: !!theoYellMascotRef.current, isBingoMiss: theoYellIsBingoMiss });
      
      // Trigger dramatic effects
      setIsTheoYelling(true);
      
      // Small delay to ensure mascot is rendered
      setTimeout(() => {
        const phrase = makeTheoYell(theoYellMascotRef, theoYellIsBingoMiss);
        if (phrase) {
          setTheoYellPhrase(phrase);
        }
      }, 100);
      
      // Reset effects after animation completes
      setTimeout(() => {
        setIsTheoYelling(false);
        setTheoYellPhrase('');
      }, 2000); // Match the duration of effects
      
      setShouldTheoYell(false); // Reset the flag
    }
  }, [shouldTheoYell, theoYellEnabled, theoYellIsBingoMiss, setShouldTheoYell, setTheoYellPhrase]);

  return (
    <Box className={styles.container}>
      {/* Dramatic Red Background Overlay with multiple layers */}
      {isTheoYelling && (
        <>
          {/* Main red flash overlay */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(239, 68, 68, 0.5)',
              zIndex: 1400,
              pointerEvents: 'none',
              animation: 'redFlash 2s ease-out',
              '@keyframes redFlash': {
                '0%': { 
                  backgroundColor: 'rgba(239, 68, 68, 0)',
                  backdropFilter: 'blur(0px)',
                  opacity: 0
                },
                '10%': { 
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  backdropFilter: 'blur(3px)',
                  opacity: 1
                },
                '25%': { 
                  backgroundColor: 'rgba(239, 68, 68, 0.7)',
                  backdropFilter: 'blur(2px)',
                  opacity: 1
                },
                '40%': { 
                  backgroundColor: 'rgba(239, 68, 68, 0.5)',
                  backdropFilter: 'blur(1px)',
                  opacity: 0.8
                },
                '60%': { 
                  backgroundColor: 'rgba(239, 68, 68, 0.3)',
                  backdropFilter: 'blur(0.5px)',
                  opacity: 0.6
                },
                '80%': { 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  backdropFilter: 'blur(0px)',
                  opacity: 0.3
                },
                '100%': { 
                  backgroundColor: 'rgba(239, 68, 68, 0)',
                  backdropFilter: 'blur(0px)',
                  opacity: 0
                }
              }
            }}
          />
          {/* Pulsing red ring effect - multiple rings */}
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: '4px solid rgba(239, 68, 68, 0.6)',
                zIndex: 1401,
                pointerEvents: 'none',
                animation: `redPulse 2s ease-out ${i * 0.2}s`,
                '@keyframes redPulse': {
                  '0%': { 
                    transform: 'translate(-50%, -50%) scale(0.5)',
                    opacity: 1,
                    borderWidth: '8px',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
                  },
                  '50%': { 
                    transform: 'translate(-50%, -50%) scale(3)',
                    opacity: 0.5,
                    borderWidth: '2px',
                    boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
                  },
                  '100%': { 
                    transform: 'translate(-50%, -50%) scale(5)',
                    opacity: 0,
                    borderWidth: '1px',
                    boxShadow: '0 0 60px rgba(239, 68, 68, 0)'
                  }
                }
              }}
            />
          ))}
          
          {/* Screen flash effect */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
              zIndex: 1402,
              pointerEvents: 'none',
              animation: 'screenFlash 2s ease-out',
              '@keyframes screenFlash': {
                '0%': { opacity: 0 },
                '5%': { opacity: 1 },
                '15%': { opacity: 0.8 },
                '30%': { opacity: 0.4 },
                '50%': { opacity: 0.2 },
                '100%': { opacity: 0 }
              }
            }}
          />
        </>
      )}
      
      <Sidenav/>
      <Box 
        className={styles.page}
        sx={isTheoYelling ? {
          animation: 'boardShake 2s ease-out',
          '@keyframes boardShake': {
            '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
            '2%': { transform: 'translate(-15px, -8px) rotate(-2deg) scale(1.02)' },
            '4%': { transform: 'translate(15px, 8px) rotate(2deg) scale(0.98)' },
            '6%': { transform: 'translate(-12px, -6px) rotate(-1.5deg) scale(1.01)' },
            '8%': { transform: 'translate(12px, 6px) rotate(1.5deg) scale(0.99)' },
            '10%': { transform: 'translate(-10px, -5px) rotate(-1deg) scale(1.01)' },
            '12%': { transform: 'translate(10px, 5px) rotate(1deg) scale(0.99)' },
            '14%': { transform: 'translate(-8px, -4px) rotate(-0.8deg) scale(1)' },
            '16%': { transform: 'translate(8px, 4px) rotate(0.8deg) scale(1)' },
            '18%': { transform: 'translate(-6px, -3px) rotate(-0.5deg) scale(1)' },
            '20%': { transform: 'translate(6px, 3px) rotate(0.5deg) scale(1)' },
            '22%': { transform: 'translate(-4px, -2px) rotate(-0.3deg) scale(1)' },
            '24%': { transform: 'translate(4px, 2px) rotate(0.3deg) scale(1)' },
            '26%': { transform: 'translate(-3px, -1px) rotate(-0.2deg) scale(1)' },
            '28%': { transform: 'translate(3px, 1px) rotate(0.2deg) scale(1)' },
            '30%': { transform: 'translate(-2px, -1px) rotate(-0.1deg) scale(1)' },
            '32%': { transform: 'translate(2px, 1px) rotate(0.1deg) scale(1)' },
            '34%': { transform: 'translate(-1px, 0) rotate(0deg) scale(1)' },
            '36%': { transform: 'translate(1px, 0) rotate(0deg) scale(1)' },
            '38%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' }
          }
        } : {}}
      >
        <Box className={styles.mainPanel} sx={{
          gridTemplateColumns: gameStarted ? '1fr 380px' : '1fr',
          gridTemplateAreas: gameStarted ? '"title ." "board panel"' : '"title" "board"'
        }}>

          <Box className={styles.leftContainer}>
            <Box 
              className={`${styles.mainBox} ${styles.mainBoxContent}`} 
              component="main"
              sx={isTheoYelling ? {
                animation: 'boardShakeIntense 2s ease-out',
                '@keyframes boardShakeIntense': {
                  '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
                  '2%': { transform: 'translate(-20px, -10px) rotate(-3deg)' },
                  '4%': { transform: 'translate(20px, 10px) rotate(3deg)' },
                  '6%': { transform: 'translate(-18px, -8px) rotate(-2.5deg)' },
                  '8%': { transform: 'translate(18px, 8px) rotate(2.5deg)' },
                  '10%': { transform: 'translate(-15px, -6px) rotate(-2deg)' },
                  '12%': { transform: 'translate(15px, 6px) rotate(2deg)' },
                  '14%': { transform: 'translate(-12px, -5px) rotate(-1.5deg)' },
                  '16%': { transform: 'translate(12px, 5px) rotate(1.5deg)' },
                  '18%': { transform: 'translate(-10px, -4px) rotate(-1deg)' },
                  '20%': { transform: 'translate(10px, 4px) rotate(1deg)' },
                  '22%': { transform: 'translate(-8px, -3px) rotate(-0.8deg)' },
                  '24%': { transform: 'translate(8px, 3px) rotate(0.8deg)' },
                  '26%': { transform: 'translate(-6px, -2px) rotate(-0.5deg)' },
                  '28%': { transform: 'translate(6px, 2px) rotate(0.5deg)' },
                  '30%': { transform: 'translate(-4px, -1px) rotate(-0.3deg)' },
                  '32%': { transform: 'translate(4px, 1px) rotate(0.3deg)' },
                  '34%': { transform: 'translate(-2px, 0) rotate(-0.1deg)' },
                  '36%': { transform: 'translate(2px, 0) rotate(0.1deg)' },
                  '38%, 100%': { transform: 'translate(0, 0) rotate(0deg)' }
                }
              } : {}}
            >
          {gameStarted ? (
          <Board 
            board={board}
            boardMode={theme}
            lightMode={lightMode}
            showNoCommentaryLabel={false}
            onBoardChildClick={(row, col) => {
              // Nothing gets pressed/committed while analyzing
              if (analysis.active) return;
              // Run the existing selection logic (only works on non-occupied cells)
              handleBoardPositionSelect({
                row,
                col,
                boardCoords,
                selectedBoardPosition,
                setSelectedBoardPosition,
                arrowDirection,
                setArrowDirection
              });
            }}
            onTileClick={(tile, index) => {
              if (analysis.active) return;
              handleTileClick({
                tile,
                index,
                currentPlayer,
                player1Rack,
                player2Rack,
                selectedTilesArray,
                setSelectedTiles,
                tilesToExchange,
                setTilesToExchange,
                exchangeModeActive: false
              });
            }}
            selectedPosition={analysis.active ? null : selectedBoardPosition}
            arrowDirection={arrowDirection}
            onArrowDirectionChange={(newDirection) => {
                console.log('Play component received direction change:', newDirection);
                setArrowDirection(newDirection);
            }}
            animate={false}
            enableTelestrator={telestratorEnabled}
            analysisGhostGrid={analysisGhostGrid}
            analysisHeatGrid={analysisHeatGrid}
            analysisHeatMaxSimulations={analysis.heatMap?.maxSimulations}
            showSlip={false}
            showDictionary={false}
            dictionary=""
            previewScore={previewScore}
            previewScorePosition={previewScorePosition}
            lastMoveCoordinates={lastMoveCoordinates}
          />
          ) : (
          <GameSetup onSelectBot={handleBotSelect} onStartGame={handleStartGame} />
          )}
          </Box>
        </Box>

        <Box className={styles.rightPanel} sx={{ display: gameStarted ? 'flex' : 'none' }}>
          <PlayerInfo
            player1Name={player1Name}
                          player2Name={isBotMode ? (selectedBot.name === 'Defense Bot' ? `Defense Bot (${selectedBot.defenseWeight}x)` : selectedBot.name) : player2Name}
            player1Points={player1points}
            player2Points={player2points}
              player1Time={formatTime(player1Time || 0)}
              player2Time={formatTime(player2Time || 0)}
            currentPlayer={currentPlayer}
            player1Rack={player1Rack}
            player2Rack={player2Rack}
            color={color}
            onTileClick={(tile, index) => handleTileClick({
              tile,
              index,
              currentPlayer,
              player1Rack,
              player2Rack,
              selectedTilesArray,
              setSelectedTiles,
              tilesToExchange,
              setTilesToExchange,
              exchangeModeActive: false
            })}
            selectedTiles={selectedTilesArray}
            isBotMode={isBotMode}
            isMultiplayerMode={isMultiplayerMode}
            localPlayerNumber={localPlayerNumber}
            opponentRackCount={opponentRackCount}
            gameStarted={gameStarted}
            isDictionaryLoading={isDictionaryLoading}
            isLoadingTopMoves={isLoadingTopMoves}
            onSettingsOpen={handleSettingsOpen}
            onBotModeToggle={isMultiplayerMode ? null : handleBotModeToggleWithSounds}
            onGetTopMoves={handleGetTopMovesForExpandable}
            onWordSubmit={handleWordSubmitWithMultiplayer}
            onPass={handlePassWithMultiplayer}
            onExchangeClick={handleExchangeModalOpen}
            onPlayTopMove={handlePlayTopMoveClick}
            selectedBoardPosition={selectedBoardPosition}
            tilesToExchange={tilesToExchange}
            isBotThinking={isBotThinking}
            isPlayerThinking={isPlayerThinking}
            latestMove={latestMove}
            moveHistory={moveHistory}
            topMoves={topMoves}
            onMoveSelect={handleMoveSelectClick}
            boardCoords={boardCoords}
            blankTiles={blankTiles}
            pool={pool}
            icons={{
              settings: <Gear size={20} color={lightMode === 'dark' ? "white" : "#1F2937"} />,
              time: null,
              botMode: <SmartToyIcon 
                  className={`${styles.botIcon} ${isBotMode ? styles.active : ''} ${isBotMode && currentPlayer === 2 ? styles.thinking : ''}`}
                  sx={{
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
              />,
              topMoves: <Lightbulb size={20} color={lightMode === 'dark' ? "white" : "#1F2937"} />,
              vs: gameStarted ? (
                <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={20} color={lightMode === 'dark' ? "white" : "#1F2937"} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: lightMode === 'dark' ? "white" : "#1F2937" }}>vs</span>
                  {isBotMode ? getBotIcon(selectedBot.name) : <img src="/images/player.png" alt="Opponent" width={20} height={20} />}
                </Box>
              ) : null,
            }}
            lightMode={lightMode}
            mascotRef={mascotRef}
            botImage={isBotMode ? getBotIcon(selectedBot.name) : undefined}
            moveStatus={moveStatus}
            telestratorEnabled={telestratorEnabled}
            onToggleTelestrator={setTelestratorEnabled}
            topeThinking={topeThinking}
            analysisModeActive={analysis.active}
            canUseAnalysisMode={isBotMode && !isMultiplayerMode}
            onToggleAnalysisMode={handleToggleAnalysisMode}
            analysisState={analysis}
            onAnalysisSelectMove={runAnalysisMovePreview}
            onAnalysisSetSelectedMove={(move) => setAnalysisState({ selectedMove: move, frames: [], stepIndex: 0, heatMap: null, error: null })}
            onAnalysisSetLayer={(layer) => setAnalysisState({ layer })}
            onAnalysisStep={(stepIndex) => setAnalysisState({ stepIndex })}
            onAnalysisRunHeatMap={runAnalysisHeatMap}
            onAnalysisRunOpponentResponses={runAnalysisOpponentResponses}
          />

          {showTimeSlider && !gameStarted && (
              <Box 
                className={styles.timeSliderContainer}
                style={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  border: lightMode === 'light' ? '1px solid #D1D5DB' : 'none'
                }}
              >
                <Box 
                  className={styles.timeSliderLabel}
                  style={{
                    color: lightMode === 'dark' ? '#6B7280' : '#4B5563'
                  }}
                >
                Game Time: {gameTime} min
              </Box>
                <Box className={styles.timeSliderWrapper}>
                  {[5, 15, 25, 30].map((value) => (
                    <Box
                      key={value}
                      className={styles.timeSliderMark}
                  style={{
                        left: `${((value - 5) / 25) * 100}%`,
                        backgroundColor: lightMode === 'dark' ? '#bfbfbf' : '#9ca3af'
                      }}
                    />
                  ))}
                  <Box
                    className={styles.timeSliderThumb}
                    style={{
                      left: `${((gameTime - 5) / 25) * 100}%`,
                      backgroundColor: lightMode === 'dark' ? '#4CAF50' : '#059669'
                    }}
                      onMouseDown={(e) => handleTimeSliderMouseDown(e, setGameTime)}
                  />
              </Box>
            </Box>
          )}

          <Box className={styles.playerPanel}>
            {/* Collapsible Pool Section */}
            <Box 
              className={styles.poolBox} 
              sx={{
                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                background: lightMode === 'dark'
                  ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
                  : '#FFFFFF',
                border: lightMode === 'dark' ? 'none' : '1px solid rgba(140, 130, 110, 0.28)',
                padding: '10px',
                      cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '8px',
                boxShadow: lightMode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 3px 10px rgba(100, 95, 80, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 5px 14px rgba(100, 95, 80, 0.2)'
                },
                marginBottom: poolExpanded ? '8px' : '0'
                    }}
              onClick={() => setPoolExpanded(!poolExpanded)}
                  >
              {/* Pool Header */}
              <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: poolExpanded ? '8px' : '0'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {gameStarted ? (
                    <span>
                      {pool.length + player2Rack.length}
                    </span>
                  ) : (
                    <span>Pool</span>
                  )}
                </Box>
                <Box sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4B5563', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  {poolExpanded ? <ExpandLessIcon style={{ fontSize: 18 }} /> : <ExpandMoreIcon style={{ fontSize: 18 }} />}
                </Box>
              </Box>
              
              {/* Pool Content */}
              {poolExpanded && (
                <Collapse in={poolExpanded}>
                  <Box sx={{
                    borderTop: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.18)',
                    paddingTop: '8px'
                  }}>
                    <PlayPool 
                      pool={pool} 
                      player1Rack={player1Rack} 
                      player2Rack={player2Rack}
                      gameStarted={gameStarted}
                      lightMode={lightMode}
                    />  
                  </Box>
                </Collapse>
              )}
            </Box>

            {/* Notes area - separate from pool */}
            <Box 
              sx={{
                mt: 1.5,
                padding: '8px 10px',
                borderRadius: '8px',
                background: lightMode === 'dark'
                  ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%)'
                  : '#FFFFFF',
                border: lightMode === 'dark' ? 'none' : '1px solid rgba(140, 130, 110, 0.28)',
                boxShadow: lightMode === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                  : '0 3px 10px rgba(100, 95, 80, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Box
                component="textarea"
                value={playNotes}
                onChange={(e) => {
                  setPlayNotes(e.target.value);
                  if (e.target) {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }
                }}
                placeholder="Thoughts?"
                sx={{
                  width: '100%',
                  minHeight: 0,
                  height: 'auto',
                  resize: 'none',
                  overflow: 'hidden',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  borderRadius: 1,
                  padding: '6px 8px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  border: lightMode === 'dark'
                    ? '1px solid rgba(156, 163, 175, 0.7)'
                    : '1px solid rgba(140, 130, 110, 0.35)',
                  backgroundColor: lightMode === 'dark'
                    ? 'rgba(17, 24, 39, 0.9)'
                    : '#FFFFFF',
                  color: lightMode === 'dark' ? '#F9FAFB' : '#111827',
                  '&:focus': {
                    borderColor: lightMode === 'dark' ? '#60A5FA' : '#3B82F6',
                    boxShadow: lightMode === 'dark'
                      ? '0 0 0 1px rgba(96, 165, 250, 0.6)'
                      : '0 0 0 1px rgba(59, 130, 246, 0.4)'
                  }
                }}
              />
            </Box>

          </Box>
        </Box>
        </Box>

        {/* Mobile on-screen keyboard overlay for board input */}
        <MobileKeyboardOverlay
          visible={isMobile && gameStarted && !!selectedBoardPosition && !gameEnded}
          onKeyPress={triggerKeyFromOverlay}
          onClose={() => setSelectedBoardPosition(null)}
          label="Type your move"
        />

        <GameModal />

        {/* Exchange Modal - same look as 3D Play */}
        <Modal
          open={showExchangeModal}
          onClose={handleExchangeModalCancel}
          aria-labelledby="exchange-modal-title"
          BackdropProps={{ sx: { backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' } }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: 420,
              p: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              backgroundColor: lightMode === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              boxShadow: lightMode === 'dark'
                ? '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <Typography
              id="exchange-modal-title"
              component="h2"
              sx={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: lightMode === 'dark' ? 'rgba(251, 191, 36, 0.95)' : '#B45309',
                textAlign: 'center',
                mb: 1,
                pb: 1,
                borderBottom: '1px solid',
                borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              Exchange Tiles
            </Typography>
            <Typography sx={{ color: lightMode === 'dark' ? '#94A3B8' : '#64748B', textAlign: 'center', fontSize: 13, mb: 2 }}>
              Click tiles to select ({tilesToExchange.length} selected)
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Rack
                rack={currentPlayer === 1 ? player1Rack : player2Rack}
                color={color?.current ?? '#E8D5B5'}
                onTileClick={handleExchangeTileToggle}
                selectedTiles={tilesToExchange}
              />
            </Box>

            {pool.length < 7 && (
              <Typography sx={{ color: '#EF4444', textAlign: 'center', fontSize: 12, mb: 1.5 }}>
                Fewer than 7 tiles in pool ({pool.length} remaining)
              </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
              <Box
                component="button"
                onClick={handleExchangeModalCancel}
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  color: lightMode === 'dark' ? '#94A3B8' : '#64748B',
                  border: '1px solid',
                  borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  background: 'transparent',
                  '&:hover': { background: lightMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                }}
              >
                Cancel
              </Box>
              <Box
                component="button"
                onClick={handleExchangeModalConfirm}
                disabled={tilesToExchange.length === 0 || pool.length < 7}
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 1.5,
                  cursor: tilesToExchange.length > 0 && pool.length >= 7 ? 'pointer' : 'not-allowed',
                  opacity: tilesToExchange.length > 0 && pool.length >= 7 ? 1 : 0.5,
                  background: tilesToExchange.length > 0 && pool.length >= 7
                    ? (lightMode === 'dark' ? 'linear-gradient(135deg, #D97706, #B45309)' : 'linear-gradient(135deg, #EA580C, #C2410C)')
                    : (lightMode === 'dark' ? '#374151' : '#94A3B8'),
                  '&:hover': (tilesToExchange.length > 0 && pool.length >= 7) ? { opacity: 0.95 } : {},
                }}
              >
                Exchange {tilesToExchange.length > 0 ? `(${tilesToExchange.length})` : ''}
              </Box>
            </Box>
          </Box>
        </Modal>

              <DefenseModal
          open={showDefenseModal}
          onClose={() => {
            setShowDefenseModal(false);
          }}
          move={defenseMove}
          boardCoords={boardCoords}
          pool={pool}
          defenseResults={defenseResults}
          isLoading={isDefenseLoading}
          onUpdateResults={updateDefenseResults}
        />

        <MoveCoach
          open={showMoveCoach}
          onClose={() => setShowMoveCoach(false)}
          moveData={moveCoachData}
          topMoves={topMoves}
          gameState={{
            player1points,
            player2points,
            currentPlayer,
            moveHistory
          }}
        />
        
        {/* Theo Yell Mascot - appears in center when yelling */}
        {isTheoYelling && (
          <Box
                    sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1500,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              animation: 'theoAppear 2s ease-out',
              '@keyframes theoAppear': {
                '0%': { 
                  transform: 'translate(-50%, -50%) scale(0.3)',
                  opacity: 0,
                  filter: 'brightness(1.5) drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))'
                      },
                '10%': { 
                  transform: 'translate(-50%, -50%) scale(1.2)',
                  opacity: 1,
                  filter: 'brightness(1.3) drop-shadow(0 0 30px rgba(239, 68, 68, 1))'
                },
                '20%': { 
                  transform: 'translate(-50%, -50%) scale(1)',
                  opacity: 1,
                  filter: 'brightness(1.2) drop-shadow(0 0 25px rgba(239, 68, 68, 0.9))'
                },
                '50%': { 
                  transform: 'translate(-50%, -50%) scale(1)',
                  opacity: 1,
                  filter: 'brightness(1.1) drop-shadow(0 0 20px rgba(239, 68, 68, 0.7))'
                },
                '80%': { 
                  transform: 'translate(-50%, -50%) scale(0.95)',
                  opacity: 0.8,
                  filter: 'brightness(1) drop-shadow(0 0 15px rgba(239, 68, 68, 0.5))'
                },
                '100%': { 
                  transform: 'translate(-50%, -50%) scale(0.8)',
                  opacity: 0,
                  filter: 'brightness(1) drop-shadow(0 0 10px rgba(239, 68, 68, 0))'
                }
              }
            }}
          >
            <ShakeableMascot 
              ref={theoYellMascotRef} 
              src="/images/theomascot.png" 
              width={200} 
              alt="Theo yelling" 
            />
            {theoYellPhrase && (
              <Box
                className={styles.theoYellPhrase}
                sx={{
                  backgroundColor: 'rgba(239, 68, 68, 0.95)',
                    color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 700,
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  maxWidth: '300px'
                }}
              >
                {theoYellPhrase}
              </Box>
            )}
          </Box>
        )}

      <Snackbar 
        open={snackbarOpen} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={
          snackbarSeverity === 'error' && snackbarMessage.includes('Invalid word')
            ? 5000
            : 3000
        }
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          className={styles.snackbarAlert}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Victory Celebration Components */}
      <Confetti
        winner={winner}
        isVisible={showConfetti}
        onComplete={handleConfettiComplete}
      />
      
      {/* Floating Victory Message */}
      {showVictoryOverlay && (
          <Box className={styles.victoryOverlay}>
            <Box className={`${styles.victoryCard} ${winner === 'player' ? styles.victoryCardPlayer : styles.victoryCardBot}`}>
              <Box className={styles.victoryIcon}>
              {winner === 'player' ? '🏆' : '🤖'}
            </Box>
              <Box className={styles.victoryTitle}>
              {winner === 'player' ? 'It\'s a huge, huge win!' : 'The bot got the best of you!'}
            </Box>
              <Box className={styles.victorySubtitle}>
              {winner === 'player' ? '' : ''}
            </Box>
              <Box className={`${styles.victoryScore} ${winner === 'player' ? styles.victoryScorePlayer : styles.victoryScoreBot}`}>
              {winner === 'player' ? '' : ''}
            </Box>
            
            {/* Rematch Button */}
            <Box
              onClick={handleNewGame}
                className={styles.rematchButton}
            >
              Rematch
          </Box>
        </Box>
        </Box>
      )}
      </Box>
    </Box>
  );
} 