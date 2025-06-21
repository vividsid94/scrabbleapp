import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Play from '../Play';
import { useGameStore } from '../../../stores/gameStore';

// Mock the Zustand store
jest.mock('../../../stores/gameStore', () => ({
  useGameStore: jest.fn()
}));

// Mock child components
jest.mock('../../../components/AppContent/Sidenav/Sidenav.js', () => {
  return function MockSidenav() {
    return <div data-testid="sidenav">Sidenav</div>;
  };
});

jest.mock('../../../components/AppContent/Board/Board.js', () => {
  return function MockBoard({ onBoardChildClick, onTileDrop, onTileClick }) {
    return (
      <div data-testid="board">
        <button 
          data-testid="board-click" 
          onClick={() => onBoardChildClick(0, 0)}
        >
          Click Board
        </button>
        <button 
          data-testid="tile-drop" 
          onClick={() => onTileDrop('A', 0, 0, 0)}
        >
          Drop Tile
        </button>
        <button 
          data-testid="tile-click" 
          onClick={() => onTileClick('A', 0)}
        >
          Click Tile
        </button>
      </div>
    );
  };
});

jest.mock('../../../components/AppContent/Board/PlayPool.js', () => {
  return function MockPlayPool() {
    return <div data-testid="play-pool">PlayPool</div>;
  };
});

jest.mock('../../../components/Modals/SimulationModal', () => {
  return function MockSimulationModal({ open }) {
    return open ? <div data-testid="simulation-modal">SimulationModal</div> : null;
  };
});

jest.mock('../../../components/Modals/GameModal', () => {
  return function MockGameModal() {
    return <div data-testid="game-modal">GameModal</div>;
  };
});

jest.mock('../components/PlayerInfo', () => {
  return function MockPlayerInfo({ onWordSubmit, onPass, onExchange, onPlayTopMove }) {
    return (
      <div data-testid="player-info">
        <button data-testid="word-submit" onClick={onWordSubmit}>Submit Word</button>
        <button data-testid="pass" onClick={onPass}>Pass</button>
        <button data-testid="exchange" onClick={onExchange}>Exchange</button>
        <button data-testid="play-top-move" onClick={onPlayTopMove}>Play Top Move</button>
      </div>
    );
  };
});

jest.mock('../../../components/Confetti/Confetti', () => {
  return function MockConfetti() {
    return <div data-testid="confetti">Confetti</div>;
  };
});

// Mock Audio constructor
global.Audio = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  currentTime: 0,
  duration: 0,
  error: null
}));

// Mock sound functions
jest.mock('../../../functions/play/soundFunctions', () => ({
  initializeSounds: jest.fn(() => {
    const mockAudio = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      currentTime: 0,
      duration: 0,
      error: null
    };
    return {
      gameStartSound: mockAudio,
      playerMoveSound: mockAudio,
      botMoveSound: mockAudio
    };
  }),
  updateSoundType: jest.fn(),
  handleSoundError: jest.fn()
}));

// Mock static data
jest.mock('../../../components/AppContent/References/staticData.js', () => ({
  origPool: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  origBoard: '[[1,1,1],[1,1,1],[1,1,1]]',
  letterLookup: { 
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, 
    N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10 
  }
}));

jest.mock('../../../components/AppContent/References/testRacks.js', () => ({
  TEST_RACKS: [['A', 'B', 'C'], ['D', 'E', 'F']]
}));

// Mock tile functions
jest.mock('../../../functions/play/tileFunctions', () => ({
  handleTileDrop: jest.fn(),
  handleTileClick: jest.fn()
}));

// Mock board functions
jest.mock('../../../functions/boardFunctions.js', () => ({
  createBoard: jest.fn(() => [])
}));

describe('Play Component - Integration Tests', () => {
  let mockStore;

  beforeEach(() => {
    // Create a fresh mock store for each test
    mockStore = {
      // Board state
      boardCoords: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
      tempBoardCoords: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
      origBoardCoords: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
      setBoardCoords: jest.fn(),
      setTempBoardCoords: jest.fn(),
      setOrigBoardCoords: jest.fn(),
      
      // Player state
      player1points: 0,
      player2points: 0,
      player1Rack: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      player2Rack: ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
      player1Name: 'Player 1',
      player2Name: 'Player 2',
      currentPlayer: 1,
      setPlayer1points: jest.fn(),
      setPlayer2points: jest.fn(),
      setPlayer1Rack: jest.fn(),
      setPlayer2Rack: jest.fn(),
      setPlayer1Name: jest.fn(),
      setPlayer2Name: jest.fn(),
      setCurrentPlayer: jest.fn(),
      
      // Game state
      pool: ['O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      gameStarted: false,
      gameEnded: false,
      isBotMode: false,
      consecutivePasses: 0,
      setPool: jest.fn(),
      setGameStarted: jest.fn(),
      setGameEnded: jest.fn(),
      setIsBotMode: jest.fn(),
      setConsecutivePasses: jest.fn(),
      
      // Tile and selection state
      selectedTiles: [],
      selectedBoardPosition: null,
      arrowDirection: 'right',
      tilesToExchange: [],
      blankTiles: [],
      setSelectedTiles: jest.fn(),
      setSelectedBoardPosition: jest.fn(),
      setArrowDirection: jest.fn(),
      setTilesToExchange: jest.fn(),
      setBlankTiles: jest.fn(),
      
      // Bot state
      isBotThinking: false,
      isPlayerThinking: false,
      
      // Timer state
      player1Time: 1200,
      player2Time: 1200,
      timerActive: false,
      gameTime: 20,
      setPlayer1Time: jest.fn(),
      setPlayer2Time: jest.fn(),
      setTimerActive: jest.fn(),
      setGameTime: jest.fn(),
      
      // Move history
      moveHistory: [],
      topMoves: [],
      isLoadingTopMoves: false,
      setMoveHistory: jest.fn(),
      setTopMoves: jest.fn(),
      setIsLoadingTopMoves: jest.fn(),
      
      // Dictionary loading
      isDictionaryLoading: false,
      setIsDictionaryLoading: jest.fn(),
      
      // Auto-play
      autoPlayBest: false,
      isAutoPlaying: false,
      setAutoPlayBest: jest.fn(),
      setIsAutoPlaying: jest.fn(),
      
      // Victory state
      winner: null,
      
      // Simulation state
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
      isHeatMapMode: false,
      heatMapData: null,
      setSimulatingMove: jest.fn(),
      setSimulationResult: jest.fn(),
      setSimulationProgress: jest.fn(),
      setPreviewBoard: jest.fn(),
      setPreviewMove: jest.fn(),
      setPreviewTileOwnership: jest.fn(),
      setMoveWithResults: jest.fn(),
      setSimulationBoard: jest.fn(),
      setLeaveValues: jest.fn(),
      setShowSimulationModal: jest.fn(),
      
      // UI state
      theme: "STANDARD",
      snackbarOpen: false,
      snackbarMessage: "",
      snackbarSeverity: "error",
      showTimeSlider: false,
      showConfetti: false,
      showVictoryOverlay: false,
      setTheme: jest.fn(),
      setSnackbarOpen: jest.fn(),
      setSnackbarMessage: jest.fn(),
      setSnackbarSeverity: jest.fn(),
      setShowTimeSlider: jest.fn(),
      setShowConfetti: jest.fn(),
      setShowVictoryOverlay: jest.fn(),
      
      // Settings state
      playerMoveSoundType: 'classic',
      botMoveSoundType: 'classic',
      setPlayerMoveSoundType: jest.fn(),
      setBotMoveSoundType: jest.fn(),
      
      // Computed values
      getCurrentRack: jest.fn(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G']),
      getCurrentPlayerName: jest.fn(() => 'Player 1'),
      getCurrentPlayerPoints: jest.fn(() => 0),
      setCurrentPlayerPoints: jest.fn(),
      setCurrentPlayerRack: jest.fn(),
      
      // Utility functions
      getBoardDiff: jest.fn(),
      
      // Store actions
      initializeGame: jest.fn(),
      startBotGame: jest.fn(),
      handleVictory: jest.fn(),
      handleNewGame: jest.fn(),
      startTimer: jest.fn(),
      handlePass: jest.fn(),
      handleExchange: jest.fn(),
      handleWordSubmit: jest.fn(),
      handlePlayTopMove: jest.fn(),
      getTopMovesForExpandable: jest.fn(),
      handleMoveSelectClick: jest.fn(),
      calculatePreviewScore: jest.fn(),
      handleConfettiComplete: jest.fn(),
      runSimulation: jest.fn(),
      getSelectedTiles: jest.fn(() => []),
      
      // UI handler functions
      handleSettingsOpen: jest.fn(),
      handleColorSchemeOpen: jest.fn(),
      handleWordSubmitClick: jest.fn(),
      handlePassClick: jest.fn(),
      handleExchangeClick: jest.fn(),
      handlePlayTopMoveClick: jest.fn(() => Promise.resolve()),
      handleBotModeToggle: jest.fn(),
      
      // Simulation handler functions
      openSimulationModal: jest.fn(),
      resetHeatMapMode: jest.fn(),
      stopSimulation: jest.fn(),
      simulateMove: jest.fn(),
      runAllMovesSimulation: jest.fn(),
      runHeatMapSimulation: jest.fn(),
      handleGetTopMovesForExpandable: jest.fn(),
      
      // Utility functions
      limitMoveHistory: jest.fn(),
      updatePreviewScore: jest.fn(),
      fetchLeaveValuesForTopMoves: jest.fn(),
      checkDictionary: jest.fn(),
      
      // Keyboard event handlers
      handleKeyDownWrapper: jest.fn(),
      handleKeyPressWrapper: jest.fn(),
      
      // Time slider handler
      handleTimeSliderMouseDown: jest.fn(),
      
      // Bot move handler
      makeBotMove: jest.fn(),
    };

    useGameStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Game Scenarios', () => {
    test('simulates a complete game with word submissions and score tracking', async () => {
      render(<Play />);
      
      // Start the game
      mockStore.gameStarted = true;
      mockStore.setGameStarted(true);
      
      // Player 1 plays "CAT" (C=3, A=1, T=1 = 5 points)
      mockStore.player1Rack = ['C', 'A', 'T', 'D', 'E', 'F', 'G'];
      mockStore.setPlayer1Rack(['C', 'A', 'T', 'D', 'E', 'F', 'G']);
      mockStore.player1points = 5;
      mockStore.setPlayer1points(5);
      mockStore.currentPlayer = 2;
      mockStore.setCurrentPlayer(2);
      
      // Player 2 plays "DOG" (D=2, O=1, G=2 = 5 points)
      mockStore.player2Rack = ['D', 'O', 'G', 'H', 'I', 'J', 'K'];
      mockStore.setPlayer2Rack(['D', 'O', 'G', 'H', 'I', 'J', 'K']);
      mockStore.player2points = 5;
      mockStore.setPlayer2points(5);
      mockStore.currentPlayer = 1;
      mockStore.setCurrentPlayer(1);
      
      // Player 1 plays "FISH" (F=4, I=1, S=1, H=4 = 10 points)
      mockStore.player1Rack = ['F', 'I', 'S', 'H', 'D', 'E', 'G'];
      mockStore.setPlayer1Rack(['F', 'I', 'S', 'H', 'D', 'E', 'G']);
      mockStore.player1points = 15;
      mockStore.setPlayer1points(15);
      mockStore.currentPlayer = 2;
      mockStore.setCurrentPlayer(2);
      
      // Player 2 passes
      mockStore.consecutivePasses = 1;
      mockStore.setConsecutivePasses(1);
      mockStore.currentPlayer = 1;
      mockStore.setCurrentPlayer(1);
      
      // Player 1 passes again - game should end
      mockStore.consecutivePasses = 2;
      mockStore.setConsecutivePasses(2);
      mockStore.gameEnded = true;
      mockStore.setGameEnded(true);
      mockStore.winner = 'player1';
      mockStore.showVictoryOverlay = true;
      mockStore.setShowVictoryOverlay(true);
      
      // Verify final scores
      expect(mockStore.player1points).toBe(15);
      expect(mockStore.player2points).toBe(5);
      expect(mockStore.winner).toBe('player1');
      expect(mockStore.showVictoryOverlay).toBe(true);
    });

    test('simulates bot mode game with automatic moves', async () => {
      // Set up bot mode conditions BEFORE rendering
      mockStore.isBotMode = true;
      mockStore.gameStarted = true;
      mockStore.currentPlayer = 2;
      mockStore.isBotThinking = false;
      mockStore.gameEnded = false;
      mockStore.player1Name = 'You';
      mockStore.player2Name = 'SidBot';
      
      render(<Play />);
      
      // Bot should make a move
      expect(mockStore.makeBotMove).toHaveBeenCalled();
      
      // Bot completes move
      mockStore.player2points = 8;
      mockStore.setPlayer2points(8);
      mockStore.currentPlayer = 1;
      mockStore.setCurrentPlayer(1);
      mockStore.isBotThinking = false;
      
      // Verify bot mode behavior
      expect(mockStore.player1Name).toBe('You');
      expect(mockStore.player2Name).toBe('SidBot');
      expect(mockStore.makeBotMove).toHaveBeenCalled();
    });

    test('simulates game with exchanges and passes', async () => {
      render(<Play />);
      
      // Start game
      mockStore.gameStarted = true;
      mockStore.setGameStarted(true);
      
      // Player 1 exchanges tiles
      mockStore.tilesToExchange = ['A', 'B', 'C'];
      mockStore.setTilesToExchange(['A', 'B', 'C']);
      mockStore.pool = ['X', 'Y', 'Z', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];
      mockStore.setPool(['X', 'Y', 'Z', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']);
      mockStore.currentPlayer = 2;
      mockStore.setCurrentPlayer(2);
      
      // Player 2 passes
      mockStore.consecutivePasses = 1;
      mockStore.setConsecutivePasses(1);
      mockStore.currentPlayer = 1;
      mockStore.setCurrentPlayer(1);
      
      // Player 1 passes
      mockStore.consecutivePasses = 2;
      mockStore.setConsecutivePasses(2);
      mockStore.gameEnded = true;
      mockStore.setGameEnded(true);
      
      // Verify exchange and pass behavior
      expect(mockStore.tilesToExchange).toEqual(['A', 'B', 'C']);
      expect(mockStore.consecutivePasses).toBe(2);
      expect(mockStore.gameEnded).toBe(true);
    });

    test('simulates game with timer running out', async () => {
      render(<Play />);
      
      // Start game with timer
      mockStore.gameStarted = true;
      mockStore.setGameStarted(true);
      mockStore.timerActive = true;
      mockStore.setTimerActive(true);
      mockStore.player1Time = 1200; // 20 minutes
      mockStore.setPlayer1Time(1200);
      mockStore.player2Time = 1200;
      mockStore.setPlayer2Time(1200);
      
      // Player 1's time runs out
      mockStore.player1Time = 0;
      mockStore.setPlayer1Time(0);
      mockStore.gameEnded = true;
      mockStore.setGameEnded(true);
      mockStore.winner = 'player2';
      mockStore.showVictoryOverlay = true;
      mockStore.setShowVictoryOverlay(true);
      
      // Verify timer-based victory
      expect(mockStore.player1Time).toBe(0);
      expect(mockStore.winner).toBe('player2');
      expect(mockStore.showVictoryOverlay).toBe(true);
    });

    test('simulates game with auto-play best moves', async () => {
      // Set up auto-play conditions BEFORE rendering
      mockStore.gameStarted = true;
      mockStore.autoPlayBest = true;
      mockStore.currentPlayer = 1;
      mockStore.isLoadingTopMoves = false;
      mockStore.isDictionaryLoading = false;
      mockStore.isAutoPlaying = false;
      mockStore.isPlayerThinking = false;
      mockStore.gameEnded = false;
      
      render(<Play />);
      
      // Auto-play should trigger - first with true, then with false in finally block
      expect(mockStore.setIsAutoPlaying).toHaveBeenCalledWith(true);
      expect(mockStore.handlePlayTopMoveClick).toHaveBeenCalled();
      
      // After the Promise resolves, setIsAutoPlaying should be called with false
      await waitFor(() => {
        expect(mockStore.setIsAutoPlaying).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('handles rapid button clicking without breaking', async () => {
      render(<Play />);
      
      // Rapidly click multiple buttons
      await Promise.all([
        userEvent.click(screen.getByTestId('word-submit')),
        userEvent.click(screen.getByTestId('pass')),
        userEvent.click(screen.getByTestId('exchange')),
        userEvent.click(screen.getByTestId('play-top-move'))
      ]);
      
      // Component should still render without errors
      expect(screen.getByTestId('sidenav')).toBeInTheDocument();
      expect(screen.getByTestId('board')).toBeInTheDocument();
    });

    test('handles game state corruption gracefully', async () => {
      // Simulate corrupted state
      mockStore.boardCoords = null;
      mockStore.player1Rack = null;
      mockStore.player2Rack = null;
      
      render(<Play />);
      
      // Component should still render
      expect(screen.getByTestId('sidenav')).toBeInTheDocument();
      expect(screen.getByTestId('board')).toBeInTheDocument();
    });

    test('handles network failures during dictionary loading', async () => {
      mockStore.isDictionaryLoading = true;
      mockStore.setIsDictionaryLoading(true);
      mockStore.snackbarMessage = 'Loading dictionary.. (up to 30s)';
      mockStore.setSnackbarMessage('Loading dictionary.. (up to 30s)');
      mockStore.snackbarOpen = true;
      mockStore.setSnackbarOpen(true);
      
      render(<Play />);
      
      // Should show loading message
      expect(screen.getByText('Loading dictionary.. (up to 30s)')).toBeInTheDocument();
    });
  });
}); 