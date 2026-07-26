import { generateRandomRack } from './moveFunctions.js';
import { removeTilesByCount } from './play/rackFunctions';

// Helper function to track board occupancy for heat maps
const trackBoardOccupancy = (board, heatMap) => {
  // Safety checks
  if (!board || !Array.isArray(board) || board.length !== 15) {
    console.error('Invalid board in trackBoardOccupancy:', board);
    return;
  }
  
  if (!heatMap || !Array.isArray(heatMap) || heatMap.length !== 15) {
    console.error('Invalid heatMap in trackBoardOccupancy:', heatMap);
    return;
  }
  
  for (let row = 0; row < 15; row++) {
    if (!board[row] || !Array.isArray(board[row]) || board[row].length !== 15) {
      console.error(`Invalid board row ${row}:`, board[row]);
      continue;
    }
    
    if (!heatMap[row] || !Array.isArray(heatMap[row]) || heatMap[row].length !== 15) {
      console.error(`Invalid heatMap row ${row}:`, heatMap[row]);
      continue;
    }
    
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
        let currentTurnRack = isOpponentTurn ? simBotRack : simOurRack;
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
              if (isOpponentTurn) {
                // Modify botRack directly
                const index = simBotRack.indexOf(tile.letter);
                if (index !== -1) {
                  simBotRack.splice(index, 1);
                }
              } else {
                // Modify ourRack directly
                const index = simOurRack.indexOf(tile.letter);
                if (index !== -1) {
                  simOurRack.splice(index, 1);
                }
              }
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
          
          // Draw new tiles for the current player
          if (isOpponentTurn) {
            while (botRack.length < 7 && simPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * simPool.length);
              botRack.push(simPool[randomIndex]);
              simPool.splice(randomIndex, 1);
            }
          } else {
            while (ourRack.length < 7 && simPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * simPool.length);
              ourRack.push(simPool[randomIndex]);
              simPool.splice(randomIndex, 1);
            }
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
          if (isOpponentTurn) {
            while (botRack.length < 7 && simPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * simPool.length);
              botRack.push(simPool[randomIndex]);
              simPool.splice(randomIndex, 1);
            }
          } else {
            while (ourRack.length < 7 && simPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * simPool.length);
              ourRack.push(simPool[randomIndex]);
              simPool.splice(randomIndex, 1);
            }
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
      
      // Safety check for board initialization
      if (!board || !Array.isArray(board) || board.length !== 15) {
        console.error('Invalid board state in heat map simulation:', board);
        throw new Error('Invalid board state in heat map simulation');
      }
      
      // Ensure each row is properly initialized
      for (let row = 0; row < 15; row++) {
        if (!board[row] || !Array.isArray(board[row]) || board[row].length !== 15) {
          console.error(`Invalid board row ${row} in heat map simulation:`, board[row]);
          // Initialize the row if it's invalid
          board[row] = Array(15).fill(0);
        }
      }
      
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
              if (isOpponentTurn) {
                // Modify botRack directly
                const index = botRack.indexOf(tile.letter);
                if (index !== -1) {
                  botRack.splice(index, 1);
                }
              } else {
                // Modify ourRack directly
                const index = ourRack.indexOf(tile.letter);
                if (index !== -1) {
                  ourRack.splice(index, 1);
                }
              }
            }
          }
          
          // Track the board after the move
          trackBoardOccupancy(board, heatMap);
          
          // Draw new tiles for the current player
          if (isOpponentTurn) {
            while (botRack.length < 7 && currentPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * currentPool.length);
              botRack.push(currentPool[randomIndex]);
              currentPool.splice(randomIndex, 1);
            }
          } else {
            while (ourRack.length < 7 && currentPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * currentPool.length);
              ourRack.push(currentPool[randomIndex]);
              currentPool.splice(randomIndex, 1);
            }
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

