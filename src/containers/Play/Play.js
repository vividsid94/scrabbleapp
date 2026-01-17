import React, { useEffect, useRef, useMemo, useState, useContext } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Play.module.css';
import { ThemeContext } from '../../App';
import Board from "../../components/AppContent/Board/Board.js";
import PlayPool from "../../components/AppContent/Board/PlayPool.js";
import { origPool, origBoard, letterLookup } from "../../components/AppContent/References/staticData.js";
import { TEST_RACKS } from "../../components/AppContent/References/testRacks.js";
import { createBoard } from "../../functions/boardFunctions.js";
import { Snackbar, Alert, Tooltip, Slider, Collapse, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel } from "@mui/material";
import SimulationModal from '../../components/Modals/SimulationModal';
import GameModal from '../../components/Modals/GameModal';
import DefenseModal from '../../components/Modals/DefenseModal';
import Metrics2Modal from '../../components/Modals/Metrics2Modal';
import MoveCoach from './components/MoveCoach';
import PlayerInfo from './components/PlayerInfo';
import Confetti from '../../components/Confetti/Confetti';
import TuneIcon from '@mui/icons-material/Tune';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import { handleTileDrop, handleTileClick } from '../../functions/play/tileFunctions';
import { handleBoardPositionSelect } from "../../functions/play/boardFunctions.js";
import { formatTime } from '../../functions/play/timeUtils';
import { useGameStore } from '../../stores/gameStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { initializeSounds, updateSoundType } from '../../functions/play/soundFunctions';
import { makeTheoYell } from '../../functions/play/theoYellFunctions';
import ShakeableMascot from '../../components/AppContent/ShakeableMascot';
import Modal from '@mui/material/Modal';
import { initializeDictionary } from '../../utils/localDictionary';
import { CaretDown, CaretUp, Smiley, Robot, UserCircle, User, Gear, Lightbulb, DotsThree, Play as PlayIcon, Brain } from '@phosphor-icons/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const bots = [
  {
    name: 'Theo',
    img: '/images/theomascot.png',
    desc: 'Clever and quick, Theo prefers bold, aggressive moves.'
  },
  {
    name: 'Tess',
    img: '/images/tessmascot.png',
    desc: 'Calm and strategic, Tess loves defense. Outfox her if you can!'
  }
];

export default function Play() {
  const { lightMode } = useContext(ThemeContext);
  // Use Zustand Game Store
  const {
    // Board state
    boardCoords,
    tempBoardCoords,
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
    
    // Auto-play
    autoPlayBest,
    isAutoPlaying,
    setAutoPlayBest,
    setIsAutoPlaying,
    
    // Victory state
    winner,
    
    // Simulation state
    simulatingMove,
    simulationResult,
    simulationProgress,
    previewBoard,
    previewTileOwnership,
    moveWithResults,
    simulationBoard,
    showSimulationModal,
    allMoveResults,
    isSimulatingAllMoves,
    previewScore,
    previewScorePosition,
    isHeatMapMode,
    heatMapData,
    setSimulatingMove,
    setSimulationResult,
    setSimulationProgress,
    setPreviewBoard,
    setPreviewMove,
    setPreviewTileOwnership,
    setMoveWithResults,
    setSimulationBoard,
    setLeaveValues,
    setShowSimulationModal,
    
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
    handleNewGame,
    startTimer,
    handleMoveSelectClick,
    handleConfettiComplete,
    runSimulation,
    
    // UI handler functions
    handleSettingsOpen,
    handleWordSubmitClick,
    handlePassClick,
    handleExchangeClick,
    handlePlayTopMoveClick,
    handleBotModeToggle,
    
    // Simulation handler functions
    openSimulationModal,
    resetHeatMapMode,
    stopSimulation,
    simulateMove,
    runAllMovesSimulation,
    runHeatMapSimulation,
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
    
    // Metrics2 modal
    showMetrics2Modal,
    setShowMetrics2Modal,
    
    // Move Coach
    showMoveCoach,
    moveCoachData,
    setShowMoveCoach,
    moveCoachEnabled,
    setMoveCoachEnabled,
    
    // Theo Yell
    theoYellEnabled,
    setTheoYellEnabled,
    shouldTheoYell,
    setShouldTheoYell,
    theoYellCriteria,
    setTheoYellCriteria,
    theoYellScoreThreshold,
    setTheoYellScoreThreshold,
    theoYellIsBingoMiss,
    theoYellPhrase,
    setTheoYellPhrase,
  } = useGameStore();

  // Get global color scheme - subscribe to the current value
  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);


  // Refs (keep these local)
  const complementaryColor = useRef('#9F7A83');
  const timerRef = useRef(null);
  const botMoveMadeRef = useRef(false);
  const mascotRef = useRef();
  const theoYellMascotRef = useRef(); // Separate ref for Theo Yell mascot
  const [botSelectOpen, setBotSelectOpen] = useState(false);
  const [showTimeControls, setShowTimeControls] = useState(false);
  const [pendingBot, setPendingBot] = useState(null);
  const [selectedDictionary, setSelectedDictionary] = useState('NWL');
  const [theoYellSettingsExpanded, setTheoYellSettingsExpanded] = useState(false);
  const [gameMode, setGameMode] = useState('Normal');
  const [showSkillBots, setShowSkillBots] = useState(false);
  const [poolExpanded, setPoolExpanded] = useState(false);
  const skillBots = [
    { name: 'Novice', desc: 'Makes random moves.', icon: <Smiley size={32} color="#60A5FA" /> },
    { name: 'Beginner', desc: 'Plays simple, easy-to-beat moves.', icon: <UserCircle size={32} color="#8B7355" /> },
    { name: 'Intermediate', desc: 'A bit more challenging, but still beatable.', icon: <Robot size={32} color="#3D5A80" /> },
  ];

  // Bot icon mapping for the top panel
  const getBotIcon = (botName) => {
    switch (botName) {
      case 'Theo':
        return <img src="/images/theomascot.png" alt="Theo" width={20} height={20} />;
      case 'Tess':
        return <img src="/images/tessmascot.png" alt="Tess" width={20} height={20} />;
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
  const [customRank, setCustomRank] = useState('');
  const [customBotSelected, setCustomBotSelected] = useState(false);
  const [customDefenseBotSelected, setCustomDefenseBotSelected] = useState(false);
  const [defenseWeight, setDefenseWeight] = useState(1.0);

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

  // Initialize game using store action
  useEffect(() => {
    if (sounds) {
      initializeGame(origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound);
    }
  }, [sounds]);

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    
    // Check dictionary loading state on mount
    checkDictionary();
  }, []);

  // Update useEffect to handle keyboard events
  useEffect(() => {
    console.log('🎹 Adding keyboard event listener');
    const handleKeyDownWrapperWithParams = (e) => {
      handleKeyDownWrapper(e, playerMoveSound, origBoard);
    };

    window.addEventListener('keydown', handleKeyDownWrapperWithParams);
    return () => {
      console.log('🎹 Removing keyboard event listener');
      window.removeEventListener('keydown', handleKeyDownWrapperWithParams);
    };
  }, [handleKeyDownWrapper, playerMoveSound, origBoard]);

  // Handle keyboard shortcuts - integrated into handleKeyDownWrapper
  // Removed duplicate keydown listener to prevent double-press issues

  // Update the useEffect for bot turns to use the new makeBotMove
  useEffect(() => { 
    if (isBotMode && currentPlayer === 2 && !isBotThinking && !gameEnded && !botMoveMadeRef.current) {
      botMoveMadeRef.current = true;
      makeBotMove(botMoveSound);
    }
  }, [currentPlayer, isBotMode, isBotThinking, gameEnded, gameStarted]);

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

  // Show modal when toggling bot mode on
  const handleBotModeToggleWithSounds = () => {
    if (!isBotMode) {
      setBotSelectOpen(true);
    } else {
      handleBotModeToggle(gameStartSound, botMoveSound);
    }
  };

  // When a bot is selected, show time controls slideout
  const handleBotSelect = (bot) => {
    setSelectedBot(bot);
    setPlayer2Name(bot.name);
    setPendingBot(bot);
    setShowTimeControls(true);
  };

  // Start the game after time controls are set
  const handleStartGame = () => {
    setShowTimeControls(false);
    setBotSelectOpen(false);
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

  // Update player2Name when isBotMode changes
  useEffect(() => {
    setPlayer1Name(isBotMode ? 'You' : 'Player 1');
          setPlayer2Name(isBotMode ? 'Theo' : 'Player 2');
  }, [isBotMode]);

  // Start timer when game starts or player changes
  useEffect(() => {
    if (gameStarted) {
      setTimerActive(true);
    }
  }, [currentPlayer, gameStarted]);

  // Start timer when it's a player's turn
  useEffect(() => {
    return startTimer(timerRef);
  }, [timerActive, currentPlayer, gameStarted]);

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
      lastMoveCoordinates,
      lightMode,
      invalidWordCoords
    );
  }, [tempBoardCoords, boardCoords, theme, color.current, boardColor.current, blankTiles, lastMoveCoordinates, lightMode, invalidWordCoords]);

  // Update player time states when gameTime changes
  useEffect(() => {
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
  }, [gameTime]);

  // Update the useEffect for auto-play to use isPlayerThinking
  useEffect(() => {
    if (autoPlayBest && gameStarted && currentPlayer === 1 && !isLoadingTopMoves && !isDictionaryLoading && !isAutoPlaying && !isPlayerThinking && !gameEnded) {
      setIsAutoPlaying(true);
      handlePlayTopMoveClick().finally(() => {
        setIsAutoPlaying(false);
      });
    }
  }, [autoPlayBest, gameStarted, currentPlayer, isLoadingTopMoves, isDictionaryLoading, handlePlayTopMoveClick, isAutoPlaying, isPlayerThinking, gameEnded]);

  // Add cleanup effect for all temporary states
  useEffect(() => {
    return () => {
      // Clear all state
      setBoardCoords([]);
      setTempBoardCoords([]);
      setOrigBoardCoords([]);
      setMoveHistory([]);
      setTopMoves([]);
      setSimulatingMove(null);
      setSimulationResult(null);
      setSimulationProgress(0);
      setPreviewBoard(null);
      setPreviewMove(null);
      setMoveWithResults(null);
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
          <Board 
            board={board}
            boardMode={theme}
            lightMode={lightMode}
            onBoardChildClick={(row, col) => handleBoardPositionSelect({
              row,
              col,
              boardCoords,
              selectedBoardPosition,
              setSelectedBoardPosition,
              arrowDirection,
              setArrowDirection
            })}
            onTileDrop={(tile, index, row, col) => handleTileDrop({
              tile,
              index,
              row,
              col,
              player1Rack,
              setPlayer1Rack,
              player2Rack,
              setPlayer2Rack,
                  selectedTilesArray,
              setSelectedTiles,
              setSelectedBoardPosition,
              tempBoardCoords,
              setTempBoardCoords
            })}
            onTileClick={(tile, index) => handleTileClick({
              tile,
              index,
              currentPlayer,
              player1Rack,
              player2Rack,
                  selectedTilesArray,
              setSelectedTiles,
              tilesToExchange,
              setTilesToExchange
            })}
            selectedPosition={selectedBoardPosition}
            arrowDirection={arrowDirection}
            onArrowDirectionChange={(newDirection) => {
                console.log('Play component received direction change:', newDirection);
                setArrowDirection(newDirection);
            }}
            animate={false}
            showSlip={false}
            showDictionary={false}
            dictionary=""
            previewScore={previewScore}
            previewScorePosition={previewScorePosition}
            lastMoveCoordinates={lastMoveCoordinates}
          />
          {/* Overlay Play Button */}
          {!gameStarted && (
          <Box
            sx={{
              position: 'absolute',
              top: 'calc(50% + 6px)',
              left: 'calc(50% + 10px)',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              padding: 0
            }}
          >
            <Tooltip title={isDictionaryLoading ? "Loading dictionary..." : (gameStarted ? "New Game" : "Start Game")}>
              <Box
                component="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (isDictionaryLoading || isBotThinking || isPlayerThinking) return;
                  handleBotModeToggleWithSounds();
                }}
                sx={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.9)' : 'rgba(217, 119, 6, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (isDictionaryLoading || isBotThinking || isPlayerThinking) ? 'not-allowed' : 'pointer',
                  opacity: (isDictionaryLoading || isBotThinking || isPlayerThinking) ? 0.5 : 1,
                  pointerEvents: (isDictionaryLoading || isBotThinking || isPlayerThinking) ? 'none' : 'auto',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  outline: 'none',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                    backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 1)' : 'rgba(217, 119, 6, 1)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                <PlayIcon size={28} color="#fff" weight="fill" />
              </Box>
            </Tooltip>
          </Box>
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
              setTilesToExchange
            })}
            selectedTiles={tilesToExchange}
            isBotMode={isBotMode}
            gameStarted={gameStarted}
            isDictionaryLoading={isDictionaryLoading}
            isLoadingTopMoves={isLoadingTopMoves}
            onSettingsOpen={handleSettingsOpen}
            onBotModeToggle={handleBotModeToggleWithSounds}
            onGetTopMoves={handleGetTopMovesForExpandable}
            onWordSubmit={handleWordSubmitClick}
            onPass={handlePassClick}
            onExchange={handleExchangeClick}
            onPlayTopMove={handlePlayTopMoveClick}
            selectedBoardPosition={selectedBoardPosition}
            tilesToExchange={tilesToExchange}
            autoPlayBest={autoPlayBest}
            setAutoPlayBest={setAutoPlayBest}
            isBotThinking={isBotThinking}
            isPlayerThinking={isPlayerThinking}
            latestMove={latestMove}
            moveHistory={moveHistory}
            topMoves={topMoves}
            onMoveSelect={handleMoveSelectClick}
            onSimulateMove={simulateMove}
            onOpenSimulationModal={openSimulationModal}
            onOpenMetrics2Modal={() => setShowMetrics2Modal(true)}
            simulatingMove={simulatingMove}
            boardCoords={boardCoords}
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
          />

          {showTimeSlider && !gameStarted && (
              <Box 
                className={styles.timeSliderContainer}
                style={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  border: lightMode === 'light' ? '1px solid #e5e7eb' : 'none'
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
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%)',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '8px',
                boxShadow: lightMode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
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
                    borderTop: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.12)',
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
          </Box>
        </Box>
      </Box>

        <GameModal />

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

        <Metrics2Modal
          open={showMetrics2Modal}
          onClose={() => {
            setShowMetrics2Modal(false);
          }}
          topMoves={topMoves}
          boardCoords={boardCoords}
          pool={pool}
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

      <SimulationModal
        open={showSimulationModal}
        onClose={() => {
          setShowSimulationModal(false);
          setSimulationBoard(null);
          setPreviewMove(null);
          setPreviewTileOwnership(null);
          setMoveWithResults(null);
          resetHeatMapMode();
        }}
        simulationBoard={previewBoard || simulationBoard}
          previewBoard={previewBoard}
        previewTileOwnership={previewTileOwnership}
        theme={theme}
        color={color}
        complementaryColor={complementaryColor}
        blankTiles={blankTiles}
        simulatingMove={simulatingMove}
        simulationProgress={simulationProgress}
        simulationResult={simulationResult}
        moveWithResults={moveWithResults}
        onStartSimulation={runSimulation}
        onStartHeatMap={runHeatMapSimulation}
        onStopSimulation={stopSimulation}
          onSwitchToMetrics={() => {}}
        heatMapData={heatMapData}
        isHeatMapMode={isHeatMapMode}
          simulationSettings={{
            numSimulations: 5,
            turnsPerSim: 1
          }}
          onSimulationSettingsChange={(newSettings) => {
            // This function is now empty as the state is managed by the simulation store
          }}
        topMoves={topMoves}
        onMoveSelect={handleMoveSelectClick}
        onRunAllMovesSimulation={runAllMovesSimulation}
        allMoveResults={allMoveResults}
        isSimulatingAllMoves={isSimulatingAllMoves}
      />

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

      <Modal
        open={botSelectOpen}
        onClose={() => { setBotSelectOpen(false); setShowTimeControls(false); }}
        aria-labelledby="bot-select-modal-title"
        aria-describedby="bot-select-modal-description"
      >
        <Box 
          className={styles.modalContainer} 
          style={{ 
            minWidth: 280, 
            maxWidth: 380, 
            alignItems: 'center', 
            animation: 'none', 
            border: 'none', 
            boxShadow: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Time Controls Slideout */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#ffffff',
              transform: showTimeControls ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              zIndex: 10,
              overflowY: 'auto',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, textAlign: 'center', letterSpacing: '0.04em', color: '#1F2937' }}>
              Options
            </div>
            
            {/* Time Controls */}
            <Box sx={{ width: '100%', marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 1, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Time
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, color: '#1F2937' }}>
                {gameTime} {gameTime === 1 ? 'minute' : 'minutes'}
              </div>
              <Slider
                value={gameTime}
                onChange={(e, value) => setGameTime(value)}
                min={1}
                max={30}
                step={1}
                sx={{
                  color: '#3D5A80',
                  marginBottom: 0,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  },
                  '& .MuiSlider-track': {
                    height: 3,
                  },
                  '& .MuiSlider-rail': {
                    height: 3,
                    opacity: 0.3,
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5, marginTop: 0.5 }}>
                {[5, 10, 15, 30].map((time) => (
                  <button
                    key={time}
                    onClick={() => setGameTime(time)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      color: gameTime === time ? '#fff' : '#374151',
                      backgroundColor: gameTime === time ? '#3D5A80' : 'rgba(0, 0, 0, 0.04)',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      flex: 1,
                      opacity: gameTime === time ? 1 : 0.85
                    }}
                  >
                    {time}
                  </button>
                ))}
              </Box>
            </Box>

            {/* Dictionary Dropdown */}
            <Box sx={{ width: '100%', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 3, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dictionary
              </div>
              <FormControl fullWidth size="small" variant="outlined" sx={{ marginBottom: 0 }}>
                <Select
                  value={selectedDictionary}
                  onChange={(e) => setSelectedDictionary(e.target.value)}
                  sx={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1F2937',
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e7eb',
                      borderWidth: '1px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3D5A80'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3D5A80'
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#6B7280',
                      fontSize: '16px'
                    }
                  }}
                >
                  <MenuItem value="NWL" sx={{ fontSize: '11px', fontWeight: 600 }}>NWL</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Game Mode Dropdown */}
            <Box sx={{ width: '100%', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 3, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Game Mode
              </div>
              <FormControl fullWidth size="small" variant="outlined" sx={{ marginBottom: 0 }}>
                <Select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  sx={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1F2937',
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e7eb',
                      borderWidth: '1px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3D5A80'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3D5A80'
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#6B7280',
                      fontSize: '16px'
                    }
                  }}
                >
                  <MenuItem value="Normal" sx={{ fontSize: '11px', fontWeight: 600 }}>Normal</MenuItem>
                  <MenuItem value="Randomize bonus squares" disabled sx={{ fontSize: '11px', opacity: 0.4 }}>Randomize bonus squares</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Move Coach & Theo Yell Toggles - Grouped, Mutually Exclusive */}
            <Box sx={{ width: '100%', marginTop: 3, marginBottom: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 3, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Analysis Mode
              </div>
              
              {/* Theo Yell Option */}
              <Box>
                <Box 
                  onClick={() => {
                    if (!theoYellEnabled) {
                      setTheoYellEnabled(true);
                      setMoveCoachEnabled(false);
                    } else {
                      setTheoYellEnabled(false);
                    }
                  }}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: theoYellEnabled ? 'rgba(217, 119, 6, 0.1)' : '#fff',
                    border: theoYellEnabled ? '2px solid #D97706' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#D97706',
                      backgroundColor: theoYellEnabled ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.05)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src="/images/theomascot.png" 
                      alt="Theo" 
                      width={14} 
                      height={14} 
                      style={{ 
                        borderRadius: '3px',
                        opacity: theoYellEnabled ? 1 : 0.6,
                        filter: theoYellEnabled ? 'drop-shadow(0 0 3px rgba(217, 119, 6, 0.5))' : 'none',
                        transition: 'all 0.2s ease'
                      }} 
                    />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: theoYellEnabled ? '#D97706' : '#1F2937' }}>
                      Have Theo Yell at You
                    </span>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {theoYellEnabled && (
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheoYellSettingsExpanded(!theoYellSettingsExpanded);
                        }}
                        sx={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          backgroundColor: theoYellSettingsExpanded ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.08)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(217, 119, 6, 0.2)'
                          }
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#D97706' }}>
                          {theoYellSettingsExpanded ? 'Hide' : 'Settings'}
                        </span>
                        {theoYellSettingsExpanded ? (
                          <CaretUp size={14} color="#D97706" weight="bold" />
                        ) : (
                          <CaretDown size={14} color="#D97706" weight="bold" />
                        )}
                      </Box>
                    )}
                    <Box
                      sx={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: theoYellEnabled ? '5px solid #D97706' : '2px solid #9CA3AF',
                        backgroundColor: theoYellEnabled ? '#D97706' : 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </Box>
                </Box>
                
                {/* Expandable Settings */}
                <Collapse in={theoYellEnabled && theoYellSettingsExpanded}>
                  <Box sx={{ marginTop: 1, padding: '6px', backgroundColor: 'rgba(217, 119, 6, 0.05)', borderRadius: '6px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Trigger When
                    </div>
                    
                    {/* Bingo Miss Option */}
                    <Box 
                      onClick={() => setTheoYellCriteria('bingo')}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 8px',
                        marginBottom: '4px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: theoYellCriteria === 'bingo' ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(217, 119, 6, 0.08)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          border: theoYellCriteria === 'bingo' ? '3px solid #D97706' : '2px solid #9CA3AF',
                          backgroundColor: theoYellCriteria === 'bingo' ? '#D97706' : 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#1F2937' }}>
                        When I miss a bingo
                      </span>
                    </Box>
                    
                    {/* Score Threshold Option */}
                    <Box 
                      onClick={() => setTheoYellCriteria('score')}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: theoYellCriteria === 'score' ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(217, 119, 6, 0.08)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          border: theoYellCriteria === 'score' ? '3px solid #D97706' : '2px solid #9CA3AF',
                          backgroundColor: theoYellCriteria === 'score' ? '#D97706' : 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#1F2937', flex: 1 }}>
                        Move scores under
                      </span>
                      {theoYellCriteria === 'score' && (
                        <input
                          type="number"
                          value={theoYellScoreThreshold}
                          onChange={(e) => setTheoYellScoreThreshold(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '40px',
                            padding: '2px 4px',
                            fontSize: '11px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}
                        />
                      )}
                      {theoYellCriteria === 'score' && (
                        <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '4px' }}>points</span>
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </Box>

              {/* Move Coach Option - Disabled/Greyed Out */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  marginTop: '4px',
                  cursor: 'not-allowed',
                  opacity: 0.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={14} color="#9CA3AF" weight="regular" />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>
                    Move Coach
                  </span>
                </Box>
                <Box
                  sx={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '2px solid #9CA3AF',
                    backgroundColor: 'transparent'
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 8, width: '100%', marginTop: 'auto', paddingTop: 2 }}>
              <button
                onClick={() => setShowTimeControls(false)}
                style={{
                  flex: 1,
                  marginTop: 0,
                  background: '#f0f0f0',
                  color: '#1F2937',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                Back
              </button>
              <button
                onClick={handleStartGame}
                style={{
                  flex: 1,
                  marginTop: 0,
                  background: '#f0f0f0',
                  color: '#1F2937',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                Start Game
              </button>
            </Box>
          </Box>

          {/* Bot Selection Content */}
          <Box
            sx={{
              transform: showTimeControls ? 'translateX(-100%)' : 'translateX(0)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              width: '100%'
            }}
          >
          <div className={styles.modalTitle} id="bot-select-modal-title" style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, textAlign: 'center', letterSpacing: '0.04em' }}>
            Who will you play against today?
          </div>
          <div style={{ fontSize: 12, color: '#374151', marginBottom: 16, textAlign: 'center', fontWeight: 500, opacity: 0.85 }}>
            Each fox has a unique style. Pick your challenger!
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 16, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            {bots.map(bot => (
              <div
                key={bot.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  border: selectedBot.name === bot.name ? '2px solid #3D5A80' : '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '12px 12px 8px 12px',
                  background: selectedBot.name === bot.name ? 'rgba(96,165,250,0.08)' : '#fff',
                  boxShadow: selectedBot.name === bot.name ? '0 4px 16px rgba(61,90,128,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  minWidth: 100,
                  maxWidth: 130,
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative',
                }}
                onClick={() => handleBotSelect(bot)}
              >
                <img src={bot.img} alt={bot.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: '#eee', marginBottom: 3, boxShadow: selectedBot.name === bot.name ? '0 0 0 2px #60A5FA' : 'none', transition: 'box-shadow 0.2s' }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1F2937', marginBottom: 2 }}>{bot.name}</div>
                <div style={{ fontSize: 11, color: '#374151', opacity: 0.8, textAlign: 'center', minHeight: 32, maxHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{bot.desc}</div>
                <button
                  style={{
                    marginTop: 6,
                    background: selectedBot.name === bot.name ? 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)' : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                    color: '#fff',
                    border: 0,
                    borderRadius: 6,
                    padding: '5px 14px',
                    fontWeight: 'bold',
                    letterSpacing: 0.5,
                    fontSize: 12,
                    boxShadow: selectedBot.name === bot.name ? '4px 0px 0px #60A5FA' : '4px 0px 0px #374151',
                    outline: 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: selectedBot.name === bot.name ? 1 : 0.85
                  }}
                  onClick={e => { e.stopPropagation(); handleBotSelect(bot); }}
                >
                  {selectedBot.name === bot.name ? 'Selected' : 'Choose'}
                </button>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', marginBottom: 6 }}>
            <div className={styles.moveHistoryList} style={{ marginTop: 6, width: '100%', maxHeight: 180, overflowY: 'auto' }}>
              {skillBots.map(bot => (
                <div
                  key={bot.name}
                  className={styles.moveHistoryItem}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: selectedBot.name === bot.name && !customBotSelected ? 'rgba(96,165,250,0.08)' : '#fff',
                    border: selectedBot.name === bot.name && !customBotSelected ? '2px solid #3D5A80' : '1px solid #e5e7eb',
                    borderRadius: 10,
                    boxShadow: selectedBot.name === bot.name && !customBotSelected ? '0 4px 16px rgba(61,90,128,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    marginBottom: 6,
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative',
                  }}
                  onClick={() => { setCustomBotSelected(false); setCustomDefenseBotSelected(false); handleBotSelect(bot); }}
                >
                  <div style={{ marginRight: 6 }}>{bot.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1F2937', marginBottom: 1 }}>{bot.name}</div>
                    <div style={{ fontSize: 10, color: '#374151', opacity: 0.8 }}>{bot.desc}</div>
                  </div>
                  <button
                    style={{
                      background: selectedBot.name === bot.name && !customBotSelected ? 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)' : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                      color: '#fff',
                      border: 0,
                      borderRadius: 6,
                      padding: '4px 12px',
                      fontWeight: 'bold',
                      letterSpacing: 0.5,
                      fontSize: 11,
                      boxShadow: selectedBot.name === bot.name && !customBotSelected ? '4px 0px 0px #60A5FA' : '4px 0px 0px #374151',
                      outline: 'transparent',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      opacity: selectedBot.name === bot.name && !customBotSelected ? 1 : 0.85
                    }}
                    onClick={e => { e.stopPropagation(); setCustomBotSelected(false); setCustomDefenseBotSelected(false); handleBotSelect(bot); }}
                  >
                    {selectedBot.name === bot.name && !customBotSelected ? 'Selected' : 'Choose'}
                  </button>
                </div>
              ))}
              {/* Custom bot item */}
              <div
                className={styles.moveHistoryItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: customBotSelected ? 'rgba(96,165,250,0.08)' : '#fff',
                  border: customBotSelected ? '2px solid #3D5A80' : '1px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: customBotSelected ? '0 4px 16px rgba(61,90,128,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  marginBottom: 6,
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative',
                }}
                onClick={() => { if (/^\d+$/.test(customRank) && parseInt(customRank) > 0) { setCustomBotSelected(true); setCustomDefenseBotSelected(false); handleBotSelect({ name: `Custom`, desc: `Plays the ${customRank}th best move by points + leave.`, customRank: parseInt(customRank) }); } }}
              >
                <div style={{ marginRight: 6 }}><Robot size={24} color="#9CA3AF" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1F2937', marginBottom: 1 }}>Custom</div>
                  <div style={{ fontSize: 10, color: '#374151', opacity: 0.8 }}>Play <input type="text" value={customRank} onChange={e => { if (/^\d*$/.test(e.target.value)) setCustomRank(e.target.value); }} placeholder="X" style={{ width: 24, fontSize: 10, textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 3, margin: '0 3px', padding: '2px' }} />th by points + leave</div>
                </div>
                <button
                  style={{
                    background: customBotSelected ? 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)' : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                    color: '#fff',
                    border: 0,
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontWeight: 'bold',
                    letterSpacing: 0.5,
                    fontSize: 11,
                    boxShadow: customBotSelected ? '4px 0px 0px #60A5FA' : '4px 0px 0px #374151',
                    outline: 'transparent',
                    cursor: /^\d+$/.test(customRank) && parseInt(customRank) > 0 ? 'pointer' : 'not-allowed',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: customBotSelected ? 1 : 0.85
                  }}
                  disabled={!/^\d+$/.test(customRank) || parseInt(customRank) <= 0}
                  onClick={e => { e.stopPropagation(); if (/^\d+$/.test(customRank) && parseInt(customRank) > 0) { setCustomBotSelected(true); setCustomDefenseBotSelected(false); handleBotSelect({ name: `Custom`, desc: `Plays the ${customRank}th best move by points + leave.`, customRank: parseInt(customRank) }); } }}
                >
                  {customBotSelected ? 'Selected' : 'Choose'}
                </button>
              </div>
              
              {/* Custom Defense Bot item */}
              <div
                className={styles.moveHistoryItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: customDefenseBotSelected ? 'rgba(96,165,250,0.08)' : '#fff',
                  border: customDefenseBotSelected ? '2px solid #3D5A80' : '1px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: customDefenseBotSelected ? '0 4px 16px rgba(61,90,128,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  marginBottom: 6,
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative',
                }}
                onClick={() => { setCustomDefenseBotSelected(true); setCustomBotSelected(false); handleBotSelect({ name: `Defense Bot`, desc: `Uses defense analysis with ${defenseWeight.toFixed(1)}x defense weight.`, defenseWeight: defenseWeight }); }}
              >
                <div style={{ marginRight: 6 }}><Robot size={24} color="#9CA3AF" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1F2937', marginBottom: 1 }}>Custom Defense</div>
                  <div style={{ fontSize: 9, color: '#374151', opacity: 0.8, marginBottom: 3 }}>
                    Defense Weight: {defenseWeight.toFixed(1)}x
                  </div>
                  <Slider
                    value={defenseWeight}
                    onChange={(e, value) => setDefenseWeight(value)}
                    onClick={(e) => e.stopPropagation()}
                    min={0.0}
                    max={5.0}
                    step={0.1}
                    size="small"
                    sx={{
                      color: '#3D5A80',
                      '& .MuiSlider-thumb': {
                        width: 12,
                        height: 12,
                      },
                      '& .MuiSlider-track': {
                        height: 3,
                      },
                      '& .MuiSlider-rail': {
                        height: 3,
                        opacity: 0.3,
                      },
                    }}
                  />
                </div>
                <button
                  style={{
                    background: customDefenseBotSelected ? 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)' : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                    color: '#fff',
                    border: 0,
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontWeight: 'bold',
                    letterSpacing: 0.5,
                    fontSize: 11,
                    boxShadow: customDefenseBotSelected ? '4px 0px 0px #60A5FA' : '4px 0px 0px #374151',
                    outline: 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: customDefenseBotSelected ? 1 : 0.85
                  }}
                  disabled={false}
                  onClick={e => { e.stopPropagation(); setCustomDefenseBotSelected(true); setCustomBotSelected(false); handleBotSelect({ name: `Defense Bot`, desc: `Uses defense analysis with ${defenseWeight.toFixed(1)}x defense weight.`, defenseWeight: defenseWeight }); }}
                >
                  {customDefenseBotSelected ? 'Selected' : 'Choose'}
                </button>
              </div>
            </div>
          </div>
          <button
            style={{
              marginTop: 6,
              background: '#f0f0f0',
              color: '#1F2937',
              border: 'none',
              borderRadius: 6,
              padding: '4px 12px',
              fontWeight: 'bold',
              fontSize: 12,
              cursor: 'pointer',
              alignSelf: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
            onClick={() => setBotSelectOpen(false)}
          >
            Cancel
          </button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
} 