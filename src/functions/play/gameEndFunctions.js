import { useGameStore } from '../../stores/gameStore';

/**
 * Handles the end of a game when a player plays all their tiles
 * @param {Object} params - The parameters object
 * @param {Array} params.winnerRack - The rack of the winning player
 * @param {string} params.winnerName - The name of the winning player
 * @param {Array} params.loserRack - The rack of the losing player
 * @param {number} params.loserPoints - The points of the losing player
 * @param {Array} params.player1Rack - Player 1's rack
 * @param {Array} params.player2Rack - Player 2's rack
 * @param {number} params.player1points - Player 1's score
 * @param {number} params.player2points - Player 2's score
 * @param {string} params.player1Name - Player 1's name
 * @param {string} params.player2Name - Player 2's name
 * @param {boolean} params.autoPlayBest - Whether auto-play is enabled
 * @param {Function} params.setPlayer1points - Function to update player 1's score
 * @param {Function} params.setPlayer2points - Function to update player 2's score
 * @param {Function} params.setSnackbarMessage - Function to update snackbar message
 * @param {Function} params.setSnackbarSeverity - Function to update snackbar severity
 * @param {Function} params.setSnackbarOpen - Function to update snackbar visibility
 * @param {Function} params.setAutoPlayBest - Function to update auto-play state
 * @returns {void}
 */
export const handleGameEnd = async ({
  winnerRack,
  winnerName,
  loserRack,
  loserPoints,
  player1Rack,
  player2Rack,
  player1points,
  player2points,
  player1Name,
  player2Name,
  autoPlayBest,
  setPlayer1points,
  setPlayer2points,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  setAutoPlayBest
}) => {
  console.log('🏁 handleGameEnd called!', {
    winnerName,
    winnerRack,
    loserRack,
    loserPoints,
    player1points,
    player2points,
    autoPlayBest
  });

  // Get the Zustand store state and setters
  const {
    setGameEnded,
    setWinner,
    setFinalPlayer1Score,
    setFinalPlayer2Score,
    setShowConfetti,
    setShowVictoryOverlay,
    setTimerActive,
    boardCoords,
    moveHistory,
    gameTime,
    player1Time,
    player2Time
  } = useGameStore.getState();

  // Calculate sum of loser's remaining tiles
  const rackSum = (loserRack || []).reduce((sum, tile) => {
    const value = tile === '?' || tile === '*' ? 0 : 
      tile === 'A' || tile === 'E' || tile === 'I' || tile === 'O' || tile === 'U' || 
      tile === 'L' || tile === 'N' || tile === 'S' || tile === 'T' || tile === 'R' ? 1 :
      tile === 'D' || tile === 'G' ? 2 :
      tile === 'B' || tile === 'C' || tile === 'M' || tile === 'P' ? 3 :
      tile === 'F' || tile === 'H' || tile === 'V' || tile === 'W' || tile === 'Y' ? 4 :
      tile === 'K' ? 5 :
      tile === 'J' || tile === 'X' ? 8 :
      tile === 'Q' || tile === 'Z' ? 10 : 0;
    return sum + value;
  }, 0);
  
  // Standard Scrabble endgame scoring: the player who went out gains the
  // value of everyone else's stranded tiles, and the loser's score is
  // reduced by the value of their own stranded tiles.
  let finalPlayer1Score = player1points;
  let finalPlayer2Score = player2points;

  if (winnerName === player1Name) {
    finalPlayer1Score = player1points + rackSum;
    finalPlayer2Score = player2points - rackSum;
  } else {
    finalPlayer2Score = player2points + rackSum;
    finalPlayer1Score = player1points - rackSum;
  }
  setPlayer1points(finalPlayer1Score);
  setPlayer2points(finalPlayer2Score);
  
  // Set game as ended
  setGameEnded(true);
  
  // Stop the timer
  setTimerActive(false);
  
  // Determine winner based on winnerName
  const isPlayerWinner = winnerName === player1Name;
  const winner = isPlayerWinner ? 'player' : 'bot';
  setWinner(winner);
  
  // Set final scores
  setFinalPlayer1Score(finalPlayer1Score);
  setFinalPlayer2Score(finalPlayer2Score);
  
  // Update user stats if user is logged in (only track player 1 stats for now)
  // Only update if playing against a bot (isBotMode)
  const { isBotMode } = useGameStore.getState();
  console.log('📊 Stats update check:', { isBotMode, isPlayerWinner, finalPlayer1Score, finalPlayer2Score });
  
  if (isBotMode) {
    try {
      console.log('📊 Attempting to update stats and save game...');
      // Dynamically import to avoid circular dependencies
      const { updateUserStats } = await import('../../utils/stats');
      const { saveGame } = await import('../../utils/games');
      const { supabase } = await import('../../utils/supabase');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('📊 User check:', { user: !!user, userId: user?.id, error: userError });
      
      if (user) {
        // User is always player 1 in bot mode
        const won = isPlayerWinner;
        
        // Update stats
        console.log('📊 Updating stats:', { userId: user.id, won, score: finalPlayer1Score });
        const statsResult = await updateUserStats(user.id, won, finalPlayer1Score);
        console.log('✅ Stats update result:', statsResult);
        
        if (statsResult.error) {
          console.error('❌ Stats update error:', statsResult.error);
        } else {
          console.log('✅ Stats successfully updated:', statsResult.data);
        }
        
        // Save game to database
        // Calculate game duration: total time minus remaining time
        const totalTimeSeconds = gameTime * 60;
        const remainingTimeSeconds = Math.min(player1Time, player2Time);
        const gameDurationSeconds = Math.max(0, totalTimeSeconds - remainingTimeSeconds);
        
        console.log('💾 Saving game to database...');
        const gameResult = await saveGame({
          userId: user.id,
          gameType: 'bot',
          opponentName: player2Name,
          opponentType: 'bot',
          playerScore: finalPlayer1Score,
          opponentScore: finalPlayer2Score,
          won: won,
          gameDurationSeconds: gameDurationSeconds,
          finalBoardState: boardCoords,
          moveHistory: moveHistory || [],
          playerRackFinal: (player1Rack || []).join(''),
          opponentRackFinal: (player2Rack || []).join(''),
        });
        
        if (gameResult.error) {
          console.error('❌ Game save error:', gameResult.error);
        } else {
          console.log('✅ Game successfully saved:', gameResult.data);
        }
      } else {
        console.log('⚠️ No user logged in, skipping stats update and game save');
      }
    } catch (error) {
      console.error('❌ Exception updating stats/saving game:', error);
      // Don't block victory celebration if stats update fails
    }
  } else {
    console.log('⚠️ Not in bot mode, skipping stats update and game save');
  }
  
  // Trigger victory celebration
  setShowConfetti(true);
  setShowVictoryOverlay(true);
  
  // Disable auto-play
  setAutoPlayBest(false);
}; 