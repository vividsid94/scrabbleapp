import { calculateExchangeLeave } from './leaveFunctions';
import { fetchLeaveValues } from './leaveFunctions';

/**
 * Generates all possible combinations of tiles for exchange
 * @param {Array} rack - The current rack of tiles
 * @returns {Array} Array of possible tile combinations
 */
const generateExchangeCombinations = (rack) => {
  const combinations = [];
  // Generate all possible combinations of 1-7 tiles
  for (let i = 1; i <= Math.min(rack.length, 7); i++) {
    const generateCombos = (current, start, remaining) => {
      if (current.length === i) {
        combinations.push([...current]);
        return;
      }
      for (let j = start; j < remaining.length; j++) {
        current.push(remaining[j]);
        generateCombos(current, j + 1, remaining);
        current.pop();
      }
    };
    generateCombos([], 0, rack);
  }
  return combinations;
};

/**
 * Fetches board control metrics for moves
 * @param {Array} boardCoords - Current board state
 * @param {Array} moves - Array of moves to analyze
 * @returns {Promise<Array>} Board control metrics for each move
 */
const fetchBoardControl = async (boardCoords, moves) => {
  try {
    const response = await fetch('/.netlify/functions/getBoardControl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        board: boardCoords,
        moves: moves
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch board control metrics');
    }

    const data = await response.json();
    return data.moveMetrics;
  } catch (error) {
    console.error('Error fetching board control:', error);
    return [];
  }
};

/**
 * Gets the top moves for the current position
 * @param {Object} params - The parameters object
 * @param {Array} params.boardCoords - Current board state
 * @param {Array} params.tempBoardCoords - Temporary board state with uncommitted moves
 * @param {number} params.currentPlayer - Current player (1 or 2)
 * @param {Array} params.player1Rack - Player 1's rack
 * @param {Array} params.player2Rack - Player 2's rack
 * @param {Array} params.selectedTiles - Currently selected tiles
 * @param {Array} params.pool - The tile pool
 * @param {Object} params.leaveValues - Current cache of leave values
 * @param {Function} params.setPlayer1Rack - Function to update player 1's rack
 * @param {Function} params.setPlayer2Rack - Function to update player 2's rack
 * @param {Function} params.setTempBoardCoords - Function to update temporary board state
 * @param {Function} params.setSelectedTiles - Function to update selected tiles
 * @param {Function} params.setSelectedBoardPosition - Function to update selected position
 * @param {Function} params.setLeaveValues - Function to update leave values
 * @param {Function} params.setTopMoves - Function to update top moves
 * @param {Function} params.setIsLoadingTopMoves - Function to update loading state
 * @param {Function} params.setShowTopMoves - Function to update visibility of top moves
 * @param {Function} params.setIsDictionaryLoading - Function to update dictionary loading state
 * @param {Function} params.setSnackbarMessage - Function to update snackbar message
 * @param {Function} params.setSnackbarSeverity - Function to update snackbar severity
 * @param {Function} params.setSnackbarOpen - Function to update snackbar visibility
 * @returns {Promise<void>}
 */
export const handleGetTopMoves = async ({
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
}) => {
  setIsLoadingTopMoves(true);
  setShowTopMoves(true);
  try {
    // Get the current rack
    const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
    
    // Get any tiles that are placed on the board but not committed
    const uncommittedTiles = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (typeof tempBoardCoords[row][col] === 'string' && typeof boardCoords[row][col] !== 'string') {
          const tileIndex = selectedTiles.findIndex(t => t === '*');
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
    setShowTopMoves(false);
  } finally {
    setIsLoadingTopMoves(false);
  }
}; 