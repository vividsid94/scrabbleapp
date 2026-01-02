import { supabase } from './supabase';

/**
 * Save a completed game to the database
 * @param {Object} gameData - The game data to save
 * @param {string} gameData.userId - User ID
 * @param {string} gameData.gameType - Type of game ('bot', 'puzzle', etc.)
 * @param {string} gameData.opponentName - Name of opponent
 * @param {string} gameData.opponentType - Type of opponent ('bot', 'player')
 * @param {number} gameData.playerScore - Player's final score
 * @param {number} gameData.opponentScore - Opponent's final score
 * @param {boolean} gameData.won - Whether the player won
 * @param {number} gameData.gameDurationSeconds - Game duration in seconds
 * @param {Array} gameData.finalBoardState - Final board state (15x15 array)
 * @param {Array} gameData.moveHistory - Array of move history entries
 * @param {string} gameData.playerRackFinal - Final rack of player
 * @param {string} gameData.opponentRackFinal - Final rack of opponent
 */
export const saveGame = async (gameData) => {
  if (!gameData.userId) return { error: 'User ID required' };

  try {
    const { data, error } = await supabase
      .from('user_games')
      .insert({
        user_id: gameData.userId,
        game_type: gameData.gameType || 'bot',
        opponent_name: gameData.opponentName || 'Unknown',
        opponent_type: gameData.opponentType || 'bot',
        player_score: gameData.playerScore,
        opponent_score: gameData.opponentScore,
        won: gameData.won,
        game_duration_seconds: gameData.gameDurationSeconds || null,
        final_board_state: gameData.finalBoardState,
        move_history: gameData.moveHistory,
        player_rack_final: gameData.playerRackFinal || '',
        opponent_rack_final: gameData.opponentRackFinal || '',
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error saving game:', error);
    return { data: null, error };
  }
};

/**
 * Get user's game history
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of games to return (default: 50)
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const getUserGames = async (userId, limit = 50) => {
  if (!userId) return { data: null, error: 'User ID required' };

  try {
    const { data, error } = await supabase
      .from('user_games')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user games:', error);
    return { data: null, error };
  }
};

/**
 * Get a specific saved game by ID
 * @param {string} gameId - Game ID
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const getSavedGame = async (gameId) => {
  if (!gameId) return { data: null, error: 'Game ID required' };

  try {
    const { data, error } = await supabase
      .from('user_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching saved game:', error);
    return { data: null, error };
  }
};

