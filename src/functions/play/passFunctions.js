import { alphabetizeRack } from './rackFunctions';

/**
 * Handles a player passing their turn
 * @param {Object} params - The parameters object
 * @param {number} params.consecutivePasses - Current number of consecutive passes
 * @param {Array} params.boardCoords - Current board state
 * @param {Array} params.tempBoardCoords - Temporary board state
 * @param {number} params.currentPlayer - Current player (1 or 2)
 * @param {Array} params.player1Rack - Player 1's rack
 * @param {Array} params.player2Rack - Player 2's rack
 * @param {number} params.player1points - Player 1's score
 * @param {number} params.player2points - Player 2's score
 * @param {string} params.player1Name - Player 1's name
 * @param {string} params.player2Name - Player 2's name
 * @param {boolean} params.isBotMode - Whether bot mode is active
 * @param {Function} params.setConsecutivePasses - Function to update consecutive passes
 * @param {Function} params.setMoveHistory - Function to update move history
 * @param {Function} params.setCurrentPlayer - Function to update current player
 * @param {Function} params.setSnackbarMessage - Function to update snackbar message
 * @param {Function} params.setSnackbarSeverity - Function to update snackbar severity
 * @param {Function} params.setSnackbarOpen - Function to update snackbar visibility
 * @param {Function} params.setTempBoardCoords - Function to update temporary board state
 * @param {Function} params.setSelectedTiles - Function to update selected tiles
 * @param {Function} params.setSelectedBoardPosition - Function to update selected position
 * @param {Function} params.setPlayer1Rack - Function to update player 1's rack
 * @param {Function} params.setPlayer2Rack - Function to update player 2's rack
 * @param {Function} params.makeBotMove - Function to make a bot move
 * @returns {void}
 */
export const handlePass = ({
  consecutivePasses,
  boardCoords,
  tempBoardCoords,
  currentPlayer,
  player1Rack,
  player2Rack,
  player1points,
  player2points,
  player1Name,
  player2Name,
  isBotMode,
  setConsecutivePasses,
  setMoveHistory,
  setCurrentPlayer,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  setTempBoardCoords,
  setSelectedTiles,
  setSelectedBoardPosition,
  setPlayer1Rack,
  setPlayer2Rack,
  makeBotMove
}) => {
  setConsecutivePasses(prev => prev + 1);
  
  // Check if game should end (six consecutive passes)
  if (consecutivePasses >= 5) {
    setSnackbarMessage('Game ended due to six consecutive passes');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    // TODO: Add game end logic here
    return;
  }

  // Restore any tiles that were placed on the board but not committed
  const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const restoredRack = [...currentRack];
  
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (typeof tempBoardCoords[row][col] === 'string' && typeof boardCoords[row][col] !== 'string') {
        // This tile was placed on the board but not committed, so restore it to the rack
        restoredRack.push(tempBoardCoords[row][col]);
      }
    }
  }

  // Update the rack with restored tiles
  if (currentPlayer === 1) {
    setPlayer1Rack(alphabetizeRack(restoredRack));
  } else {
    setPlayer2Rack(alphabetizeRack(restoredRack));
  }

  // Add pass move to history
  setMoveHistory(prev => [...prev, {
    beforeBoard: JSON.parse(JSON.stringify(boardCoords)),
    afterBoard: JSON.parse(JSON.stringify(boardCoords)), // Same board state for pass
    player: currentPlayer === 1 ? player1Name : player2Name,
    score: 0,
    rack: alphabetizeRack(restoredRack).join(''),
    total: currentPlayer === 1 ? player1points : player2points,
    word: 'Pass'
  }]);

  // Switch to next player
  setCurrentPlayer(prev => prev === 1 ? 2 : 1);
  setSnackbarMessage(currentPlayer === 1 ? "You passed your turn" : `${player2Name} passed their turn`);
  setSnackbarSeverity('info');
  setSnackbarOpen(true);
  
  // Reset the board state
  setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
  setSelectedTiles([]);
  setSelectedBoardPosition(null);
  
  // If next player is bot, make bot move
  if (isBotMode && currentPlayer === 2) {
    makeBotMove();
  }
}; 