import React, { useEffect, useRef, useMemo} from "react";
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
import SimulationModal from '../../components/Modals/SimulationModal';
import PlayerInfo from './components/PlayerInfo';
import ColorScheme from '../../components/common/ColorScheme';
import Confetti from '../../components/Confetti/Confetti';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import SortIcon from '@mui/icons-material/Sort';
import { simulateMove as simulateMoveFunction, runHeatMapSimulation as runHeatMapSimulationFunction, runAllMovesSimulation as runAllMovesSimulationFunction, runSimulation as runSimulationFunction, openSimulationModal as openSimulationModalFunction, stopSimulation as stopSimulationFunction, resetHeatMapMode as resetHeatMapModeFunction, switchToMetrics as switchToMetricsFunction } from '../../functions/simulationFunctions';
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
import { handleGetTopMoves, handlePlayTopMove, handleMoveSelect, generateExchangeCombinations, fetchBoardControl } from '../../functions/play/moveFunctions';
import { generateRandomRack } from '../../functions/moveFunctions';
import { getBoardDiff } from '../../functions/play/boardUtils';
import { handlePass } from '../../functions/play/passFunctions';
import { handleGameEnd } from '../../functions/play/gameEndFunctions';
import { formatTime } from '../../functions/play/timeUtils';
import { useGameStore } from '../../stores/gameStore';

const boardMultipliers = JSON.parse(origBoard);

export default function Play() {
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
    setPlayer1points,
    setPlayer2points,
    setPlayer1Rack,
    setPlayer2Rack,
    setPlayer1Name,
    setPlayer2Name,
    setCurrentPlayer,
    
    // Game state
    pool,
    gameStarted,
    gameEnded,
    isBotMode,
    consecutivePasses,
    setPool,
    setGameStarted,
    setGameEnded,
    setIsBotMode,
    setConsecutivePasses,
    
    // Tile and selection state
    selectedTiles,
    selectedBoardPosition,
    arrowDirection,
    tilesToExchange,
    blankTiles,
    setSelectedTiles,
    setSelectedBoardPosition,
    setArrowDirection,
    setTilesToExchange,
    setBlankTiles,
    
    // Bot state
    isBotThinking,
    isPlayerThinking,
    botGoesFirst,
    setIsBotThinking,
    setIsPlayerThinking,
    setBotGoesFirst,
    
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
    setIsLoadingTopMoves,
    
    // Dictionary loading
    isDictionaryLoading,
    setIsDictionaryLoading,
    
    // Auto-play
    autoPlayBest,
    isAutoPlaying,
    setAutoPlayBest,
    setIsAutoPlaying,
    
    // Victory state
    winner,
    finalPlayer1Score,
    finalPlayer2Score,
    setWinner,
    setFinalPlayer1Score,
    setFinalPlayer2Score,
    
    // Simulation state
    simulatingMove,
    simulationResult,
    simulationProgress,
    previewBoard,
    previewMove,
    previewTileOwnership,
    moveWithResults,
    simulationBoard,
    leaveValues,
    showSimulationModal,
    shouldStopSimulation,
    allMoveResults,
    isSimulatingAllMoves,
    previewScore,
    previewScorePosition,
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
    setShouldStopSimulation,
    setAllMoveResults,
    setIsSimulatingAllMoves,
    setPreviewScore,
    setPreviewScorePosition,
    
    // UI state
    theme,
    open,
    modalContent,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showTimeSlider,
    showConfetti,
    showVictoryOverlay,
    setTheme,
    setOpen,
    setModalContent,
    setSnackbarOpen,
    setSnackbarMessage,
    setSnackbarSeverity,
    setShowTimeSlider,
    setShowConfetti,
    setShowVictoryOverlay,
    
    // Settings state
    playerMoveSoundType,
    botMoveSoundType,
    setPlayerMoveSoundType,
    setBotMoveSoundType,
    
    // Computed values
    getCurrentRack,
    getCurrentPlayerName,
    getCurrentPlayerPoints,
    setCurrentPlayerPoints,
    setCurrentPlayerRack,
    
    // Utility functions
    getBoardDiff,
  } = useGameStore();

  // Refs (keep these local)
  const color = useRef('#b064af');
  const boardColor = useRef('#ffffff');
  const complementaryColor = useRef('#9F7A83');
  const timerRef = useRef(null);
  const shouldStopSimulationRef = useRef(false);

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
      handleWordSubmit,
      playerMoveSound,
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

  const handleNewGame = () => {
    setShowVictoryOverlay(false);
    setShowConfetti(false);
    setGameEnded(false);
    setWinner(null);
    setFinalPlayer1Score(0);
    setFinalPlayer2Score(0);
    
    // Reset timer
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
    setTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset game state
    handleBotModeToggle();
  };

  // Victory celebration handlers
  const handleConfettiComplete = () => {
    setShowConfetti(false);
    // Don't hide the victory card - let it stay open until user clicks rematch
  };

  // Modify handleWordSubmit to use board diffs
  const handleWordSubmitClick = () => {
    handleWordSubmit(playerMoveSound);
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
    
    // Reset game ended state for new game
    setGameEnded(false);
    setShowVictoryOverlay(false);
    setShowConfetti(false);
    setWinner(null);
    
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
    
    // Reset timer for new game
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Randomly determine who goes first
    const randomFirst = Math.random() < 0.5;
    setBotGoesFirst(randomFirst);
    
    // Set game started state
    setGameStarted(true);
    setTimerActive(true);
    
    // Start the game using the new startBotGame function
    startBotGame({ origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound });
  };

  // Update the useEffect for bot turns to use the new makeBotMove
  useEffect(() => {
    if (isBotMode && currentPlayer === 2 && !isBotThinking && !gameEnded) {
      makeBotMove(botMoveSound);
    }
  }, [currentPlayer, isBotMode, isBotThinking, gameEnded]);

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
          const currentTime = useGameStore.getState().player1Time;
          if (currentTime <= 0 || isNaN(currentTime)) {
            clearInterval(timerRef.current);
            setPlayer1Time(0);
          } else {
            setPlayer1Time(currentTime - 1);
          }
        } else {
          const currentTime = useGameStore.getState().player2Time;
          if (currentTime <= 0 || isNaN(currentTime)) {
            clearInterval(timerRef.current);
            setPlayer2Time(0);
          } else {
            setPlayer2Time(currentTime - 1);
          }
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, currentPlayer, gameStarted]);

  const handlePassClick = () => {
    if (gameEnded) return; // Don't allow passes after game has ended
    handlePass();
  };

  const handleGetTopMovesForExpandable = () => {
    if (gameEnded) return; // Don't allow getting top moves after game has ended
    // Create a version of handleGetTopMoves that doesn't open the modal
    const fetchTopMovesWithoutModal = async () => {
      setIsLoadingTopMoves(true);
      try {
        // Get the current rack
        const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
        
        // Get any tiles that are placed on the board but not committed
        const uncommittedTiles = [];
        for (let row = 0; row < 15; row++) {
          for (let col = 0; col < 15; col++) {
            if (typeof tempBoardCoords[row][col] === 'string' && typeof boardCoords[row][col] !== 'string') {
              const tileIndex = selectedTiles.findIndex(t => t.tile === '*');
              if (tileIndex !== -1) {
                uncommittedTiles.push('*');
              } else {
                uncommittedTiles.push(tempBoardCoords[row][col]);
              }
            }
          }
        }
        
        // Return uncommitted tiles to the rack
        const newRack = [...currentRack, ...uncommittedTiles];
        if (currentPlayer === 1) {
          setPlayer1Rack(newRack);
        } else {
          setPlayer2Rack(newRack);
        }
        
        // Reset the board state
        setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
        setSelectedTiles([]);
        setSelectedBoardPosition(null);
        
        // Convert any '?' in the rack to '*' for the API
        const apiRack = newRack.map(tile => tile === '?' ? '*' : tile);
        
        const response = await fetch('/.netlify/functions/getTopMoves', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: boardCoords,
            letters: apiRack
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if this is the first load (dictionary loading)
        if (data.message && data.message.includes('Loading dictionary')) {
          setIsDictionaryLoading(true);
          // Retry after a short delay
          setTimeout(() => {
            fetchTopMovesWithoutModal();
          }, 1000);
          return;
        }
        
        setIsDictionaryLoading(false);

        // Generate exchange moves
        const exchangeCombinations = generateExchangeCombinations(newRack);
        const exchangeMoves = exchangeCombinations.map(tiles => {
          const leave = calculateExchangeLeave(newRack, tiles);
          return {
            word: `Exchange ${tiles.join('')}`,
            score: 0,
            tiles: tiles.map(tile => ({ letter: tile, isNew: false })),
            direction: 'exchange',
            startPosition: 'Exchange',
            leave: leave,
            isExchange: true,
            currentRack: newRack
          };
        });

        // First, fetch leave values for all moves
        const allMoves = [...data.moves.map(move => ({ ...move, currentRack: newRack })), ...exchangeMoves];
        const [updatedLeaveValues, boardControlMetrics] = await Promise.all([
          fetchLeaveValues(allMoves, leaveValues, setLeaveValues),
          fetchBoardControl(boardCoords, allMoves)
        ]);

        // Create a map of move words to their control metrics
        const controlMap = new Map(
          boardControlMetrics.map(metric => [metric.move, metric])
        );

        // Then calculate total values and sort
        const movesWithValues = allMoves
          .map(move => {
            const leaveValue = updatedLeaveValues[move.leave] || 0;
            const controlMetrics = controlMap.get(move.word) || { defensiveValue: 0, boardControl: 0, totalControl: 0 };
            const totalValue = move.isExchange ? 
              leaveValue : // For exchanges, total value is just the leave value
              (move.score + leaveValue); // Just points + leave, no control value
            return {
              ...move,
              totalValue,
              leaveValue, // Add the leave value to the move object
              defensiveValue: controlMetrics.defensiveValue,
              boardControl: controlMetrics.boardControl,
            };
          })
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 15); // Show top 15 moves

        setTopMoves(movesWithValues);
      } catch (error) {
        console.error('Error getting top moves:', error);
        setSnackbarMessage('Error getting top moves: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setIsLoadingTopMoves(false);
      }
    };

    fetchTopMovesWithoutModal();
  };

  const handleExchangeClick = () => {
    if (gameEnded) return; // Don't allow exchanges after game has ended
    handleExchange();
  };

  const handleMoveSelectClick = (move) => {
    // Validate move structure
    if (!move || !move.tiles || !Array.isArray(move.tiles)) {
      console.error('Invalid move structure:', move);
      return;
    }
    
    // If the simulation modal is open, update the selected move and board
    if (showSimulationModal) {
      setMoveWithResults(move);
      
      // Clear preview board so the new move shows up
      setPreviewBoard(null);
      setPreviewMove(null);
      setPreviewTileOwnership(null);
      
      // Clear heat map data when selecting a new move
      setSimulationBoard(null);
      setSimulationProgress(0);
      
      // Update the simulation board with the new move
      const simulationBoardData = JSON.parse(JSON.stringify(boardCoords));
      
      // Apply the move to the simulation board
      for (const tile of move.tiles) {
        if (tile.isNew) {
          simulationBoardData[tile.row][tile.col] = tile.letter;
        }
      }
      
      setSimulationBoard(simulationBoardData);
    } else {
      // Normal move selection for the game board
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
    }
  };

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

  // Update player time states when gameTime changes
  useEffect(() => {
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
  }, [gameTime]);

  const handlePlayTopMoveClick = () => {
    if (gameEnded) return Promise.resolve(); // Don't allow playing top move after game has ended
    setIsPlayerThinking(true);
    return handlePlayTopMove().finally(() => {
      setIsPlayerThinking(false);
    });
  };

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPressWrapper = (event) => handleKeyPress({
      event,
      gameStarted,
      gameEnded,
      handlePass: handlePassClick,
      handleExchangeClick,
      handlePlayTopMove: handlePlayTopMoveClick,
      toggleAutoPlayBest: () => setAutoPlayBest(!autoPlayBest),
      isPlayerThinking,
      isBotThinking
    });

    window.addEventListener('keydown', handleKeyPressWrapper);
    return () => {
      window.removeEventListener('keydown', handleKeyPressWrapper);
    };
  }, [gameStarted, gameEnded, handlePassClick, handleExchangeClick, handlePlayTopMoveClick, autoPlayBest, isPlayerThinking, isBotThinking]);

  const openSimulationModal = (move = null) => {
    openSimulationModalFunction(move, topMoves, boardCoords, {
      setMoveWithResults,
      setSimulationBoard,
      setPreviewBoard,
      setPreviewMove,
      setShowSimulationModal
    });
  };

  const resetHeatMapMode = () => {
    resetHeatMapModeFunction({
      setSimulationBoard,
      setSimulationProgress,
      setPreviewMove,
      setPreviewTileOwnership
    });
  };

  const stopSimulation = () => {
    stopSimulationFunction({
      setShouldStopSimulation,
      shouldStopRef: shouldStopSimulationRef,
      setSimulatingMove,
      setSimulationProgress,
      setPreviewMove,
      setPreviewTileOwnership
    });
  };

  const switchToMetrics = () => {
    // This function is now empty as the state is managed by the simulation store
  };

  const runHeatMapSimulation = async (move) => {
    setSimulatingMove(move);
    setSimulationProgress(0);
    
    // Reset stop flag
    setShouldStopSimulation(false);
    shouldStopSimulationRef.current = false;
    
    const gameState = {
      boardCoords: simulationBoard,
      currentPlayer,
      player1Rack,
      player2Rack,
      player1points,
      player2points,
      pool
    };
    
    await runHeatMapSimulationFunction(move, gameState, {
      onProgress: setSimulationProgress,
      onHeatMapUpdate: setSimulationBoard,
      onError: (message) => {
        setSnackbarMessage(message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      },
      onComplete: () => {
        setSimulatingMove(null);
        setSimulationProgress(0);
        setShouldStopSimulation(false);
        shouldStopSimulationRef.current = false;
      },
      shouldStopRef: shouldStopSimulationRef
    });
  };

  const runSimulation = async (move) => {
    setSimulatingMove(move);
    setSimulationProgress(0);
    
    // Reset stop flag
    setShouldStopSimulation(false);
    shouldStopSimulationRef.current = false;
    
    const gameState = {
      boardCoords: simulationBoard,
      currentPlayer,
      player1Rack,
      player2Rack,
      player1points,
      player2points,
      pool
    };
    
    await runSimulationFunction(move, gameState, {
      onProgress: setSimulationProgress,
      onPreviewUpdate: (previewData) => {
        setPreviewBoard(previewData.board);
        setPreviewMove(previewData.move);
        setPreviewTileOwnership(previewData.tileOwnership);
      },
      onError: (message) => {
        setSnackbarMessage(message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      },
      onComplete: () => {
        setSimulatingMove(null);
        setSimulationProgress(0);
        setShouldStopSimulation(false);
        shouldStopSimulationRef.current = false;
      },
      shouldStopRef: shouldStopSimulationRef,
      resetHeatMapMode: () => {
        setSimulationBoard(null);
        setSimulationProgress(0);
      }
    });
  };

  const runAllMovesSimulation = async () => {
    if (!topMoves || topMoves.length === 0) return;
    
    setIsSimulatingAllMoves(true);
    setSimulationProgress(0);
    setShouldStopSimulation(false);
    shouldStopSimulationRef.current = false;
    
    const gameState = {
      boardCoords: simulationBoard,
      currentPlayer,
      player1Rack,
      player2Rack,
      player1points,
      player2points,
      pool
    };
    
    await runAllMovesSimulationFunction(topMoves, gameState, {
      onProgress: setSimulationProgress,
      onResultsUpdate: setAllMoveResults,
      onError: (message) => {
        setSnackbarMessage(message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      },
      onComplete: () => {
        setIsSimulatingAllMoves(false);
        setSimulationProgress(0);
        setShouldStopSimulation(false);
        shouldStopSimulationRef.current = false;
      },
      shouldStopRef: shouldStopSimulationRef
    });
  };

  const simulateMove = async (move) => {
    openSimulationModal(move);
    await runSimulation(move);
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
        <Box className={styles.mainPanel}>
          <Box className={styles.title}>
            <Box className={styles.gameTitle}>
              <Box className={styles.playModeTitle}>
                Playground+
              </Box>
            </Box>
          </Box>
          <Box className={styles.leftContainer}>
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
                lastMoveCoordinates={lastMoveCoordinates}
              />   
            </Box>
          </Box>

          <Box className={styles.rightPanel}>
            <PlayerInfo
              player1Name={player1Name}
              player2Name={player2Name}
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
              simulatingMove={simulatingMove}
              boardCoords={boardCoords}
              pool={pool}
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
        onSwitchToMetrics={switchToMetrics}
        heatMapData={simulationBoard}
        isHeatMapMode={!!simulationBoard}
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
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10001,
            textAlign: 'center',
            pointerEvents: 'auto',
          }}
        >
          <Box
            sx={{
              background: winner === 'player' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%), url("https://www.transparenttextures.com/patterns/bright-squares.png")'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%), url("https://www.transparenttextures.com/patterns/bright-squares.png")',
              color: 'white',
              padding: '15px 20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
              backdropFilter: 'blur(15px)',
              minWidth: '220px',
              position: 'relative',
            }}
          >
            <Box sx={{ fontSize: '28px', mb: 1 }}>
              {winner === 'player' ? '🏆' : '🤖'}
            </Box>
            <Box sx={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              mb: 1,
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              letterSpacing: '0.5px'
            }}>
              {winner === 'player' ? 'It\'s a huge, huge win!' : 'The bot got the best of you!'}
            </Box>
            <Box sx={{ 
              fontSize: '11px', 
              opacity: 0.9,
              mb: 1
            }}>
              {winner === 'player' ? '' : ''}
            </Box>
            <Box sx={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: winner === 'player' ? '#FFD700' : '#C0C0C0',
              mb: 2
            }}>
              {winner === 'player' ? '' : ''}
            </Box>
            
            {/* Rematch Button */}
            <Box
              onClick={handleNewGame}
              sx={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '6px 16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px',
                backdropFilter: 'blur(10px)',
                display: 'inline-block',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              Rematch
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
} 