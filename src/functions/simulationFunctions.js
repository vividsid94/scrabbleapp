import { generateRandomRack } from './moveFunctions.js';

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
  const turnsPerSim = settings.turnsPerSim || 2;

  try {
    // Create copies of initial state
    let board = JSON.parse(JSON.stringify(boardCoords));
    let ourRack = [...(currentPlayer === 1 ? player1Rack : player2Rack)];
    // Use a random rack for the opponent instead of the current game state's rack
    let botRack = generateRandomRack(7);
    let ourScore = currentPlayer === 1 ? player1points : player2points;
    let botScore = currentPlayer === 1 ? player2points : player1points;
    ourScore += (move.score || 0);
    let moves = 1;
    const results = [];
    
    // Run simulations
    for (let sim = 0; sim < numSimulations; sim++) {
      // Report progress at the start of each simulation
      onProgress?.(sim / numSimulations);
      
      // Reset state for this simulation
      let simBoard = JSON.parse(JSON.stringify(board));
      let simOurRack = [...ourRack];
      let simBotRack = [...botRack];
      let simOurScore = ourScore;
      let simBotScore = botScore;
      let simMoves = moves;
      
      // Apply the initial move
      for (const tile of move.tiles) {
        if (tile.isNew) {
          simBoard[tile.row][tile.col] = tile.letter;
          const tileIndex = simOurRack.indexOf(tile.letter);
          if (tileIndex !== -1) {
            simOurRack.splice(tileIndex, 1);
          }
        }
      }
      
      // Store the board after initial move
      onProgress?.(sim / numSimulations, {
        board: JSON.parse(JSON.stringify(simBoard)),
        move: 'initial'
      });
      
      // Simulate additional moves based on turnsPerSim
      // turnsPerSim now represents total turns starting with opponent
      for (let turn = 0; turn < turnsPerSim; turn++) {
        try {
          // Determine whose turn it is (opponent goes first)
          const isOpponentTurn = turn % 2 === 0;
          const currentTurnRack = isOpponentTurn ? simBotRack : simOurRack;
          const currentTurnScore = isOpponentTurn ? simBotScore : simOurScore;
          
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
            throw new Error(`HTTP error! status: ${response.status}`);
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
              const tileIndex = currentTurnRack.indexOf(tile.letter);
              if (tileIndex !== -1) {
                currentTurnRack.splice(tileIndex, 1);
              }
            }
          }
          
          // Update score for current player
          if (isOpponentTurn) {
            simBotScore += (bestMove.score || 0);
          } else {
            simOurScore += (bestMove.score || 0);
          }
          
          simMoves++;
          
          // Store the board after the move
          onProgress?.(sim / numSimulations, {
            board: JSON.parse(JSON.stringify(simBoard)),
            move: isOpponentTurn ? 'bot' : 'player'
          });
          
          // Draw new tiles for the current player
          const newPool = [...pool];
          while (currentTurnRack.length < 7 && newPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * newPool.length);
            currentTurnRack.push(newPool[randomIndex]);
            newPool.splice(randomIndex, 1);
          }
          
        } catch (error) {
          console.error('Error in simulation:', error);
          break;
        }
      }
      
      results.push({
        finalScore: simOurScore,
        finalBotScore: simBotScore,
        movesPlayed: simMoves
      });
    }
    
    // Report final progress
    onProgress?.(1);
    
    // Calculate average results
    const avgScore = results.reduce((sum, r) => sum + (r.finalScore || 0), 0) / results.length;
    const avgBotScore = results.reduce((sum, r) => sum + (r.finalBotScore || 0), 0) / results.length;
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
      avgMoves,
      winRate,
      results
    };
    
  } catch (error) {
    console.error('Error simulating move:', error);
    throw error;
  }
}; 