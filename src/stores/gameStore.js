import { create } from 'zustand';
import { origPool, origBoard } from '../components/AppContent/References/staticData.js';
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
})); 