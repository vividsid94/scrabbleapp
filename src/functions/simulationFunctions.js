export const simulateMove = async (move, gameState, onProgress) => {
  const {
    boardCoords,
    currentPlayer,
    player1Rack,
    player2Rack,
    player1points,
    player2points,
    pool
  } = gameState;

  try {
    // Create copies of initial state
    let board = JSON.parse(JSON.stringify(boardCoords));
    let ourRack = [...(currentPlayer === 1 ? player1Rack : player2Rack)];
    let botRack = [...(currentPlayer === 1 ? player2Rack : player1Rack)];
    let ourScore = currentPlayer === 1 ? player1points : player2points;
    let botScore = currentPlayer === 1 ? player2points : player1points;
    ourScore += (move.score || 0);
    let moves = 1;
    const results = [];
    
    // Run 5 simulations
    for (let sim = 0; sim < 5; sim++) {
      // Report progress at the start of each simulation
      onProgress?.(sim / 5);
      
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
      onProgress?.(sim / 5, {
        board: JSON.parse(JSON.stringify(simBoard)),
        move: 'initial'
      });
      
      // Simulate 4 more moves (2 turns each)
      for (let turn = 0; turn < 2; turn++) {
        try {
          // Get bot's response
          const response = await fetch('/.netlify/functions/getTopMoves', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              board: simBoard,
              letters: simBotRack
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const botMoves = await response.json();
          
          if (!botMoves || !botMoves.moves || botMoves.moves.length === 0) {
            break;
          }

          // Select the highest scoring move for bot
          const botMove = botMoves.moves[0];  // Moves are already sorted by score
          
          // Apply bot's move
          for (const tile of botMove.tiles) {
            if (tile.isNew) {
              simBoard[tile.row][tile.col] = tile.letter;
              const tileIndex = simBotRack.indexOf(tile.letter);
              if (tileIndex !== -1) {
                simBotRack.splice(tileIndex, 1);
              }
            }
          }
          
          simBotScore += (botMove.score || 0);
          simMoves++;
          
          // Store the board after bot's move
          onProgress?.(sim / 5, {
            board: JSON.parse(JSON.stringify(simBoard)),
            move: 'bot'
          });
          
          // Get our next move
          const ourResponse = await fetch('/.netlify/functions/getTopMoves', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              board: simBoard,
              letters: simOurRack
            })
          });
          
          if (!ourResponse.ok) {
            throw new Error(`HTTP error! status: ${ourResponse.status}`);
          }
          
          const ourMoves = await ourResponse.json();
          
          if (!ourMoves || !ourMoves.moves || ourMoves.moves.length === 0) {
            break;
          }

          // Select the highest scoring move
          const ourMove = ourMoves.moves[0];  // Moves are already sorted by score
          
          // Apply our move
          for (const tile of ourMove.tiles) {
            if (tile.isNew) {
              simBoard[tile.row][tile.col] = tile.letter;
              const tileIndex = simOurRack.indexOf(tile.letter);
              if (tileIndex !== -1) {
                simOurRack.splice(tileIndex, 1);
              }
            }
          }
          
          simOurScore += (ourMove.score || 0);
          simMoves++;
          
          // Store the board after our move
          onProgress?.(sim / 5, {
            board: JSON.parse(JSON.stringify(simBoard)),
            move: 'player'
          });
          
          // Draw new tiles for both players
          const newPool = [...pool];
          while (simOurRack.length < 7 && newPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * newPool.length);
            simOurRack.push(newPool[randomIndex]);
            newPool.splice(randomIndex, 1);
          }
          while (simBotRack.length < 7 && newPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * newPool.length);
            simBotRack.push(newPool[randomIndex]);
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
    
    return {
      move,
      avgScore,
      avgBotScore,
      avgMoves,
      results
    };
    
  } catch (error) {
    console.error('Error simulating move:', error);
    throw error;
  }
}; 