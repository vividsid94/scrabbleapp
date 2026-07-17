import React, { useEffect, useRef, useMemo, useState, useContext } from "react";
import { Snackbar, Alert, Tooltip, Slider, Collapse, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Checkbox, Box, Modal, Typography } from "@mui/material";
import TuneIcon from '@mui/icons-material/Tune';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { CaretDown, CaretUp, Smiley, Robot, UserCircle, User, Gear, Lightbulb, DotsThree, Play as PlayIcon, Brain } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { loadActiveGameSnapshot } from '../../utils/activeGamePersistence';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import PlayPool from "../../components/AppContent/Board/PlayPool.js";
import SimulationModal from '../../components/Modals/SimulationModal';
import GameModal from '../../components/Modals/GameModal';
import DefenseModal from '../../components/Modals/DefenseModal';
import Metrics2Modal from '../../components/Modals/Metrics2Modal';
import MoveCoach from './components/MoveCoach';
import PlayerInfo from './components/PlayerInfo';
import Confetti from '../../components/Confetti/Confetti';
import ShakeableMascot from '../../components/AppContent/ShakeableMascot';
import AnimatedMascot from '../../components/AppContent/AnimatedMascot';
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
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import styles from './Play.module.css';
import MobileKeyboardOverlay from '../../components/MobileKeyboardOverlay';

// Helper function to generate pool from distribution object
const generatePoolFromDistribution = (distribution) => {
  let pool = '';
  for (const [letter, count] of Object.entries(distribution)) {
    pool += letter.repeat(count);
  }
  return pool;
};

// Helper function to generate pool from preset name
const generatePoolFromPreset = (preset) => {
  const standard = { A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, '?': 2 };
  
  switch (preset) {
    case 'standard':
      return null; // Use origPool
    case 'vowel-heavy':
      return generatePoolFromDistribution({
        A: 12, B: 2, C: 2, D: 4, E: 16, F: 2, G: 3, H: 2, I: 12, J: 1, K: 1, L: 4, M: 2, N: 6, O: 12, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 6, V: 2, W: 2, X: 1, Y: 2, Z: 1, '?': 2
      });
    case 'consonant-heavy':
      return generatePoolFromDistribution({
        A: 6, B: 4, C: 4, D: 6, E: 8, F: 4, G: 5, H: 4, I: 6, J: 2, K: 2, L: 6, M: 4, N: 8, O: 6, P: 4, Q: 2, R: 8, S: 6, T: 8, U: 2, V: 4, W: 4, X: 2, Y: 4, Z: 2, '?': 2
      });
    case 'advanced':
      // Return a marker that we're in advanced mode - will be handled by editor
      return 'ADVANCED:' + generatePoolFromDistribution(standard);
    default:
      return null;
  }
};

// Helper function to parse pool string into distribution object
const parsePoolToDistribution = (pool) => {
  const distribution = {};
  for (const letter of pool) {
    distribution[letter] = (distribution[letter] || 0) + 1;
  }
  return distribution;
};

// Bonus Square Editor Component
const BonusSquareEditor = ({ distribution, onDistributionChange, lightMode }) => {
  const updateCount = (type, newCount) => {
    const updated = { ...distribution };
    updated[type] = Math.max(0, Math.min(newCount, 225)); // Cap at 225 (total squares)
    onDistributionChange(updated);
  };
  
  const types = [
    { key: 'TWS', label: 'TWS', color: '#dc2626' },
    { key: 'DWS', label: 'DWS', color: '#ec4899' },
    { key: 'TLS', label: 'TLS', color: '#1e40af' },
    { key: 'DLS', label: 'DLS', color: '#3b82f6' }
  ];
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {types.map(type => (
        <Box key={type.key} sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box sx={{ 
            fontSize: { xs: '9px', sm: '8px' }, 
            fontWeight: 600, 
            color: lightMode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280',
            minWidth: '32px'
          }}>
            {type.label}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
            <Box
              onClick={() => updateCount(type.key, (distribution[type.key] || 0) - 1)}
              sx={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                userSelect: 'none',
                '&:hover': {
                  backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e5e7eb'
                }
              }}
            >
              −
            </Box>
            <Box sx={{
              minWidth: '40px',
              textAlign: 'center',
              fontSize: { xs: '10px', sm: '9px' },
              fontWeight: 600,
              color: lightMode === 'dark' ? '#fff' : '#1F2937',
              padding: '2px 4px'
            }}>
              {distribution[type.key] || 0}
            </Box>
            <Box
              onClick={() => updateCount(type.key, (distribution[type.key] || 0) + 1)}
              sx={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                userSelect: 'none',
                '&:hover': {
                  backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e5e7eb'
                }
              }}
            >
              +
            </Box>
            <Box sx={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '2px', 
              backgroundColor: type.color,
              marginLeft: 'auto'
            }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// Variable Pool Editor Component
const VariablePoolEditor = ({ currentPool, onPoolChange, lightMode }) => {
  const getPoolString = () => {
    if (!currentPool) return origPool;
    if (currentPool.startsWith('ADVANCED:')) return currentPool.substring(9);
    return currentPool;
  };
  
  const [distribution, setDistribution] = useState(() => {
    return parsePoolToDistribution(getPoolString());
  });
  
  // Update distribution when currentPool changes externally
  useEffect(() => {
    const pool = getPoolString();
    setDistribution(parsePoolToDistribution(pool));
  }, [currentPool]);
  
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '?'];
  
  const updateCount = (letter, newCount) => {
    const updated = { ...distribution };
    if (newCount <= 0) {
      delete updated[letter];
    } else {
      updated[letter] = Math.min(newCount, 20); // Cap at 20
    }
    setDistribution(updated);
    const newPool = generatePoolFromDistribution(updated);
    onPoolChange('ADVANCED:' + newPool);
  };
  
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(9, 1fr)', 
      gap: '4px',
      maxHeight: '120px',
      overflowY: 'auto',
      padding: '4px'
    }}>
      {letters.map(letter => (
        <Box key={letter} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <Box sx={{ 
            fontSize: { xs: '9px', sm: '8px' }, 
            fontWeight: 600, 
            color: lightMode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280' 
          }}>
            {letter === '?' ? 'BL' : letter}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Box
              onClick={() => updateCount(letter, (distribution[letter] || 0) - 1)}
              sx={{
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 600,
                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                userSelect: 'none',
                '&:hover': {
                  backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e5e7eb'
                }
              }}
            >
              −
            </Box>
            <Box sx={{
              minWidth: '24px',
              textAlign: 'center',
              fontSize: { xs: '10px', sm: '9px' },
              fontWeight: 600,
              color: lightMode === 'dark' ? '#fff' : '#1F2937',
              padding: '2px 4px'
            }}>
              {distribution[letter] || 0}
            </Box>
            <Box
              onClick={() => updateCount(letter, (distribution[letter] || 0) + 1)}
              sx={{
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 600,
                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                userSelect: 'none',
                '&:hover': {
                  backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e5e7eb'
                }
              }}
            >
              +
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

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
  },
  {
    name: 'Tope',
    img: '/images/topemascot.png',
    desc: 'Reasons like an expert - retrieves similar positions from real annotated games and explains its thinking.'
  }
];

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
    restoreActiveGame,
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
    
    // Premium squares
    premiumSquares,
    setPremiumSquares,
    generateRandomPremiumSquares,
    
    // Game mode features
    randomizeBonusSquares,
    setRandomizeBonusSquares,
    customBonusSquareDistribution,
    setCustomBonusSquareDistribution,
    twoTurnsPerPlayer,
    setTwoTurnsPerPlayer,
    variablePool,
    setVariablePool,
    customPool,
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
  const [botSelectOpen, setBotSelectOpen] = useState(false);
  const [showTimeControls, setShowTimeControls] = useState(false);
  const [pendingBot, setPendingBot] = useState(null);
  const [selectedDictionary, setSelectedDictionary] = useState('NWL');
  const [theoYellSettingsExpanded, setTheoYellSettingsExpanded] = useState(false);
  const [showSkillBots, setShowSkillBots] = useState(false);
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
  const skillBots = [
    { name: 'Theo', desc: 'Clever and quick, Theo prefers bold, aggressive moves.', icon: <img src="/images/theomascot.png" alt="Theo" width={18} height={18} style={{ borderRadius: '3px' }} /> },
    { name: 'Tess', desc: 'Calm and strategic, Tess loves defense. Outfox her if you can!', icon: <img src="/images/tessmascot.png" alt="Tess" width={18} height={18} style={{ borderRadius: '3px' }} /> },
    { name: 'Tope', desc: 'Reasons like an expert - retrieves similar positions from real annotated games and explains its thinking.', icon: <img src="/images/topemascot.png" alt="Tope" width={18} height={18} style={{ borderRadius: '3px' }} /> },
    { name: 'Novice', desc: 'Makes random moves.', icon: <Smiley size={18} color="#60A5FA" /> },
    { name: 'Beginner', desc: 'Plays simple, easy-to-beat moves.', icon: <UserCircle size={18} color="#8B7355" /> },
    { name: 'Intermediate', desc: 'A bit more challenging, but still beatable.', icon: <Robot size={18} color="#3D5A80" /> },
  ];

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
  const [customRank, setCustomRank] = useState('');
  const [customBotSelected, setCustomBotSelected] = useState(false);
  const [customDefenseBotSelected, setCustomDefenseBotSelected] = useState(false);
  const [defenseWeight, setDefenseWeight] = useState(1.0);
  const [poolPreset, setPoolPreset] = useState('standard');
  const [bonusSquarePreset, setBonusSquarePreset] = useState('default');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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

  // Initialize game using store action - unless we arrived via the
  // homepage's "Continue" button, in which case restore the saved
  // single-player snapshot instead of resetting to a blank board.
  useEffect(() => {
    if (!sounds) return;
    const wantsContinue = new URLSearchParams(location.search).get('continue') === '1';
    if (wantsContinue) {
      const snapshot = loadActiveGameSnapshot();
      if (snapshot) {
        restoreActiveGame(snapshot);
        return;
      }
    }
    initializeGame(origBoard, origPool, gameStartSound, botMoveSound);
  }, [sounds]);

  useEffect(() => {
    // Don't reset board in multiplayer mode - it's managed by syncGameState
    if (isMultiplayerMode) {
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
      setBonusSquarePreset('default');
    }
  }, [randomizeBonusSquares, setCustomBonusSquareDistribution]);
  
  // Sync bonusSquarePreset with customBonusSquareDistribution
  useEffect(() => {
    if (!customBonusSquareDistribution) {
      setBonusSquarePreset('default');
    } else {
      const dist = customBonusSquareDistribution;
      if (dist.TWS === 12 && dist.DWS === 20 && dist.TLS === 8 && dist.DLS === 20) {
        setBonusSquarePreset('word-heavy');
      } else if (dist.TWS === 4 && dist.DWS === 8 && dist.TLS === 20 && dist.DLS === 28) {
        setBonusSquarePreset('letter-heavy');
      } else if (dist.TWS === 20 && dist.DWS === 0 && dist.TLS === 0 && dist.DLS === 0) {
        setBonusSquarePreset('extreme');
      } else {
        setBonusSquarePreset('advanced');
      }
    }
  }, [customBonusSquareDistribution]);
  
  // Reset turn count when twoTurnsPerPlayer changes
  useEffect(() => {
    const { setPlayerTurnCount } = useGameStore.getState();
    setPlayerTurnCount(1);
  }, [twoTurnsPerPlayer]);
  
  // Reset customPool when variablePool is disabled
  useEffect(() => {
    if (!variablePool) {
      setCustomPool(null);
      setPoolPreset('standard');
    }
  }, [variablePool, setCustomPool]);
  
  // Sync poolPreset with customPool when it changes externally
  useEffect(() => {
    if (!customPool) {
      setPoolPreset('standard');
    } else if (customPool.startsWith('ADVANCED:')) {
      setPoolPreset('advanced');
    }
  }, [customPool]);

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
    if (isBotMode && currentPlayer === 2 && !isBotThinking && !gameEnded && !botMoveMadeRef.current) {
      botMoveMadeRef.current = true;
      runBotMove(botMoveSound);
    }
  }, [currentPlayer, isBotMode, isBotThinking, gameEnded, gameStarted, botMoveSound]);

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

  // Update player time states when gameTime changes
  useEffect(() => {
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
  }, [gameTime]);


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
          {gameStarted ? (
          <Board 
            board={board}
            boardMode={theme}
            lightMode={lightMode}
            showNoCommentaryLabel={false}
            onBoardChildClick={(row, col) => {
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
            selectedPosition={selectedBoardPosition}
            arrowDirection={arrowDirection}
            onArrowDirectionChange={(newDirection) => {
                console.log('Play component received direction change:', newDirection);
                setArrowDirection(newDirection);
            }}
            animate={false}
            enableTelestrator={telestratorEnabled}
            showSlip={false}
            showDictionary={false}
            dictionary=""
            previewScore={previewScore}
            previewScorePosition={previewScorePosition}
            lastMoveCoordinates={lastMoveCoordinates}
          />
          ) : (
          <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '24px',
                padding: '40px 20px'
              }}
            >
              {/* Container for Scouting Report and Slideouts */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: { xs: '100%', sm: '650px' },
                  minHeight: { xs: '400px', sm: '500px' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Scouting Report */}
                {!botSelectOpen && (
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: { xs: '12px', sm: '16px' },
                    padding: { xs: '20px 16px', sm: '28px 24px' },
                    maxWidth: '650px',
                    width: '100%',
                    flexShrink: 0,
                    backgroundColor: lightMode === 'dark' 
                      ? '#2A3A4A' 
                      : '#FDF9F3',
                    // Enhanced paper texture with multiple layers
                    backgroundImage: lightMode === 'dark'
                      ? `repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(120, 120, 120, 0.15) 22px, rgba(120, 120, 120, 0.15) 23px),
                         repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(80, 80, 80, 0.08) 1px, rgba(80, 80, 80, 0.08) 2px),
                         radial-gradient(circle at 20% 30%, rgba(150, 150, 150, 0.05) 0%, transparent 50%),
                         radial-gradient(circle at 80% 70%, rgba(100, 100, 100, 0.05) 0%, transparent 50%),
                         linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, transparent 30%, rgba(0,0,0,0.04) 70%, rgba(0,0,0,0.02) 100%)`
                      : `repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(220, 210, 195, 0.4) 22px, rgba(220, 210, 195, 0.4) 23px),
                         repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(200, 190, 175, 0.15) 1px, rgba(200, 190, 175, 0.15) 2px),
                         radial-gradient(circle at 20% 30%, rgba(240, 235, 225, 0.3) 0%, transparent 50%),
                         radial-gradient(circle at 80% 70%, rgba(230, 220, 210, 0.2) 0%, transparent 50%),
                         linear-gradient(to bottom, rgba(255,255,250,0.6) 0%, transparent 30%, rgba(240, 235, 220, 0.3) 70%, rgba(250, 245, 235, 0.2) 100%)`,
                    backgroundSize: '100% 23px, 2px 100%, 200px 200px, 150px 150px, 100% 100%',
                    backgroundPosition: '0 0, 0 0, 0 0, 100% 100%, 0 0',
                    // Paper-like border with subtle aging
                    border: lightMode === 'dark' 
                      ? '1px solid rgba(139, 115, 85, 0.2)' 
                      : '1px solid rgba(200, 185, 165, 0.4)',
                    borderRadius: '2px',
                    // Enhanced realistic paper shadows
                    boxShadow: lightMode === 'dark'
                      ? `0 2px 4px rgba(0, 0, 0, 0.3),
                         0 8px 16px rgba(0, 0, 0, 0.4),
                         0 16px 32px rgba(0, 0, 0, 0.5),
                         inset 0 0 200px rgba(0, 0, 0, 0.2),
                         inset 0 1px 0 rgba(255, 255, 255, 0.04),
                         inset 0 -1px 0 rgba(0, 0, 0, 0.1)`
                      : `0 1px 3px rgba(0, 0, 0, 0.12),
                         0 4px 8px rgba(0, 0, 0, 0.15),
                         0 12px 24px rgba(0, 0, 0, 0.2),
                         0 20px 40px rgba(0, 0, 0, 0.25),
                         inset 0 0 200px rgba(250, 245, 235, 0.4),
                         inset 0 1px 0 rgba(255, 255, 255, 0.8),
                         inset 0 -1px 0 rgba(200, 190, 175, 0.2)`,
                    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                    // Remove tilt - keep it flat
                    transform: 'none',
                    '&:hover': {
                      boxShadow: lightMode === 'dark'
                        ? `0 2px 4px rgba(0, 0, 0, 0.3),
                           0 8px 16px rgba(0, 0, 0, 0.4),
                           0 20px 40px rgba(0, 0, 0, 0.6),
                           inset 0 0 200px rgba(0, 0, 0, 0.2),
                           inset 0 1px 0 rgba(255, 255, 255, 0.04)`
                        : `0 1px 3px rgba(0, 0, 0, 0.12),
                           0 4px 8px rgba(0, 0, 0, 0.15),
                           0 16px 32px rgba(0, 0, 0, 0.25),
                           0 24px 48px rgba(0, 0, 0, 0.3),
                           inset 0 0 200px rgba(250, 245, 235, 0.4),
                           inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
                      transform: 'translateY(-2px)'
                    },
                    // Paper aging effect overlay
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: lightMode === 'dark'
                        ? 'radial-gradient(ellipse at top left, rgba(217, 119, 6, 0.06) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(139, 92, 46, 0.04) 0%, transparent 50%)'
                        : 'radial-gradient(ellipse at top left, rgba(250, 240, 220, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(240, 230, 210, 0.3) 0%, transparent 50%)',
                      pointerEvents: 'none',
                      zIndex: 0,
                      borderRadius: '2px'
                    },
                    // Paper grain/noise texture
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: lightMode === 'dark'
                        ? 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.15\'/%3E%3C/svg%3E")'
                        : 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
                      pointerEvents: 'none',
                      zIndex: 1,
                      opacity: 0.6,
                      mixBlendMode: lightMode === 'dark' ? 'multiply' : 'overlay'
                    }
                  }}
                >
                {/* Thumb Tacks */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #DC2626, #991B1B)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                    zIndex: 1,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
              transform: 'translate(-50%, -50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 0 2px rgba(255, 255, 255, 0.6)'
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #DC2626, #991B1B)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                    zIndex: 1,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 0 2px rgba(255, 255, 255, 0.6)'
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #DC2626, #991B1B)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                    zIndex: 1,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 0 2px rgba(255, 255, 255, 0.6)'
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #DC2626, #991B1B)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                    zIndex: 1,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.4)',
                      boxShadow: '0 0 2px rgba(255, 255, 255, 0.6)'
                    }
                  }}
                />

                <Box
                  sx={{
                    fontSize: { xs: '16px', sm: '18px' },
                    fontWeight: 600,
                    color: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.9)' : '#8B7355',
                    letterSpacing: '0.02em',
                    marginBottom: '4px',
                    fontFamily: 'serif',
                    textShadow: lightMode === 'dark' 
                      ? '1px 1px 2px rgba(0, 0, 0, 0.3)' 
                      : '1px 1px 2px rgba(255, 255, 255, 0.5)',
                    borderBottom: lightMode === 'dark'
                      ? '2px solid rgba(217, 119, 6, 0.3)'
                      : '2px solid rgba(139, 115, 85, 0.3)',
                    paddingBottom: { xs: '6px', sm: '8px' },
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  Scouting Report
                </Box>
                <Box
                  sx={{
              display: 'flex',
                    flexWrap: 'wrap',
                    gap: { xs: '20px', sm: '32px' },
                    width: '100%',
              justifyContent: 'center',
                    alignItems: 'flex-start'
            }}
          >
                  {bots.map((bot, index) => (
              <Box
                      key={bot.name}
                component="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (isDictionaryLoading || isBotThinking || isPlayerThinking) return;
                        handleBotSelect(bot);
                        setBotSelectOpen(true);
                }}
                      disabled={isDictionaryLoading || isBotThinking || isPlayerThinking}
                sx={{
                  display: 'flex',
                        flexDirection: 'column',
                  alignItems: 'center',
                        gap: { xs: '10px', sm: '12px' },
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: (isDictionaryLoading || isBotThinking || isPlayerThinking) ? 'not-allowed' : 'pointer',
                  opacity: (isDictionaryLoading || isBotThinking || isPlayerThinking) ? 0.5 : 1,
                  border: 'none',
                        background: 'transparent',
                        padding: 0,
                        '&:hover:not(:disabled)': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        },
                        '&:active:not(:disabled)': {
                          transform: 'scale(0.98)'
                        }
                      }}
                    >
                      <Box
                  sx={{
                          width: { xs: '70px', sm: '100px' },
                          height: { xs: '70px', sm: '100px' },
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <AnimatedMascot about={bot.name.toLowerCase()} />
                </Box>
                      <Box
                        sx={{
                          fontSize: { xs: '14px', sm: '18px' },
                          fontWeight: 700,
                          color: lightMode === 'dark' ? '#fff' : '#1F2937',
                          marginTop: '2px',
                          fontFamily: 'serif'
                        }}
                      >
                        {bot.name}
                      </Box>
                      <Box
                        sx={{
                          fontSize: { xs: '11px', sm: '13px' },
                          color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : '#4B5563',
                          textAlign: 'center',
                          lineHeight: 1.4,
                          maxWidth: { xs: '150px', sm: '200px' }
                  }}
                >
                        {bot.desc}
              </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
          )}

                {/* Multiplayer Card - Separate */}
                {!botSelectOpen && (
                <Box
                  sx={{
                        position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: { xs: '12px', sm: '16px' },
                    padding: { xs: '20px 16px', sm: '24px 20px' },
                    maxWidth: '650px',
                    width: '100%',
                    marginTop: { xs: '16px', sm: '20px' },
                backgroundColor: lightMode === 'dark' 
                  ? '#2A3A4A' 
                  : '#FDF9F3',
                backgroundImage: lightMode === 'dark'
                  ? `repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(120, 120, 120, 0.15) 22px, rgba(120, 120, 120, 0.15) 23px),
                     repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(80, 80, 80, 0.08) 1px, rgba(80, 80, 80, 0.08) 2px)`
                  : `repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(220, 210, 195, 0.4) 22px, rgba(220, 210, 195, 0.4) 23px),
                     repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(200, 190, 175, 0.15) 1px, rgba(200, 190, 175, 0.15) 2px)`,
                backgroundSize: '100% 23px, 2px 100%',
                border: lightMode === 'dark' 
                  ? '1px solid rgba(139, 115, 85, 0.2)' 
                  : '1px solid rgba(200, 185, 165, 0.4)',
                borderRadius: '2px',
                boxShadow: lightMode === 'dark'
                  ? `0 2px 4px rgba(0, 0, 0, 0.3),
                     0 8px 16px rgba(0, 0, 0, 0.4),
                     inset 0 0 200px rgba(0, 0, 0, 0.2)`
                  : `0 1px 3px rgba(0, 0, 0, 0.12),
                     0 4px 8px rgba(0, 0, 0, 0.15),
                     inset 0 0 200px rgba(250, 245, 235, 0.4)`,
                transition: 'box-shadow 0.3s ease',
                '&:hover': {
                  boxShadow: lightMode === 'dark'
                    ? `0 2px 4px rgba(0, 0, 0, 0.3),
                       0 8px 16px rgba(0, 0, 0, 0.4),
                       0 20px 40px rgba(0, 0, 0, 0.6)`
                    : `0 1px 3px rgba(0, 0, 0, 0.12),
                       0 4px 8px rgba(0, 0, 0, 0.15),
                       0 16px 32px rgba(0, 0, 0, 0.25)`
                }
              }}
            >
              <Box
                component="button"
                  onClick={() => {
                    window.location.href = '/multiplayer';
                  }}
                  disabled={isDictionaryLoading || isBotThinking || isPlayerThinking}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: (isDictionaryLoading || isBotThinking || isPlayerThinking) ? 'not-allowed' : 'pointer',
                    opacity: (isDictionaryLoading || isBotThinking || isPlayerThinking) ? 0.5 : 1,
                    border: 'none',
                    background: 'transparent',
                    padding: '12px',
                    transition: 'transform 0.2s ease',
                    '&:hover:not(:disabled)': {
                      transform: 'translateY(-2px)'
                    },
                    '&:active:not(:disabled)': {
                      transform: 'translateY(0)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '80px', sm: '100px' },
                      height: { xs: '80px', sm: '100px' },
                      borderRadius: '50%',
                      background: lightMode === 'dark'
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
                        : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
                      border: lightMode === 'dark'
                        ? '2px solid rgba(99, 102, 241, 0.5)'
                        : '2px solid rgba(99, 102, 241, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: { xs: '32px', sm: '40px' },
                      color: lightMode === 'dark' ? '#818CF8' : '#6366F1',
                      boxShadow: lightMode === 'dark'
                        ? '0 4px 16px rgba(99, 102, 241, 0.3)'
                        : '0 4px 16px rgba(99, 102, 241, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    👥
                  </Box>
                  <Box
                    sx={{
                      fontSize: { xs: '16px', sm: '18px' },
                      fontWeight: 600,
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      fontFamily: 'serif',
                      letterSpacing: '0.02em'
                    }}
                  >
                    Multiplayer (Beta)
                  </Box>
                  <Box
                    sx={{
                      fontSize: { xs: '11px', sm: '12px' },
                      color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                      textAlign: 'center',
                      maxWidth: '200px',
                      lineHeight: 1.3
                    }}
                  >
                    Play with friends in real-time
                  </Box>
                  <Box
                    sx={{
                      fontSize: { xs: '10px', sm: '11px' },
                      color: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.7)' : '#A78B5B',
                      textAlign: 'center',
                      marginTop: '-4px'
                    }}
                  >
                    No sign-up required
                  </Box>
                </Box>
              </Box>
                )}

                {/* Bot Selection Slideout */}
                {botSelectOpen && (
                <>
            <Box 
              sx={{
                    position: { xs: 'fixed', sm: 'relative' },
                    top: { xs: 'auto', sm: 'auto' },
                    left: { xs: 0, sm: 'auto' },
                    right: { xs: 0, sm: 'auto' },
                    bottom: { xs: 0, sm: 'auto' },
                    width: '100%',
                    maxWidth: { xs: '100%', sm: '500px', md: '540px' },
                    height: { xs: 'auto', sm: 'auto' },
                    maxHeight: { xs: 'min(92vh, 780px)', sm: 'min(85vh, 720px)' },
                    backgroundColor: lightMode === 'dark' ? '#1F2937' : '#ffffff',
                    borderLeft: { xs: 'none', sm: lightMode === 'dark' ? '1px solid rgba(139, 115, 85, 0.1)' : '1px solid rgba(200, 180, 150, 0.2)' },
                    boxShadow: { xs: '0 -8px 32px rgba(0,0,0,0.35)', sm: '0 4px 24px rgba(0,0,0,0.12)' },
                    borderRadius: { xs: '16px 16px 0 0', sm: '12px' },
                    padding: 0,
                    overflow: 'hidden',
                    transform: 'none',
                    zIndex: { xs: 1300, sm: 2 },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Back Button */}
                  <Box
                    component="button"
                    onClick={() => { setBotSelectOpen(false); setShowTimeControls(false); }}
                    sx={{
                      position: 'absolute',
                      top: { xs: '12px', sm: '12px' },
                      left: { xs: '12px', sm: '12px' },
                      background: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      border: 'none',
                cursor: 'pointer',
                      padding: { xs: '6px 10px', sm: '6px 10px' },
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '4px',
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      zIndex: 10,
                      borderRadius: 4,
                      fontSize: { xs: '12px', sm: '12px' },
                      fontWeight: 600,
                transition: 'all 0.2s ease',
                '&:hover': {
                        background: lightMode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                        transform: 'translateX(-2px)'
                      }
                    }}
                  >
                    <CaretDown 
                      size={16} 
                      weight="bold" 
                      style={{ 
                        transform: 'rotate(90deg)'
                      }} 
                    />
                    Back
      </Box>

                  {/* Slide panels wrapper */}
                  <Box sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  {/* Bot Selection Content */}
          <Box
            sx={{
                      transform: { 
                        xs: showTimeControls ? 'translateY(-100%)' : 'translateY(0)', 
                        sm: showTimeControls ? 'translateX(-100%)' : 'translateX(0)' 
                      },
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      width: '100%',
                      maxWidth: '100%',
                      height: '100%',
              display: 'flex',
              flexDirection: 'column',
                      overflow: 'hidden',
                      backgroundColor: lightMode === 'dark' ? '#1F2937' : '#ffffff',
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      flex: 1,
                      minHeight: 0,
                      boxSizing: 'border-box'
                    }}
                  >
                    <Box sx={{ flexShrink: 0, padding: { xs: '40px 16px 8px', sm: '40px 20px 8px' }, textAlign: 'center' }}>
                      <Box sx={{ fontSize: { xs: '16px', sm: '17px' }, fontWeight: 700, letterSpacing: '0.01em', color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                        Who will you play against today?
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: { xs: '0 16px', sm: '0 20px' }, boxSizing: 'border-box' }}>
                      <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                        {skillBots.map(bot => (
                          <Box
                            key={bot.name}
                            onClick={() => { setCustomBotSelected(false); setCustomDefenseBotSelected(false); handleBotSelect(bot); }}
                            sx={{
                              width: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              display: 'flex',
              alignItems: 'center',
                              gap: { xs: 6, sm: 6 },
                              background: selectedBot.name === bot.name && !customBotSelected 
                                ? 'rgba(96,165,250,0.08)' 
                                : (lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'),
                              border: selectedBot.name === bot.name && !customBotSelected 
                                ? '2px solid #3D5A80' 
                                : (lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'),
                              borderRadius: 4,
                              boxShadow: selectedBot.name === bot.name && !customBotSelected ? '0 2px 8px rgba(61,90,128,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
                              cursor: 'pointer',
                              padding: { xs: '6px 8px', sm: '5px 8px' },
                              marginBottom: { xs: 2, sm: 1.5 },
                              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                              position: 'relative',
                              overflow: 'hidden',
                              '&:hover': {
                                transform: 'translateX(2px)',
                                boxShadow: selectedBot.name === bot.name && !customBotSelected ? '0 3px 12px rgba(61,90,128,0.15)' : '0 2px 6px rgba(0,0,0,0.08)'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: { xs: '18px', sm: '18px' }, height: { xs: '18px', sm: '18px' }, '& img': { width: '100%', height: '100%', objectFit: 'contain' } }}>{bot.icon}</Box>
                            <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                              <Box sx={{ fontWeight: 700, fontSize: { xs: '14px', sm: '13px' }, color: lightMode === 'dark' ? '#fff' : '#1F2937', marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bot.name}</Box>
                              <Box sx={{ fontSize: { xs: '12px', sm: '12px' }, color: lightMode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bot.desc}</Box>
                            </Box>
                            <Box
                              component="button"
                              onClick={e => { e.stopPropagation(); setCustomBotSelected(false); setCustomDefenseBotSelected(false); handleBotSelect(bot); }}
                sx={{
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                background: selectedBot.name === bot.name && !customBotSelected ? 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)' : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                  color: '#fff',
                                border: 0,
                                borderRadius: 3,
                                padding: { xs: '6px 10px', sm: '5px 10px' },
                                fontWeight: 600,
                                letterSpacing: 0.3,
                                fontSize: { xs: '12px', sm: '12px' },
                                boxShadow: selectedBot.name === bot.name && !customBotSelected ? '3px 0px 0px #60A5FA' : '3px 0px 0px #374151',
                                outline: 'transparent',
                                cursor: 'pointer',
                                userSelect: 'none',
                                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                                opacity: selectedBot.name === bot.name && !customBotSelected ? 1 : 0.85
                }}
              >
                              {selectedBot.name === bot.name && !customBotSelected ? 'Selected' : 'Choose'}
              </Box>
          </Box>
                        ))}
                        {/* Custom bot item */}
                        <Box
                          onClick={() => { if (/^\d+$/.test(customRank) && parseInt(customRank) > 0) { setCustomBotSelected(true); setCustomDefenseBotSelected(false); handleBotSelect({ name: `Custom`, desc: `Plays the ${customRank}th best move by points + leave.`, customRank: parseInt(customRank) }); } }}
                          sx={{
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 6, sm: 6 },
                            background: customBotSelected 
                              ? 'rgba(96,165,250,0.08)' 
                              : (lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'),
                            border: customBotSelected 
                              ? '2px solid #3D5A80' 
                              : (lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'),
                            borderRadius: 4,
                            overflow: 'hidden',
                            boxShadow: customBotSelected ? '0 2px 8px rgba(61,90,128,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            padding: { xs: '6px 8px', sm: '5px 8px' },
                            marginBottom: { xs: 2, sm: 1.5 },
                            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                            position: 'relative',
                            '&:hover': {
                              transform: 'translateX(2px)',
                              boxShadow: customBotSelected ? '0 3px 12px rgba(61,90,128,0.15)' : '0 2px 6px rgba(0,0,0,0.08)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: { xs: '18px', sm: '18px' }, height: { xs: '18px', sm: '18px' } }}><Robot size={18} color="#9CA3AF" /></Box>
                          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                            <Box sx={{ fontWeight: 700, fontSize: { xs: '12px', sm: '11px' }, color: lightMode === 'dark' ? '#fff' : '#1F2937', marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Custom</Box>
                            <Box sx={{ fontSize: { xs: '10px', sm: '9px' }, color: lightMode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280', lineHeight: 1.3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
                              Play <input 
                                type="text" 
                                value={customRank} 
                                onChange={e => { if (/^\d*$/.test(e.target.value)) setCustomRank(e.target.value); }} 
                                placeholder="X" 
                                onClick={(e) => e.stopPropagation()}
                                style={{ 
                                  width: 24, 
                                  fontSize: '9px', 
                                  textAlign: 'center', 
                                  border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb', 
                                  borderRadius: 2, 
                                  margin: 0, 
                                  padding: '1px 2px',
                                  background: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#fff',
                                  color: lightMode === 'dark' ? '#fff' : '#1F2937'
                                }} 
                              />th by points + leave
            </Box>
            </Box>
                          <Box
                            component="button"
                            disabled={!/^\d+$/.test(customRank) || parseInt(customRank) <= 0}
                            onClick={e => { e.stopPropagation(); if (/^\d+$/.test(customRank) && parseInt(customRank) > 0) { setCustomBotSelected(true); setCustomDefenseBotSelected(false); handleBotSelect({ name: `Custom`, desc: `Plays the ${customRank}th best move by points + leave.`, customRank: parseInt(customRank) }); } }}
                            sx={{
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              background: customBotSelected ? 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)' : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                              color: '#fff',
                              border: 0,
                              borderRadius: 3,
                              padding: { xs: '4px 8px', sm: '3px 8px' },
                              fontWeight: 600,
                              letterSpacing: 0.3,
                              fontSize: { xs: '10px', sm: '9px' },
                              boxShadow: customBotSelected ? '3px 0px 0px #60A5FA' : '3px 0px 0px #374151',
                              outline: 'transparent',
                              cursor: /^\d+$/.test(customRank) && parseInt(customRank) > 0 ? 'pointer' : 'not-allowed',
                              userSelect: 'none',
                              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                              opacity: customBotSelected ? 1 : 0.85
                            }}
                          >
                            {customBotSelected ? 'Selected' : 'Choose'}
            </Box>
            </Box>
            
                        {/* Custom Defense Bot item */}
            <Box
                          onClick={() => { setCustomDefenseBotSelected(true); setCustomBotSelected(false); handleBotSelect({ name: `Defense Bot`, desc: `Uses defense analysis with ${defenseWeight.toFixed(1)}x defense weight.`, defenseWeight: defenseWeight }); }}
                          sx={{
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 6, sm: 6 },
                            background: customDefenseBotSelected 
                              ? 'rgba(96,165,250,0.08)' 
                              : (lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'),
                            border: customDefenseBotSelected 
                              ? '2px solid #3D5A80' 
                              : (lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'),
                            borderRadius: 4,
                            overflow: 'hidden',
                            boxShadow: customDefenseBotSelected ? '0 2px 8px rgba(61,90,128,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            padding: { xs: '6px 8px', sm: '5px 8px' },
                            marginBottom: { xs: 2, sm: 1.5 },
                            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                            position: 'relative',
                            '&:hover': {
                              transform: 'translateX(2px)',
                              boxShadow: customDefenseBotSelected ? '0 3px 12px rgba(61,90,128,0.15)' : '0 2px 6px rgba(0,0,0,0.08)'
                            }
                          }}
            >
                          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: { xs: '18px', sm: '18px' }, height: { xs: '18px', sm: '18px' } }}><Robot size={18} color="#9CA3AF" /></Box>
                          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                            <Box sx={{ fontWeight: 700, fontSize: { xs: '12px', sm: '11px' }, color: lightMode === 'dark' ? '#fff' : '#1F2937', marginBottom: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Custom Defense</Box>
                            <Box sx={{ fontSize: { xs: '10px', sm: '9px' }, color: lightMode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280', marginBottom: 0.5 }}>
                              Defense Weight: {defenseWeight.toFixed(1)}x
            </Box>
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
                                  width: { xs: 12, sm: 10 },
                                  height: { xs: 12, sm: 10 },
                                },
                                '& .MuiSlider-track': {
                                  height: 2,
                                },
                                '& .MuiSlider-rail': {
                                  height: 2,
                                  opacity: 0.3,
                                },
                              }}
                            />
          </Box>
                          <Box
                            component="button"
                            onClick={e => { e.stopPropagation(); setCustomDefenseBotSelected(true); setCustomBotSelected(false); handleBotSelect({ name: `Defense Bot`, desc: `Uses defense analysis with ${defenseWeight.toFixed(1)}x defense weight.`, defenseWeight: defenseWeight }); }}
                            sx={{
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              background: customDefenseBotSelected ? 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)' : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                              color: '#fff',
                              border: 0,
                              borderRadius: 3,
                              padding: { xs: '4px 8px', sm: '3px 8px' },
                              fontWeight: 600,
                              letterSpacing: 0.3,
                              fontSize: { xs: '10px', sm: '9px' },
                              boxShadow: customDefenseBotSelected ? '3px 0px 0px #60A5FA' : '3px 0px 0px #374151',
                              outline: 'transparent',
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                              opacity: customDefenseBotSelected ? 1 : 0.85
                            }}
                          >
                            {customDefenseBotSelected ? 'Selected' : 'Choose'}
        </Box>
      </Box>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        flexShrink: 0,
                        padding: { xs: '12px 16px 16px', sm: '12px 20px 16px' },
                        borderTop: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                        backgroundColor: lightMode === 'dark' ? '#1F2937' : '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                    <Box
                      component="button"
                      onClick={() => { setShowTimeControls(true); }}
                      sx={{
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        background: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.9)' : 'rgba(217, 119, 6, 0.95)',
                        color: '#fff',
            border: 'none', 
                        borderRadius: 4,
                        padding: { xs: '12px 16px', sm: '11px 16px' },
                        fontWeight: 600,
                        fontSize: { xs: '14px', sm: '14px' },
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: lightMode === 'dark' ? 'rgba(217, 119, 6, 1)' : 'rgba(217, 119, 6, 1)',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                        },
                        '&:active': {
                          transform: 'scale(0.98)'
                        }
          }}
        >
                      Continue
                    </Box>
                    </Box>
                  </Box>

          {/* Time Controls Slideout */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
                      backgroundColor: lightMode === 'dark' ? '#1F2937' : '#ffffff',
              transform: showTimeControls ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 10,
              boxSizing: 'border-box'
            }}
          >
                    <Box sx={{ flexShrink: 0, padding: { xs: '40px 16px 8px', sm: '40px 20px 8px' }, textAlign: 'center' }}>
                      <Box sx={{ fontSize: { xs: '16px', sm: '17px' }, fontWeight: 700, letterSpacing: '0.01em', color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
              Options
                      </Box>
                    </Box>

                    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: { xs: '0 16px', sm: '0 20px' }, boxSizing: 'border-box' }}>
            {/* Time Controls */}
            <Box sx={{ width: '100%', marginBottom: 2 }}>
                      <Box sx={{ fontSize: { xs: '10px', sm: '10px' }, fontWeight: 600, marginBottom: 0.5, color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Time
                      </Box>
                      <Box sx={{ fontSize: { xs: '13px', sm: '13px' }, fontWeight: 700, marginBottom: 1, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {gameTime} {gameTime === 1 ? 'minute' : 'minutes'}
                      </Box>
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
                            width: { xs: 14, sm: 12 },
                            height: { xs: 14, sm: 12 },
                  },
                  '& .MuiSlider-track': {
                    height: 2,
                  },
                  '& .MuiSlider-rail': {
                    height: 2,
                    opacity: 0.3,
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5, marginTop: 0.5 }}>
                {[5, 10, 15, 30].map((time) => (
                          <Box
                    key={time}
                            component="button"
                    onClick={() => setGameTime(time)}
                            sx={{
                              padding: { xs: '6px 8px', sm: '6px 8px' },
                              fontSize: { xs: '12px', sm: '12px' },
                      fontWeight: 600,
                              color: gameTime === time ? '#fff' : (lightMode === 'dark' ? 'rgba(255,255,255,0.8)' : '#374151'),
                              backgroundColor: gameTime === time ? '#3D5A80' : (lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.04)'),
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      flex: 1,
                      opacity: gameTime === time ? 1 : 0.85
                    }}
                  >
                    {time}
                          </Box>
                ))}
              </Box>
            </Box>

            {/* Dictionary Dropdown */}
            <Box sx={{ width: '100%', marginBottom: 2 }}>
                      <Box sx={{ fontSize: { xs: '10px', sm: '10px' }, fontWeight: 600, marginBottom: 0.5, color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dictionary
                      </Box>
              <FormControl fullWidth size="small" variant="outlined" sx={{ marginBottom: 0 }}>
                <Select
                  value={selectedDictionary}
                  onChange={(e) => setSelectedDictionary(e.target.value)}
                  sx={{
                            fontSize: { xs: '14px', sm: '14px' },
                    fontWeight: 600,
                            color: lightMode === 'dark' ? '#fff' : '#1F2937',
                            backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                      borderWidth: '1px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3D5A80'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3D5A80'
                    },
                    '& .MuiSvgIcon-root': {
                              color: lightMode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280',
                      fontSize: '16px'
                    }
                  }}
                >
                          <MenuItem value="NWL" sx={{ fontSize: { xs: '12px', sm: '11px' }, fontWeight: 600 }}>NWL</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Variants — collapsed by default to reduce scroll */}
            <Box sx={{ width: '100%', marginBottom: 2 }}>
              <Box
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: { xs: '10px 12px', sm: '9px 12px' },
                  backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#3D5A80',
                    backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(61, 90, 128, 0.05)'
                  }
                }}
              >
                <Box>
                  <Box sx={{ fontSize: { xs: '13px', sm: '13px' }, fontWeight: 600, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                    Variants (optional)
                  </Box>
                  {!showAdvancedOptions && (randomizeBonusSquares || twoTurnsPerPlayer || variablePool) && (
                    <Box sx={{ fontSize: { xs: '11px', sm: '11px' }, color: lightMode === 'dark' ? 'rgba(255,255,255,0.5)' : '#6B7280', marginTop: '2px' }}>
                      Custom settings enabled
                    </Box>
                  )}
                </Box>
                <CaretDown
                  size={16}
                  weight="bold"
                  color={lightMode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280'}
                  style={{
                    transform: showAdvancedOptions ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </Box>

              <Collapse in={showAdvancedOptions}>
            <Box sx={{ marginTop: 1 }}>
              
              {/* Randomize Bonus Squares */}
              <Box sx={{ marginBottom: 1 }}>
                <Box 
                  onClick={() => setRandomizeBonusSquares(!randomizeBonusSquares)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: { xs: '6px 8px', sm: '5px 8px' },
                    backgroundColor: randomizeBonusSquares ? 'rgba(61, 90, 128, 0.1)' : (lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'),
                    border: randomizeBonusSquares ? '2px solid #3D5A80' : (lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'),
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#3D5A80',
                      backgroundColor: randomizeBonusSquares ? 'rgba(61, 90, 128, 0.15)' : 'rgba(61, 90, 128, 0.05)'
                    }
                  }}
                >
                  <Box sx={{ fontSize: { xs: '12px', sm: '11px' }, fontWeight: 600, color: randomizeBonusSquares ? '#3D5A80' : (lightMode === 'dark' ? '#fff' : '#1F2937') }}>
                    Randomize bonus squares
                  </Box>
                  <Box
                    sx={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      border: randomizeBonusSquares ? '4px solid #3D5A80' : '2px solid #9CA3AF',
                      backgroundColor: randomizeBonusSquares ? '#3D5A80' : 'transparent',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&::after': randomizeBonusSquares ? {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '4px',
                        height: '8px',
                        border: 'solid white',
                        borderWidth: '0 2px 2px 0',
                        transform: 'translate(-50%, -60%) rotate(45deg)'
                      } : {}
                    }}
                  />
                </Box>
                
                {/* Bonus Square Customization */}
                <Collapse in={randomizeBonusSquares}>
                  <Box sx={{ marginTop: 1, padding: '8px', backgroundColor: lightMode === 'dark' ? 'rgba(61, 90, 128, 0.05)' : 'rgba(61, 90, 128, 0.03)', borderRadius: '6px', border: '1px solid rgba(61, 90, 128, 0.2)' }}>
                    <Box sx={{ fontSize: { xs: '10px', sm: '9px' }, fontWeight: 600, marginBottom: 1, color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Distribution
                    </Box>
                    <Select
                      value={bonusSquarePreset}
                      onChange={(e) => {
                        const preset = e.target.value;
                        setBonusSquarePreset(preset);
                        if (preset === 'default') {
                          setCustomBonusSquareDistribution(null);
                        } else if (preset === 'word-heavy') {
                          setCustomBonusSquareDistribution({ TWS: 12, DWS: 20, TLS: 8, DLS: 20 });
                        } else if (preset === 'letter-heavy') {
                          setCustomBonusSquareDistribution({ TWS: 4, DWS: 8, TLS: 20, DLS: 28 });
                        } else if (preset === 'extreme') {
                          setCustomBonusSquareDistribution({ TWS: 20, DWS: 0, TLS: 0, DLS: 0 });
                        } else if (preset === 'advanced') {
                          setCustomBonusSquareDistribution({ TWS: 8, DWS: 16, TLS: 12, DLS: 24 });
                        }
                      }}
                      size="small"
                      fullWidth
                      sx={{
                        fontSize: { xs: '11px', sm: '10px' },
                        fontWeight: 600,
                        color: lightMode === 'dark' ? '#fff' : '#1F2937',
                        backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#fff',
                        marginBottom: 1,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3D5A80',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3D5A80',
                        }
                      }}
                    >
                      <MenuItem value="default" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Default (8 TWS, 16 DWS, 12 TLS, 24 DLS)</MenuItem>
                      <MenuItem value="word-heavy" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Word-Heavy</MenuItem>
                      <MenuItem value="letter-heavy" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Letter-Heavy</MenuItem>
                      <MenuItem value="extreme" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Extreme (All TWS)</MenuItem>
                      <MenuItem value="advanced" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Advanced (Custom)</MenuItem>
                    </Select>
                    
                    {/* Advanced Custom Editor */}
                    {bonusSquarePreset === 'advanced' ? (
                      <Box sx={{ marginTop: 1 }}>
                        <Box sx={{ fontSize: { xs: '10px', sm: '9px' }, fontWeight: 600, marginBottom: 0.5, color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Square Counts
                        </Box>
                        <BonusSquareEditor 
                          distribution={customBonusSquareDistribution} 
                          onDistributionChange={setCustomBonusSquareDistribution}
                          lightMode={lightMode}
                        />
                      </Box>
                    ) : null}
                  </Box>
                </Collapse>
              </Box>
              
              {/* 2 Turns Per Player */}
              <Box>
                <Box 
                  onClick={() => setTwoTurnsPerPlayer(!twoTurnsPerPlayer)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: { xs: '6px 8px', sm: '5px 8px' },
                    backgroundColor: twoTurnsPerPlayer ? 'rgba(61, 90, 128, 0.1)' : (lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'),
                    border: twoTurnsPerPlayer ? '2px solid #3D5A80' : (lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'),
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#3D5A80',
                      backgroundColor: twoTurnsPerPlayer ? 'rgba(61, 90, 128, 0.15)' : 'rgba(61, 90, 128, 0.05)'
                    }
                  }}
                >
                  <Box sx={{ fontSize: { xs: '12px', sm: '11px' }, fontWeight: 600, color: twoTurnsPerPlayer ? '#3D5A80' : (lightMode === 'dark' ? '#fff' : '#1F2937') }}>
                    2 turns per player
                  </Box>
                  <Box
                    sx={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      border: twoTurnsPerPlayer ? '4px solid #3D5A80' : '2px solid #9CA3AF',
                      backgroundColor: twoTurnsPerPlayer ? '#3D5A80' : 'transparent',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&::after': twoTurnsPerPlayer ? {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '4px',
                        height: '8px',
                        border: 'solid white',
                        borderWidth: '0 2px 2px 0',
                        transform: 'translate(-50%, -60%) rotate(45deg)'
                      } : {}
                    }}
                  />
                </Box>
              </Box>
              
              {/* Variable Pool */}
              <Box sx={{ marginTop: 1 }}>
                <Box 
                  onClick={() => setVariablePool(!variablePool)}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: { xs: '6px 8px', sm: '5px 8px' },
                    backgroundColor: variablePool ? 'rgba(61, 90, 128, 0.1)' : (lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'),
                    border: variablePool ? '2px solid #3D5A80' : (lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'),
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#3D5A80',
                      backgroundColor: variablePool ? 'rgba(61, 90, 128, 0.15)' : 'rgba(61, 90, 128, 0.05)'
                    }
                  }}
                >
                  <Box sx={{ fontSize: { xs: '12px', sm: '11px' }, fontWeight: 600, color: variablePool ? '#3D5A80' : (lightMode === 'dark' ? '#fff' : '#1F2937') }}>
                    Variable pool
                  </Box>
                  <Box
                    sx={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      border: variablePool ? '4px solid #3D5A80' : '2px solid #9CA3AF',
                      backgroundColor: variablePool ? '#3D5A80' : 'transparent',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&::after': variablePool ? {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '4px',
                        height: '8px',
                        border: 'solid white',
                        borderWidth: '0 2px 2px 0',
                        transform: 'translate(-50%, -60%) rotate(45deg)'
                      } : {}
                    }}
                  />
                </Box>
                
                {/* Variable Pool Settings */}
                <Collapse in={variablePool}>
                  <Box sx={{ marginTop: 1, padding: '8px', backgroundColor: lightMode === 'dark' ? 'rgba(61, 90, 128, 0.05)' : 'rgba(61, 90, 128, 0.03)', borderRadius: '6px', border: '1px solid rgba(61, 90, 128, 0.2)' }}>
                    <Box sx={{ fontSize: { xs: '10px', sm: '9px' }, fontWeight: 600, marginBottom: 1, color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Preset
                    </Box>
                    <Select
                      value={poolPreset}
                      onChange={(e) => {
                        const preset = e.target.value;
                        setPoolPreset(preset);
                        if (preset === 'standard') {
                          setCustomPool(null);
                        } else if (preset === 'advanced') {
                          // Initialize with standard distribution for editing
                          setCustomPool('ADVANCED:' + origPool);
                        } else {
                          setCustomPool(generatePoolFromPreset(preset));
                        }
                      }}
                      size="small"
                      fullWidth
                      sx={{
                        fontSize: { xs: '11px', sm: '10px' },
                        fontWeight: 600,
                        color: lightMode === 'dark' ? '#fff' : '#1F2937',
                        backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#fff',
                        marginBottom: 1,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: lightMode === 'dark' ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3D5A80',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3D5A80',
                        }
                      }}
                    >
                      <MenuItem value="standard" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Standard</MenuItem>
                      <MenuItem value="vowel-heavy" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Vowel-Heavy</MenuItem>
                      <MenuItem value="consonant-heavy" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Consonant-Heavy</MenuItem>
                      <MenuItem value="advanced" sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600 }}>Advanced (Custom)</MenuItem>
                    </Select>
                    
                    {/* Advanced Custom Editor */}
                    {poolPreset === 'advanced' ? (
                      <Box sx={{ marginTop: 1 }}>
                        <Box sx={{ fontSize: { xs: '10px', sm: '9px' }, fontWeight: 600, marginBottom: 0.5, color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Letter Counts
                        </Box>
                        <VariablePoolEditor 
                          currentPool={customPool} 
                          onPoolChange={setCustomPool}
                          lightMode={lightMode}
                        />
                      </Box>
                    ) : null}
                  </Box>
                </Collapse>
              </Box>
            </Box>
              </Collapse>
            </Box>

            {/* Move Coach & Theo Yell Toggles - Grouped, Mutually Exclusive */}
            <Box sx={{ width: '100%', marginTop: 1, marginBottom: 2 }}>
                      <Box sx={{ fontSize: { xs: '11px', sm: '11px' }, fontWeight: 600, marginBottom: 1, color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Analysis Mode
                      </Box>
              
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
                            padding: { xs: '6px 8px', sm: '5px 8px' },
                            backgroundColor: theoYellEnabled ? 'rgba(217, 119, 6, 0.1)' : (lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'),
                            border: theoYellEnabled ? '2px solid #D97706' : (lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'),
                    borderRadius: 4,
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
                            <Box sx={{ fontSize: { xs: '12px', sm: '11px' }, fontWeight: 600, color: theoYellEnabled ? '#D97706' : (lightMode === 'dark' ? '#fff' : '#1F2937') }}>
                      Have Theo Yell at You
                            </Box>
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
                                <Box sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600, color: '#D97706' }}>
                          {theoYellSettingsExpanded ? 'Hide' : 'Settings'}
                                </Box>
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
                            <Box sx={{ fontSize: { xs: '11px', sm: '10px' }, fontWeight: 600, marginBottom: 4, color: lightMode === 'dark' ? 'rgba(255,255,255,0.6)' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Trigger When
                            </Box>
                    
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
                              <Box sx={{ fontSize: { xs: '12px', sm: '11px' }, fontWeight: 500, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                        When I miss a bingo
                              </Box>
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
                              <Box sx={{ fontSize: { xs: '12px', sm: '11px' }, fontWeight: 500, color: lightMode === 'dark' ? '#fff' : '#1F2937', flex: 1 }}>
                        Move scores under
                              </Box>
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
                                    border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #d1d5db',
                            borderRadius: '4px',
                                    textAlign: 'center',
                                    background: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#fff',
                                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                          }}
                        />
                      )}
                      {theoYellCriteria === 'score' && (
                                <Box sx={{ fontSize: { xs: '12px', sm: '11px' }, color: lightMode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280', marginLeft: '4px' }}>points</Box>
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
                          padding: { xs: '6px 8px', sm: '5px 8px' },
                          backgroundColor: lightMode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5',
                          border: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #d1d5db',
                  borderRadius: 4,
                  marginTop: '4px',
                  cursor: 'not-allowed',
                  opacity: 0.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={14} color="#9CA3AF" weight="regular" />
                          <Box sx={{ fontSize: { xs: '12px', sm: '11px' }, fontWeight: 600, color: '#9CA3AF' }}>
                    Move Coach
                          </Box>
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
                    </Box>

            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                gap: { xs: 8, sm: 8 },
                width: '100%',
                padding: { xs: '12px 16px 16px', sm: '12px 20px 16px' },
                borderTop: lightMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                backgroundColor: lightMode === 'dark' ? '#1F2937' : '#ffffff',
                boxSizing: 'border-box'
              }}
            >
                      <Box
                        component="button"
                onClick={() => setShowTimeControls(false)}
                        sx={{
                  flex: 1,
                  marginTop: 0,
                          background: lightMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f0f0f0',
                          color: lightMode === 'dark' ? '#fff' : '#1F2937',
                  border: 'none',
                  borderRadius: 4,
                          padding: { xs: '12px 16px', sm: '11px 16px' },
                  fontWeight: 600,
                          fontSize: { xs: '14px', sm: '14px' },
                  cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: lightMode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0'
                          }
                }}
              >
                Back
                      </Box>
                      <Box
                        component="button"
                onClick={handleStartGame}
                        sx={{
                  flex: 1,
                  marginTop: 0,
                          background: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.9)' : 'rgba(217, 119, 6, 0.95)',
                          color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                          padding: { xs: '12px 16px', sm: '11px 16px' },
                  fontWeight: 600,
                          fontSize: { xs: '14px', sm: '14px' },
                  cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: lightMode === 'dark' ? 'rgba(217, 119, 6, 1)' : 'rgba(217, 119, 6, 1)',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                          },
                          '&:active': {
                            transform: 'scale(0.98)'
                          }
                }}
              >
                Start Game
                      </Box>
                    </Box>
            </Box>
                  </Box>
            </Box>

                {/* Backdrop for mobile */}
                {botSelectOpen && (
          <Box
                    onClick={() => { setBotSelectOpen(false); setShowTimeControls(false); }}
            sx={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 1200,
                      display: { xs: 'block', sm: 'none' }
                    }}
                  />
                )}
                </>
                )}
              </Box>
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
            telestratorEnabled={telestratorEnabled}
            onToggleTelestrator={setTelestratorEnabled}
            topeThinking={topeThinking}
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
                  : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
                border: lightMode === 'dark' ? 'none' : '1px solid #D1D5DB',
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
                  : 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.98) 100%)',
                boxShadow: lightMode === 'dark' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.08)'
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
                    : '1px solid rgba(209, 213, 219, 1)',
                  backgroundColor: lightMode === 'dark'
                    ? 'rgba(17, 24, 39, 0.9)'
                    : '#F9FAFB',
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
    </Box>
  );
} 