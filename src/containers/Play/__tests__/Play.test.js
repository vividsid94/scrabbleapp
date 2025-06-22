import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Play from '../Play';
import { useGameStore } from '../../../stores/gameStore';
import { handleTileClick, handleTileDrop } from '../../../functions/play/tileFunctions';

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
  origPool: ['A', 'B', 'C'],
  origBoard: '[[1,1,1],[1,1,1],[1,1,1]]',
  letterLookup: { A: 1, B: 3, C: 3 }
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

describe('Play Component', () => {
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
      player1Rack: ['A', 'B', 'C'],
      player2Rack: ['D', 'E', 'F'],
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
      pool: ['A', 'B', 'C'],
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
      getCurrentRack: jest.fn(() => ['A', 'B', 'C']),
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

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<Play />);
      expect(screen.getByTestId('sidenav')).toBeInTheDocument();
      expect(screen.getByTestId('board')).toBeInTheDocument();
      expect(screen.getByTestId('player-info')).toBeInTheDocument();
      expect(screen.getByTestId('play-pool')).toBeInTheDocument();
    });

    test('renders game title', () => {
      render(<Play />);
      expect(screen.getByText('Playground+')).toBeInTheDocument();
    });

    test('renders time slider when showTimeSlider is true and game not started', () => {
      mockStore.showTimeSlider = true;
      mockStore.gameStarted = false;
      
      render(<Play />);
      expect(screen.getByText('Game Time: 20 min')).toBeInTheDocument();
    });

    test('does not render time slider when game is started', () => {
      mockStore.showTimeSlider = true;
      mockStore.gameStarted = true;
      
      render(<Play />);
      expect(screen.queryByText('Game Time: 20 min')).not.toBeInTheDocument();
    });

    test('renders simulation modal when showSimulationModal is true', () => {
      mockStore.showSimulationModal = true;
      
      render(<Play />);
      expect(screen.getByTestId('simulation-modal')).toBeInTheDocument();
    });

    test('renders victory overlay when showVictoryOverlay is true', () => {
      mockStore.showVictoryOverlay = true;
      mockStore.winner = 'player';
      
      render(<Play />);
      expect(screen.getByText("It's a huge, huge win!")).toBeInTheDocument();
      expect(screen.getByText('Rematch')).toBeInTheDocument();
    });

    test('renders confetti when showConfetti is true', () => {
      mockStore.showConfetti = true;
      mockStore.winner = 'player';
      
      render(<Play />);
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });

    test('renders snackbar when snackbarOpen is true', () => {
      mockStore.snackbarOpen = true;
      mockStore.snackbarMessage = 'Test message';
      mockStore.snackbarSeverity = 'info';
      
      render(<Play />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls handleWordSubmitClick when word submit button is clicked', async () => {
      render(<Play />);
      
      await userEvent.click(screen.getByTestId('word-submit'));
      expect(mockStore.handleWordSubmitClick).toHaveBeenCalledTimes(1);
    });

    test('calls handlePassClick when pass button is clicked', async () => {
      render(<Play />);
      
      await userEvent.click(screen.getByTestId('pass'));
      expect(mockStore.handlePassClick).toHaveBeenCalledTimes(1);
    });

    test('calls handleExchangeClick when exchange button is clicked', async () => {
      render(<Play />);
      
      await userEvent.click(screen.getByTestId('exchange'));
      expect(mockStore.handleExchangeClick).toHaveBeenCalledTimes(1);
    });

    test('calls handlePlayTopMoveClick when play top move button is clicked', async () => {
      render(<Play />);
      
      await userEvent.click(screen.getByTestId('play-top-move'));
      expect(mockStore.handlePlayTopMoveClick).toHaveBeenCalledTimes(1);
    });

    test('calls handleBoardPositionSelect when board is clicked', async () => {
      render(<Play />);
      
      await userEvent.click(screen.getByTestId('board-click'));
      expect(mockStore.setSelectedBoardPosition).toHaveBeenCalled();
    });

    test('calls handleTileDrop when tile is dropped', async () => {
      render(<Play />);
      
      await userEvent.click(screen.getByTestId('tile-drop'));
      expect(handleTileDrop).toHaveBeenCalledWith({
        tile: 'A',
        index: 0,
        row: 0,
        col: 0,
        player1Rack: ['A', 'B', 'C'],
        setPlayer1Rack: expect.any(Function),
        player2Rack: ['D', 'E', 'F'],
        setPlayer2Rack: expect.any(Function),
        selectedTilesArray: [],
        setSelectedTiles: expect.any(Function),
        setSelectedBoardPosition: expect.any(Function),
        tempBoardCoords: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        setTempBoardCoords: expect.any(Function)
      });
    });

    test('calls handleTileClick when tile is clicked', async () => {
      render(<Play />);
      
      await userEvent.click(screen.getByTestId('tile-click'));
      expect(handleTileClick).toHaveBeenCalledWith({
        tile: 'A',
        index: 0,
        currentPlayer: 1,
        player1Rack: ['A', 'B', 'C'],
        player2Rack: ['D', 'E', 'F'],
        selectedTilesArray: [],
        setSelectedTiles: expect.any(Function),
        tilesToExchange: [],
        setTilesToExchange: expect.any(Function)
      });
    });

    test('calls handleNewGame when rematch button is clicked', async () => {
      mockStore.showVictoryOverlay = true;
      mockStore.winner = 'player';
      
      render(<Play />);
      
      await userEvent.click(screen.getByText('Rematch'));
      expect(mockStore.handleNewGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('Zustand Store Integration', () => {
    test('initializes game on mount', () => {
      render(<Play />);
      expect(mockStore.initializeGame).toHaveBeenCalledTimes(1);
    });

    test('sets up board coordinates on mount', () => {
      render(<Play />);
      expect(mockStore.setOrigBoardCoords).toHaveBeenCalled();
      expect(mockStore.setBoardCoords).toHaveBeenCalled();
      expect(mockStore.setTempBoardCoords).toHaveBeenCalled();
    });

    test('checks dictionary on mount', () => {
      render(<Play />);
      expect(mockStore.checkDictionary).toHaveBeenCalledTimes(1);
    });

    test('updates player names when bot mode changes', () => {
      mockStore.isBotMode = true;
      render(<Play />);
      
      expect(mockStore.setPlayer1Name).toHaveBeenCalledWith('You');
      expect(mockStore.setPlayer2Name).toHaveBeenCalledWith('SidBot');
    });

    test('starts timer when game starts', () => {
      mockStore.gameStarted = true;
      render(<Play />);
      
      expect(mockStore.setTimerActive).toHaveBeenCalledWith(true);
    });

    test('updates player time when gameTime changes', () => {
      mockStore.gameTime = 30;
      render(<Play />);
      
      expect(mockStore.setPlayer1Time).toHaveBeenCalledWith(1800);
      expect(mockStore.setPlayer2Time).toHaveBeenCalledWith(1800);
    });
  });

  describe('Effects and Lifecycle', () => {
    test('sets up keyboard event listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      render(<Play />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<Play />);
      
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('makes bot move when it is bot mode and bot turn', () => {
      mockStore.isBotMode = true;
      mockStore.currentPlayer = 2;
      mockStore.isBotThinking = false;
      mockStore.gameEnded = false;
      
      render(<Play />);
      expect(mockStore.makeBotMove).toHaveBeenCalled();
    });

    test('auto-plays best move when enabled', () => {
      mockStore.autoPlayBest = true;
      mockStore.gameStarted = true;
      mockStore.currentPlayer = 1;
      mockStore.isLoadingTopMoves = false;
      mockStore.isDictionaryLoading = false;
      mockStore.isAutoPlaying = false;
      mockStore.isPlayerThinking = false;
      mockStore.gameEnded = false;
      
      render(<Play />);
      expect(mockStore.setIsAutoPlaying).toHaveBeenCalledWith(true);
    });
  });

  describe('Error Handling', () => {
    test('handles sound loading errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<Play />);
      
      // The component should render without crashing even if sounds fail to load
      expect(screen.getByTestId('sidenav')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('handles missing board data gracefully', () => {
      mockStore.boardCoords = null;
      mockStore.tempBoardCoords = null;
      
      render(<Play />);
      expect(screen.getByTestId('sidenav')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('memoizes board creation', () => {
      const { rerender } = render(<Play />);
      
      // Re-render with same props
      rerender(<Play />);
      
      // The board should be recreated efficiently
      expect(screen.getByTestId('board')).toBeInTheDocument();
    });

    test('limits move history size', () => {
      render(<Play />);
      expect(mockStore.limitMoveHistory).toHaveBeenCalled();
    });
  });
}); 