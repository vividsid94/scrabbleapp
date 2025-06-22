import { alphabetizeRack, removeTilesByCount } from './rackFunctions';
import { useGameStore } from '../../stores/gameStore';
import { handleGameEnd } from './gameEndFunctions';

// Add warmup function for the Go service
export const warmupGoService = async (retryCount = 0) => {
  const renderUrl = 'https://scrabble-move-generator.onrender.com/generate-moves';
  const maxRetries = 2;
  
  try {
    console.log(`🔥 Warming up Go service... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Make a simple warmup request with minimal data
    const warmupData = {
      board: Array(15).fill().map(() => Array(15).fill('')),
      rack: 'HELLO',
      topN: 1
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for warmup
    
    const response = await fetch(renderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(warmupData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Go service warmed up successfully');
      return true;
    } else {
      console.warn(`⚠️ Go service warmup failed with status: ${response.status}`);
      
      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying warmup in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return warmupGoService(retryCount + 1);
      }
      
      return false;
    }
  } catch (error) {
    console.warn(`⚠️ Go service warmup failed: ${error.message}`);
    
    // Retry if we haven't exceeded max retries and it's not an abort error
    if (retryCount < maxRetries && error.name !== 'AbortError') {
      console.log(`🔄 Retrying warmup in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return warmupGoService(retryCount + 1);
    }
    
    return false;
  }
};

// Cache for warmup status
let goServiceWarmedUp = false;
let warmupPromise = null;

// Function to ensure Go service is warmed up
export const ensureGoServiceWarmedUp = async () => {
  if (goServiceWarmedUp) {
    return true;
  }
  
  if (warmupPromise) {
    return warmupPromise;
  }
  
  warmupPromise = warmupGoService().then(success => {
    goServiceWarmedUp = success;
    return success;
  });
  
  return warmupPromise;
};

// Function to pre-warm the Go service (can be called when app starts)
export const preWarmGoService = async () => {
  console.log('🔥 Pre-warming Go service...');
  try {
    const success = await ensureGoServiceWarmedUp();
    if (success) {
      console.log('✅ Go service pre-warmed successfully');
      
      // Start periodic warmup to keep service alive
      startPeriodicWarmup();
    } else {
      console.warn('⚠️ Go service pre-warm failed');
    }
    return success;
  } catch (error) {
    console.error('❌ Go service pre-warm error:', error);
    return false;
  }
};

// Periodic warmup to keep Go service alive
let periodicWarmupInterval = null;

export const startPeriodicWarmup = () => {
  // Clear any existing interval
  if (periodicWarmupInterval) {
    clearInterval(periodicWarmupInterval);
  }
  
  // Ping the service every 4 minutes to keep it warm
  periodicWarmupInterval = setInterval(async () => {
    console.log('🔥 Periodic Go service warmup...');
    try {
      await warmupGoService();
    } catch (error) {
      console.warn('⚠️ Periodic warmup failed:', error.message);
    }
  }, 4 * 60 * 1000); // 4 minutes
  
  console.log('🔄 Started periodic Go service warmup (every 4 minutes)');
};

export const stopPeriodicWarmup = () => {
  if (periodicWarmupInterval) {
    clearInterval(periodicWarmupInterval);
    periodicWarmupInterval = null;
    console.log('🛑 Stopped periodic Go service warmup');
  }
};

export const makeBotMove = async (botMoveSound) => {
  const {
    isBotMode,
    currentPlayer,
    boardCoords,
    player2Rack,
    player1Rack,
    pool,
    blankTiles,
    player2points,
    player1points,
    player2Name,
    player1Name,
    autoPlayBest,
    setIsBotThinking,
    setCurrentPlayer,
    setPlayer2Rack,
    setPlayer1Rack,
    setBoardCoords,
    setTempBoardCoords,
    setPool,
    setBlankTiles,
    setPlayer2points,
    setPlayer1points,
    setMoveHistory,
    setTopMoves,
    setSnackbarMessage,
    setSnackbarSeverity,
    setSnackbarOpen,
    setConsecutivePasses,
    setSelectedBoardPosition,
    setSelectedTiles,
    setArrowDirection,
    setAutoPlayBest,
    getBoardDiff,
    setSimulatingMove,
    setSimulationResult,
    setSimulationProgress,
    setPreviewBoard,
    setPreviewMove,
    setMoveWithResults
  } = useGameStore.getState();

  if (!isBotMode || currentPlayer !== 2) {
    return;
  }

  // Only show thinking state if auto-play is not enabled
  if (!autoPlayBest) {
    setIsBotThinking(true);
  }

  try {
    // Ensure Go service is warmed up before making the actual request
    console.log('🔥 Ensuring Go service is warmed up...');
    const isWarmedUp = await ensureGoServiceWarmedUp();
    
    if (!isWarmedUp) {
      console.warn('⚠️ Go service warmup failed, proceeding with fallback...');
    }

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
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 29000); // 29 second timeout
      
      try {
        response = await fetch('/.netlify/functions/botLogic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: boardCopy,
            letters: apiRack,
            pool: pool
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Bot calculation timed out. Please try again.');
        }
        throw fetchError;
      }

      // Calculate remaining time to ensure minimum 2 second delay
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } else {
      // Skip delay when auto-play is enabled, but still add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 29000); // 29 second timeout
      
      try {
        response = await fetch('/.netlify/functions/botLogic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: boardCopy,
            letters: apiRack,
            pool: pool
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Bot calculation timed out. Please try again.');
        }
        throw fetchError;
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Bot error details:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.error || 'Unknown error'}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse bot response:', jsonError);
      throw new Error('Bot returned invalid response. Please try again.');
    }

    // Filter out moves with empty words
    if (data.moves) {
      data.moves = data.moves.filter(move => move.word && move.word.trim() !== '');
    }

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
    if (botMoveSound && botMoveSound.play) {
      botMoveSound.play();
    }

    // Get the current rack before making the move
    const botRack = player2Rack;
    
    // Create a copy of the board with the bot's move
    const newBoard = JSON.parse(JSON.stringify(boardCoords));
    let newRack = [...player2Rack];
    const newBlankTiles = [...blankTiles];
    let newPool = [...pool];
    
    // Initialize botRunningTotal for game end check
    let botRunningTotal = player2points;
    
    if (bestMove.isExchange) {
      // Handle exchange move
      const tilesToExchange = bestMove.tilesToExchange || bestMove.tiles.map(t => t.letter);
      const newTiles = bestMove.newTiles || [];
      
      // Remove exchanged tiles from rack using count method
      newRack = removeTilesByCount(newRack, tilesToExchange);
      
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
      const tilesToRemove = [];
      
      for (const tile of bestMove.tiles) {
        if (tile.isNew) {
          newBoard[tile.row][tile.col] = tile.letter;
          
          // For blank tiles, we need to find the blank in the rack
          if (tile.isBlank) {
            newBlankTiles.push({ row: tile.row, col: tile.col });
            tilesToRemove.push('?');
          } else {
            // For non-blank tiles, add the letter to tiles to remove
            tilesToRemove.push(tile.letter);
          }
        }
      }
      
      // Remove all tiles at once using count method
      if (tilesToRemove.length > 0) {
        newRack = removeTilesByCount(newRack, tilesToRemove);
      }
      
      // Calculate running total for regular moves
      botRunningTotal = player2points + bestMove.score;

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

      // Add move to history
      const currentHistory = useGameStore.getState().moveHistory || [];
      setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);

      // Update the board state
      setBoardCoords(newBoard);
      setTempBoardCoords(JSON.parse(JSON.stringify(newBoard)));
      setPlayer2Rack(alphabetizeRack(newRack));
      setBlankTiles(newBlankTiles);
      
      // Update bot's score
      setPlayer2points(botRunningTotal);
    }
    
    // Check if game should end BEFORE drawing new tiles
    // Game ends if bot played all its tiles and there are no tiles left in the pool
    if (newRack.length === 0 && newPool.length === 0) {
      console.log('🎯 GAME END: Bot played all tiles and pool is empty!', {
        botRack: newRack,
        poolSize: newPool.length,
        botScore: botRunningTotal,
        player1Score: player1points,
        player1Rack: player1Rack
      });
      handleGameEnd({
        winnerRack: newRack,
        winnerName: player2Name,
        loserRack: player1Rack || [],
        loserPoints: player1points,
        player1Rack: player1Rack,
        player2Rack: player2Rack,
        player1points: player1points,
        player2points: player2points,
        player1Name: player1Name,
        player2Name: player2Name,
        autoPlayBest: autoPlayBest,
        setPlayer1points: setPlayer1points,
        setPlayer2points: setPlayer2points,
        setSnackbarMessage: setSnackbarMessage,
        setSnackbarSeverity: setSnackbarSeverity,
        setSnackbarOpen: setSnackbarOpen,
        setAutoPlayBest: setAutoPlayBest
      });
      return;
    }
    
    // Draw new tiles for bot (only if game didn't end)
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
    
    // Reset consecutive passes since bot made a move
    setConsecutivePasses(0);
    
    // Switch back to player 1
    setCurrentPlayer(1);
    setSelectedBoardPosition(null);
    setSelectedTiles([]);
    setArrowDirection('right');
    
  } catch (error) {
    console.error('Error making bot move:', error);
    
    // Try fallback strategies
    try {
      console.log('Attempting fallback bot move...');
      
      // If the bot can't calculate moves, try a simple pass or exchange
      if (pool.length >= 7) {
        // Try an exchange if pool has enough tiles
        const tilesToExchange = player2Rack.slice(0, Math.min(3, player2Rack.length));
        let newRack = player2Rack.filter(tile => !tilesToExchange.includes(tile));
        
        // Draw new tiles
        for (let i = 0; i < tilesToExchange.length && pool.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * pool.length);
          newRack.push(pool[randomIndex]);
          pool.splice(randomIndex, 1);
        }
        
        // Update state for exchange
        setPlayer2Rack(alphabetizeRack(newRack));
        setPool([...pool, ...tilesToExchange]);
        
        // Add exchange to move history
        const moveHistoryEntry = {
          boardDiff: [],
          player: player2Name,
          score: 0,
          rack: newRack.join(''),
          total: player2points,
          word: 'Exchange'
        };
        // Add move to history
        const currentHistory = useGameStore.getState().moveHistory || [];
        setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);
        
        console.log('Bot fallback: Exchange completed');
      } else {
        // Pass if no exchange possible
        const moveHistoryEntry = {
          boardDiff: [],
          player: player2Name,
          score: 0,
          rack: player2Rack.join(''),
          total: player2points,
          word: 'Pass'
        };
        // Add move to history
        const currentHistory = useGameStore.getState().moveHistory || [];
        setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);
        
        console.log('Bot fallback: Pass completed');
      }
      
      // Switch back to player 1
      setCurrentPlayer(1);
      setConsecutivePasses(prev => prev + 1);
      
      // Show user-friendly message
      setSnackbarMessage('Bot had trouble calculating moves, used fallback strategy');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      setSnackbarMessage('Bot error: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setCurrentPlayer(1); // Switch back to player 1 on error
    }
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

export const startBotGame = ({ origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound }) => {
  const {
    setOrigBoardCoords,
    setBoardCoords,
    setTempBoardCoords,
    setPlayer1points,
    setPlayer2points,
    setPool,
    setCurrentPlayer,
    setConsecutivePasses,
    setPlayer1Rack,
    setPlayer2Rack,
    setIsBotMode,
    setPlayer1Name,
    setPlayer2Name,
    setSimulatingMove,
    setSimulationResult,
    setSimulationProgress,
    setPreviewBoard,
    setPreviewMove,
    setMoveWithResults,
    setTopMoves,
    setMoveHistory,
    setGameStarted
  } = useGameStore.getState();

  // Play game start sound
  console.log('🎮 startBotGame called, gameStartSound:', gameStartSound);
  if (gameStartSound && gameStartSound.play) {
    console.log('🔊 Playing game start sound');
    gameStartSound.play();
  } else {
    console.log('❌ Game start sound not available');
  }

  // Clear move history first
  setMoveHistory([]);

  // Reset game state
  let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
  setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setPlayer1points(0);
  setPlayer2points(0);
  setPool(origPool);
  
  // Set current player based on who goes first
  const botGoesFirst = Math.random() < 0.5;
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
  
  setPlayer1Rack(rack1);
  setPlayer2Rack(rack2);
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
  
  // Set gameStarted to true
  setGameStarted(true);
}; 