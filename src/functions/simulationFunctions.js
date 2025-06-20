import { generateRandomRack } from './moveFunctions.js';
import { removeTilesByCount } from './play/rackFunctions';

// Helper function to track board occupancy for heat maps
const trackBoardOccupancy = (board, heatMap) => {
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (typeof board[row][col] === 'string') {
        heatMap[row][col]++;
      }
    }
  }
};

export const simulateMove = async (move, gameState, onProgress, settings = {}) => {
  const {
    boardCoords,
    currentPlayer,
    player1Rack,
    player2Rack,
    player1points,
    player2points,
    pool
  } = gameState;

  // Use settings or defaults
  const numSimulations = settings.numSimulations || 5;
  const turnsPerSim = settings.turnsPerSim || 1;

  try {
    // Create copies of initial state
    let board = JSON.parse(JSON.stringify(boardCoords));
    let ourRack = [...(currentPlayer === 1 ? player1Rack : player2Rack)];
    // Always generate a random rack for the opponent instead of using the passed player2Rack
    let botRack = generateRandomRack(7);
    let ourScore = currentPlayer === 1 ? player1points : player2points;
    let botScore = currentPlayer === 1 ? player2points : player1points;
    ourScore += (move.score || 0);
    let moves = 1;
    const results = [];
    
    // Run simulations
    for (let sim = 0; sim < numSimulations; sim++) {
      // Report progress at the start of each simulation
      const simulationProgress = sim / numSimulations;
      onProgress?.(simulationProgress);
      
      // Add a delay between simulations to make each one visible
      if (sim > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Reset state for this simulation
      let simBoard = JSON.parse(JSON.stringify(board));
      let simOurRack = [...ourRack]; // Fresh copy of our rack for each simulation
      let simBotRack = generateRandomRack(7); // Fresh random rack for opponent for each simulation
      let simOurScore = ourScore;
      let simBotScore = botScore;
      let simMoves = moves;
      let simPool = [...pool]; // Fresh copy of pool for each simulation
      
      // Apply the initial move
      for (const tile of move.tiles) {
        if (tile.isNew) {
          simBoard[tile.row][tile.col] = tile.letter;
          // Remove the tile from the current player's rack using count method
          simOurRack = removeTilesByCount(simOurRack, [tile.letter]);
        }
      }
      
      // Store the board after initial move
      // Calculate progress that reflects simulation progress plus initial move
      // For initial move, use a smaller progress increment to ensure it's displayed
      const initialMoveProgress = 0.1; // Fixed small value instead of 1/turnsPerSim
      const overallProgress = simulationProgress + (initialMoveProgress / numSimulations);
      
      onProgress?.(overallProgress, {
        board: JSON.parse(JSON.stringify(simBoard)),
        move: 'selected', // This is the move we selected to analyze
        tileOwnership: simBoard.map((row, rowIndex) => 
          row.map((cell, colIndex) => {
            if (typeof cell === 'string') {
              // Check if this tile was just placed in the initial move
              const wasJustPlaced = move.tiles.some(tile => 
                tile.row === rowIndex && tile.col === colIndex && tile.isNew
              );
              return wasJustPlaced ? 'player' : 'existing';
            }
            return null;
          })
        )
      });
      
      // Simulate additional moves based on turnsPerSim
      // turnsPerSim represents subsequent moves after our selected move
      // Turn 0 = opponent's first response, Turn 1 = our response, etc.
      let firstTurnOpponentScore = 0;
      for (let turn = 0; turn < turnsPerSim; turn++) {
        // Determine whose turn it is (opponent goes first after our selected move)
        const isOpponentTurn = turn % 2 === 0;
        const currentTurnRack = isOpponentTurn ? simBotRack : simOurRack;
        const currentTurnScore = isOpponentTurn ? simBotScore : simOurScore;
        
        try {
          // Validate board state before making API call
          if (!simBoard || !Array.isArray(simBoard) || simBoard.length !== 15) {
            console.error('Invalid board state in simulation:', simBoard);
            break;
          }
          
          // Validate rack before making API call
          if (!currentTurnRack || !Array.isArray(currentTurnRack) || currentTurnRack.length === 0) {
            console.error('Invalid rack in simulation:', currentTurnRack);
            break;
          }
          
          // Get moves for current player
          const response = await fetch('/.netlify/functions/getTopMoves', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              board: simBoard,
              letters: currentTurnRack
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error: Status ${response.status}, Response:`, errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }
          
          const moves = await response.json();
          
          if (!moves || !moves.moves || moves.moves.length === 0) {
            break;
          }

          // Select the highest scoring move
          const bestMove = moves.moves[0];  // Moves are already sorted by score
          
          // Apply the move
          for (const tile of bestMove.tiles) {
            if (tile.isNew) {
              simBoard[tile.row][tile.col] = tile.letter;
              // Remove the tile from the current player's rack using count method
              currentTurnRack = removeTilesByCount(currentTurnRack, [tile.letter]);
            }
          }
          
          // Update score for current player
          if (isOpponentTurn) {
            simBotScore += (bestMove.score || 0);
            // Track opponent's first turn score
            if (turn === 0) {
              firstTurnOpponentScore = bestMove.score || 0;
            }
          } else {
            simOurScore += (bestMove.score || 0);
          }
          
          simMoves++;
          
          // Draw new tiles for the current player BEFORE storing the board
          while (currentTurnRack.length < 7 && simPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * simPool.length);
            currentTurnRack.push(simPool[randomIndex]);
            simPool.splice(randomIndex, 1);
          }
          
          // Store the board after the move
          // Calculate progress that reflects both simulation and turn progress
          // Use a more balanced progress calculation
          const turnProgress = (turn + 1) * 0.3; // Fixed increment per turn
          const overallProgress = simulationProgress + (turnProgress / numSimulations);
          
          const boardToSend = JSON.parse(JSON.stringify(simBoard));
          onProgress?.(overallProgress, {
            board: boardToSend,
            move: isOpponentTurn ? 'opponent' : 'player',
            tileOwnership: simBoard.map((row, rowIndex) => 
              row.map((cell, colIndex) => {
                if (typeof cell === 'string') {
                  // Check if this tile was just placed in this turn
                  const wasJustPlaced = bestMove.tiles.some(tile => 
                    tile.row === rowIndex && tile.col === colIndex && tile.isNew
                  );
                  return wasJustPlaced ? (isOpponentTurn ? 'opponent' : 'player') : 'existing';
                }
                return null;
              })
            )
          });
          
        } catch (error) {
          console.error('Error in simulation:', error);
          // Instead of breaking, continue with a pass move
          
          // Draw new tiles for the current player even on pass
          while (currentTurnRack.length < 7 && simPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * simPool.length);
            currentTurnRack.push(simPool[randomIndex]);
            simPool.splice(randomIndex, 1);
          }
          
          // Continue to next turn instead of breaking
          continue;
        }
      }
      
      results.push({
        finalScore: simOurScore,
        finalBotScore: simBotScore,
        movesPlayed: simMoves,
        firstTurnOpponentScore: firstTurnOpponentScore
      });
      
      // Add a delay at the end of each simulation to show the final state
      if (sim < numSimulations - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Report final progress
    onProgress?.(1);
    
    // Calculate average results
    const avgScore = results.reduce((sum, r) => sum + (r.finalScore || 0), 0) / results.length;
    const avgBotScore = results.reduce((sum, r) => sum + (r.finalBotScore || 0), 0) / results.length;
    const avgFirstTurnOpponentScore = results.reduce((sum, r) => sum + (r.firstTurnOpponentScore || 0), 0) / results.length;
    const avgMoves = results.reduce((sum, r) => sum + (r.movesPlayed || 0), 0) / results.length;
    
    // Calculate additional metrics for the modal
    const scores = results.map(r => r.finalScore || 0);
    const botScores = results.map(r => r.finalBotScore || 0);
    
    // Calculate win rate (percentage of simulations where we win)
    const wins = results.filter(r => (r.finalScore || 0) > (r.finalBotScore || 0)).length;
    const winRate = (wins / results.length) * 100;
    
    return {
      move,
      avgScore,
      avgBotScore,
      avgFirstTurnOpponentScore,
      avgMoves,
      winRate,
      results
    };
    
  } catch (error) {
    console.error('Error simulating move:', error);
    throw error;
  }
};

export const runHeatMapSimulation = async (move, gameState, settings, callbacks) => {
  const {
    onProgress,
    onHeatMapUpdate,
    onError,
    onComplete,
    shouldStopRef
  } = callbacks;

  try {
    const iterations = settings.numSimulations;
    
    // Initialize heat map data (15x15 grid)
    const heatMap = Array(15).fill(null).map(() => Array(15).fill(0));
    
    for (let i = 0; i < iterations; i++) {
      // Check if simulation should be stopped
      if (shouldStopRef?.current) {
        throw new Error('Simulation stopped by user');
      }
      
      // Update progress
      onProgress?.((i / iterations) * 100);
      
      // Create copies of initial state for this iteration
      let board = JSON.parse(JSON.stringify(gameState.boardCoords));
      let ourRack = [...(gameState.currentPlayer === 1 ? gameState.player1Rack : gameState.player2Rack)];
      let botRack = generateRandomRack(7);
      let currentPool = [...gameState.pool];
      
      // Apply the initial move
      for (const tile of move.tiles) {
        if (tile.isNew) {
          board[tile.row][tile.col] = tile.letter;
          // Remove the tile from the current player's rack using count method
          ourRack = removeTilesByCount(ourRack, [tile.letter]);
        }
      }
      
      // Track the board after initial move
      trackBoardOccupancy(board, heatMap);
      
      // Simulate additional moves based on turnsPerSim
      for (let turn = 0; turn < settings.turnsPerSim; turn++) {
        try {
          // Check if simulation should be stopped
          if (shouldStopRef?.current) {
            throw new Error('Simulation stopped by user');
          }
          
          // Determine whose turn it is (opponent goes first)
          const isOpponentTurn = turn % 2 === 0;
          const currentTurnRack = isOpponentTurn ? botRack : ourRack;
          
          // Get moves for current player
          const response = await fetch('/.netlify/functions/getTopMoves', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              board: board,
              letters: currentTurnRack
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const moves = await response.json();
          
          if (!moves || !moves.moves || moves.moves.length === 0) {
            break;
          }

          // Select the highest scoring move
          const bestMove = moves.moves[0];
          
          // Apply the move
          for (const tile of bestMove.tiles) {
            if (tile.isNew) {
              board[tile.row][tile.col] = tile.letter;
              // Remove the tile from the current player's rack using count method
              currentTurnRack = removeTilesByCount(currentTurnRack, [tile.letter]);
            }
          }
          
          // Track the board after the move
          trackBoardOccupancy(board, heatMap);
          
          // Draw new tiles for the current player
          while (currentTurnRack.length < 7 && currentPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * currentPool.length);
            currentTurnRack.push(currentPool[randomIndex]);
            currentPool.splice(randomIndex, 1);
          }
          
        } catch (error) {
          console.error('Error in heat map iteration:', error);
          break;
        }
      }
      
      // Update heat map data after each iteration
      onHeatMapUpdate?.([...heatMap]);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Final update
    onHeatMapUpdate?.([...heatMap]);
    onComplete?.();
    
  } catch (error) {
    if (error.message === 'Simulation stopped by user') {
      console.log('Heat map simulation stopped by user');
    } else {
      console.error('Error running heat map simulation:', error);
      onError?.('Error running heat map simulation: ' + error.message);
    }
  }
};

export const runAllMovesSimulation = async (moves, gameState, settings, callbacks) => {
  const {
    onProgress,
    onResultsUpdate,
    onError,
    onComplete,
    shouldStopRef
  } = callbacks;

  try {
    const results = {};
    const numIterations = settings.numSimulations;
    
    // For each iteration, test all moves against the same random rack
    for (let iteration = 0; iteration < numIterations; iteration++) {
      // Check if simulation should be stopped
      if (shouldStopRef?.current) {
        throw new Error('Simulation stopped by user');
      }
      
      // Update progress
      onProgress?.((iteration / numIterations) * 100);
      
      // Generate a single random rack for this iteration
      const randomRack = generateRandomRack(7);
      
      // Test all moves against this same rack
      for (let moveIndex = 0; moveIndex < moves.length; moveIndex++) {
        const move = moves[moveIndex];
        
        // Check if simulation should be stopped
        if (shouldStopRef?.current) {
          throw new Error('Simulation stopped by user');
        }
        
        const testGameState = {
          ...gameState,
          player2Rack: randomRack // Use the same random rack for all moves in this iteration
        };
        
        try {
          const result = await simulateMove(move, testGameState, (progress, previewData) => {
            // Check if simulation should be stopped during individual move simulation
            if (shouldStopRef?.current) {
              throw new Error('Simulation stopped by user');
            }
          }, { ...settings, numSimulations: 1, turnsPerSim: 1 }); // Force single simulation per move and 1 turn only
          
          // Initialize results for this move if not exists
          if (!results[move.word]) {
            results[move.word] = {
              winRates: [],
              avgFirstTurnOpponentScores: [],
              totalWins: 0,
              totalOpponentScores: 0
            };
          }
          
          // Store results for this iteration
          results[move.word].winRates.push(result.winRate);
          results[move.word].avgFirstTurnOpponentScores.push(result.avgFirstTurnOpponentScore);
          results[move.word].totalWins += result.winRate > 50 ? 1 : 0; // Count wins
          results[move.word].totalOpponentScores += result.avgFirstTurnOpponentScore;
          
        } catch (error) {
          if (error.message === 'Simulation stopped by user') {
            throw error; // Re-throw to stop the entire process
          }
          console.error(`Error simulating move ${move.word} in iteration ${iteration + 1}:`, error);
          // Continue with other moves even if one fails
        }
      }
      
      // Update results live after each iteration
      const currentResults = {};
      for (const [moveWord, moveResults] of Object.entries(results)) {
        const avgWinRate = moveResults.winRates.reduce((sum, rate) => sum + rate, 0) / moveResults.winRates.length;
        const avgOpponentScore = moveResults.totalOpponentScores / moveResults.avgFirstTurnOpponentScores.length;
        const winCount = moveResults.totalWins;
        
        currentResults[moveWord] = {
          winRate: avgWinRate,
          avgFirstTurnOpponentScore: avgOpponentScore,
          winCount: winCount,
          totalIterations: iteration + 1
        };
      }
      
      // Update the results
      onResultsUpdate?.(currentResults);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    onComplete?.();
    
  } catch (error) {
    if (error.message === 'Simulation stopped by user') {
      console.log('All moves simulation stopped by user');
    } else {
      console.error('Error running all moves simulation:', error);
      onError?.('Error running all moves simulation: ' + error.message);
    }
  }
};

export const runSimulation = async (move, gameState, settings, callbacks) => {
  const {
    onProgress,
    onPreviewUpdate,
    onError,
    onComplete,
    shouldStopRef,
    resetHeatMapMode
  } = callbacks;

  // Reset heat map mode when starting normal simulation
  resetHeatMapMode?.();
  
  try {
    // Ensure simulation board is properly initialized
    if (!gameState.boardCoords) {
      throw new Error('Simulation board not initialized');
    }
    
    // For "Play It Out", we want to show multiple simulations to see different responses
    // Run simulations to demonstrate the moves
    const result = await simulateMove(move, gameState, async (progress, previewData) => {
      // Check if simulation should be stopped
      if (shouldStopRef?.current) {
        throw new Error('Simulation stopped by user');
      }
      onProgress?.(progress * 100);
      
      // Handle board preview updates
      if (previewData && previewData.board) {
        onPreviewUpdate?.({
          board: previewData.board,
          move: previewData.move,
          tileOwnership: previewData.tileOwnership
        });
        
        // Add a delay to make the visualization more visible
        // Use longer delay for final state to ensure it's seen
        const delay = progress >= 1 ? 500 : 200;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }, settings); // Use full user settings to see multiple simulations
    
    // Don't store statistics for individual "Play It Out" - just show the demonstration
    onComplete?.();
    
  } catch (error) {
    if (error.message === 'Simulation stopped by user') {
      console.log('Simulation stopped by user');
    } else {
      console.error('Error running simulation:', error);
      onError?.('Error running simulation: ' + error.message);
    }
  }
};

export const openSimulationModal = (move, topMoves, boardCoords, callbacks) => {
  const {
    setMoveWithResults,
    setSimulationBoard,
    setPreviewBoard,
    setPreviewMove,
    setShowSimulationModal
  } = callbacks;

  // If no move is provided, use the first move from topMoves
  const selectedMove = move || (topMoves && topMoves.length > 0 ? topMoves[0] : null);
  
  if (!selectedMove) {
    console.error('No move available for simulation modal');
    return;
  }
  
  // Ensure the move has the required structure
  if (!selectedMove.tiles || !Array.isArray(selectedMove.tiles)) {
    console.error('Selected move does not have valid tiles array:', selectedMove);
    return;
  }
  
  setMoveWithResults(selectedMove);
  setSimulationBoard(null);
  setPreviewBoard(null);
  setPreviewMove(null);
  setShowSimulationModal(true);
  
  // Create a completely separate simulation board
  // Start with the current game board and apply the move
  const simulationBoardData = JSON.parse(JSON.stringify(boardCoords));
  
  // Apply the move to the simulation board
  for (const tile of selectedMove.tiles) {
    if (tile.isNew) {
      simulationBoardData[tile.row][tile.col] = tile.letter;
    }
  }
  
  // Update the simulation board to show the simulation starting point
  setSimulationBoard(simulationBoardData);
};

export const stopSimulation = (callbacks) => {
  const {
    setShouldStopSimulation,
    shouldStopRef,
    setSimulatingMove,
    setSimulationProgress,
    setPreviewMove,
    setPreviewTileOwnership
  } = callbacks;

  setShouldStopSimulation(true);
  shouldStopRef.current = true;
  setSimulatingMove(null);
  setSimulationProgress(0);
  setPreviewMove(null);
  setPreviewTileOwnership(null);
};

export const resetHeatMapMode = (callbacks) => {
  const {
    setIsHeatMapMode,
    setHeatMapData
  } = callbacks;

  setIsHeatMapMode(false);
  setHeatMapData(null);
};

export const switchToMetrics = (callbacks) => {
  const {
    setIsHeatMapMode
  } = callbacks;

  setIsHeatMapMode(false);
}; 