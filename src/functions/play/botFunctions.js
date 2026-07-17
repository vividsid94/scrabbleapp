import { alphabetizeRack, removeTilesByCount } from './rackFunctions';
import { useGameStore } from '../../stores/gameStore';
import { handleGameEnd } from './gameEndFunctions';

// If you don't see this in the console on page load, you're on a STALE bundle — hard refresh.
console.warn('[botFunctions] LOADED Tope picker v5 — if missing, hard-refresh (Ctrl+Shift+R)');

const isTopeBot = (bot, player2Name) =>
  (bot?.name || '').trim() === 'Tope' || (player2Name || '').trim() === 'Tope';

async function pickTopeMove({
  boardCoords,
  player2Rack,
  player2points,
  player1points,
  pool,
  sortedMoves,
  setTopeThinking,
}) {
  console.warn('=== TOPE v5: pickTopeMove CALLED ===');
  const candidateMoves = sortedMoves.slice(0, 15);
  console.warn('=== TOPE v5: candidates ===', candidateMoves.map((m, i) => `${i + 1}. ${m.word} @ ${m.startPosition} (${m.score} pts)`));

  if (typeof setTopeThinking === 'function') {
    setTopeThinking({
      prompt: '(building prompt...)',
      response: 'Tope is reasoning...',
      status: 'loading',
    });
  } else {
    console.error('=== TOPE v5: setTopeThinking is missing from store ===', setTopeThinking);
  }

  try {
    const topeResponse = await fetch('/.netlify/functions/topeBot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board: boardCoords,
        rack: player2Rack,
        ownScore: player2points,
        opponentScore: player1points,
        poolRemaining: pool.length,
        candidateMoves: candidateMoves.map(m => ({
          word: m.word,
          startPosition: m.startPosition,
          score: m.score,
          leave: m.leave,
          totalValue: m.totalValue,
          isExchange: m.isExchange,
        })),
      }),
    });
    const topeData = await topeResponse.json();
    if (!topeResponse.ok || topeData.error) {
      throw new Error(topeData.error || `Tope request failed (${topeResponse.status})`);
    }

    // Always readable from console: window.__TOPE_PROMPT / window.__TOPE_RESPONSE
    if (typeof window !== 'undefined') {
      window.__TOPE_PROMPT = topeData.prompt;
      window.__TOPE_RESPONSE = topeData.rawResponse;
      window.__TOPE_CHOSEN = candidateMoves[topeData.chosenIndex] || candidateMoves[0];
      window.__TOPE_LAST = {
        prompt: topeData.prompt,
        response: topeData.rawResponse,
        chosenIndex: topeData.chosenIndex,
        chosen: window.__TOPE_CHOSEN,
        at: new Date().toISOString(),
      };
    }

    console.warn('=== TOPE v5: LLM PROMPT (also window.__TOPE_PROMPT) ===');
    console.warn(topeData.prompt);
    console.warn('=== TOPE v5: LLM RESPONSE (also window.__TOPE_RESPONSE) ===');
    console.warn(topeData.rawResponse);
    console.warn('=== TOPE v5: chose move ===', candidateMoves[topeData.chosenIndex]?.word, 'index', topeData.chosenIndex);

    if (typeof setTopeThinking === 'function') {
      setTopeThinking({
        prompt: topeData.prompt,
        response: topeData.rawResponse,
        status: 'done',
      });
    }
    return candidateMoves[topeData.chosenIndex] || candidateMoves[0];
  } catch (topeError) {
    console.error('=== TOPE v5: FAILED ===', topeError);
    if (typeof window !== 'undefined') {
      window.__TOPE_LAST = { error: String(topeError), at: new Date().toISOString() };
    }
    if (typeof setTopeThinking === 'function') {
      setTopeThinking({
        prompt: null,
        response: `Tope failed: ${topeError.message}`,
        status: 'error',
      });
    }
    return sortedMoves[0];
  }
}

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
    setMoveWithResults,
    setTopeThinking
  } = useGameStore.getState();

  if (!isBotMode || currentPlayer !== 2) {
    return;
  }

  // Only show thinking state if auto-play is not enabled
  if (!autoPlayBest) {
    setIsBotThinking(true);
    // Add 5 second delay at the START for thinking animation
    console.log('🤖 Bot thinking for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('🤖 Bot done thinking, now calculating move...');
  }

  // Create a deep copy of the board and rack (moved outside try block for retry access)
  const boardCopy = JSON.parse(JSON.stringify(boardCoords));
  const rackCopy = [...player2Rack];
  
  // Convert any '?' in the rack to '*' for the API
  const apiRack = rackCopy.map(tile => tile === '?' ? '*' : tile);

  // Get premiumSquares from store if available
  const { premiumSquares } = useGameStore.getState();
  
  // Helper function to attempt bot move with retry logic
  const attemptBotMove = async (isRetry = false) => {
    if (isRetry) {
      console.log('🔄 Retrying Railway service query...');
      setSnackbarMessage('Bot fallback: Retrying move');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 29000); // 29 second timeout
    
    try {
      const requestBody = {
        board: boardCopy,
        letters: apiRack,
        pool: pool
      };
      
      // Add premiumSquares if available
      if (premiumSquares && premiumSquares.length > 0) {
        requestBody.premiumSquares = premiumSquares;
      }
      
      const response = await fetch('/.netlify/functions/botLogic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
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

      const data = await response.json();
      
      // Filter out moves with empty words
      if (data.moves) {
        data.moves = data.moves.filter(move => move.word && move.word.trim() !== '');
      }

      if (!data.moves || data.moves.length === 0) {
        throw new Error('No valid moves found');
      }

      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Bot calculation timed out. Please try again.');
      }
      throw fetchError;
    }
  };

  try {
    console.log('🤖 Bot Move Request:', {
      rack: apiRack.join('')
    });

    // First attempt
    let data = await attemptBotMove(false);

    // Delay already added at the start of the function

    console.log('Bot moves response:', {
      moves: data.moves,
      poolSize: pool.length,
      exchangesConsidered: pool.length >= 7
    });
    
    if (!data.moves || data.moves.length === 0) {
      setSnackbarMessage('Bot could not find a valid move');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      // Switch to next player (handles 2 turns mode)
      const { switchToNextPlayer } = useGameStore.getState();
      switchToNextPlayer();
      return;
    }

    // Sort moves by totalValue (points + leave) from the backend
    const sortedMoves = data.moves.sort((a, b) => b.totalValue - a.totalValue);
    let botToUse = useGameStore.getState().selectedBot;
    const playingTope = isTopeBot(botToUse, player2Name);
    console.warn('=== BOT PICK v5 ===', {
      botName: botToUse?.name,
      player2Name,
      playingTope,
      customRank: botToUse?.customRank,
      hasSetTopeThinking: typeof setTopeThinking === 'function',
    });
    let botMove;

    // Tope FIRST — nothing else can intercept
    if (playingTope) {
      console.warn('=== BOT PICK v5: entering Tope path NOW ===');
      botMove = await pickTopeMove({
        boardCoords,
        player2Rack,
        player2points,
        player1points,
        pool,
        sortedMoves,
        setTopeThinking: setTopeThinking || useGameStore.getState().setTopeThinking,
      });
    } else if (botToUse && botToUse.name === 'Defense Bot') {
      // Custom Defense Bot uses opponent simulation with adjustable defense weighting
      console.log('🤖 Custom Defense Bot - STARTING CUSTOM DEFENSE BOT LOGIC');
      console.log('🤖 Custom Defense Bot - Bot config:', botToUse);
      
      const { runCustomDefenseSims } = useGameStore.getState();
      
      console.log('🤖 Custom Defense Bot - Running opponent simulations...');
      console.log(`🤖 Custom Defense Bot - Defense weight: ${botToUse.defenseWeight}x`);
      
      // Wait for simulations to complete and get results
      const simulationResults = await runCustomDefenseSims(sortedMoves, boardCoords, pool, botToUse.defenseWeight);
      console.log('🤖 Custom Defense Bot - Simulation results received:', simulationResults);
      
      // Only evaluate moves that were actually analyzed (top 15)
      const movesToEvaluate = sortedMoves.slice(0, 15);
      const evaluatedMoves = movesToEvaluate.map(move => {
        const simResult = simulationResults[move.word];
        console.log(`🤖 Custom Defense Bot - Checking move ${move.word}:`, simResult);
        
        if (simResult && simResult.data && !simResult.error) {
          // Calculate: points + leave - (defenseWeight * opponent average score)
          const opponentAvgScore = simResult.data.averageScore || 0;
          const adjustedValue = move.totalValue - (botToUse.defenseWeight * opponentAvgScore);
          
          console.log(`🤖 Custom Defense Bot - Move ${move.word}: ${move.totalValue} - ${opponentAvgScore} = ${adjustedValue}`);
          
          return {
            ...move,
            adjustedValue: adjustedValue,
            opponentAvgScore: opponentAvgScore
          };
        } else {
          // Fallback to original value if no simulation data
          console.log(`🤖 Custom Defense Bot - No simulation data for ${move.word}, using original value`);
          return {
            ...move,
            adjustedValue: move.totalValue,
            opponentAvgScore: 0
          };
        }
      });
      
      // Sort by adjusted value
      evaluatedMoves.sort((a, b) => b.adjustedValue - a.adjustedValue);
      
      // Log top 5 evaluated moves with ranking
      console.log('🤖 Custom Defense Bot - Top 5 moves ranked by points + leave - defense:');
      evaluatedMoves.slice(0, 5).forEach((move, index) => {
        console.log(`  #${index + 1}: ${move.word} - ${move.totalValue} - ${move.opponentAvgScore} = ${move.adjustedValue} (${move.score} pts, ${move.leave} leave)`);
      });
      
      // Log the selected move with full details
      const selectedMove = evaluatedMoves[0];
      
      // Find where this move ranks in the original points + leave list
      const originalRank = sortedMoves.findIndex(move => move.word === selectedMove.word) + 1;
      
      console.log('🤖 Custom Defense Bot - Selected move:', {
        word: selectedMove.word,
        originalValue: selectedMove.totalValue,
        opponentAvgScore: selectedMove.opponentAvgScore,
        defenseWeight: botToUse.defenseWeight,
        adjustedValue: selectedMove.adjustedValue,
        score: selectedMove.score,
        leave: selectedMove.leave,
        originalRank: originalRank
      });
      
      console.log(`🤖 Custom Defense Bot - Move "${selectedMove.word}" was #${originalRank} by points+leave, but #1 by defense-adjusted value`);
      
      botMove = selectedMove; // Best adjusted move
    } else if (botToUse && botToUse.customRank && sortedMoves.length >= botToUse.customRank) {
      console.warn('=== BOT PICK: custom rank ===', botToUse.customRank);
      botMove = sortedMoves[botToUse.customRank - 1]; // Custom rank (1-based)
    } else if (botToUse && botToUse.name === 'Tess') {
      // Tess uses opponent simulation to evaluate moves
      const { runTessOpponentSims, tessOpponentSims, tessIsRunningSims, setTessOpponentSims } = useGameStore.getState();
      
      console.log('🤖 Tess - Running opponent simulations...');
      setTessOpponentSims({}); // Clear old results
      
      // Wait for simulations to complete and get results
      const simulationResults = await runTessOpponentSims(sortedMoves, boardCoords, pool);
      console.log('🤖 Tess - Simulation results received:', simulationResults);
      
      // Only evaluate moves that were actually analyzed (top 15)
      const movesToEvaluate = sortedMoves.slice(0, 15);
      const evaluatedMoves = movesToEvaluate.map(move => {
        const simResult = simulationResults[move.word];
        console.log(`🤖 Tess - Checking move ${move.word}:`, simResult);
        
        if (simResult && simResult.data && !simResult.error) {
          // Calculate: points + leave - (2x opponent average score)
          const opponentAvgScore = simResult.data.averageScore || 0;
          console.log(`🤖 Tess - Move ${move.word} opponentAvgScore:`, opponentAvgScore);
          const adjustedValue = move.totalValue - (2 * opponentAvgScore);
          
          console.log(`🤖 Tess - Move ${move.word}: ${move.totalValue} - (2 × ${opponentAvgScore}) = ${adjustedValue}`);
          
          return {
            ...move,
            adjustedValue: adjustedValue,
            opponentAvgScore: opponentAvgScore
          };
        } else {
          // Fallback to original value if no simulation data
          console.log(`🤖 Tess - No simulation data for ${move.word}, using original value`);
          return {
            ...move,
            adjustedValue: move.totalValue,
            opponentAvgScore: 0
          };
        }
      });
      
      // Sort by adjusted value
      evaluatedMoves.sort((a, b) => b.adjustedValue - a.adjustedValue);
      
      // Log the selected move with full details
      const selectedMove = evaluatedMoves[0];
      
      // Find where this move ranks in the original points + leave list
      const originalRank = sortedMoves.findIndex(move => move.word === selectedMove.word) + 1;
      
      console.log('🤖 Tess - Selected move:', {
        word: selectedMove.word,
        originalValue: selectedMove.totalValue,
        opponentAvgScore: selectedMove.opponentAvgScore,
        adjustedValue: selectedMove.adjustedValue,
        score: selectedMove.score,
        leave: selectedMove.leave,
        originalRank: originalRank
      });
      
      console.log(`🤖 Tess - Move "${selectedMove.word}" was #${originalRank} by points+leave, but #1 by defense-adjusted value`);
      
      botMove = selectedMove; // Best adjusted move
    } else if (botToUse && botToUse.name === 'Novice' && sortedMoves.length >= 30) {
      botMove = sortedMoves[29]; // 30th best move
    } else if (botToUse && botToUse.name === 'Beginner' && sortedMoves.length >= 15) {
      botMove = sortedMoves[14]; // 15th best move
    } else if (botToUse && botToUse.name === 'Intermediate' && sortedMoves.length >= 5) {
      botMove = sortedMoves[4]; // 5th best move
    } else {
      console.warn('=== BOT PICK: default top move ===', botToUse?.name);
      botMove = sortedMoves[0]; // Best move
    }
    const bestMove = botMove;

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
      
      // Create move history entry for exchange
      const moveHistoryEntry = {
        boardDiff: [],
        player: player2Name,
        score: 0,
        rack: alphabetizeRack(newRack).join(''),
        total: player2points,
        word: 'Exchange'
      };
      
      // Add move to history
      const currentHistory = useGameStore.getState().moveHistory || [];
      setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);
      
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
      await handleGameEnd({
        winnerRack: newRack,
        winnerName: player2Name,
        loserRack: player1Rack || [],
        loserPoints: player1points,
        player1Rack: player1Rack,
        player2Rack: player2Rack,
        player1points: player1points,
        // Use the freshly computed total — player2points here is still the
        // pre-move value (state hasn't flushed yet)
        player2points: botRunningTotal,
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
    
    // Switch to next player (handles 2 turns mode)
    const { switchToNextPlayer } = useGameStore.getState();
    switchToNextPlayer();
    setSelectedBoardPosition(null);
    setSelectedTiles([]);
    setArrowDirection('right');
    
  } catch (error) {
    console.error('Error making bot move:', error);
    
    // Try fallback strategies
    try {
      console.log('🔄 Attempting fallback bot move...');
      
      // First, try to query the Railway service again
      try {
        const retryData = await attemptBotMove(true);
        
        console.log('✅ Railway service retry successful!');
        
        // Sort moves by totalValue (points + leave) from the backend
        const sortedMoves = retryData.moves.sort((a, b) => b.totalValue - a.totalValue);
        let botToUse = useGameStore.getState().selectedBot;
        let botMove;
        if (botToUse && botToUse.customRank && sortedMoves.length >= botToUse.customRank) {
          botMove = sortedMoves[botToUse.customRank - 1]; // Custom rank (1-based)
        } else if (botToUse && botToUse.name === 'Tess' && sortedMoves.length >= 2) {
          botMove = sortedMoves[1]; // 2nd best move
        } else if (botToUse && botToUse.name === 'Novice' && sortedMoves.length >= 30) {
          botMove = sortedMoves[29]; // 30th best move
        } else if (botToUse && botToUse.name === 'Beginner' && sortedMoves.length >= 15) {
          botMove = sortedMoves[14]; // 15th best move
        } else if (botToUse && botToUse.name === 'Intermediate' && sortedMoves.length >= 5) {
          botMove = sortedMoves[4]; // 5th best move
        } else {
          botMove = sortedMoves[0]; // Best move
        }
        const bestMove = botMove;
        
        // Play bot move sound
        if (botMoveSound && botMoveSound.play) {
          botMoveSound.play();
        }
        
        // Execute the move (same logic as above)
        const botRack = player2Rack;
        const newBoard = JSON.parse(JSON.stringify(boardCoords));
        let newRack = [...player2Rack];
        const newBlankTiles = [...blankTiles];
        let newPool = [...pool];
        let botRunningTotal = player2points;
        
        if (bestMove.isExchange) {
          // Handle exchange move
          const tilesToExchange = bestMove.tilesToExchange || bestMove.tiles.map(t => t.letter);
          const newTiles = bestMove.newTiles || [];
          
          newRack = removeTilesByCount(newRack, tilesToExchange);
          newRack.push(...newTiles);
          
          for (const tile of newTiles) {
            const poolIndex = newPool.indexOf(tile);
            if (poolIndex !== -1) {
              newPool.splice(poolIndex, 1);
            }
          }
          
          newPool.push(...tilesToExchange);
          setPlayer2Rack(alphabetizeRack(newRack));
          setPool(newPool);
          
          // Create move history entry for exchange
          const moveHistoryEntry = {
            boardDiff: [],
            player: player2Name,
            score: 0,
            rack: alphabetizeRack(newRack).join(''),
            total: player2points,
            word: 'Exchange'
          };
          
          // Add move to history
          const currentHistory = useGameStore.getState().moveHistory || [];
          setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);
        } else {
          // Handle regular move
          const tilesToRemove = [];
          
          for (const tile of bestMove.tiles) {
            if (tile.isNew) {
              newBoard[tile.row][tile.col] = tile.letter;
              
              if (tile.isBlank) {
                newBlankTiles.push({ row: tile.row, col: tile.col });
                tilesToRemove.push('?');
              } else {
                tilesToRemove.push(tile.letter);
              }
            }
          }
          
          if (tilesToRemove.length > 0) {
            newRack = removeTilesByCount(newRack, tilesToRemove);
          }
          
          botRunningTotal = player2points + bestMove.score;
          
          const boardDiff = getBoardDiff(boardCoords, newBoard);
          const moveHistoryEntry = {
            boardDiff,
            player: player2Name,
            score: bestMove.score,
            rack: alphabetizeRack(botRack).join(''),
            total: botRunningTotal,
            word: bestMove.word
          };
          
          const currentHistory = useGameStore.getState().moveHistory || [];
          setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);
          
          setBoardCoords(newBoard);
          setTempBoardCoords(JSON.parse(JSON.stringify(newBoard)));
          setPlayer2Rack(alphabetizeRack(newRack));
          setBlankTiles(newBlankTiles);
          setPlayer2points(botRunningTotal);
        }
        
        // Check if game should end
        if (newRack.length === 0 && newPool.length === 0) {
          console.log('🎯 GAME END: Bot played all tiles and pool is empty!');
          await handleGameEnd({
            winnerRack: newRack,
            winnerName: player2Name,
            loserRack: player1Rack || [],
            loserPoints: player1points,
            player1Rack: player1Rack,
            player2Rack: player2Rack,
            player1points: player1points,
            // Use the freshly computed total — player2points here is still the
            // pre-move value (state hasn't flushed yet)
            player2points: botRunningTotal,
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
        
        // Draw new tiles for bot
        while (newRack.length < 7 && newPool.length > 0) {
          const randomIndex = Math.floor(Math.random() * newPool.length);
          newRack.push(newPool[randomIndex]);
          newPool.splice(randomIndex, 1);
        }
        setPlayer2Rack(alphabetizeRack(newRack));
        setPool(newPool);
        
        setConsecutivePasses(0);
        // Switch to next player (handles 2 turns mode)
        const { switchToNextPlayer: switchToNextPlayerRetry } = useGameStore.getState();
        switchToNextPlayerRetry();
        setSelectedBoardPosition(null);
        setSelectedTiles([]);
        setArrowDirection('right');
        
        console.log('✅ Bot move completed successfully after retry');
        
        // Show success message for retry (with delay so retry message is visible)
        setTimeout(() => {
          setSnackbarMessage('Bot move completed (recovered from initial error)');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }, 1500); // 1.5 second delay
        
        return;
        
      } catch (retryError) {
        console.log('⚠️ Railway service retry failed:', retryError.message);
      }
      
      // If Railway service retry failed, fall back to simple pass/exchange
      console.log('🔄 Falling back to simple pass/exchange strategy...');
      
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
      
      // Show user-friendly message (with delay so retry message is visible)
      setTimeout(() => {
        setSnackbarMessage('Bot used simple fallback strategy (pass/exchange)');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }, 1500); // 1.5 second delay
      
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      setSnackbarMessage('Bot error: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      // Switch to next player (handles 2 turns mode)
      const { switchToNextPlayer: switchToNextPlayerError } = useGameStore.getState();
      switchToNextPlayerError();
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
    setSimulatingMove,
    setSimulationResult,
    setSimulationProgress,
    setPreviewBoard,
    setPreviewMove,
    setMoveWithResults,
    setTopMoves,
    setMoveHistory,
    setGameStarted,
    setTopeThinking
  } = useGameStore.getState();

  // Play game start sound
  if (gameStartSound && gameStartSound.play) {
    gameStartSound.play();
  }

  // Clear move history first
  setMoveHistory([]);
  setTopeThinking(null);

  // Reset game state - check if premiumSquares are set
  const { premiumSquares } = useGameStore.getState();
  let parsedOrigBoardCoords;
  if (premiumSquares && premiumSquares.length > 0) {
    // Start with empty board (all zeros) when using randomized premium squares
    // The premiumSquares array will define where bonus squares are for rendering/scoring
    parsedOrigBoardCoords = Array(15).fill(null).map(() => Array(15).fill(0));
  } else {
    // Use standard board layout
    parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
  }
  setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
  setPlayer1points(0);
  setPlayer2points(0);
  
  // Use custom pool if variable pool is enabled
  const { variablePool, customPool } = useGameStore.getState();
  const poolToUse = (variablePool && customPool) ? (customPool.startsWith('ADVANCED:') ? customPool.substring(9) : customPool) : origPool;
  setPool(poolToUse);
  
  // Set current player based on who goes first
  const botGoesFirst = Math.random() < 0.5;
  setCurrentPlayer(botGoesFirst ? 2 : 1);
  setConsecutivePasses(0);
  
  // Reset turn count when starting new game
  const { setPlayerTurnCount } = useGameStore.getState();
  setPlayerTurnCount(1);
  
  // Initialize player racks
  const newPool = [...poolToUse];
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
  
  // Set bot mode. Player 2's name is left alone here - whoever called this
  // (bot selection, "New Game", etc.) already set it to the actual selected
  // bot's name, and hardcoding it to 'Theo' here would clobber that.
  setIsBotMode(true);
  setPlayer1Name('You');

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