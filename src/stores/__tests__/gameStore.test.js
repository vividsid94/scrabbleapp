import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../gameStore';

// Mock the dependencies
jest.mock('../../components/AppContent/References/staticData.js', () => ({
  origPool: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  origBoard: '[[1,1,1],[1,1,1],[1,1,1]]'
}));

jest.mock('../../components/AppContent/References/testRacks.js', () => ({
  TEST_RACKS: [['A', 'B', 'C'], ['D', 'E', 'F']]
}));

jest.mock('../../functions/play/boardUtils', () => ({
  getBoardDiff: jest.fn(() => [])
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Game Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    const { result } = renderHook(() => useGameStore());
    act(() => {
      result.current.resetGame();
    });
  });

  describe('Initial State', () => {
    test('has correct initial state', () => {
      const { result } = renderHook(() => useGameStore());
      
      expect(result.current.player1points).toBe(0);
      expect(result.current.player2points).toBe(0);
      expect(result.current.currentPlayer).toBe(1);
      expect(result.current.gameStarted).toBe(false);
      expect(result.current.gameEnded).toBe(false);
      expect(result.current.isBotMode).toBe(false);
      expect(result.current.selectedTiles).toEqual([]);
      expect(result.current.selectedBoardPosition).toBe(null);
      expect(result.current.arrowDirection).toBe('right');
    });
  });

  describe('Player State Management', () => {
    test('sets player 1 points', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setPlayer1points(50);
      });
      
      expect(result.current.player1points).toBe(50);
    });

    test('sets player 2 points', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setPlayer2points(75);
      });
      
      expect(result.current.player2points).toBe(75);
    });

    test('sets current player', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setCurrentPlayer(2);
      });
      
      expect(result.current.currentPlayer).toBe(2);
    });

    test('sets player racks', () => {
      const { result } = renderHook(() => useGameStore());
      const newRack = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      
      act(() => {
        result.current.setPlayer1Rack(newRack);
      });
      
      expect(result.current.player1Rack).toEqual(newRack);
    });
  });

  describe('Game State Management', () => {
    test('sets game started', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setGameStarted(true);
      });
      
      expect(result.current.gameStarted).toBe(true);
    });

    test('sets game ended', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setGameEnded(true);
      });
      
      expect(result.current.gameEnded).toBe(true);
    });

    test('sets bot mode', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setIsBotMode(true);
      });
      
      expect(result.current.isBotMode).toBe(true);
    });
  });

  describe('Tile and Selection State', () => {
    test('sets selected tiles', () => {
      const { result } = renderHook(() => useGameStore());
      const tiles = [{ letter: 'A', row: 7, col: 7, isNew: true }];
      
      act(() => {
        result.current.setSelectedTiles(tiles);
      });
      
      expect(result.current.selectedTiles).toEqual(tiles);
    });

    test('sets selected board position', () => {
      const { result } = renderHook(() => useGameStore());
      const position = { row: 7, col: 7 };
      
      act(() => {
        result.current.setSelectedBoardPosition(position);
      });
      
      expect(result.current.selectedBoardPosition).toEqual(position);
    });

    test('sets arrow direction', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setArrowDirection('down');
      });
      
      expect(result.current.arrowDirection).toBe('down');
    });
  });

  describe('Computed Values', () => {
    test('getCurrentRack returns correct rack for player 1', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setPlayer1Rack(['A', 'B', 'C']);
        result.current.setPlayer2Rack(['D', 'E', 'F']);
        result.current.setCurrentPlayer(1);
      });
      
      expect(result.current.getCurrentRack()).toEqual(['A', 'B', 'C']);
    });

    test('getCurrentRack returns correct rack for player 2', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setPlayer1Rack(['A', 'B', 'C']);
        result.current.setPlayer2Rack(['D', 'E', 'F']);
        result.current.setCurrentPlayer(2);
      });
      
      expect(result.current.getCurrentRack()).toEqual(['D', 'E', 'F']);
    });

    test('getCurrentPlayerName returns correct name for player 1', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setPlayer1Name('Alice');
        result.current.setPlayer2Name('Bob');
        result.current.setCurrentPlayer(1);
      });
      
      expect(result.current.getCurrentPlayerName()).toBe('Alice');
    });

    test('getCurrentPlayerPoints returns correct points for current player', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setPlayer1points(50);
        result.current.setPlayer2points(75);
        result.current.setCurrentPlayer(2);
      });
      
      expect(result.current.getCurrentPlayerPoints()).toBe(75);
    });
  });

  describe('Game Actions', () => {
    test('resetGame resets all game state', () => {
      const { result } = renderHook(() => useGameStore());
      
      // Set some state
      act(() => {
        result.current.setPlayer1points(50);
        result.current.setPlayer2points(75);
        result.current.setGameStarted(true);
        result.current.setSelectedTiles([{ letter: 'A' }]);
      });
      
      // Reset game
      act(() => {
        result.current.resetGame();
      });
      
      expect(result.current.player1points).toBe(0);
      expect(result.current.player2points).toBe(0);
      expect(result.current.gameStarted).toBe(false);
      expect(result.current.selectedTiles).toEqual([]);
    });

    test('setCurrentPlayerPoints sets points for current player', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setCurrentPlayer(1);
        result.current.setCurrentPlayerPoints(100);
      });
      
      expect(result.current.player1points).toBe(100);
      expect(result.current.player2points).toBe(0);
    });

    test('setCurrentPlayerRack sets rack for current player', () => {
      const { result } = renderHook(() => useGameStore());
      const newRack = ['X', 'Y', 'Z'];
      
      act(() => {
        result.current.setCurrentPlayer(2);
        result.current.setCurrentPlayerRack(newRack);
      });
      
      expect(result.current.player2Rack).toEqual(newRack);
      expect(result.current.player1Rack).toEqual([]);
    });
  });

  describe('UI State Management', () => {
    test('sets theme', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setTheme('DARK');
      });
      
      expect(result.current.theme).toBe('DARK');
    });

    test('sets snackbar state', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setSnackbarOpen(true);
        result.current.setSnackbarMessage('Test message');
        result.current.setSnackbarSeverity('info');
      });
      
      expect(result.current.snackbarOpen).toBe(true);
      expect(result.current.snackbarMessage).toBe('Test message');
      expect(result.current.snackbarSeverity).toBe('info');
    });

    test('sets victory overlay state', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setShowVictoryOverlay(true);
        result.current.setShowConfetti(true);
        result.current.setWinner('player');
      });
      
      expect(result.current.showVictoryOverlay).toBe(true);
      expect(result.current.showConfetti).toBe(true);
      expect(result.current.winner).toBe('player');
    });
  });

  describe('Simulation State Management', () => {
    test('sets simulation state', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setSimulatingMove({ word: 'TEST', score: 10 });
        result.current.setSimulationProgress(50);
        result.current.setShowSimulationModal(true);
      });
      
      expect(result.current.simulatingMove).toEqual({ word: 'TEST', score: 10 });
      expect(result.current.simulationProgress).toBe(50);
      expect(result.current.showSimulationModal).toBe(true);
    });

    test('sets heat map state', () => {
      const { result } = renderHook(() => useGameStore());
      const heatMapData = [[1, 2, 3], [4, 5, 6]];
      
      act(() => {
        result.current.setIsHeatMapMode(true);
        result.current.setHeatMapData(heatMapData);
      });
      
      expect(result.current.isHeatMapMode).toBe(true);
      expect(result.current.heatMapData).toEqual(heatMapData);
    });
  });

  describe('Timer State Management', () => {
    test('sets timer state', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setPlayer1Time(600);
        result.current.setPlayer2Time(900);
        result.current.setTimerActive(true);
        result.current.setGameTime(15);
      });
      
      expect(result.current.player1Time).toBe(600);
      expect(result.current.player2Time).toBe(900);
      expect(result.current.timerActive).toBe(true);
      expect(result.current.gameTime).toBe(15);
    });
  });

  describe('Move History Management', () => {
    test('sets move history', () => {
      const { result } = renderHook(() => useGameStore());
      const moveHistory = [
        { word: 'HELLO', score: 10, player: 1 },
        { word: 'WORLD', score: 15, player: 2 }
      ];
      
      act(() => {
        result.current.setMoveHistory(moveHistory);
      });
      
      expect(result.current.moveHistory).toEqual(moveHistory);
    });

    test('sets top moves', () => {
      const { result } = renderHook(() => useGameStore());
      const topMoves = [
        { word: 'HELLO', score: 10 },
        { word: 'WORLD', score: 15 }
      ];
      
      act(() => {
        result.current.setTopMoves(topMoves);
      });
      
      expect(result.current.topMoves).toEqual(topMoves);
    });
  });

  describe('Settings State Management', () => {
    test('sets sound types', () => {
      const { result } = renderHook(() => useGameStore());
      
      act(() => {
        result.current.setPlayerMoveSoundType('modern');
        result.current.setBotMoveSoundType('puzzle');
      });
      
      expect(result.current.playerMoveSoundType).toBe('modern');
      expect(result.current.botMoveSoundType).toBe('puzzle');
    });
  });

  describe('Error Handling', () => {
    test('handles invalid state updates gracefully', () => {
      const { result } = renderHook(() => useGameStore());
      
      // Should not throw when setting invalid values
      expect(() => {
        act(() => {
          result.current.setPlayer1points(null);
          result.current.setCurrentPlayer('invalid');
        });
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('updates state efficiently', () => {
      const { result } = renderHook(() => useGameStore());
      
      // Multiple rapid updates should work
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.setPlayer1points(i);
          result.current.setPlayer2points(i * 2);
        }
      });
      
      expect(result.current.player1points).toBe(9);
      expect(result.current.player2points).toBe(18);
    });
  });
}); 