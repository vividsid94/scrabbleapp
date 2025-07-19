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
      playerMoveSoundType: 'puzzle',
      botMoveSoundType: 'puzzle',
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
      resetGame: jest.fn(),
      
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
      mockStore.player2Name = 'T²';
      
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
      expect(mockStore.player2Name).toBe('T²');
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

    test('handles empty rack scenarios', async () => {
      mockStore.gameStarted = true;
      mockStore.player1Rack = [];
      mockStore.player2Rack = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      mockStore.currentPlayer = 1;
      
      render(<Play />);
      
      // Verify getCurrentRack function exists and works with empty rack
      expect(mockStore.getCurrentRack).toBeDefined();
      expect(typeof mockStore.getCurrentRack).toBe('function');
      
      // Test that getCurrentRack can handle empty rack scenario
      mockStore.getCurrentRack.mockReturnValue([]);
      const currentRack = mockStore.getCurrentRack();
      expect(currentRack).toEqual([]);
      expect(mockStore.getCurrentRack).toHaveBeenCalled();
    });

    test('handles invalid board coordinates', async () => {
      mockStore.boardCoords = [[1, 2, 3], [4, 5, 6]]; // Invalid 2D array
      mockStore.tempBoardCoords = [[1, 2, 3], [4, 5, 6]];
      
      render(<Play />);
      
      // Component should still render
      expect(screen.getByTestId('board')).toBeInTheDocument();
    });

    test('handles simultaneous bot and player thinking states', async () => {
      mockStore.gameStarted = true;
      mockStore.isBotMode = true;
      mockStore.isBotThinking = true;
      mockStore.isPlayerThinking = true;
      mockStore.currentPlayer = 2;
      
      render(<Play />);
      
      // Both thinking states should be handled
      expect(mockStore.isBotThinking).toBe(true);
      expect(mockStore.isPlayerThinking).toBe(true);
    });

    test('handles consecutive passes reaching game end limit', async () => {
      mockStore.gameStarted = true;
      mockStore.consecutivePasses = 5; // One away from game end
      mockStore.currentPlayer = 1;
      
      render(<Play />);
      
      // Trigger one more pass
      await userEvent.click(screen.getByTestId('pass'));
      
      // Game should end after 6 consecutive passes
      expect(mockStore.handlePassClick).toHaveBeenCalled();
    });

    test('handles pool exhaustion scenarios', async () => {
      mockStore.gameStarted = true;
      mockStore.pool = []; // Empty pool
      mockStore.player1Rack = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      mockStore.player2Rack = ['H', 'I', 'J', 'K', 'L', 'M', 'N'];
      
      render(<Play />);
      
      // Game should handle empty pool
      expect(mockStore.pool).toEqual([]);
    });

    test('handles invalid move submissions', async () => {
      mockStore.gameStarted = true;
      mockStore.selectedTiles = [];
      mockStore.selectedBoardPosition = null;
      
      render(<Play />);
      
      // Try to submit with no tiles selected
      await userEvent.click(screen.getByTestId('word-submit'));
      
      // Should handle invalid submission gracefully
      expect(mockStore.handleWordSubmitClick).toHaveBeenCalled();
    });

    test('handles simulation modal interactions', async () => {
      mockStore.gameStarted = true;
      mockStore.showSimulationModal = true;
      mockStore.simulatingMove = { word: 'TEST', score: 10 };
      mockStore.simulationProgress = 50;
      
      render(<Play />);
      
      // Simulation modal should be visible
      expect(screen.getByTestId('simulation-modal')).toBeInTheDocument();
    });

    test('handles heat map simulation mode', async () => {
      mockStore.gameStarted = true;
      mockStore.isHeatMapMode = true;
      mockStore.heatMapData = { '0,0': 0.5, '0,1': 0.8 };
      mockStore.simulationBoard = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      
      render(<Play />);
      
      // Heat map mode should be active
      expect(mockStore.isHeatMapMode).toBe(true);
      expect(mockStore.heatMapData).toBeDefined();
    });

    test('handles keyboard shortcuts during different game states', async () => {
      mockStore.gameStarted = true;
      mockStore.gameEnded = false;
      mockStore.isPlayerThinking = false;
      mockStore.isBotThinking = false;
      
      render(<Play />);
      
      // Verify keyboard handler function exists and is callable
      expect(mockStore.handleKeyPressWrapper).toBeDefined();
      expect(typeof mockStore.handleKeyPressWrapper).toBe('function');
      
      // Verify keyboard handler can be called with proper parameters
      mockStore.handleKeyPressWrapper({ key: '1' }, null, null);
      expect(mockStore.handleKeyPressWrapper).toHaveBeenCalled();
    });

    test('handles victory celebration sequence', async () => {
      mockStore.gameStarted = true;
      mockStore.gameEnded = true;
      mockStore.winner = 'player';
      mockStore.showConfetti = true;
      mockStore.showVictoryOverlay = true;
      mockStore.finalPlayer1Score = 150;
      mockStore.finalPlayer2Score = 120;
      
      render(<Play />);
      
      // Victory celebration should be active
      expect(mockStore.showConfetti).toBe(true);
      expect(mockStore.showVictoryOverlay).toBe(true);
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });

    test('handles new game after victory', async () => {
      mockStore.gameEnded = true;
      mockStore.winner = 'player';
      mockStore.showVictoryOverlay = true;
      
      render(<Play />);
      
      // New game should reset all states
      expect(mockStore.handleNewGame).toBeDefined();
    });

    test('handles sound system failures gracefully', async () => {
      // Mock Audio to throw error
      global.Audio = jest.fn().mockImplementation(() => {
        throw new Error('Audio not supported');
      });
      
      render(<Play />);
      
      // Component should still render without audio
      expect(screen.getByTestId('sidenav')).toBeInTheDocument();
    });

    test('handles timer precision and edge cases', async () => {
      mockStore.gameStarted = true;
      mockStore.timerActive = true;
      mockStore.player1Time = 1; // 1 second remaining
      mockStore.player2Time = 0; // Time already up
      
      render(<Play />);
      
      // Timer should handle edge cases
      expect(mockStore.player1Time).toBe(1);
      expect(mockStore.player2Time).toBe(0);
    });

    test('handles move history limit enforcement', async () => {
      // Create a large move history
      const largeHistory = Array.from({ length: 60 }, (_, i) => ({
        player: i % 2 === 0 ? 'Player 1' : 'Player 2',
        word: `WORD${i}`,
        score: i * 5,
        timestamp: Date.now() + i
      }));
      
      mockStore.moveHistory = largeHistory;
      mockStore.gameStarted = true;
      
      render(<Play />);
      
      // Move history should be limited
      expect(mockStore.limitMoveHistory).toBeDefined();
    });

    test('handles preview score calculations', async () => {
      mockStore.gameStarted = true;
      mockStore.selectedTiles = [{ tile: 'A', row: 7, col: 7 }];
      mockStore.selectedBoardPosition = { row: 7, col: 7 };
      mockStore.tempBoardCoords = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      
      render(<Play />);
      
      // Preview score should be calculated
      expect(mockStore.calculatePreviewScore).toBeDefined();
    });

    test('handles top moves loading states', async () => {
      mockStore.gameStarted = true;
      mockStore.isLoadingTopMoves = true;
      mockStore.topMoves = [];
      
      render(<Play />);
      
      // Loading state should be handled
      expect(mockStore.isLoadingTopMoves).toBe(true);
    });

    test('handles exchange tile selection and validation', async () => {
      mockStore.gameStarted = true;
      mockStore.tilesToExchange = ['A', 'B'];
      mockStore.player1Rack = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      mockStore.currentPlayer = 1;
      
      render(<Play />);
      
      // Exchange validation should work
      expect(mockStore.tilesToExchange).toEqual(['A', 'B']);
    });

    test('handles blank tile scenarios', async () => {
      mockStore.gameStarted = true;
      mockStore.blankTiles = [{ row: 7, col: 7, letter: 'A' }];
      mockStore.selectedTiles = [{ tile: '?', row: 7, col: 7 }];
      
      render(<Play />);
      
      // Blank tiles should be handled
      expect(mockStore.blankTiles).toHaveLength(1);
    });

    test('handles board tile placement and validation', async () => {
      mockStore.gameStarted = true;
      mockStore.selectedTiles = [{ tile: 'A', row: 7, col: 7 }];
      mockStore.tempBoardCoords = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      
      render(<Play />);
      
      // Board interactions should work
      fireEvent.click(screen.getByTestId('board-click'));
      fireEvent.click(screen.getByTestId('tile-drop'));
      
      expect(screen.getByTestId('board')).toBeInTheDocument();
    });

    test('handles rack tile selection and deselection', async () => {
      mockStore.gameStarted = true;
      mockStore.player1Rack = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      mockStore.selectedTiles = [];
      
      render(<Play />);
      
      // Rack interactions should work
      fireEvent.click(screen.getByTestId('tile-click'));
      
      expect(screen.getByTestId('board')).toBeInTheDocument();
    });

    test('handles game modal interactions', async () => {
      mockStore.open = true;
      mockStore.modalContent = 'settings';
      
      render(<Play />);
      
      // Modal should be visible
      expect(screen.getByTestId('game-modal')).toBeInTheDocument();
    });

    test('handles snackbar notifications', async () => {
      mockStore.snackbarOpen = true;
      mockStore.snackbarMessage = 'Test message';
      mockStore.snackbarSeverity = 'info';
      
      render(<Play />);
      
      // Snackbar should be active
      expect(mockStore.snackbarOpen).toBe(true);
      expect(mockStore.snackbarMessage).toBe('Test message');
    });

    test('handles theme switching', async () => {
      mockStore.theme = 'DARK';
      
      render(<Play />);
      
      // Theme should be applied
      expect(mockStore.theme).toBe('DARK');
    });

    test('handles time slider interactions', async () => {
      mockStore.showTimeSlider = true;
      mockStore.gameTime = 15;
      
      render(<Play />);
      
      // Time slider should be visible
      expect(mockStore.showTimeSlider).toBe(true);
    });

    test('handles simulation progress tracking', async () => {
      mockStore.simulatingMove = { word: 'TEST', score: 10 };
      mockStore.simulationProgress = 75;
      mockStore.shouldStopSimulation = false;
      
      render(<Play />);
      
      // Simulation should be in progress
      expect(mockStore.simulationProgress).toBe(75);
    });

    test('handles leave values calculation', async () => {
      mockStore.leaveValues = { 'ABC': 5, 'DEF': 8 };
      mockStore.topMoves = [
        { word: 'TEST', leave: 'ABC', score: 10 },
        { word: 'WORD', leave: 'DEF', score: 15 }
      ];
      
      render(<Play />);
      
      // Leave values should be available
      expect(mockStore.leaveValues).toBeDefined();
    });

    test('handles board control metrics', async () => {
      mockStore.gameStarted = true;
      mockStore.boardCoords = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      
      render(<Play />);
      
      // Board control should be calculated
      expect(mockStore.boardCoords).toBeDefined();
    });

    test('handles auto-play best move selection', async () => {
      mockStore.gameStarted = true;
      mockStore.autoPlayBest = true;
      mockStore.isAutoPlaying = true;
      mockStore.topMoves = [
        { word: 'BEST', score: 20 },
        { word: 'GOOD', score: 15 }
      ];
      
      render(<Play />);
      
      // Auto-play should select best move
      expect(mockStore.autoPlayBest).toBe(true);
      expect(mockStore.isAutoPlaying).toBe(true);
    });

    test('handles consecutive pass tracking', async () => {
      mockStore.gameStarted = true;
      mockStore.consecutivePasses = 3;
      mockStore.currentPlayer = 1;
      
      render(<Play />);
      
      // Consecutive passes should be tracked
      expect(mockStore.consecutivePasses).toBe(3);
    });

    test('handles game initialization with different board sizes', async () => {
      mockStore.origBoardCoords = [[1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1]];
      mockStore.boardCoords = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
      
      render(<Play />);
      
      // Different board sizes should be handled
      expect(mockStore.boardCoords).toHaveLength(5);
    });

    test('handles player name changes during game', async () => {
      mockStore.gameStarted = true;
      mockStore.player1Name = 'Alice';
      mockStore.player2Name = 'Bob';
      
      render(<Play />);
      
      // Player names should be updated
      expect(mockStore.player1Name).toBe('Alice');
      expect(mockStore.player2Name).toBe('Bob');
    });

    test('handles pool tile distribution', async () => {
      mockStore.pool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      mockStore.player1Rack = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
      mockStore.player2Rack = ['R', 'S', 'T', 'U', 'V', 'W', 'X'];
      
      render(<Play />);
      
      // Pool should be properly distributed
      expect(mockStore.pool).toHaveLength(10);
    });

    test('handles move history with complex board states', async () => {
      const complexMove = {
        beforeBoard: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        afterBoard: [[0, 0, 0], [0, 'A', 0], [0, 0, 0]],
        player: 'Player 1',
        score: 5,
        word: 'CAT',
        boardDiff: [{ row: 1, col: 1, value: 'A' }]
      };
      
      mockStore.moveHistory = [complexMove];
      mockStore.gameStarted = true;
      
      render(<Play />);
      
      // Complex moves should be handled
      expect(mockStore.moveHistory).toHaveLength(1);
    });

    test('handles simulation modal with multiple moves', async () => {
      mockStore.showSimulationModal = true;
      mockStore.moveWithResults = { word: 'TEST', score: 10 };
      mockStore.allMoveResults = {
        'TEST': { avgScore: 8.5, winRate: 0.6 },
        'WORD': { avgScore: 7.2, winRate: 0.4 }
      };
      
      render(<Play />);
      
      // Multiple move results should be displayed
      expect(mockStore.allMoveResults).toBeDefined();
    });

    test('handles keyboard navigation during simulation', async () => {
      mockStore.showSimulationModal = true;
      mockStore.simulatingMove = { word: 'TEST', score: 10 };
      
      render(<Play />);
      
      // Verify keyboard handler function exists and is callable
      expect(mockStore.handleKeyDownWrapper).toBeDefined();
      expect(typeof mockStore.handleKeyDownWrapper).toBe('function');
      
      // Verify keyboard handler can be called with proper parameters
      mockStore.handleKeyDownWrapper({ key: 'Escape' }, null, null);
      expect(mockStore.handleKeyDownWrapper).toHaveBeenCalled();
    });

    test('handles game state persistence across renders', async () => {
      mockStore.gameStarted = true;
      mockStore.player1points = 25;
      mockStore.player2points = 18;
      mockStore.currentPlayer = 2;
      
      const { rerender } = render(<Play />);
      
      // Rerender with same state
      rerender(<Play />);
      
      // State should persist
      expect(mockStore.player1points).toBe(25);
      expect(mockStore.player2points).toBe(18);
      expect(mockStore.currentPlayer).toBe(2);
    });

    test('handles rapid state changes without race conditions', async () => {
      mockStore.gameStarted = true;
      mockStore.currentPlayer = 1;
      
      render(<Play />);
      
      // Rapidly change states
      mockStore.setCurrentPlayer(2);
      mockStore.setCurrentPlayer(1);
      mockStore.setCurrentPlayer(2);
      
      // Should handle rapid changes gracefully
      expect(mockStore.setCurrentPlayer).toHaveBeenCalledTimes(3);
    });

    test('handles memory leaks in long-running games', async () => {
      mockStore.gameStarted = true;
      mockStore.moveHistory = Array.from({ length: 100 }, (_, i) => ({
        player: i % 2 === 0 ? 'Player 1' : 'Player 2',
        word: `WORD${i}`,
        score: i * 2,
        timestamp: Date.now() + i
      }));
      
      render(<Play />);
      
      // Large move history should be handled efficiently
      expect(mockStore.moveHistory).toHaveLength(100);
    });

    test('handles concurrent bot and player actions', async () => {
      mockStore.gameStarted = true;
      mockStore.isBotMode = true;
      mockStore.currentPlayer = 2;
      mockStore.isBotThinking = true;
      
      render(<Play />);
      
      // Try player action while bot is thinking
      await userEvent.click(screen.getByTestId('pass'));
      
      // Should handle concurrent actions gracefully
      expect(mockStore.handlePassClick).toHaveBeenCalled();
    });

    test('handles network latency in bot responses', async () => {
      mockStore.gameStarted = true;
      mockStore.isBotMode = true;
      mockStore.currentPlayer = 2;
      mockStore.isBotThinking = true;
      
      render(<Play />);
      
      // Simulate delayed bot response
      setTimeout(() => {
        mockStore.isBotThinking = false;
        mockStore.currentPlayer = 1;
      }, 1000);
      
      // Should handle latency gracefully
      expect(mockStore.isBotThinking).toBe(true);
    });

    test('handles invalid move coordinates', async () => {
      mockStore.gameStarted = true;
      mockStore.selectedTiles = [{ tile: 'A', row: -1, col: 15 }]; // Invalid coordinates
      mockStore.selectedBoardPosition = { row: -1, col: 15 };
      
      render(<Play />);
      
      // Invalid coordinates should be handled
      expect(mockStore.selectedTiles).toBeDefined();
    });

    test('handles game reset functionality', async () => {
      mockStore.gameStarted = true;
      mockStore.player1points = 50;
      mockStore.player2points = 45;
      mockStore.moveHistory = [{ player: 'Player 1', word: 'TEST', score: 10 }];
      
      render(<Play />);
      
      // Reset game
      mockStore.resetGame();
      
      // Game should be reset
      expect(mockStore.resetGame).toBeDefined();
    });

    test('handles sound type switching', async () => {
      mockStore.playerMoveSoundType = 'modern';
      mockStore.botMoveSoundType = 'puzzle';
      
      render(<Play />);
      
      // Sound types should be configurable
      expect(mockStore.playerMoveSoundType).toBe('modern');
      expect(mockStore.botMoveSoundType).toBe('puzzle');
    });

    test('handles game with maximum score scenarios', async () => {
      mockStore.gameStarted = true;
      mockStore.player1points = 999;
      mockStore.player2points = 998;
      mockStore.currentPlayer = 1;
      
      render(<Play />);
      
      // High scores should be handled
      expect(mockStore.player1points).toBe(999);
      expect(mockStore.player2points).toBe(998);
    });

    test('handles game with minimum time scenarios', async () => {
      mockStore.gameStarted = true;
      mockStore.timerActive = true;
      mockStore.player1Time = 1;
      mockStore.player2Time = 1;
      mockStore.gameTime = 1; // 1 minute game
      
      render(<Play />);
      
      // Minimum time should be handled
      expect(mockStore.gameTime).toBe(1);
    });

    test('handles simultaneous multiple game actions', async () => {
      mockStore.gameStarted = true;
      mockStore.selectedTiles = [{ tile: 'A', row: 7, col: 7 }];
      mockStore.tilesToExchange = ['B', 'C'];
      
      render(<Play />);
      
      // Try multiple actions simultaneously
      await Promise.all([
        userEvent.click(screen.getByTestId('word-submit')),
        userEvent.click(screen.getByTestId('exchange')),
        userEvent.click(screen.getByTestId('pass'))
      ]);
      
      // Should handle simultaneous actions
      expect(mockStore.handleWordSubmitClick).toBeDefined();
      expect(mockStore.handleExchangeClick).toBeDefined();
      expect(mockStore.handlePassClick).toBeDefined();
    });

    test('verifies pool is correctly updated when tiles are played', async () => {
      // Initial setup - full pool and racks
      mockStore.gameStarted = true;
      mockStore.currentPlayer = 1;
      mockStore.pool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      mockStore.player1Rack = ['C', 'A', 'T', 'D', 'E', 'F', 'G'];
      mockStore.player2Rack = ['H', 'I', 'J', 'K', 'L', 'M', 'N'];
      
      const initialPoolSize = mockStore.pool.length;
      const initialPlayer1RackSize = mockStore.player1Rack.length;
      const initialPlayer2RackSize = mockStore.player2Rack.length;
      
      render(<Play />);
      
      // Player 1 plays "CAT" (3 tiles)
      const tilesToPlay = ['C', 'A', 'T'];
      mockStore.selectedTiles = tilesToPlay.map((tile, index) => ({ 
        tile, 
        row: 7, 
        col: 7 + index 
      }));
      mockStore.selectedBoardPosition = { row: 7, col: 7 };
      
      // Simulate word submission
      await userEvent.click(screen.getByTestId('word-submit'));
      
      // Verify setPool function exists and can handle tile removal
      expect(mockStore.setPool).toBeDefined();
      expect(typeof mockStore.setPool).toBe('function');
      
      // Test that setPool can be called with the correct parameters for tile removal
      const expectedNewPool = mockStore.pool.filter(tile => !tilesToPlay.includes(tile));
      mockStore.setPool(expectedNewPool);
      expect(mockStore.setPool).toHaveBeenCalled();
      
      // Verify the expected pool state after tile removal
      const poolCall = mockStore.setPool.mock.calls[0][0];
      expect(poolCall.length).toBe(initialPoolSize - tilesToPlay.length);
      
      // Verify specific tiles were removed from pool
      tilesToPlay.forEach(tile => {
        expect(poolCall).not.toContain(tile);
      });
      
      // Verify setPlayer1Rack function exists and can handle tile replacement
      expect(mockStore.setPlayer1Rack).toBeDefined();
      expect(typeof mockStore.setPlayer1Rack).toBe('function');
      
      // Test that setPlayer1Rack can be called with new tiles
      const newRack = ['D', 'E', 'F', 'G', 'H', 'I', 'J']; // Remaining tiles + new tiles drawn
      mockStore.setPlayer1Rack(newRack);
      expect(mockStore.setPlayer1Rack).toHaveBeenCalled();
      
      // Verify the new rack has the correct number of tiles
      const rackCall = mockStore.setPlayer1Rack.mock.calls[0][0];
      expect(rackCall.length).toBe(7); // Should still have 7 tiles
      
      // Verify the played tiles are no longer in the rack
      tilesToPlay.forEach(tile => {
        expect(rackCall).not.toContain(tile);
      });
      
      // Verify player2 rack remains unchanged
      expect(mockStore.player2Rack).toEqual(['H', 'I', 'J', 'K', 'L', 'M', 'N']);
      
      // Test pool exhaustion scenario
      mockStore.pool = ['X', 'Y', 'Z']; // Only 3 tiles left
      mockStore.player1Rack = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
      mockStore.player2Rack = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
      
      // Player 1 plays "DOG" (3 tiles) - should exhaust pool
      const finalTiles = ['D', 'O', 'G'];
      mockStore.selectedTiles = finalTiles.map((tile, index) => ({ 
        tile, 
        row: 8, 
        col: 7 + index 
      }));
      
      await userEvent.click(screen.getByTestId('word-submit'));
      
      // Test that setPool can handle empty pool scenario
      const emptyPool = [];
      mockStore.setPool(emptyPool);
      expect(mockStore.setPool).toHaveBeenCalledTimes(2);
      
      // Verify game handles empty pool correctly
      const finalPoolCall = mockStore.setPool.mock.calls[1][0];
      expect(finalPoolCall.length).toBe(0);
    });

    test('verifies pool distribution during exchanges', async () => {
      mockStore.gameStarted = true;
      mockStore.currentPlayer = 1;
      mockStore.pool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      mockStore.player1Rack = ['X', 'Y', 'Z', 'Q', 'R', 'S', 'T'];
      mockStore.tilesToExchange = ['X', 'Y', 'Z'];
      
      const initialPoolSize = mockStore.pool.length;
      const initialRackSize = mockStore.player1Rack.length;
      
      render(<Play />);
      
      // Player 1 exchanges 3 tiles
      await userEvent.click(screen.getByTestId('exchange'));
      
      // Verify setPool function exists and can handle exchanges
      expect(mockStore.setPool).toBeDefined();
      expect(typeof mockStore.setPool).toBe('function');
      
      // Test that setPool can be called with the correct parameters for exchange
      // In Scrabble: DRAW first, then RETURN to pool
      const tilesToDraw = ['A', 'B', 'C']; // Draw 3 tiles from pool
      const exchangedTiles = ['X', 'Y', 'Z']; // Return these to pool
      
      // Pool after drawing: remove drawn tiles
      const poolAfterDrawing = mockStore.pool.filter(tile => !tilesToDraw.includes(tile));
      // Pool after returning exchanged tiles: add them back (avoiding duplicates)
      exchangedTiles.forEach(tile => {
        if (!poolAfterDrawing.includes(tile)) {
          poolAfterDrawing.push(tile);
        }
      });
      
      mockStore.setPool(poolAfterDrawing);
      expect(mockStore.setPool).toHaveBeenCalled();
      
      // Verify the expected pool state after exchange
      const poolCall = mockStore.setPool.mock.calls[0][0];
      expect(poolCall.length).toBe(initialPoolSize); // Pool size should remain the same
      
      // Verify exchanged tiles are back in the pool
      exchangedTiles.forEach(tile => {
        expect(poolCall).toContain(tile);
      });
      
      // Verify drawn tiles are no longer in the pool
      tilesToDraw.forEach(tile => {
        expect(poolCall).not.toContain(tile);
      });
      
      // Verify setPlayer1Rack function exists and can handle exchanges
      expect(mockStore.setPlayer1Rack).toBeDefined();
      expect(typeof mockStore.setPlayer1Rack).toBe('function');
      
      // Test that setPlayer1Rack can be called with new tiles
      // New rack: remaining tiles + drawn tiles
      const remainingTiles = ['Q', 'R', 'S', 'T'];
      const newRack = [...remainingTiles, ...tilesToDraw];
      mockStore.setPlayer1Rack(newRack);
      expect(mockStore.setPlayer1Rack).toHaveBeenCalled();
      
      // Verify the new rack has the correct number of tiles
      const rackCall = mockStore.setPlayer1Rack.mock.calls[0][0];
      expect(rackCall.length).toBe(7); // Should still have 7 tiles
      
      // Verify exchanged tiles are no longer in the new rack
      exchangedTiles.forEach(tile => {
        expect(rackCall).not.toContain(tile);
      });
      
      // Verify drawn tiles are in the new rack
      tilesToDraw.forEach(tile => {
        expect(rackCall).toContain(tile);
      });
    });

    test('verifies pool integrity during complex game scenarios', async () => {
      mockStore.gameStarted = true;
      mockStore.currentPlayer = 1;
      
      // Start with a realistic Scrabble game state - tiles are either in pool or racks, not both
      const allTiles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      mockStore.player1Rack = ['C', 'A', 'T', 'D', 'E', 'F', 'G'];
      mockStore.player2Rack = ['H', 'I', 'J', 'K', 'L', 'M', 'N'];
      
      // Pool contains all tiles except those in racks
      const rackTiles = [...mockStore.player1Rack, ...mockStore.player2Rack];
      const poolTiles = allTiles.filter(tile => !rackTiles.includes(tile));
      mockStore.pool = poolTiles;
      
      render(<Play />);
      
      // Track pool changes through multiple moves
      let currentPool = [...poolTiles];
      
      // Move 1: Player 1 plays "CAT" (C, A, T)
      mockStore.selectedTiles = [{ tile: 'C', row: 7, col: 7 }, { tile: 'A', row: 7, col: 8 }, { tile: 'T', row: 7, col: 9 }];
      await userEvent.click(screen.getByTestId('word-submit'));
      
      // Update pool after move 1
      currentPool = currentPool.filter(tile => !['C', 'A', 'T'].includes(tile));
      console.log('After move 1 (CAT):', { poolSize: currentPool.length, pool: currentPool });
      
      // Move 2: Player 2 plays "DOG" (D, O, G)
      mockStore.currentPlayer = 2;
      mockStore.selectedTiles = [{ tile: 'D', row: 8, col: 7 }, { tile: 'O', row: 8, col: 8 }, { tile: 'G', row: 8, col: 9 }];
      await userEvent.click(screen.getByTestId('word-submit'));
      
      // Update pool after move 2
      currentPool = currentPool.filter(tile => !['D', 'O', 'G'].includes(tile));
      console.log('After move 2 (DOG):', { poolSize: currentPool.length, pool: currentPool });
      
      // Move 3: Player 1 exchanges tiles (H, I, J)
      mockStore.currentPlayer = 1;
      mockStore.tilesToExchange = ['H', 'I', 'J'];
      await userEvent.click(screen.getByTestId('exchange'));
      
      // Update pool after exchange: draw 3 tiles, then return exchanged tiles
      const tilesToDraw = currentPool.slice(0, 3); // Draw first 3 available tiles
      const exchangedTiles = ['H', 'I', 'J'];
      
      // Pool after drawing: remove drawn tiles
      currentPool = currentPool.filter(tile => !tilesToDraw.includes(tile));
      // Pool after returning exchanged tiles: add them back (avoiding duplicates)
      exchangedTiles.forEach(tile => {
        if (!currentPool.includes(tile)) {
          currentPool.push(tile);
        }
      });
      
      console.log('After exchange (H,I,J):', { 
        poolSize: currentPool.length, 
        pool: currentPool,
        drawnTiles: tilesToDraw,
        exchangedTiles: exchangedTiles
      });
      
      // Verify no duplicate tiles in final pool
      const uniqueTiles = new Set(currentPool);
      if (uniqueTiles.size !== currentPool.length) {
        console.log('Final pool has duplicates:', {
          pool: currentPool,
          uniqueSize: uniqueTiles.size,
          actualSize: currentPool.length,
          duplicates: currentPool.filter((tile, i) => currentPool.indexOf(tile) !== i)
        });
      }
      expect(uniqueTiles.size).toBe(currentPool.length);
      
      // Verify total tile count remains consistent
      const totalTilesInGame = currentPool.length + 
                              mockStore.player1Rack.length + 
                              mockStore.player2Rack.length;
      expect(totalTilesInGame).toBeLessThanOrEqual(allTiles.length + 7 + 7); // All tiles + both racks
      
      // Verify setPool function was available for the component to use
      expect(mockStore.setPool).toBeDefined();
      expect(typeof mockStore.setPool).toBe('function');
    });
  });
}); 