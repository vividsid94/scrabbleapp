import { supabase } from './supabase';

/**
 * Update user stats after a game ends
 * @param {string} userId - User ID
 * @param {boolean} won - Whether the user won
 * @param {number} score - User's final score
 */
export const updateUserStats = async (userId, won, score) => {
  if (!userId) return { error: 'User ID required' };

  try {
    // Get current stats
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" - we'll create stats if they don't exist
      throw fetchError;
    }

    const stats = currentStats || {
      user_id: userId,
      games_played: 0,
      games_won: 0,
      games_lost: 0,
      total_points: 0,
      average_score: 0,
      best_score: 0,
    };

    // Calculate new stats
    const newGamesPlayed = stats.games_played + 1;
    const newGamesWon = won ? stats.games_won + 1 : stats.games_won;
    const newGamesLost = !won ? stats.games_lost + 1 : stats.games_lost;
    const newTotalPoints = stats.total_points + score;
    const newAverageScore = newTotalPoints / newGamesPlayed;
    const newBestScore = Math.max(stats.best_score || 0, score);

    // Update or insert stats
    // Use upsert with onConflict to handle the unique constraint on user_id
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        games_played: newGamesPlayed,
        games_won: newGamesWon,
        games_lost: newGamesLost,
        total_points: newTotalPoints,
        average_score: newAverageScore,
        best_score: newBestScore,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user stats:', error);
    return { data: null, error };
  }
};

/**
 * Get user stats
 * @param {string} userId - User ID
 */
export const getUserStats = async (userId) => {
  if (!userId) return { data: null, error: 'User ID required' };

  try {
    console.log('getUserStats: Querying user_stats for', userId);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Stats query timeout')), 3000)
    );
    
    const queryPromise = supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    console.log('getUserStats: Query result', { data, error });

    // If stats don't exist yet (new user), return default stats
    if (error && error.code === 'PGRST116') {
      console.log('getUserStats: Stats not found, returning defaults');
      return { 
        data: {
          user_id: userId,
          games_played: 0,
          games_won: 0,
          games_lost: 0,
          total_points: 0,
          average_score: 0,
          best_score: 0,
        }, 
        error: null 
      };
    }

    if (error) {
      console.error('getUserStats: Error', error);
      // If it's a timeout or network error, return defaults
      if (error.message === 'Stats query timeout' || error.message?.includes('timeout')) {
        return { 
          data: {
            user_id: userId,
            games_played: 0,
            games_won: 0,
            games_lost: 0,
            total_points: 0,
            average_score: 0,
            best_score: 0,
          }, 
          error: null 
        };
      }
      throw error;
    }
    
    console.log('getUserStats: Success, returning data', data);
    return { data, error: null };
  } catch (error) {
    console.error('getUserStats: Exception', error);
    // Return default stats on any error
    return { 
      data: {
        user_id: userId,
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        total_points: 0,
        average_score: 0,
        best_score: 0,
      }, 
      error: null 
    };
  }
};

