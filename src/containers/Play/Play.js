import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Play.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import PlayPool from "../../components/AppContent/Board/PlayPool.js";
import Modal from '@mui/material/Modal';
import { origPool, origBoard, letterLookup } from "../../components/AppContent/References/staticData.js";
import { TEST_RACKS } from "../../components/AppContent/References/testRacks.js";
import { createBoard } from "../../functions/boardFunctions.js";
import { Snackbar, Alert, Slider, Tooltip } from "@mui/material";
import ChoicesModal from '../../components/Modals/ChoicesModal';
import PlayerInfo from './components/PlayerInfo';
import ColorScheme from '../../components/common/ColorScheme';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import SortIcon from '@mui/icons-material/Sort';
import MoveHistoryModal from '../../components/Modals/MoveHistoryModal';
import { simulateMove as simulateMoveFunction } from '../../functions/simulationFunctions';
import { calculateScore } from '../../functions/scoreFunctions';
import { initializeSounds, updateSoundType, handleSoundError } from '../../functions/play/soundFunctions';
import { alphabetizeRack } from '../../functions/play/rackFunctions';
import { handleTileDrop, handleTileClick } from '../../functions/play/tileFunctions';
import { handleBoardPositionSelect } from "../../functions/play/boardFunctions.js";
import { handleKeyDown, handleKeyPress } from '../../functions/play/keyboardFunctions';
import { makeBotMove, startBotGame } from '../../functions/play/botFunctions';
import { calculateLeave, fetchLeaveValues, calculateExchangeLeave } from '../../functions/play/leaveFunctions';
import { handleExchange } from '../../functions/play/exchangeFunctions';
import { handleWordSubmit } from '../../functions/play/wordSubmitFunctions';
import { handleGetTopMoves, handlePlayTopMove, handleMoveSelect } from '../../functions/play/moveFunctions';
import { getBoardDiff } from '../../functions/play/boardUtils';
import { handlePass } from '../../functions/play/passFunctions';
import { handleGameEnd } from '../../functions/play/gameEndFunctions';
import { formatTime } from '../../functions/play/timeUtils';

const boardMultipliers = JSON.parse(origBoard);

export default function Play() {
  const [boardCoords, setBoardCoords] = useState([]);
  const [tempBoardCoords, setTempBoardCoords] = useState([]);
  const [origBoardCoords, setOrigBoardCoords] = useState([]);
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pool, setPool] = useState(origPool);
  const [theme, setTheme] = useState("STANDARD");
  const [open, setOpen] = useState(false);
  const [modalContent, setModalContent] = useState("settings");
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [player1Rack, setPlayer1Rack] = useState([]);
  const [player2Rack, setPlayer2Rack] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]); 
  const [selectedBoardPosition, setSelectedBoardPosition] = useState(null);
  const [arrowDirection, setArrowDirection] = useState('right');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const color = useRef('#b064af');
  const boardColor = useRef('#ffffff');
  const complementaryColor = useRef('#9F7A83');
  const [isBotMode, setIsBotMode] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isPlayerThinking, setIsPlayerThinking] = useState(false);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [player1Time, setPlayer1Time] = useState(20 * 60); // 20 minutes in seconds
  const [player2Time, setPlayer2Time] = useState(20 * 60); // 20 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef(null);
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [showTopMoves, setShowTopMoves] = useState(false);
  const [topMoves, setTopMoves] = useState([]);
  const [isLoadingTopMoves, setIsLoadingTopMoves] = useState(false);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);
  const [botGoesFirst, setBotGoesFirst] = useState(false);
  const [tilesToExchange, setTilesToExchange] = useState([]);
  const [blankTiles, setBlankTiles] = useState([]); // Track positions of blank tiles
  const [gameTime, setGameTime] = useState(20); // in minutes
  const [showTimeSlider, setShowTimeSlider] = useState(false);
  const [showMoveHistory, setShowMoveHistory] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [simulatingMove, setSimulatingMove] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [previewBoard, setPreviewBoard] = useState(null);
  const [previewMove, setPreviewMove] = useState(null);
  const [moveWithResults, setMoveWithResults] = useState(null);
  const [leaveValues, setLeaveValues] = useState({});
  const [autoPlayBest, setAutoPlayBest] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  
  // Add state for move sound selection first
  const [playerMoveSoundType, setPlayerMoveSoundType] = useState('classic');
  const [botMoveSoundType, setBotMoveSoundType] = useState('classic');

  // Initialize sounds
  const sounds = useRef(initializeSounds());
  const gameStartSound = useRef(sounds.current.gameStartSound);
  const playerMoveSound = useRef(sounds.current.playerMoveSound);
  const botMoveSound = useRef(sounds.current.botMoveSound);

  // Add error handlers for sounds
  useEffect(() => {
    if (!gameStartSound.current || !playerMoveSound.current || !botMoveSound.current) {
      const newSounds = initializeSounds();
      gameStartSound.current = newSounds.gameStartSound;
      playerMoveSound.current = newSounds.playerMoveSound;
      botMoveSound.current = newSounds.botMoveSound;
    }

    gameStartSound.current.addEventListener('error', () => 
      handleSoundError(gameStartSound.current, 'game start', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );
    playerMoveSound.current.addEventListener('error', () => 
      handleSoundError(playerMoveSound.current, 'player move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );
    botMoveSound.current.addEventListener('error', () => 
      handleSoundError(botMoveSound.current, 'bot move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );

    return () => {
      if (gameStartSound.current) {
        gameStartSound.current.removeEventListener('error', () => 
          handleSoundError(gameStartSound.current, 'game start', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
      if (playerMoveSound.current) {
        playerMoveSound.current.removeEventListener('error', () => 
          handleSoundError(playerMoveSound.current, 'player move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
      if (botMoveSound.current) {
        botMoveSound.current.removeEventListener('error', () => 
          handleSoundError(botMoveSound.current, 'bot move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
    };
  }, []);

  // Update audio refs when sound type changes
  useEffect(() => {
    if (playerMoveSound.current && playerMoveSoundType) {
      updateSoundType(playerMoveSound, playerMoveSoundType, 'player');
    }
  }, [playerMoveSoundType]);

  useEffect(() => {
    if (botMoveSound.current && botMoveSoundType) {
      updateSoundType(botMoveSound, botMoveSoundType, 'bot');
    }
  }, [botMoveSoundType]);

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    
    // Check dictionary loading state on mount
    const checkDictionary = async () => {
      try {
        const response = await fetch('/.netlify/functions/gameLogic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'validate',
            beforeBoard: parsedOrigBoardCoords,
            afterBoard: parsedOrigBoardCoords
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        // Set loading to false if we get any response
        setIsDictionaryLoading(false);
        setSnackbarOpen(false);
      } catch (error) {
        console.error('Error checking dictionary:', error);
        // Retry after a short delay
        setTimeout(checkDictionary, 1000);
      }
    };
    
    setIsDictionaryLoading(true);
    setSnackbarMessage('Loading dictionary.. (up to 30s)');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    checkDictionary();
  }, []);

  // Update useEffect to handle keyboard events
  useEffect(() => {
    const handleKeyDownWrapper = (e) => handleKeyDown({
      e,
      selectedBoardPosition,
      boardCoords,
      tempBoardCoords,
      currentPlayer,
      player1Rack,
      player2Rack,
      selectedTiles,
      blankTiles,
      setSelectedBoardPosition,
      setArrowDirection,
      setTempBoardCoords,
      setSelectedTiles,
      setPlayer1Rack,
      setPlayer2Rack,
      setBlankTiles,
      setPreviewScore,
      setPreviewScorePosition,
      handleWordSubmit: handleWordSubmitClick,
      arrowDirection,
      origBoard
    });

    window.addEventListener('keydown', handleKeyDownWrapper);
    return () => {
      window.removeEventListener('keydown', handleKeyDownWrapper);
    };
  }, [
    selectedBoardPosition,
    boardCoords,
    tempBoardCoords,
    currentPlayer,
    player1Rack,
    player2Rack,
    selectedTiles,
    blankTiles,
    arrowDirection,
    origBoard
  ]);

  const handleGameEndClick = useCallback((winnerRack, winnerName, loserRack, loserPoints) => {
    handleGameEnd({
      winnerRack,
      winnerName,
      loserRack,
      loserPoints,
      player1Rack,
      player2Rack,
      player1points,
      player2points,
      autoPlayBest,
      setPlayer1points,
      setPlayer2points,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen,
      setAutoPlayBest
    });
  }, [
    player1Rack,
    player2Rack,
    player1points,
    player2points,
    autoPlayBest
  ]);

  // Modify handleWordSubmit to use board diffs
  const handleWordSubmitClick = () => {
    handleWordSubmit({
      boardCoords,
      tempBoardCoords,
      currentPlayer,
      player1Rack,
      player2Rack,
      selectedTiles,
      pool,
      player1points,
      player2points,
      player1Name,
      player2Name,
      blankTiles,
      moveHistory,
      selectedBoardPosition,
      arrowDirection,
      setBoardCoords,
      setTempBoardCoords,
      setSelectedTiles,
      setSelectedBoardPosition,
      setArrowDirection,
      setPlayer1points,
      setPlayer2points,
      setPlayer1Rack,
      setPlayer2Rack,
      setPool,
      setCurrentPlayer,
      setMoveHistory,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen,
      handleGameEnd: handleGameEndClick,
      getBoardDiff,
      playerMoveSound
    });
  };

  const handleSettingsOpen = () => {
    setModalContent("settings");
    setOpen(true);
  };

  const handleColorSchemeOpen = () => {
    setModalContent("colorScheme");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Update the handleBotModeToggle function to use the new startBotGame
  const handleBotModeToggle = () => {
    if (isDictionaryLoading) return;
    
    // If there are tiles on the board, return them to the rack first
    if (selectedTiles.length > 0) {
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      const newRack = [...currentRack, ...selectedTiles];
      
      if (currentPlayer === 1) {
        setPlayer1Rack(alphabetizeRack(newRack));
      } else {
        setPlayer2Rack(alphabetizeRack(newRack));
      }
      
      // Reset the board state by rebuilding from origBoardCoords
      const newBoard = JSON.parse(JSON.stringify(origBoardCoords));
      
      // Copy over any committed tiles from boardCoords
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (typeof boardCoords[row][col] === 'string') {
            newBoard[row][col] = boardCoords[row][col];
          }
        }
      }
      
      setTempBoardCoords(newBoard);
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      setArrowDirection('right');
    }
    
    // Clear blank tiles when starting new game
    setBlankTiles([]);
    
    // Randomly determine who goes first
    const randomFirst = Math.random() < 0.5;
    setBotGoesFirst(randomFirst);
    
    // Set game started state
    setGameStarted(true);
    setTimerActive(true);
    
    // Start the game using the new startBotGame function
    startBotGame({
      origBoard,
      origPool,
      TEST_RACKS,
      setOrigBoardCoords,
      setBoardCoords,
      setTempBoardCoords,
      setPlayer1points,
      setPlayer2points,
      setPool,
      botGoesFirst: randomFirst,
      setCurrentPlayer,
      setConsecutivePasses,
      setPlayer1Rack,
      setPlayer2Rack,
      setIsBotMode,
      setPlayer1Name,
      setPlayer2Name,
      makeBotMove: () => makeBotMove({
        boardCoords,
        player2Rack,
        pool,
        player2points,
        player2Name,
        player1Rack,
        player1points,
        blankTiles,
        setBoardCoords,
        setTempBoardCoords,
        setPlayer2Rack,
        setBlankTiles,
        setPool,
        setPlayer2points,
        setCurrentPlayer,
        setSelectedBoardPosition,
        setSelectedTiles,
        setArrowDirection,
        setSnackbarMessage,
        setSnackbarSeverity,
        setSnackbarOpen,
        setConsecutivePasses,
        setMoveHistory,
        getBoardDiff,
        handleGameEnd: handleGameEndClick,
        botMoveSound,
        autoPlayBest,
        setIsBotThinking,
        setSimulatingMove,
        setSimulationResult,
        setSimulationProgress,
        setPreviewBoard,
        setPreviewMove,
        setMoveWithResults,
        setTopMoves,
        isBotMode,
        currentPlayer
      }),
      gameStartSound,
      setSimulatingMove,
      setSimulationResult,
      setSimulationProgress,
      setPreviewBoard,
      setPreviewMove,
      setMoveWithResults,
      setTopMoves
    });
  };

  // Update the useEffect for bot turns to use the new makeBotMove
  useEffect(() => {
    if (isBotMode && currentPlayer === 2 && !isBotThinking) {
      makeBotMove({
        boardCoords,
        player2Rack,
        pool,
        player2points,
        player2Name,
        player1Rack,
        player1points,
        blankTiles,
        setBoardCoords,
        setTempBoardCoords,
        setPlayer2Rack,
        setBlankTiles,
        setPool,
        setPlayer2points,
        setCurrentPlayer,
        setSelectedBoardPosition,
        setSelectedTiles,
        setArrowDirection,
        setSnackbarMessage,
        setSnackbarSeverity,
        setSnackbarOpen,
        setConsecutivePasses,
        setMoveHistory,
        getBoardDiff,
        handleGameEnd: handleGameEndClick,
        botMoveSound,
        autoPlayBest,
        setIsBotThinking,
        setSimulatingMove,
        setSimulationResult,
        setSimulationProgress,
        setPreviewBoard,
        setPreviewMove,
        setMoveWithResults,
        setTopMoves,
        isBotMode,
        currentPlayer
      });
    }
  }, [currentPlayer, isBotMode, isBotThinking]);

  // Update player2Name when isBotMode changes
  useEffect(() => {
    setPlayer1Name(isBotMode ? 'You' : 'Player 1');
    setPlayer2Name(isBotMode ? 'SidBot' : 'Player 2');
  }, [isBotMode]);

  // Start timer when game starts or player changes
  useEffect(() => {
    if (gameStarted) {
      setTimerActive(true);
    }
  }, [currentPlayer, gameStarted]);

  // Start timer when it's a player's turn
  useEffect(() => {
    if (timerActive && gameStarted) {
      timerRef.current = setInterval(() => {
        if (currentPlayer === 1) {
          setPlayer1Time(prev => {
            if (prev <= 0) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setPlayer2Time(prev => {
            if (prev <= 0) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, currentPlayer, gameStarted]);

  const handlePassClick = useCallback(() => {
    handlePass({
      consecutivePasses,
      boardCoords,
      currentPlayer,
      player1Rack,
      player2Rack,
      player1points,
      player2points,
      player1Name,
      player2Name,
      isBotMode,
      setConsecutivePasses,
      setMoveHistory,
      setCurrentPlayer,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen,
      setTempBoardCoords,
      setSelectedTiles,
      setSelectedBoardPosition,
      makeBotMove: () => makeBotMove({
        boardCoords,
        player2Rack,
        pool,
        player2points,
        player2Name,
        player1Rack,
        player1points,
        blankTiles,
        setBoardCoords,
        setTempBoardCoords,
        setPlayer2Rack,
        setBlankTiles,
        setPool,
        setPlayer2points,
        setCurrentPlayer,
        setSelectedBoardPosition,
        setSelectedTiles,
        setArrowDirection,
        setSnackbarMessage,
        setSnackbarSeverity,
        setSnackbarOpen,
        setConsecutivePasses,
        setMoveHistory,
        getBoardDiff,
        handleGameEnd: handleGameEndClick,
        botMoveSound,
        autoPlayBest,
        setIsBotThinking,
        setSimulatingMove,
        setSimulationResult,
        setSimulationProgress,
        setPreviewBoard,
        setPreviewMove,
        setMoveWithResults,
        setTopMoves,
        isBotMode,
        currentPlayer
        })
      });
  }, [
    consecutivePasses,
    boardCoords,
    currentPlayer,
    player1Rack,
    player2Rack,
    player1points,
    player2points,
    player1Name,
    player2Name,
    isBotMode,
    pool,
    blankTiles
  ]);

  const handleGetTopMovesClick = () => {
    handleGetTopMoves({
      boardCoords,
      tempBoardCoords,
      currentPlayer,
      player1Rack,
      player2Rack,
      selectedTiles,
      pool,
      leaveValues,
      setPlayer1Rack,
      setPlayer2Rack,
      setTempBoardCoords,
      setSelectedTiles,
      setSelectedBoardPosition,
      setLeaveValues,
      setTopMoves,
      setIsLoadingTopMoves,
      setShowTopMoves,
      setIsDictionaryLoading,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen
    });
  };

  const handleExchangeClick = () => {
    const result = handleExchange({
      tilesToExchange,
      currentRack: currentPlayer === 1 ? player1Rack : player2Rack,
      pool,
      currentPlayer,
      playerName: currentPlayer === 1 ? player1Name : player2Name,
      isBotMode,
      setPlayer1Rack,
      setPlayer2Rack,
      setPool,
      setTilesToExchange,
      setCurrentPlayer,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen,
      makeBotMove: () => makeBotMove({
        boardCoords,
        player2Rack,
        pool,
        player2points,
        player2Name,
        player1Rack,
        player1points,
        blankTiles,
        setBoardCoords,
        setTempBoardCoords,
        setPlayer2Rack,
        setBlankTiles,
        setPool,
        setPlayer2points,
        setCurrentPlayer,
        setSelectedBoardPosition,
        setSelectedTiles,
        setArrowDirection,
        setSnackbarMessage,
        setSnackbarSeverity,
        setSnackbarOpen,
        setConsecutivePasses,
        setMoveHistory,
        getBoardDiff,
        handleGameEnd: handleGameEndClick,
        botMoveSound,
        autoPlayBest,
        setIsBotThinking,
        setSimulatingMove,
        setSimulationResult,
        setSimulationProgress,
        setPreviewBoard,
        setPreviewMove,
        setMoveWithResults,
        setTopMoves,
        isBotMode,
        currentPlayer
      })
    });

    if (result) {
      const { newRack, newPool } = result;
      // Update state with alphabetized rack
    if (currentPlayer === 1) {
      setPlayer1Rack(alphabetizeRack(newRack));
    } else {
      setPlayer2Rack(alphabetizeRack(newRack));
    }
      setPool(newPool);
    }
  };

  const handleMoveSelectClick = useCallback((move) => {
    handleMoveSelect({
      move,
      boardCoords,
      tempBoardCoords,
      currentPlayer,
      player1Rack,
      player2Rack,
      setTempBoardCoords,
      setSelectedTiles,
      setPlayer1Rack,
      setPlayer2Rack,
      setSelectedBoardPosition,
      setArrowDirection
    });
  }, [
    boardCoords,
    tempBoardCoords,
    currentPlayer,
    player1Rack,
    player2Rack
  ]);

  const board = useMemo(() => {
    return createBoard(
      showTopMoves ? boardCoords : (previewBoard || tempBoardCoords.map((row, rowIndex) => 
        row.map((col, colIndex) => {
          // If there's a temporary move, use that
          if (typeof col === 'string') {
            return col;
          }
          // Otherwise use the committed board state
          return boardCoords[rowIndex][colIndex];
        })
      )),
      [], 
      "PROTILES", 
      theme, 
      color.current, 
      complementaryColor.current, 
      blankTiles
    );
  }, [tempBoardCoords, boardCoords, theme, blankTiles, previewBoard, showTopMoves]);

  // Update player time states when gameTime changes
  useEffect(() => {
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
  }, [gameTime]);

  const handlePlayTopMoveClick = useCallback(() => {
    setIsPlayerThinking(true);
    handlePlayTopMove({
      isLoadingTopMoves,
      isDictionaryLoading,
      currentPlayer,
      player1Rack,
      player2Rack,
      tempBoardCoords,
      boardCoords,
      selectedTiles,
      pool,
      player1points,
      player2points,
      player1Name,
      player2Name,
      blankTiles,
      moveHistory,
      leaveValues,
      handleGameEnd: handleGameEndClick,
      getBoardDiff,
      setPlayer1Rack,
      setPlayer2Rack,
      setTempBoardCoords,
      setSelectedTiles,
      setSelectedBoardPosition,
      setBoardCoords,
      setPlayer1points,
      setPlayer2points,
      setBlankTiles,
      setPool,
      setMoveHistory,
      setCurrentPlayer,
      setSimulatingMove,
      setSimulationResult,
      setSimulationProgress,
      setPreviewBoard,
      setPreviewMove,
      setMoveWithResults,
      setTopMoves,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen,
      setIsDictionaryLoading,
      setLeaveValues,
      setArrowDirection
    }).finally(() => {
      setIsPlayerThinking(false);
    });
  }, [
    isLoadingTopMoves,
    isDictionaryLoading,
    currentPlayer,
    player1Rack,
    player2Rack,
    tempBoardCoords,
    boardCoords,
    selectedTiles,
    pool,
    player1points,
    player2points,
    player1Name,
    player2Name,
    blankTiles,
    moveHistory,
    leaveValues,
    handleGameEndClick,
    getBoardDiff
  ]);

  // Update the useEffect for auto-play to use isPlayerThinking
  useEffect(() => {
    if (autoPlayBest && gameStarted && currentPlayer === 1 && !isLoadingTopMoves && !isDictionaryLoading && !isAutoPlaying && !isPlayerThinking) {
      setIsAutoPlaying(true);
      handlePlayTopMoveClick().finally(() => {
        setIsAutoPlaying(false);
      });
    }
  }, [autoPlayBest, gameStarted, currentPlayer, isLoadingTopMoves, isDictionaryLoading, handlePlayTopMoveClick, isAutoPlaying, isPlayerThinking]);

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
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPressWrapper = (event) => handleKeyPress({
      event,
      gameStarted,
      handlePass: handlePassClick,
      handleExchangeClick,
      handlePlayTopMove: handlePlayTopMoveClick,
      isPlayerThinking,
      isBotThinking
    });

    window.addEventListener('keydown', handleKeyPressWrapper);
    return () => {
      window.removeEventListener('keydown', handleKeyPressWrapper);
    };
  }, [gameStarted, handlePassClick, handleExchangeClick, handlePlayTopMoveClick, isPlayerThinking, isBotThinking]);

  const simulateMove = async (move) => {
    setSimulatingMove(move);
    setSimulationProgress(0);
    setPreviewBoard(null);
    setPreviewMove(null);
    
    try {
      const gameState = {
        boardCoords,
        currentPlayer,
        player1Rack,
        player2Rack,
        player1points,
        player2points,
        pool
      };
      
      const result = await simulateMoveFunction(move, gameState, (progress, previewData) => {
        setSimulationProgress(progress);
        if (previewData) {
          setPreviewBoard(previewData.board);
          setPreviewMove(previewData.move);
        }
      });
      setSimulationResult(result);
      setMoveWithResults(move);
    } catch (error) {
      console.error('Error simulating move:', error);
      setSnackbarMessage('Error simulating move: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSimulatingMove(null);
      setSimulationProgress(0);
      // Don't clear previewBoard and previewMove here
    }
  };

  // Modify the existing code that sets topMoves to also fetch leave values
  useEffect(() => {
    if (topMoves.length > 0) {
      console.log('Top moves updated, fetching leave values');
      fetchLeaveValues(topMoves);
    }
  }, [topMoves]);

  // Add effect to limit move history size more aggressively
  useEffect(() => {
    if (moveHistory.length > 50) { // Reduce to last 50 moves instead of 100
      setMoveHistory(prev => prev.slice(-50));
    }
  }, [moveHistory]);

  const [previewScore, setPreviewScore] = useState(null);
  const [previewScorePosition, setPreviewScorePosition] = useState(null);

  // Add this function to calculate preview score
  const calculatePreviewScore = () => {
    if (selectedTiles.length === 0) {
      setPreviewScore(null);
      setPreviewScorePosition(null);
      return;
    }

    const score = calculateScore(boardCoords, tempBoardCoords, boardMultipliers);
    setPreviewScore(score);
    
    // Calculate position for score preview
    if (selectedBoardPosition) {
      const { row, col } = selectedBoardPosition;
      setPreviewScorePosition({ row, col });
    }
  };

  // Add effect to calculate preview score when tiles are placed
  useEffect(() => {
    if (selectedTiles.length > 0) {
      calculatePreviewScore();
    } else {
      setPreviewScore(null);
      setPreviewScorePosition(null);
    }
  }, [selectedTiles, tempBoardCoords]);

  return (
    <Box className={styles.container}>
      <Sidenav/>
      <Box className={styles.page}>
      <Box className={styles.title}>
        {gameStarted ? (
            <Box className={styles.gameTitle}>
              <Box className={styles.gameTitleText}>
              {gameTime}/0 • Classic • NWL23
            </Box>
              <Box className={styles.gameSubtitle}>
              Void Challenge • Unrated
            </Box>
          </Box>
        ) : (
            <Box className={styles.gameTitle}>
              <Box className={styles.playModeTitle}>
              Play Mode
            </Box>
              <Box className={styles.playModeSubtitle}>
              Click the robot to play against SidBot
            </Box>
          </Box>
        )}
      </Box>
      <Box className={styles.mainPanel}>
        <Box className={styles.mainBox} component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Board 
            board={board}
            boardMode={theme}
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
              selectedTiles,
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
              selectedTiles,
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
          />   
        </Box>

        <Box className={styles.rightPanel}>
          <PlayerInfo
            player1Name={player1Name}
            player2Name={player2Name}
            player1Points={player1points}
            player2Points={player2points}
            player1Time={formatTime(player1Time)}
            player2Time={formatTime(player2Time)}
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
              selectedTiles,
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
            onColorSchemeOpen={handleColorSchemeOpen}
            onBotModeToggle={handleBotModeToggle}
            onGetTopMoves={handleGetTopMovesClick}
            onWordSubmit={handleWordSubmitClick}
            onPass={handlePassClick}
            onExchange={handleExchangeClick}
            onPlayTopMove={handlePlayTopMoveClick}
            selectedBoardPosition={selectedBoardPosition}
            tilesToExchange={tilesToExchange}
            autoPlayBest={autoPlayBest}
            setAutoPlayBest={setAutoPlayBest}
            setShowMoveHistory={setShowMoveHistory}
            isBotThinking={isBotThinking}
            isPlayerThinking={isPlayerThinking}
            icons={{
              settings: <TuneIcon className={styles.keyBtn} />,
              colorScheme: <PaletteIcon className={styles.keyBtn} />,
              time: (
                <Tooltip title={gameStarted ? "Game time cannot be changed after game starts" : "Set game time"}>
                  <TimerIcon 
                      className={`${styles.keyBtn} ${styles.timerIcon} ${showTimeSlider ? styles.active : ''} ${gameStarted ? styles.disabled : ''}`}
                    onClick={() => !gameStarted && setShowTimeSlider(!showTimeSlider)}
                  />
                </Tooltip>
              ),
              botMode: <SmartToyIcon 
                  className={`${styles.keyBtn} ${styles.botIcon} ${isBotMode ? styles.active : ''} ${isBotMode && currentPlayer === 2 ? styles.thinking : ''}`}
              />,
              topMoves: <LightbulbIcon className={styles.keyBtn} />,
              moveOrder: (
                <Tooltip title="Move History">
                  <SortIcon 
                      className={`${styles.keyBtn} ${styles.moveHistoryIcon} ${!gameStarted ? styles.disabled : ''}`}
                    onClick={() => setShowMoveHistory(true)}
                  />
                </Tooltip>
              )
            }}
          />

          {showTimeSlider && !gameStarted && (
              <Box className={styles.timeSliderContainer}>
                <Box className={styles.timeSliderLabel}>
                Game Time: {gameTime} min
              </Box>
                <Box className={styles.timeSliderWrapper}>
                  {[5, 15, 25, 30].map((value) => (
                    <Box
                      key={value}
                      className={styles.timeSliderMark}
                      style={{ left: `${((value - 5) / 25) * 100}%` }}
                    />
                  ))}
                  <Box
                    className={styles.timeSliderThumb}
                    style={{ left: `${((gameTime - 5) / 25) * 100}%` }}
                    onMouseDown={(e) => {
                      const slider = e.currentTarget.parentElement;
                      const rect = slider.getBoundingClientRect();
                      const handleMouseMove = (e) => {
                        const x = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(1, x / rect.width));
                        const value = Math.round(5 + percentage * 25);
                        setGameTime(value);
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
              </Box>
            </Box>
          )}

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

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className={styles.modalContainer}>
          {modalContent === "settings" && (
            <Box>
              <Box className={styles.modalContainer__dictionary}>
                Board Mode
                <select className={styles.styleSelection} value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="STANDARD">Standard</option>
                  {/* <option value="FULLBOARD">Full Board</option> */}
                </select>
              </Box>
              <Box className={styles.modalContainer__dictionary}>
                Player Move Sound
                <select
                  className={styles.styleSelection}
                  value={playerMoveSoundType}
                  onChange={e => setPlayerMoveSoundType(e.target.value)}
                >
                  <option value="classic">Classic</option>
                  <option value="sword">Sword</option>
                </select>
              </Box>
              <Box className={styles.modalContainer__dictionary}>
                Bot Move Sound
                <select
                  className={styles.styleSelection}
                  value={botMoveSoundType}
                  onChange={e => setBotMoveSoundType(e.target.value)}
                >
                  <option value="classic">Classic</option>
                  <option value="sword">Sword</option>
                </select>
              </Box>
            </Box>
          )}
          {modalContent === "colorScheme" && (
            <ColorScheme
              color={color}
              boardColor={boardColor}
            />
          )}
        </Box>
      </Modal>
      </Box>
      <Snackbar 
        open={snackbarOpen} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={snackbarMessage === 'Loading dictionary.. (up to 30s)' ? null : 3000}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          className={styles.snackbarAlert}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <ChoicesModal
        open={showTopMoves}
        onClose={() => {
          setShowTopMoves(false);
          setIsLoadingTopMoves(false);
          setIsDictionaryLoading(false);
          setSimulatingMove(null);
          setSimulationResult(null);
          setSimulationProgress(0);
          setMoveWithResults(null);
          setPreviewBoard(null);
          setPreviewMove(null);
          // Don't clear leave values when modal closes
          // setLeaveValues({});
        }}
        isTopMovesLoading={isLoadingTopMoves}
        isDictionaryLoading={isDictionaryLoading}
        topMoves={topMoves}
        onMoveSelect={handleMoveSelectClick}
        onSimulateMove={simulateMove}
        simulatingMove={simulatingMove}
        simulationResult={simulationResult}
        simulationProgress={simulationProgress}
        moveWithResults={moveWithResults}
        previewBoard={previewBoard}
        boardCoords={boardCoords}
        theme={theme}
        color={color}
        complementaryColor={complementaryColor}
        blankTiles={blankTiles}
        leaveValues={leaveValues}
      />

      <MoveHistoryModal
        open={showMoveHistory}
        onClose={() => setShowMoveHistory(false)}
        moves={moveHistory}
      />
    </Box>
  );
} 