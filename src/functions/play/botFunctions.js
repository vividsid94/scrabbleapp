import { alphabetizeRack } from './rackFunctions';

export const makeBotMove = async ({
  boardCoords,
  player2Rack,
  pool,
  player2points,
  player2Name,
  player1Rack,
  player1points,
  blankTiles,
  setBoardCoords,
  setTempBoardCoords,
  setPlayer2Rack,
  setBlankTiles,
  setPool,
  setPlayer2points,
  setCurrentPlayer,
  setSelectedBoardPosition,
  setSelectedTiles,
  setArrowDirection,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  setConsecutivePasses,
  setMoveHistory,
  getBoardDiff,
  handleGameEnd,
  botMoveSound,
  autoPlayBest,
  setIsBotThinking,
  setSimulatingMove,
  setSimulationResult,
  setSimulationProgress,
  setPreviewBoard,
  setPreviewMove,
  setMoveWithResults,
  setTopMoves,
  isBotMode,
  currentPlayer
}) => {
  if (!isBotMode || currentPlayer !== 2) {
    return;
  }

  // Only show thinking state if auto-play is not enabled
  if (!autoPlayBest) {
    setIsBotThinking(true);
  }

  try {
    // Create a deep copy of the board and rack
    const boardCopy = JSON.parse(JSON.stringify(boardCoords));
    const rackCopy = [...player2Rack];
    
    // Convert any '?' in the rack to '*' for the API
    const apiRack = rackCopy.map(tile => tile === '?' ? '*' : tile);
    
    console.log('🤖 Bot Move Request:', {
      rack: apiRack.join('')
    });

    let response;
    // Only add delay if auto-play is not enabled
    if (!autoPlayBest) {
      const startTime = Date.now();
      response = await fetch('/.netlify/functions/botLogic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardCopy,
          letters: apiRack,
          pool: pool
        })
      });

      // Calculate remaining time to ensure minimum 2 second delay
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } else {
      // Skip delay when auto-play is enabled
      response = await fetch('/.netlify/functions/botLogic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardCopy,
          letters: apiRack,
          pool: pool
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Bot error details:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Bot moves response:', {
      moves: data.moves,
      poolSize: pool.length,
      exchangesConsidered: pool.length >= 7
    });
    
    if (!data.moves || data.moves.length === 0) {
      setSnackbarMessage('Bot could not find a valid move');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      setCurrentPlayer(1); // Switch back to player 1 if bot can't move
      return;
    }

    // Sort moves by totalValue (points + leave) from the backend
    const sortedMoves = data.moves.sort((a, b) => b.totalValue - a.totalValue);
    const bestMove = sortedMoves[0];

    // Play bot move sound after the delay
    botMoveSound.current.play();

    // Get the current rack before making the move
    const botRack = player2Rack;
    
    // Create a copy of the board with the bot's move
    const newBoard = JSON.parse(JSON.stringify(boardCoords));
    const newRack = [...player2Rack];
    const newBlankTiles = [...blankTiles];
    const newPool = [...pool];
    
    if (bestMove.isExchange) {
      // Handle exchange move
      const tilesToExchange = bestMove.tilesToExchange || bestMove.tiles.map(t => t.letter);
      const newTiles = bestMove.newTiles || [];
      
      // Remove exchanged tiles from rack
      for (const tile of tilesToExchange) {
        const tileIndex = newRack.indexOf(tile);
        if (tileIndex !== -1) {
          newRack.splice(tileIndex, 1);
        }
      }
      
      // Add new tiles to rack
      newRack.push(...newTiles);
      
      // Remove new tiles from pool
      for (const tile of newTiles) {
        const poolIndex = newPool.indexOf(tile);
        if (poolIndex !== -1) {
          newPool.splice(poolIndex, 1);
        }
      }
      
      // Add exchanged tiles back to pool
      newPool.push(...tilesToExchange);
      
      // Update state
      setPlayer2Rack(alphabetizeRack(newRack));
      setPool(newPool);
      
      // Show toast notification for bot's exchange
      //setSnackbarMessage(`SidBot exchanged ${tilesToExchange.length} tiles`);
      //setSnackbarSeverity("info");
      //ssetSnackbarOpen(true);
    } else {
      // Handle regular move
      for (const tile of bestMove.tiles) {
        if (tile.isNew) {
          newBoard[tile.row][tile.col] = tile.letter;
          
          // For blank tiles, we need to find the blank in the rack
          if (tile.isBlank) {
            newBlankTiles.push({ row: tile.row, col: tile.col });
            
            // Remove the blank tile from the rack - look for both '?' and '*'
            const blankIndex = newRack.indexOf('?');
            if (blankIndex !== -1) {
              newRack.splice(blankIndex, 1);
            } else {
              const starIndex = newRack.indexOf('*');
              if (starIndex !== -1) {
                newRack.splice(starIndex, 1);
              }
            }
          } else {
            // For non-blank tiles, find and remove the letter
            const tileIndex = newRack.indexOf(tile.letter);
            if (tileIndex !== -1) {
              newRack.splice(tileIndex, 1);
            }
          }
        }
      }
      
      // Calculate running total
      const botRunningTotal = player2points + bestMove.score;

      // Store only the differences in board states
      const boardDiff = getBoardDiff(boardCoords, newBoard);
      const moveHistoryEntry = {
        boardDiff,
        player: player2Name,
        score: bestMove.score,
        rack: alphabetizeRack(botRack).join(''),
        total: botRunningTotal,
        word: bestMove.word
      };

      setMoveHistory(prev => [...prev.slice(-49), moveHistoryEntry]);

      // Update the board state
      setBoardCoords(newBoard);
      setTempBoardCoords(JSON.parse(JSON.stringify(newBoard)));
      setPlayer2Rack(alphabetizeRack(newRack));
      setBlankTiles(newBlankTiles);
      
      // Draw new tiles for bot
      while (newRack.length < 7 && newPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * newPool.length);
        newRack.push(newPool[randomIndex]);
        newPool.splice(randomIndex, 1);
      }
      setPlayer2Rack(alphabetizeRack(newRack));
      setPool(newPool);
      
      // Show toast notification for bot's move
      //setSnackbarMessage(`SidBot played "${bestMove.word}" for ${bestMove.score} points`);
      //setSnackbarSeverity("success");
      //setSnackbarOpen(true);
      
      // Update bot's score
      setPlayer2points(botRunningTotal);
    }
    
    // Check if game should end
    if (newRack.length === 0 && pool.length === 0) {
      handleGameEnd(newRack, player2Name, player1Rack, player1points);
      return;
    }
    
    // Reset consecutive passes since bot made a move
    setConsecutivePasses(0);
    
    // Switch back to player 1
    setCurrentPlayer(1);
    setSelectedBoardPosition(null);
    setSelectedTiles([]);
    setArrowDirection('right');
    
  } catch (error) {
    console.error('Error making bot move:', error);
    setSnackbarMessage('Error making bot move: ' + error.message);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    setCurrentPlayer(1); // Switch back to player 1 on error
  } finally {
    // Only clear thinking state if auto-play is not enabled
    if (!autoPlayBest) {
      setIsBotThinking(false);
    }
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

export const startBotGame = ({
  origBoard,
  origPool,
  TEST_RACKS,
  setOrigBoardCoords,
  setBoardCoords,
  setTempBoardCoords,
  setPlayer1points,
  setPlayer2points,
  setPool,
  botGoesFirst,
  setCurrentPlayer,
  setConsecutivePasses,
  setPlayer1Rack,
  setPlayer2Rack,
  setIsBotMode,
  setPlayer1Name,
  setPlayer2Name,
  makeBotMove,
  gameStartSound,
  setSimulatingMove,
  setSimulationResult,
  setSimulationProgress,
  setPreviewBoard,
  setPreviewMove,
  setMoveWithResults,
  setTopMoves
}) => {
  // Play game start sound
  gameStartSound.current.play();

  // Reset game state
  let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
  setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setPlayer1points(0);
  setPlayer2points(0);
  setPool(origPool);
  
  // Set current player based on who goes first
  setCurrentPlayer(botGoesFirst ? 2 : 1);
  setConsecutivePasses(0);
  
  // Initialize player racks
  const newPool = [...origPool];
  let rack1 = [];
  let rack2 = [];
  
  if (TEST_RACKS.enabled) {
    // Use test racks
    rack1 = [...TEST_RACKS.player1];
    rack2 = [...TEST_RACKS.player2];
    
    // Remove test tiles from pool
    [...rack1, ...rack2].forEach(tile => {
      const index = newPool.indexOf(tile);
      if (index !== -1) {
        newPool.splice(index, 1);
      }
    });
  } else {
    // Use random racks
    for (let i = 0; i < 7; i++) {
      const randomIndex1 = Math.floor(Math.random() * newPool.length);
      rack1.push(newPool[randomIndex1]);
      newPool.splice(randomIndex1, 1);
      
      const randomIndex2 = Math.floor(Math.random() * newPool.length);
      rack2.push(newPool[randomIndex2]);
      newPool.splice(randomIndex2, 1);
    }
  }
  
  setPlayer1Rack(alphabetizeRack(rack1));
  setPlayer2Rack(alphabetizeRack(rack2));
  setPool(newPool);
  
  // Set bot mode and names
  setIsBotMode(true);
  setPlayer1Name('You');
  setPlayer2Name('SidBot');
  
  // Clear all temporary states
  setSimulatingMove(null);
  setSimulationResult(null);
  setSimulationProgress(0);
  setPreviewBoard(null);
  setPreviewMove(null);
  setMoveWithResults(null);
  setTopMoves([]);
  
  // If bot goes first, make its move
  if (botGoesFirst) {
    makeBotMove();
  }
}; 