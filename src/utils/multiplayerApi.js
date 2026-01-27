/**
 * Multiplayer API Functions
 * Handles all multiplayer game operations via Netlify functions
 */

import { supabase } from './supabase';

/**
 * Gets the current player ID (auth user or guest)
 * @returns {Promise<{id: string, isGuest: boolean, name: string}>}
 */
export const getPlayerId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Get user profile for name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        isGuest: false,
        name: profile?.username || user.email?.split('@')[0] || 'Player'
      };
    }
  } catch (error) {
    console.log('No authenticated user, using guest ID');
  }

  // Guest fallback
  let guestId = localStorage.getItem('guestPlayerId');
  let guestName = localStorage.getItem('guestPlayerName');

  if (!guestId) {
    guestId = `guest_${crypto.randomUUID()}`;
    localStorage.setItem('guestPlayerId', guestId);
  }

  return {
    id: guestId,
    isGuest: true,
    name: guestName || 'Guest'
  };
};

/**
 * Sets the guest player name
 * @param {string} name
 */
export const setGuestName = (name) => {
  localStorage.setItem('guestPlayerName', name);
};

/**
 * Creates a new multiplayer game
 * @param {string} playerName - Display name for the host
 * @returns {Promise<{success: boolean, gameCode?: string, error?: string}>}
 */
export const createGame = async (playerName) => {
  try {
    const player = await getPlayerId();

    const response = await fetch('/.netlify/functions/multiplayerGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        playerId: player.id,
        playerName: playerName || player.name
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create game' };
    }

    return { success: true, gameCode: data.gameCode, gameId: data.gameId };
  } catch (error) {
    console.error('Error creating game:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Joins an existing multiplayer game
 * @param {string} gameCode - The 6-character game code
 * @param {string} playerName - Display name for the joining player
 * @returns {Promise<{success: boolean, game?: object, error?: string}>}
 */
export const joinGame = async (gameCode, playerName) => {
  try {
    const player = await getPlayerId();

    const response = await fetch('/.netlify/functions/multiplayerGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        gameCode: gameCode.toUpperCase(),
        playerId: player.id,
        playerName: playerName || player.name
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to join game' };
    }

    return {
      success: true,
      game: data.game,
      playerNumber: data.playerNumber
    };
  } catch (error) {
    console.error('Error joining game:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gets the current state of a game
 * @param {string} gameCode - The game code
 * @returns {Promise<{success: boolean, game?: object, error?: string}>}
 */
export const getGame = async (gameCode) => {
  try {
    const player = await getPlayerId();

    const response = await fetch('/.netlify/functions/multiplayerGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get',
        gameCode: gameCode.toUpperCase(),
        playerId: player.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to get game' };
    }

    // Log what we're getting from the server
    const boardState = data.game?.boardState || data.game?.board_state;
    const hasTiles = boardState?.some(row => row?.some(cell => typeof cell === 'string'));
    
    // Only log if board has tiles or if it's the first fetch (to reduce spam)
    if (hasTiles || !localStorage.getItem('lastLoggedGetGame')) {
      console.log('📥 Get game response (from server):', {
        hasGame: !!data.game,
        boardStateLength: boardState?.length,
        boardStateHasTiles: hasTiles,
        currentPlayer: data.game?.currentPlayer,
        playerNumber: data.playerNumber,
        boardStatePreview: JSON.stringify(boardState).substring(0, 300),
        // Show first few rows to see structure
        firstRow: boardState?.[0],
        secondRow: boardState?.[1]
      });
      if (hasTiles) {
        localStorage.setItem('lastLoggedGetGame', 'true');
      }
    }

    return {
      success: true,
      game: data.game,
      playerNumber: data.playerNumber
    };
  } catch (error) {
    console.error('Error getting game:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Submits a move to the game
 * @param {string} gameCode - The game code
 * @param {object} moveData - The move data (type, tiles/tilesCount)
 * @returns {Promise<{success: boolean, game?: object, error?: string}>}
 */
export const submitMove = async (gameCode, moveData) => {
  console.log('📤 apiSubmitMove called:', { gameCode, moveData, action: 'move' });
  try {
    console.log('📤 Getting player ID...');
    const player = await getPlayerId();
    console.log('📤 Player ID obtained:', { playerId: player.id, isGuest: player.isGuest });

    const requestBody = {
      action: 'move',
      gameCode: gameCode.toUpperCase(),
      playerId: player.id,
      moveData
    };
    
    console.log('📤 Making fetch request to /.netlify/functions/multiplayerGame:', {
      action: 'move',
      gameCode: gameCode.toUpperCase(),
      playerId: player.id,
      moveDataKeys: Object.keys(moveData),
      tilesCount: moveData?.tiles?.length
    });
    
    const response = await fetch('/.netlify/functions/multiplayerGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📤 Fetch response received:', { status: response.status, ok: response.ok });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to submit move' };
    }

    // Log the response for debugging - this shows what the server returned
    const boardState = data.game?.boardState || data.game?.board_state;
    const hasTiles = boardState?.some(row => row?.some(cell => typeof cell === 'string'));
    const stringCells = boardState?.flat().filter(cell => typeof cell === 'string') || [];
    
    console.log('📥 Move submission response (from server):', {
      hasGame: !!data.game,
      boardStateLength: boardState?.length,
      boardStateType: typeof boardState,
      boardStateHasTiles: hasTiles,
      stringCellsCount: stringCells.length,
      stringCells: stringCells.slice(0, 10),
      myRackLength: data.game?.myRack?.length,
      currentPlayer: data.game?.currentPlayer,
      score: data.score,
      // Show first 500 chars of board state JSON to see what's actually there
      boardStatePreview: JSON.stringify(boardState).substring(0, 500)
    });
    
    // If board should have tiles but doesn't, log a warning
    if (!hasTiles && data.game) {
      console.warn('⚠️ Server returned empty board after move - this is the problem!');
      console.warn('Full response:', JSON.stringify(data, null, 2).substring(0, 1000));
    }

    return { success: true, game: data.game, score: data.score, words: data.words };
  } catch (error) {
    console.error('Error submitting move:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Passes the current turn
 * @param {string} gameCode - The game code
 * @returns {Promise<{success: boolean, game?: object, error?: string}>}
 */
export const passTurn = async (gameCode) => {
  try {
    const player = await getPlayerId();

    const response = await fetch('/.netlify/functions/multiplayerGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pass',
        gameCode: gameCode.toUpperCase(),
        playerId: player.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to pass turn' };
    }

    return { success: true, game: data.game };
  } catch (error) {
    console.error('Error passing turn:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exchanges tiles
 * @param {string} gameCode - The game code
 * @param {string[]} tiles - Array of tiles to exchange
 * @returns {Promise<{success: boolean, game?: object, error?: string}>}
 */
export const exchangeTiles = async (gameCode, tiles) => {
  try {
    const player = await getPlayerId();

    const response = await fetch('/.netlify/functions/multiplayerGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'exchange',
        gameCode: gameCode.toUpperCase(),
        playerId: player.id,
        tiles
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to exchange tiles' };
    }

    return { success: true, game: data.game };
  } catch (error) {
    console.error('Error exchanging tiles:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resigns from the game
 * @param {string} gameCode - The game code
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const resignGame = async (gameCode) => {
  try {
    const player = await getPlayerId();

    const response = await fetch('/.netlify/functions/multiplayerGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'resign',
        gameCode: gameCode.toUpperCase(),
        playerId: player.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to resign' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error resigning:', error);
    return { success: false, error: error.message };
  }
};
