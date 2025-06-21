import { create } from 'zustand';
import { origPool, origBoard } from '../components/AppContent/References/staticData.js';
import { TEST_RACKS } from '../components/AppContent/References/testRacks.js';
import { getBoardDiff } from '../functions/play/boardUtils';

export const useGameStore = create((set, get) => ({
  // Board state
  boardCoords: [],
  tempBoardCoords: [],
  origBoardCoords: [],
  
  // Player state
  player1points: 0,
  player2points: 0,
  player1Rack: [],
  player2Rack: [],
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  currentPlayer: 1,
  
  // Game state
  pool: origPool,
  gameStarted: false,
  gameEnded: false,
  isBotMode: false,
  consecutivePasses: 0,
  
  // Tile and selection state
  selectedTiles: [],
  selectedBoardPosition: null,
  arrowDirection: 'right',
  tilesToExchange: [],
  blankTiles: [],
  
  // Bot state
  isBotThinking: false,
  isPlayerThinking: false,
  botGoesFirst: false,
  
  // Timer state
  player1Time: 20 * 60, // 20 minutes in seconds
  player2Time: 20 * 60,
  timerActive: false,
  gameTime: 20, // in minutes
  
  // Move history
  moveHistory: [],
  topMoves: [],
  isLoadingTopMoves: false,
  
  // Dictionary loading
  isDictionaryLoading: false,
  
  // Auto-play
  autoPlayBest: false,
  isAutoPlaying: false,
  
  // Victory state
  winner: null,
  finalPlayer1Score: 0,
  finalPlayer2Score: 0,
  
  // Simulation state (moved from Play.js)
  simulatingMove: null,
  simulationResult: null,
  simulationProgress: 0,
  previewBoard: null,
  previewMove: null,
  previewTileOwnership: null,
  moveWithResults: null,
  simulationBoard: null,
  leaveValues: {},
  showSimulationModal: false,
  shouldStopSimulation: false,
  allMoveResults: {},
  isSimulatingAllMoves: false,
  previewScore: null,
  previewScorePosition: null,
  
  // UI state (moved from Play.js)
  theme: "STANDARD",
  open: false,
  modalContent: "settings",
  snackbarOpen: false,
  snackbarMessage: "",
  snackbarSeverity: "error",
  showTimeSlider: false,
  showConfetti: false,
  showVictoryOverlay: false,
  
  // Settings state (moved from Play.js)
  playerMoveSoundType: 'classic',
  botMoveSoundType: 'classic',
  
  // Actions - Board
  setBoardCoords: (coords) => set({ boardCoords: coords }),
  setTempBoardCoords: (coords) => set({ tempBoardCoords: coords }),
  setOrigBoardCoords: (coords) => set({ origBoardCoords: coords }),
  
  // Actions - Players
  setPlayer1points: (points) => set({ player1points: points }),
  setPlayer2points: (points) => set({ player2points: points }),
  setPlayer1Rack: (rack) => set({ player1Rack: rack }),
  setPlayer2Rack: (rack) => set({ player2Rack: rack }),
  setPlayer1Name: (name) => set({ player1Name: name }),
  setPlayer2Name: (name) => set({ player2Name: name }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  
  // Actions - Game state
  setPool: (newPool) => set({ pool: newPool }),
  setGameStarted: (started) => set({ gameStarted: started }),
  setGameEnded: (ended) => set({ gameEnded: ended }),
  setIsBotMode: (isBot) => set({ isBotMode: isBot }),
  setConsecutivePasses: (passes) => set({ consecutivePasses: passes }),
  
  // Actions - Tile and selection
  setSelectedTiles: (tiles) => set({ selectedTiles: tiles }),
  setSelectedBoardPosition: (position) => set({ selectedBoardPosition: position }),
  setArrowDirection: (direction) => set({ arrowDirection: direction }),
  setTilesToExchange: (tiles) => set({ tilesToExchange: tiles }),
  setBlankTiles: (tiles) => set({ blankTiles: tiles }),
  
  // Actions - Bot
  setIsBotThinking: (thinking) => set({ isBotThinking: thinking }),
  setIsPlayerThinking: (thinking) => set({ isPlayerThinking: thinking }),
  setBotGoesFirst: (goesFirst) => set({ botGoesFirst: goesFirst }),
  
  // Actions - Timer
  setPlayer1Time: (time) => set({ player1Time: time }),
  setPlayer2Time: (time) => set({ player2Time: time }),
  setTimerActive: (active) => set({ timerActive: active }),
  setGameTime: (time) => set({ gameTime: time }),
  
  // Actions - Move history
  setMoveHistory: (history) => set({ moveHistory: history }),
  setTopMoves: (moves) => set({ topMoves: moves }),
  setIsLoadingTopMoves: (loading) => set({ isLoadingTopMoves: loading }),
  
  // Actions - Dictionary
  setIsDictionaryLoading: (loading) => set({ isDictionaryLoading: loading }),
  
  // Actions - Auto-play
  setAutoPlayBest: (autoPlay) => set({ autoPlayBest: autoPlay }),
  setIsAutoPlaying: (autoPlaying) => set({ isAutoPlaying: autoPlaying }),
  
  // Actions - Victory
  setWinner: (winner) => set({ winner: winner }),
  setFinalPlayer1Score: (score) => set({ finalPlayer1Score: score }),
  setFinalPlayer2Score: (score) => set({ finalPlayer2Score: score }),
  
  // Actions - Simulation
  setSimulatingMove: (move) => set({ simulatingMove: move }),
  setSimulationResult: (result) => set({ simulationResult: result }),
  setSimulationProgress: (progress) => set({ simulationProgress: progress }),
  setPreviewBoard: (board) => set({ previewBoard: board }),
  setPreviewMove: (move) => set({ previewMove: move }),
  setPreviewTileOwnership: (ownership) => set({ previewTileOwnership: ownership }),
  setMoveWithResults: (results) => set({ moveWithResults: results }),
  setSimulationBoard: (board) => set({ simulationBoard: board }),
  setLeaveValues: (values) => set({ leaveValues: values }),
  setShowSimulationModal: (show) => set({ showSimulationModal: show }),
  setShouldStopSimulation: (stop) => set({ shouldStopSimulation: stop }),
  setAllMoveResults: (results) => set({ allMoveResults: results }),
  setIsSimulatingAllMoves: (simulating) => set({ isSimulatingAllMoves: simulating }),
  setPreviewScore: (score) => set({ previewScore: score }),
  setPreviewScorePosition: (position) => set({ previewScorePosition: position }),
  
  // Actions - UI
  setTheme: (theme) => set({ theme: theme }),
  setOpen: (open) => set({ open: open }),
  setModalContent: (content) => set({ modalContent: content }),
  setSnackbarOpen: (open) => set({ snackbarOpen: open }),
  setSnackbarMessage: (message) => set({ snackbarMessage: message }),
  setSnackbarSeverity: (severity) => set({ snackbarSeverity: severity }),
  setShowTimeSlider: (show) => set({ showTimeSlider: show }),
  setShowConfetti: (show) => set({ showConfetti: show }),
  setShowVictoryOverlay: (show) => set({ showVictoryOverlay: show }),
  
  // Actions - Settings
  setPlayerMoveSoundType: (type) => set({ playerMoveSoundType: type }),
  setBotMoveSoundType: (type) => set({ botMoveSoundType: type }),
  
  // Complex actions
  resetGame: () => set({
    player1points: 0,
    player2points: 0,
    player1Rack: [],
    player2Rack: [],
    currentPlayer: 1,
    pool: origPool,
    gameStarted: false,
    gameEnded: false,
    consecutivePasses: 0,
    selectedTiles: [],
    selectedBoardPosition: null,
    arrowDirection: 'right',
    tilesToExchange: [],
    blankTiles: [],
    isBotThinking: false,
    isPlayerThinking: false,
    player1Time: 20 * 60,
    player2Time: 20 * 60,
    timerActive: false,
    moveHistory: [],
    topMoves: [],
    isLoadingTopMoves: false,
    isDictionaryLoading: false,
    autoPlayBest: false,
    isAutoPlaying: false,
    winner: null,
    finalPlayer1Score: 0,
    finalPlayer2Score: 0,
    simulatingMove: null,
    simulationResult: null,
    simulationProgress: 0,
    previewBoard: null,
    previewMove: null,
    previewTileOwnership: null,
    moveWithResults: null,
    simulationBoard: null,
    leaveValues: {},
    showSimulationModal: false,
    shouldStopSimulation: false,
    allMoveResults: {},
    isSimulatingAllMoves: false,
    previewScore: null,
    previewScorePosition: null,
  }),
  
  // Computed values
  getCurrentRack: () => {
    const { currentPlayer, player1Rack, player2Rack } = get();
    return currentPlayer === 1 ? player1Rack : player2Rack;
  },
  
  getCurrentPlayerName: () => {
    const { currentPlayer, player1Name, player2Name } = get();
    return currentPlayer === 1 ? player1Name : player2Name;
  },
  
  getCurrentPlayerPoints: () => {
    const { currentPlayer, player1points, player2points } = get();
    return currentPlayer === 1 ? player1points : player2points;
  },
  
  setCurrentPlayerPoints: (points) => {
    const { currentPlayer } = get();
    if (currentPlayer === 1) {
      set({ player1points: points });
    } else {
      set({ player2points: points });
    }
  },
  
  setCurrentPlayerRack: (rack) => {
    const { currentPlayer } = get();
    if (currentPlayer === 1) {
      set({ player1Rack: rack });
    } else {
      set({ player2Rack: rack });
    }
  },
  
  // Utility functions
  getBoardDiff: (beforeBoard, afterBoard) => getBoardDiff(beforeBoard, afterBoard),
  
  // Game initialization actions
  initializeGame: (origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound) => {
    const { setBoardCoords, setTempBoardCoords, setOrigBoardCoords, setIsDictionaryLoading } = get();
    
    // Initialize board
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    
    // Check dictionary loading state
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
        setIsDictionaryLoading(false);
        get().setSnackbarOpen(false);
      } catch (error) {
        console.error('Error checking dictionary:', error);
        setTimeout(checkDictionary, 1000);
      }
    };
    
    setIsDictionaryLoading(true);
    get().setSnackbarMessage('Loading dictionary.. (up to 30s)');
    get().setSnackbarSeverity('info');
    get().setSnackbarOpen(true);
    checkDictionary();
  },
  
  startBotGame: (params) => {
    const { 
      setGameStarted, 
      setTimerActive, 
      setBotGoesFirst, 
      setGameEnded, 
      setShowVictoryOverlay, 
      setShowConfetti, 
      setWinner,
      setPlayer1Time,
      setPlayer2Time,
      setGameTime,
      setBlankTiles,
      setSelectedTiles,
      setSelectedBoardPosition,
      setArrowDirection,
      setTempBoardCoords,
      setOrigBoardCoords,
      setBoardCoords,
      setPlayer1Rack,
      setPlayer2Rack,
      currentPlayer,
      player1Rack,
      player2Rack,
      selectedTiles,
      boardCoords,
      origBoardCoords,
      isDictionaryLoading,
      gameTime
    } = get();
    
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
        setPlayer1Rack(newRack);
      } else {
        setPlayer2Rack(newRack);
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
    
    // Randomly determine who goes first
    const randomFirst = Math.random() < 0.5;
    setBotGoesFirst(randomFirst);
    
    // Set game started state
    setGameStarted(true);
    setTimerActive(true);
    
    // Import and call the startBotGame function
    import('../functions/play/botFunctions').then(({ startBotGame }) => {
      startBotGame(params);
    });
  },
  
  // Victory celebration actions
  handleVictory: (winnerRack, winnerName, loserRack, loserPoints) => {
    const { 
      setGameEnded, 
      setWinner, 
      setFinalPlayer1Score, 
      setFinalPlayer2Score, 
      setShowConfetti, 
      setShowVictoryOverlay,
      player1Name,
      player1points,
      player2points
    } = get();
    
    setGameEnded(true);
    
    // Determine winner based on winnerName
    const isPlayerWinner = winnerName === player1Name;
    const winner = isPlayerWinner ? 'player' : 'bot';
    setWinner(winner);
    
    // Set final scores
    setFinalPlayer1Score(player1points);
    setFinalPlayer2Score(player2points);
    
    // Trigger victory celebration
    setShowConfetti(true);
    setShowVictoryOverlay(true);
  },
  
  handleNewGame: () => {
    const { 
      setShowVictoryOverlay, 
      setShowConfetti, 
      setGameEnded, 
      setWinner, 
      setFinalPlayer1Score, 
      setFinalPlayer2Score,
      setPlayer1Time,
      setPlayer2Time,
      setTimerActive,
      gameTime
    } = get();
    
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
    
    // Reset game state by calling startBotGame again
    get().startBotGame({ origBoard, origPool, TEST_RACKS, gameStartSound: null, botMoveSound: null });
  },
  
  // Timer management
  startTimer: (timerRef) => {
    const { timerActive, gameStarted, currentPlayer, setPlayer1Time, setPlayer2Time } = get();
    
    if (timerActive && gameStarted) {
      timerRef.current = setInterval(() => {
        if (currentPlayer === 1) {
          const currentTime = get().player1Time;
          if (currentTime <= 0 || isNaN(currentTime)) {
            clearInterval(timerRef.current);
            setPlayer1Time(0);
          } else {
            setPlayer1Time(currentTime - 1);
          }
        } else {
          const currentTime = get().player2Time;
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
  },
  
  // Game action handlers
  handlePass: () => {
    const { gameEnded } = get();
    if (gameEnded) return;
    
    import('../functions/play/passFunctions').then(({ handlePass }) => {
      handlePass();
    });
  },
  
  handleExchange: () => {
    const { gameEnded } = get();
    if (gameEnded) return;
    
    import('../functions/play/exchangeFunctions').then(({ handleExchange }) => {
      handleExchange();
    });
  },
  
  handleWordSubmit: (playerMoveSound) => {
    import('../functions/play/wordSubmitFunctions').then(({ handleWordSubmit }) => {
      handleWordSubmit(playerMoveSound);
    });
  },
  
  handlePlayTopMove: () => {
    const { gameEnded } = get();
    if (gameEnded) return Promise.resolve();
    
    return import('../functions/play/moveFunctions').then(({ handlePlayTopMove }) => {
      return handlePlayTopMove();
    });
  },
})); 