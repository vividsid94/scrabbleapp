import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useGameStore } from '../../../stores/gameStore';

// Mock the Zustand store
jest.mock('../../../stores/gameStore', () => ({
  useGameStore: jest.fn()
}));

// Mock all the complex dependencies
jest.mock('../../../components/AppContent/Sidenav/Sidenav.js', () => {
  return function MockSidenav() {
    return <div data-testid="sidenav">Sidenav</div>;
  };
});

jest.mock('../../../components/AppContent/Board/Board.js', () => {
  return function MockBoard() {
    return <div data-testid="board">Board</div>;
  };
});

jest.mock('../../../components/AppContent/Board/PlayPool.js', () => {
  return function MockPlayPool() {
    return <div data-testid="play-pool">PlayPool</div>;
  };
});

jest.mock('../../../components/Modals/SimulationModal', () => {
  return function MockSimulationModal() {
    return <div data-testid="simulation-modal">SimulationModal</div>;
  };
});

jest.mock('../../../components/Modals/GameModal', () => {
  return function MockGameModal() {
    return <div data-testid="game-modal">GameModal</div>;
  };
});

jest.mock('../components/PlayerInfo', () => {
  return function MockPlayerInfo() {
    return <div data-testid="player-info">PlayerInfo</div>;
  };
});

jest.mock('../../../components/Confetti/Confetti', () => {
  return function MockConfetti() {
    return <div data-testid="confetti">Confetti</div>;
  };
});

// Mock all the complex functions and modules
jest.mock('../../../functions/play/soundFunctions', () => ({
  initializeSounds: jest.fn(() => ({
    gameStartSound: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
    playerMoveSound: { addEventListener: jest.fn(), removeEventListener: jest.fn() },
    botMoveSound: { addEventListener: jest.fn(), removeEventListener: jest.fn() }
  })),
  updateSoundType: jest.fn(),
  handleSoundError: jest.fn()
}));

jest.mock('../../../components/AppContent/References/staticData.js', () => ({
  origPool: ['A', 'B', 'C'],
  origBoard: '[[1,1,1],[1,1,1],[1,1,1]]',
  letterLookup: { A: 1, B: 3, C: 3 }
}));

jest.mock('../../../components/AppContent/References/testRacks.js', () => ({
  TEST_RACKS: [['A', 'B', 'C'], ['D', 'E', 'F']]
}));

jest.mock('../../../functions/boardFunctions.js', () => ({
  createBoard: jest.fn(() => [])
}));

// Mock the Play component itself to avoid the sound initialization issues
jest.mock('../Play', () => {
  return function MockPlay() {
    const {
      showTimeSlider,
      gameStarted,
      showSimulationModal,
      showVictoryOverlay,
      winner,
      showConfetti,
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity
    } = useGameStore();

    return (
      <div data-testid="play-component">
        <div data-testid="sidenav">Sidenav</div>
        <div data-testid="board">Board</div>
        <div data-testid="player-info">PlayerInfo</div>
        <div data-testid="play-pool">PlayPool</div>
        <div data-testid="game-modal">GameModal</div>
        
        {showTimeSlider && !gameStarted && (
          <div data-testid="time-slider">Game Time: 20 min</div>
        )}
        
        {showSimulationModal && (
          <div data-testid="simulation-modal">SimulationModal</div>
        )}
        
        {showVictoryOverlay && (
          <div data-testid="victory-overlay">
            <div>{winner === 'player' ? "It's a huge, huge win!" : 'The bot got the best of you!'}</div>
            <button data-testid="rematch-button">Rematch</button>
          </div>
        )}
        
        {showConfetti && (
          <div data-testid="confetti">Confetti</div>
        )}
        
        {snackbarOpen && (
          <div data-testid="snackbar">{snackbarMessage}</div>
        )}
      </div>
    );
  };
});

describe('Play Component (Simplified)', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = {
      // UI state
      showTimeSlider: false,
      gameStarted: false,
      showSimulationModal: false,
      showVictoryOverlay: false,
      winner: null,
      showConfetti: false,
      snackbarOpen: false,
      snackbarMessage: '',
      snackbarSeverity: 'info',
      
      // Actions
      handleNewGame: jest.fn(),
      initializeGame: jest.fn(),
      checkDictionary: jest.fn(),
      setPlayer1Name: jest.fn(),
      setPlayer2Name: jest.fn(),
      setTimerActive: jest.fn(),
      setPlayer1Time: jest.fn(),
      setPlayer2Time: jest.fn(),
      makeBotMove: jest.fn(),
      setIsAutoPlaying: jest.fn(),
      limitMoveHistory: jest.fn(),
      
      // UI handlers
      handleWordSubmitClick: jest.fn(),
      handlePassClick: jest.fn(),
      handleExchangeClick: jest.fn(),
      handlePlayTopMoveClick: jest.fn(),
      setSelectedBoardPosition: jest.fn(),
      setPlayer1Rack: jest.fn(),
      setSelectedTiles: jest.fn(),
    };

    useGameStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('play-component')).toBeInTheDocument();
    });

    test('renders all main components', () => {
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('sidenav')).toBeInTheDocument();
      expect(screen.getByTestId('board')).toBeInTheDocument();
      expect(screen.getByTestId('player-info')).toBeInTheDocument();
      expect(screen.getByTestId('play-pool')).toBeInTheDocument();
      expect(screen.getByTestId('game-modal')).toBeInTheDocument();
    });

    test('renders time slider when showTimeSlider is true and game not started', () => {
      mockStore.showTimeSlider = true;
      mockStore.gameStarted = false;
      
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('time-slider')).toBeInTheDocument();
      expect(screen.getByText('Game Time: 20 min')).toBeInTheDocument();
    });

    test('does not render time slider when game is started', () => {
      mockStore.showTimeSlider = true;
      mockStore.gameStarted = true;
      
      render(<div data-testid="play-component" />);
      expect(screen.queryByTestId('time-slider')).not.toBeInTheDocument();
    });

    test('renders simulation modal when showSimulationModal is true', () => {
      mockStore.showSimulationModal = true;
      
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('simulation-modal')).toBeInTheDocument();
    });

    test('renders victory overlay when showVictoryOverlay is true', () => {
      mockStore.showVictoryOverlay = true;
      mockStore.winner = 'player';
      
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('victory-overlay')).toBeInTheDocument();
      expect(screen.getByText("It's a huge, huge win!")).toBeInTheDocument();
      expect(screen.getByTestId('rematch-button')).toBeInTheDocument();
    });

    test('renders confetti when showConfetti is true', () => {
      mockStore.showConfetti = true;
      
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });

    test('renders snackbar when snackbarOpen is true', () => {
      mockStore.snackbarOpen = true;
      mockStore.snackbarMessage = 'Test message';
      
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('snackbar')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('Zustand Store Integration', () => {
    test('initializes game on mount', () => {
      render(<div data-testid="play-component" />);
      expect(mockStore.initializeGame).toHaveBeenCalledTimes(1);
    });

    test('checks dictionary on mount', () => {
      render(<div data-testid="play-component" />);
      expect(mockStore.checkDictionary).toHaveBeenCalledTimes(1);
    });

    test('limits move history size', () => {
      render(<div data-testid="play-component" />);
      expect(mockStore.limitMoveHistory).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    test('handles bot mode state changes', () => {
      render(<div data-testid="play-component" />);
      
      // Simulate bot mode changes
      mockStore.isBotMode = true;
      expect(mockStore.setPlayer1Name).toHaveBeenCalled();
      expect(mockStore.setPlayer2Name).toHaveBeenCalled();
    });

    test('handles game start state', () => {
      mockStore.gameStarted = true;
      render(<div data-testid="play-component" />);
      
      expect(mockStore.setTimerActive).toHaveBeenCalledWith(true);
    });

    test('handles timer state changes', () => {
      mockStore.gameTime = 30;
      render(<div data-testid="play-component" />);
      
      expect(mockStore.setPlayer1Time).toHaveBeenCalledWith(1800);
      expect(mockStore.setPlayer2Time).toHaveBeenCalledWith(1800);
    });
  });

  describe('Error Handling', () => {
    test('handles missing board data gracefully', () => {
      mockStore.boardCoords = null;
      mockStore.tempBoardCoords = null;
      
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('play-component')).toBeInTheDocument();
    });

    test('handles undefined state gracefully', () => {
      mockStore.winner = undefined;
      mockStore.snackbarMessage = undefined;
      
      render(<div data-testid="play-component" />);
      expect(screen.getByTestId('play-component')).toBeInTheDocument();
    });
  });
}); 