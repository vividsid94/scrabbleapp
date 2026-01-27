/**
 * Multiplayer Game Netlify Function
 * Handles all multiplayer game operations: create, join, move, pass, exchange
 */

const { createClient } = require('@supabase/supabase-js');
const gameLogic = require('./gameLogic');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we have the required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not fully configured');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder-key');

// Standard Scrabble tile pool
const STANDARD_POOL = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ??";

// Letter scores for final scoring
const letterScores = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
  'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
  'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10, '?': 0
};

/**
 * Draw tiles from the pool
 * @param {string[]} pool - Current pool
 * @param {number} count - Number of tiles to draw
 * @returns {{tiles: string[], newPool: string[]}}
 */
function drawTiles(pool, count) {
  const newPool = [...pool];
  const tiles = [];

  for (let i = 0; i < count && newPool.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * newPool.length);
    tiles.push(newPool[randomIndex]);
    newPool.splice(randomIndex, 1);
  }

  return { tiles, newPool };
}

/**
 * Calculate rack value for end-game penalty
 * @param {string[]} rack
 * @returns {number}
 */
function calculateRackValue(rack) {
  return rack.reduce((sum, tile) => sum + (letterScores[tile] || 0), 0);
}

/**
 * Create a new game
 */
async function handleCreate(playerId, playerName) {
  // Initialize pool as array
  const poolArray = STANDARD_POOL.split('');

  // Draw 7 tiles for player 1
  const { tiles: player1Rack, newPool } = drawTiles(poolArray, 7);

  // Create empty 15x15 board
  const emptyBoard = Array(15).fill(null).map(() => Array(15).fill(0));

  // Insert game into database
  const { data, error } = await supabase
    .from('multiplayer_games')
    .insert({
      player1_id: playerId,
      player1_name: playerName,
      board_state: emptyBoard,
      player1_rack: player1Rack,
      player2_rack: [],
      pool: newPool,
      status: 'waiting',
      current_player: 1,
      move_history: []
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating game:', error);
    throw new Error('Failed to create game');
  }

  return {
    gameCode: data.game_code,
    gameId: data.id
  };
}

/**
 * Join an existing game
 */
async function handleJoin(gameCode, playerId, playerName) {
  // Get the game
  const { data: game, error: fetchError } = await supabase
    .from('multiplayer_games')
    .select('*')
    .eq('game_code', gameCode)
    .single();

  if (fetchError || !game) {
    throw new Error('Game not found');
  }

  // Check if player is already in the game
  if (game.player1_id === playerId) {
    // Player 1 rejoining
    return {
      game: formatGameResponse(game, playerId, 1),
      playerNumber: 1
    };
  }

  if (game.player2_id === playerId) {
    // Player 2 rejoining
    return {
      game: formatGameResponse(game, playerId, 2),
      playerNumber: 2
    };
  }

  // Check if game is joinable
  if (game.status !== 'waiting') {
    throw new Error('Game is not available to join');
  }

  if (game.player2_id) {
    throw new Error('Game is already full');
  }

  // Draw 7 tiles for player 2
  const { tiles: player2Rack, newPool } = drawTiles(game.pool, 7);

  // Update game with player 2
  const { data: updatedGame, error: updateError } = await supabase
    .from('multiplayer_games')
    .update({
      player2_id: playerId,
      player2_name: playerName,
      player2_rack: player2Rack,
      pool: newPool,
      status: 'active',
      started_at: new Date().toISOString()
    })
    .eq('id', game.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error joining game:', updateError);
    throw new Error('Failed to join game');
  }

  return {
    game: formatGameResponse(updatedGame, playerId, 2),
    playerNumber: 2
  };
}

/**
 * Get game state
 */
async function handleGet(gameCode, playerId) {
  const { data: game, error } = await supabase
    .from('multiplayer_games')
    .select('*')
    .eq('game_code', gameCode)
    .single();

  if (error || !game) {
    throw new Error('Game not found');
  }

  // Determine player number
  let playerNumber = null;
  if (game.player1_id === playerId) {
    playerNumber = 1;
  } else if (game.player2_id === playerId) {
    playerNumber = 2;
  }

  return {
    game: formatGameResponse(game, playerId, playerNumber),
    playerNumber
  };
}

/**
 * Handle a move (play tiles)
 */
async function handleMove(gameCode, playerId, moveData) {
  // Get the game
  const { data: game, error: fetchError } = await supabase
    .from('multiplayer_games')
    .select('*')
    .eq('game_code', gameCode)
    .single();

  if (fetchError || !game) {
    throw new Error('Game not found');
  }

  if (game.status !== 'active') {
    throw new Error('Game is not active');
  }

  // Determine which player this is
  let playerNumber;
  if (game.player1_id === playerId) {
    playerNumber = 1;
  } else if (game.player2_id === playerId) {
    playerNumber = 2;
  } else {
    throw new Error('You are not a player in this game');
  }

  // Check if it's this player's turn
  if (game.current_player !== playerNumber) {
    throw new Error("It's not your turn");
  }

  // Get player's rack
  const playerRack = playerNumber === 1 ? game.player1_rack : game.player2_rack;
  const beforeBoard = game.board_state;

  console.log('📋 Before board state:', {
    type: typeof beforeBoard,
    isArray: Array.isArray(beforeBoard),
    length: beforeBoard?.length,
    hasTiles: beforeBoard?.some(row => row?.some(cell => typeof cell === 'string'))
  });

  // Apply move to board
  const afterBoard = JSON.parse(JSON.stringify(beforeBoard));
  const placedTiles = moveData.tiles || [];

  console.log('🎯 Placing tiles:', placedTiles.map(t => `${t.letter} at (${t.row},${t.col})`));

  // Validate player has the tiles
  const rackCopy = [...playerRack];
  for (const tile of placedTiles) {
    // For blanks, look for '?' in rack
    const tileToFind = tile.isBlank ? '?' : tile.letter;
    const idx = rackCopy.indexOf(tileToFind);
    if (idx === -1) {
      throw new Error(`You don't have tile: ${tile.letter}`);
    }
    rackCopy.splice(idx, 1);
    // Place the letter on board (not the blank symbol)
    afterBoard[tile.row][tile.col] = tile.letter;
  }

  // Verify tiles were actually placed
  const placedCells = placedTiles.map(t => ({ 
    row: t.row, 
    col: t.col, 
    expected: t.letter,
    actual: afterBoard[t.row][t.col],
    match: afterBoard[t.row][t.col] === t.letter
  }));
  
  const afterHasTiles = afterBoard?.some(row => row?.some(cell => typeof cell === 'string'));
  const afterStringCells = afterBoard?.flat().filter(cell => typeof cell === 'string') || [];
  
  console.log('📋 After board state:', {
    type: typeof afterBoard,
    isArray: Array.isArray(afterBoard),
    length: afterBoard?.length,
    hasTiles: afterHasTiles,
    stringCellsCount: afterStringCells.length,
    stringCells: afterStringCells.slice(0, 10),
    placedCells,
    allPlacedCorrectly: placedCells.every(c => c.match)
  });
  
  // If tiles weren't placed correctly, this is a critical error
  if (!placedCells.every(c => c.match)) {
    console.error('❌ CRITICAL: Tiles were not placed correctly on the board!');
    console.error('Placed tiles:', placedTiles);
    console.error('Board after placement:', JSON.stringify(afterBoard).substring(0, 500));
  }

  // Validate the move using gameLogic
  const validation = await gameLogic.isValidScrabblePlacement(beforeBoard, afterBoard);
  if (!validation.isValid) {
    throw new Error(validation.reason || 'Invalid move');
  }

  // Calculate score
  const score = await gameLogic.scorePlay(beforeBoard, afterBoard);

  // Update player's score
  const newScore = playerNumber === 1
    ? game.player1_points + score
    : game.player2_points + score;

  // Update player's rack (remove used tiles, draw new ones)
  const { tiles: newTiles, newPool } = drawTiles(game.pool, placedTiles.length);
  const newRack = [...rackCopy, ...newTiles];

  // Add to move history
  const moveHistoryEntry = {
    player: playerNumber,
    playerName: playerNumber === 1 ? game.player1_name : game.player2_name,
    type: 'play',
    tiles: placedTiles,
    words: validation.words,
    score,
    timestamp: new Date().toISOString()
  };
  const newMoveHistory = [...game.move_history, moveHistoryEntry];

  // Check for game end
  let gameStatus = 'active';
  let winner = null;
  let finalP1Score = playerNumber === 1 ? newScore : game.player1_points;
  let finalP2Score = playerNumber === 2 ? newScore : game.player2_points;

  if (newRack.length === 0 && newPool.length === 0) {
    // Player went out - add opponent's rack value to winner, subtract from loser
    const opponentRack = playerNumber === 1 ? game.player2_rack : game.player1_rack;
    const rackValue = calculateRackValue(opponentRack);

    if (playerNumber === 1) {
      finalP1Score += rackValue;
      finalP2Score -= rackValue;
    } else {
      finalP2Score += rackValue;
      finalP1Score -= rackValue;
    }

    gameStatus = 'completed';
    winner = finalP1Score > finalP2Score ? 1 : (finalP2Score > finalP1Score ? 2 : null);
  }

  // Build update object - use afterBoard directly (it's already clean)
  // Don't clean it again as that might remove tiles
  console.log('🧹 Board state before update:', {
    length: afterBoard.length,
    hasTiles: afterBoard.some(row => row.some(cell => typeof cell === 'string')),
    sampleTiles: afterBoard.flat().filter(cell => typeof cell === 'string').slice(0, 5),
    placedTiles: placedTiles.map(t => ({ row: t.row, col: t.col, letter: afterBoard[t.row][t.col] }))
  });

  const updateData = {
    board_state: afterBoard, // Use afterBoard directly - it already has the tiles placed
    pool: newPool,
    current_player: playerNumber === 1 ? 2 : 1,
    consecutive_passes: 0,
    move_history: newMoveHistory,
    status: gameStatus
  };

  if (playerNumber === 1) {
    updateData.player1_rack = newRack;
    updateData.player1_points = finalP1Score;
    if (gameStatus === 'completed') {
      updateData.player2_points = finalP2Score;
    }
  } else {
    updateData.player2_rack = newRack;
    updateData.player2_points = finalP2Score;
    if (gameStatus === 'completed') {
      updateData.player1_points = finalP1Score;
    }
  }

  if (gameStatus === 'completed') {
    updateData.winner = winner;
    updateData.completed_at = new Date().toISOString();
  }

  // Update the game
  console.log('📝 Updating game with:', {
    boardStateLength: updateData.board_state?.length,
    boardStateType: typeof updateData.board_state,
    boardStateIsArray: Array.isArray(updateData.board_state),
    boardStateHasTiles: updateData.board_state?.some(row => row?.some(cell => typeof cell === 'string')),
    currentPlayer: updateData.current_player,
    player1RackLength: updateData.player1_rack?.length,
    player2RackLength: updateData.player2_rack?.length,
    poolLength: updateData.pool?.length
  });

  const { data: updatedGame, error: updateError } = await supabase
    .from('multiplayer_games')
    .update(updateData)
    .eq('id', game.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating game:', updateError);
    throw new Error('Failed to update game');
  }

  // Check what was actually stored
  const storedBoard = updatedGame.board_state;
  const storedHasTiles = storedBoard?.some(row => row?.some(cell => typeof cell === 'string'));
  const storedStringCells = storedBoard?.flat().filter(cell => typeof cell === 'string') || [];
  
  console.log('✅ Game updated successfully:', {
    boardStateLength: storedBoard?.length,
    boardStateType: typeof storedBoard,
    boardStateIsArray: Array.isArray(storedBoard),
    boardStateHasTiles: storedHasTiles,
    boardStateFirstRow: storedBoard?.[0]?.slice(0, 5),
    stringCellsCount: storedStringCells.length,
    stringCells: storedStringCells.slice(0, 10),
    retrievedBoardState: JSON.stringify(storedBoard).substring(0, 500),
    // Compare what we sent vs what we got
    sentHasTiles: afterBoard.some(row => row.some(cell => typeof cell === 'string')),
    retrievedHasTiles: storedHasTiles
  });
  
  // If board state was lost, log a warning
  if (afterBoard.some(row => row.some(cell => typeof cell === 'string')) && !storedHasTiles) {
    console.error('❌ CRITICAL: Board state was lost during database update!');
    console.error('Sent board (first 500 chars):', JSON.stringify(afterBoard).substring(0, 500));
    console.error('Retrieved board (first 500 chars):', JSON.stringify(storedBoard).substring(0, 500));
    console.error('Placed tiles:', placedTiles);
  }

  return {
    game: formatGameResponse(updatedGame, playerId, playerNumber),
    score,
    words: validation.words
  };
}

/**
 * Handle pass turn
 */
async function handlePass(gameCode, playerId) {
  const { data: game, error: fetchError } = await supabase
    .from('multiplayer_games')
    .select('*')
    .eq('game_code', gameCode)
    .single();

  if (fetchError || !game) {
    throw new Error('Game not found');
  }

  if (game.status !== 'active') {
    throw new Error('Game is not active');
  }

  // Determine player number
  let playerNumber;
  if (game.player1_id === playerId) {
    playerNumber = 1;
  } else if (game.player2_id === playerId) {
    playerNumber = 2;
  } else {
    throw new Error('You are not a player in this game');
  }

  if (game.current_player !== playerNumber) {
    throw new Error("It's not your turn");
  }

  const newConsecutivePasses = game.consecutive_passes + 1;

  // Add to move history
  const moveHistoryEntry = {
    player: playerNumber,
    playerName: playerNumber === 1 ? game.player1_name : game.player2_name,
    type: 'pass',
    timestamp: new Date().toISOString()
  };
  const newMoveHistory = [...game.move_history, moveHistoryEntry];

  // Check for game end (6 consecutive passes)
  let gameStatus = 'active';
  let winner = null;
  let finalP1Score = game.player1_points;
  let finalP2Score = game.player2_points;

  if (newConsecutivePasses >= 6) {
    // Game ends - subtract rack values from both players
    finalP1Score -= calculateRackValue(game.player1_rack);
    finalP2Score -= calculateRackValue(game.player2_rack);

    gameStatus = 'completed';
    winner = finalP1Score > finalP2Score ? 1 : (finalP2Score > finalP1Score ? 2 : null);
  }

  const updateData = {
    current_player: playerNumber === 1 ? 2 : 1,
    consecutive_passes: newConsecutivePasses,
    move_history: newMoveHistory,
    status: gameStatus,
    player1_points: finalP1Score,
    player2_points: finalP2Score
  };

  if (gameStatus === 'completed') {
    updateData.winner = winner;
    updateData.completed_at = new Date().toISOString();
  }

  const { data: updatedGame, error: updateError } = await supabase
    .from('multiplayer_games')
    .update(updateData)
    .eq('id', game.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating game:', updateError);
    throw new Error('Failed to pass turn');
  }

  return {
    game: formatGameResponse(updatedGame, playerId, playerNumber)
  };
}

/**
 * Handle tile exchange
 */
async function handleExchange(gameCode, playerId, tilesToExchange) {
  const { data: game, error: fetchError } = await supabase
    .from('multiplayer_games')
    .select('*')
    .eq('game_code', gameCode)
    .single();

  if (fetchError || !game) {
    throw new Error('Game not found');
  }

  if (game.status !== 'active') {
    throw new Error('Game is not active');
  }

  // Check pool has enough tiles
  if (game.pool.length < 7) {
    throw new Error('Not enough tiles in pool to exchange');
  }

  // Determine player number
  let playerNumber;
  if (game.player1_id === playerId) {
    playerNumber = 1;
  } else if (game.player2_id === playerId) {
    playerNumber = 2;
  } else {
    throw new Error('You are not a player in this game');
  }

  if (game.current_player !== playerNumber) {
    throw new Error("It's not your turn");
  }

  const playerRack = playerNumber === 1 ? game.player1_rack : game.player2_rack;

  // Validate player has all the tiles to exchange
  const rackCopy = [...playerRack];
  for (const tile of tilesToExchange) {
    const idx = rackCopy.indexOf(tile);
    if (idx === -1) {
      throw new Error(`You don't have tile: ${tile}`);
    }
    rackCopy.splice(idx, 1);
  }

  // Draw new tiles first
  const { tiles: newTiles, newPool: poolAfterDraw } = drawTiles(game.pool, tilesToExchange.length);

  // Put exchanged tiles back in pool
  const finalPool = [...poolAfterDraw, ...tilesToExchange];

  // Build new rack
  const newRack = [...rackCopy, ...newTiles];

  // Add to move history
  const moveHistoryEntry = {
    player: playerNumber,
    playerName: playerNumber === 1 ? game.player1_name : game.player2_name,
    type: 'exchange',
    tilesCount: tilesToExchange.length,
    timestamp: new Date().toISOString()
  };
  const newMoveHistory = [...game.move_history, moveHistoryEntry];

  const updateData = {
    pool: finalPool,
    current_player: playerNumber === 1 ? 2 : 1,
    consecutive_passes: 0,
    move_history: newMoveHistory
  };

  if (playerNumber === 1) {
    updateData.player1_rack = newRack;
  } else {
    updateData.player2_rack = newRack;
  }

  const { data: updatedGame, error: updateError } = await supabase
    .from('multiplayer_games')
    .update(updateData)
    .eq('id', game.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating game:', updateError);
    throw new Error('Failed to exchange tiles');
  }

  return {
    game: formatGameResponse(updatedGame, playerId, playerNumber)
  };
}

/**
 * Handle resignation
 */
async function handleResign(gameCode, playerId) {
  const { data: game, error: fetchError } = await supabase
    .from('multiplayer_games')
    .select('*')
    .eq('game_code', gameCode)
    .single();

  if (fetchError || !game) {
    throw new Error('Game not found');
  }

  if (game.status !== 'active' && game.status !== 'waiting') {
    throw new Error('Game is already completed');
  }

  // Determine player number
  let playerNumber;
  if (game.player1_id === playerId) {
    playerNumber = 1;
  } else if (game.player2_id === playerId) {
    playerNumber = 2;
  } else {
    throw new Error('You are not a player in this game');
  }

  // Winner is the other player
  const winner = playerNumber === 1 ? 2 : 1;

  const { error: updateError } = await supabase
    .from('multiplayer_games')
    .update({
      status: 'completed',
      winner: winner,
      completed_at: new Date().toISOString()
    })
    .eq('id', game.id);

  if (updateError) {
    console.error('Error updating game:', updateError);
    throw new Error('Failed to resign');
  }

  return { success: true };
}

/**
 * Format game response to hide opponent's rack
 */
function formatGameResponse(game, playerId, playerNumber) {
  // Determine opponent's rack count
  const opponentRackCount = playerNumber === 1
    ? (game.player2_rack || []).length
    : (game.player1_rack || []).length;

  return {
    id: game.id,
    gameCode: game.game_code,
    status: game.status,
    boardState: game.board_state,
    player1Name: game.player1_name,
    player2Name: game.player2_name,
    player1Points: game.player1_points,
    player2Points: game.player2_points,
    currentPlayer: game.current_player,
    consecutivePasses: game.consecutive_passes,
    moveHistory: game.move_history,
    winner: game.winner,
    // Only show your own rack
    myRack: playerNumber === 1 ? game.player1_rack : game.player2_rack,
    opponentRackCount,
    poolCount: (game.pool || []).length,
    createdAt: game.created_at,
    startedAt: game.started_at,
    completedAt: game.completed_at,
    // Include player IDs for reference
    player1Id: game.player1_id,
    player2Id: game.player2_id,
    hasPlayer2: !!game.player2_id
  };
}

/**
 * Main handler
 */
exports.handler = async function (event) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { action, gameCode, playerId, playerName, moveData, tiles } = JSON.parse(event.body);

    console.log('📨 Received request:', { action, gameCode, playerId, hasMoveData: !!moveData });

    let result;

    switch (action) {
      case 'create':
        result = await handleCreate(playerId, playerName);
        break;

      case 'join':
        result = await handleJoin(gameCode, playerId, playerName);
        break;

      case 'get':
        result = await handleGet(gameCode, playerId);
        break;

      case 'move':
        console.log('🎯 Handling move action:', { gameCode, playerId, tilesCount: moveData?.tiles?.length });
        result = await handleMove(gameCode, playerId, moveData);
        console.log('✅ Move handled, returning result');
        break;

      case 'pass':
        result = await handlePass(gameCode, playerId);
        break;

      case 'exchange':
        result = await handleExchange(gameCode, playerId, tiles);
        break;

      case 'resign':
        result = await handleResign(gameCode, playerId);
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

    // Log the response being sent back
    if (action === 'move' && result.game) {
      const responseBoard = result.game.boardState || result.game.board_state;
      const responseHasTiles = responseBoard?.some(row => row?.some(cell => typeof cell === 'string'));
      console.log('📤 Sending response:', {
        hasGame: !!result.game,
        boardStateHasTiles: responseHasTiles,
        boardStateLength: responseBoard?.length,
        currentPlayer: result.game.currentPlayer
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Error in multiplayerGame function:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
