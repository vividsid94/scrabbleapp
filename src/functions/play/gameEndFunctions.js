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
 * @param {boolean} params.autoPlayBest - Whether auto-play is enabled
 * @param {Function} params.setPlayer1points - Function to update player 1's score
 * @param {Function} params.setPlayer2points - Function to update player 2's score
 * @param {Function} params.setSnackbarMessage - Function to update snackbar message
 * @param {Function} params.setSnackbarSeverity - Function to update snackbar severity
 * @param {Function} params.setSnackbarOpen - Function to update snackbar visibility
 * @param {Function} params.setAutoPlayBest - Function to update auto-play state
 * @returns {void}
 */
export const handleGameEnd = ({
  winnerRack,
  winnerName,
  loserRack,
  loserPoints,
  player1Rack,
  player2Rack,
  player1points,
  player2points,
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

  // Calculate sum of loser's remaining tiles
  const rackSum = loserRack.reduce((sum, tile) => {
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
  
  // Add remaining tiles to loser's score
  if (winnerRack === player1Rack) {
    setPlayer2points(loserPoints + rackSum);
  } else {
    setPlayer1points(loserPoints + rackSum);
  }
  
  // Disable auto-play
  setAutoPlayBest(false);
}; 