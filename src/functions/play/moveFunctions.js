import { calculateExchangeLeave } from './leaveFunctions';
import { fetchLeaveValues } from './leaveFunctions';
import { alphabetizeRack } from './rackFunctions';

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

/**
 * Plays the best move for the current position
 * @param {Object} params - The parameters object
 * @param {boolean} params.isLoadingTopMoves - Whether top moves are currently loading
 * @param {boolean} params.isDictionaryLoading - Whether dictionary is currently loading
 * @param {number} params.currentPlayer - Current player (1 or 2)
 * @param {Array} params.player1Rack - Player 1's rack
 * @param {Array} params.player2Rack - Player 2's rack
 * @param {Array} params.tempBoardCoords - Temporary board state with uncommitted moves
 * @param {Array} params.boardCoords - Current board state
 * @param {Array} params.selectedTiles - Currently selected tiles
 * @param {Array} params.pool - The tile pool
 * @param {number} params.player1points - Player 1's score
 * @param {number} params.player2points - Player 2's score
 * @param {string} params.player1Name - Player 1's name
 * @param {string} params.player2Name - Player 2's name
 * @param {Array} params.blankTiles - Array of blank tile positions
 * @param {Array} params.moveHistory - Array of previous moves
 * @param {Object} params.leaveValues - Current cache of leave values
 * @param {Function} params.handleGameEnd - Function to handle game end
 * @param {Function} params.getBoardDiff - Function to get board differences
 * @param {Function} params.setPlayer1Rack - Function to update player 1's rack
 * @param {Function} params.setPlayer2Rack - Function to update player 2's rack
 * @param {Function} params.setTempBoardCoords - Function to update temporary board state
 * @param {Function} params.setSelectedTiles - Function to update selected tiles
 * @param {Function} params.setSelectedBoardPosition - Function to update selected position
 * @param {Function} params.setBoardCoords - Function to update board state
 * @param {Function} params.setPlayer1points - Function to update player 1's score
 * @param {Function} params.setPlayer2points - Function to update player 2's score
 * @param {Function} params.setBlankTiles - Function to update blank tiles
 * @param {Function} params.setPool - Function to update tile pool
 * @param {Function} params.setMoveHistory - Function to update move history
 * @param {Function} params.setCurrentPlayer - Function to update current player
 * @param {Function} params.setSimulatingMove - Function to update simulating move state
 * @param {Function} params.setSimulationResult - Function to update simulation result
 * @param {Function} params.setSimulationProgress - Function to update simulation progress
 * @param {Function} params.setPreviewBoard - Function to update preview board
 * @param {Function} params.setPreviewMove - Function to update preview move
 * @param {Function} params.setMoveWithResults - Function to update move with results
 * @param {Function} params.setTopMoves - Function to update top moves
 * @param {Function} params.setSnackbarMessage - Function to update snackbar message
 * @param {Function} params.setSnackbarSeverity - Function to update snackbar severity
 * @param {Function} params.setSnackbarOpen - Function to update snackbar visibility
 * @param {Function} params.setIsDictionaryLoading - Function to update dictionary loading state
 * @param {Function} params.setLeaveValues - Function to update leave values
 * @param {Function} params.setArrowDirection - Function to update arrow direction
 * @returns {Promise<void>}
 */
export const handlePlayTopMove = async ({
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
  handleGameEnd,
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
}) => {
  if (isLoadingTopMoves || isDictionaryLoading) return;
  
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
    
    // Make API call for moves
    const movesResponse = await fetch('/.netlify/functions/getTopMoves', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        board: boardCoords,
        letters: apiRack
      })
    });

    if (!movesResponse.ok) {
      throw new Error(`HTTP error! status: ${movesResponse.status}`);
    }

    const data = await movesResponse.json();
    
    // Check if this is the first load (dictionary loading)
    if (data.message && data.message.includes('Loading dictionary')) {
      setIsDictionaryLoading(true);
      // Retry after a short delay
      setTimeout(() => {
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
          handleGameEnd,
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
        });
      }, 1000);
      return;
    }
    
    setIsDictionaryLoading(false);

    // Generate exchange moves only if we have enough tiles in the pool
    const exchangeMoves = pool.length >= 7 ? generateExchangeCombinations(newRack).map(tiles => {
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
    }) : [];

    // First, fetch leave values and board control for all moves
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
          (move.score + leaveValue); // For regular moves, add score and leave value
        return {
          ...move,
          totalValue,
          defensiveValue: controlMetrics.defensiveValue,
          boardControl: controlMetrics.boardControl,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);

    if (movesWithValues.length > 0) {
      const bestMove = movesWithValues[0];
      
      // Prepare all state updates
      const stateUpdates = {
        newBoard: JSON.parse(JSON.stringify(boardCoords)),
        newRack: [...currentRack],
        newBlankTiles: [...blankTiles],
        newPool: [...pool],
        newMoveHistory: [...moveHistory],
        runningTotal: currentPlayer === 1 ? player1points : player2points
      };
      
      if (bestMove.isExchange) {
        // Handle exchange move
        const tilesToExchange = bestMove.tiles.map(t => t.letter);
        
        // Remove exchanged tiles from rack
        for (const tile of tilesToExchange) {
          const tileIndex = stateUpdates.newRack.indexOf(tile);
          if (tileIndex !== -1) {
            stateUpdates.newRack.splice(tileIndex, 1);
          }
        }
        
        // Add new tiles from pool
        for (let i = 0; i < tilesToExchange.length; i++) {
          if (stateUpdates.newPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * stateUpdates.newPool.length);
            stateUpdates.newRack.push(stateUpdates.newPool[randomIndex]);
            stateUpdates.newPool.splice(randomIndex, 1);
          }
        }
        
        // Add exchanged tiles back to pool
        stateUpdates.newPool.push(...tilesToExchange);
        
        // Store only the differences in board states
        const boardDiff = getBoardDiff(boardCoords, stateUpdates.newBoard);
        const moveHistoryEntry = {
          boardDiff,
          player: currentPlayer === 1 ? player1Name : player2Name,
          score: 0,
          rack: newRack.join(''),
          total: stateUpdates.runningTotal
        };

        setMoveHistory(prev => [...prev.slice(-49), moveHistoryEntry]);
        
        // Show toast notification
        setSnackbarMessage(`${currentPlayer === 1 ? player1Name : player2Name} exchanged ${tilesToExchange.length} tiles`);
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
      } else {
        // Handle regular move
        // Place tiles on board
        for (const tile of bestMove.tiles) {
          if (tile.isNew) {
            stateUpdates.newBoard[tile.row][tile.col] = tile.letter;
            
            if (tile.isBlank) {
              stateUpdates.newBlankTiles.push({ row: tile.row, col: tile.col });
              const blankIndex = stateUpdates.newRack.indexOf('?');
              if (blankIndex !== -1) {
                stateUpdates.newRack.splice(blankIndex, 1);
              } else {
                const starIndex = stateUpdates.newRack.indexOf('*');
                if (starIndex !== -1) {
                  stateUpdates.newRack.splice(starIndex, 1);
                }
              }
            } else {
              const tileIndex = stateUpdates.newRack.indexOf(tile.letter);
              if (tileIndex !== -1) {
                stateUpdates.newRack.splice(tileIndex, 1);
              }
            }
          }
        }
        
        // Draw new tiles
        while (stateUpdates.newRack.length < 7 && stateUpdates.newPool.length > 0) {
          const randomIndex = Math.floor(Math.random() * stateUpdates.newPool.length);
          stateUpdates.newRack.push(stateUpdates.newPool[randomIndex]);
          stateUpdates.newPool.splice(randomIndex, 1);
        }
        
        // Alphabetize the rack
        stateUpdates.newRack = alphabetizeRack(stateUpdates.newRack);
        
        // Update running total
        stateUpdates.runningTotal += bestMove.score;
        
        // Store only the differences in board states
        const boardDiff = getBoardDiff(boardCoords, stateUpdates.newBoard);
        const moveHistoryEntry = {
          boardDiff,
          player: currentPlayer === 1 ? player1Name : player2Name,
          score: bestMove.score,
          rack: newRack.join(''),
          total: stateUpdates.runningTotal
        };

        setMoveHistory(prev => [...prev.slice(-49), moveHistoryEntry]);
        
        // Show toast notification
        setSnackbarMessage(`${currentPlayer === 1 ? player1Name : player2Name} played "${bestMove.word}" for ${bestMove.score} points`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
      
      // Apply all state updates at once
      setBoardCoords(stateUpdates.newBoard);
      setTempBoardCoords(JSON.parse(JSON.stringify(stateUpdates.newBoard)));
      if (currentPlayer === 1) {
        setPlayer1Rack(stateUpdates.newRack);
        setPlayer1points(stateUpdates.runningTotal);
      } else {
        setPlayer2Rack(stateUpdates.newRack);
        setPlayer2points(stateUpdates.runningTotal);
      }
      setBlankTiles(stateUpdates.newBlankTiles);
      setPool(stateUpdates.newPool);
      setMoveHistory(stateUpdates.newMoveHistory);
      
      // Check if game should end
      if (stateUpdates.newRack.length === 0 && stateUpdates.newPool.length === 0) {
        handleGameEnd(
          stateUpdates.newRack,
          currentPlayer === 1 ? player1Name : player2Name,
          currentPlayer === 1 ? player2Rack : player1Rack,
          currentPlayer === 1 ? player2points : player1points
        );
        return;
      }
      
      // Switch to next player
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setSelectedBoardPosition(null);
      setSelectedTiles([]);
      setArrowDirection('right');

      // After successful move
      setSimulatingMove(null);
      setSimulationResult(null);
      setSimulationProgress(0);
      setPreviewBoard(null);
      setPreviewMove(null);
      setMoveWithResults(null);
      setTopMoves([]); // Clear top moves
    }
  } catch (error) {
    console.error('Error playing top move:', error);
    setSnackbarMessage('Error playing top move: ' + error.message);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  } finally {
    // Clear states even on error
    setSimulatingMove(null);
    setSimulationResult(null);
    setSimulationProgress(0);
    setPreviewBoard(null);
    setPreviewMove(null);
    setMoveWithResults(null);
    setTopMoves([]); // Clear top moves
  }
};

/**
 * Handles selecting a move from the top moves list
 * @param {Object} params - The parameters object
 * @param {Object} params.move - The selected move
 * @param {Array} params.boardCoords - Current board state
 * @param {Array} params.tempBoardCoords - Temporary board state
 * @param {number} params.currentPlayer - Current player (1 or 2)
 * @param {Array} params.player1Rack - Player 1's rack
 * @param {Array} params.player2Rack - Player 2's rack
 * @param {Function} params.setTempBoardCoords - Function to update temporary board state
 * @param {Function} params.setSelectedTiles - Function to update selected tiles
 * @param {Function} params.setPlayer1Rack - Function to update player 1's rack
 * @param {Function} params.setPlayer2Rack - Function to update player 2's rack
 * @param {Function} params.setSelectedBoardPosition - Function to update selected position
 * @param {Function} params.setArrowDirection - Function to update arrow direction
 * @returns {void}
 */
export const handleMoveSelect = ({
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
}) => {
  // Reset the board to its current state
  setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
  
  // Set the direction
  setArrowDirection(move.direction);
  
  // Place the tiles on the board
  const newTempBoard = [...tempBoardCoords];
  const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const newRack = [...currentRack];
  const newSelectedTiles = [];
  
  // Place each tile using the exact positions from the tiles array
  for (const tile of move.tiles) {
    if (tile.isNew) {
      // Check if the tile is already on the board in the committed state
      if (typeof boardCoords[tile.row][tile.col] === 'string') {
        continue;
      }
      
      // For blank tiles, we need to find the blank in the rack
      const tileIndex = tile.isBlank ? newRack.indexOf('*') : newRack.indexOf(tile.letter);
      if (tileIndex !== -1) {
        // For blank tiles, we need to show the letter it represents
        newTempBoard[tile.row][tile.col] = tile.letter;
        newRack.splice(tileIndex, 1);
        newSelectedTiles.push(tile.isBlank ? '*' : tile.letter);
      }
    }
  }
  
  setTempBoardCoords(newTempBoard);
  setSelectedTiles(newSelectedTiles);
  if (currentPlayer === 1) {
    setPlayer1Rack(alphabetizeRack(newRack));
  } else {
    setPlayer2Rack(alphabetizeRack(newRack));
  }

  // Set the position to the square after the last tile
  const lastTile = move.tiles[move.tiles.length - 1];
  if (move.direction === 'right') {
    let nextCol = lastTile.col + 1;
    while (nextCol <= 14 && !Number.isInteger(boardCoords[lastTile.row][nextCol])) {
      nextCol++;
    }
    if (nextCol <= 14) {
      setSelectedBoardPosition({ row: lastTile.row, col: nextCol });
    }
  } else {
    let nextRow = lastTile.row + 1;
    while (nextRow <= 14 && !Number.isInteger(boardCoords[nextRow][lastTile.col])) {
      nextRow++;
    }
    if (nextRow <= 14) {
      setSelectedBoardPosition({ row: nextRow, col: lastTile.col });
    }
  }
}; 