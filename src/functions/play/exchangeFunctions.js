/**
 * Handles the exchange of tiles between a player's rack and the pool
 * @param {Object} params - The parameters object
 * @param {Array} params.tilesToExchange - Array of tiles to exchange
 * @param {Array} params.currentRack - Current player's rack
 * @param {Array} params.pool - Current pool of tiles
 * @param {number} params.currentPlayer - Current player number (1 or 2)
 * @param {string} params.playerName - Current player's name
 * @param {boolean} params.isBotMode - Whether the game is in bot mode
 * @param {Array} params.boardCoords - Current board state
 * @param {number} params.player1points - Player 1's score
 * @param {number} params.player2points - Player 2's score
 * @param {Function} params.setPlayer1Rack - Function to update player 1's rack
 * @param {Function} params.setPlayer2Rack - Function to update player 2's rack
 * @param {Function} params.setPool - Function to update the pool
 * @param {Function} params.setTilesToExchange - Function to update tiles to exchange
 * @param {Function} params.setCurrentPlayer - Function to update current player
 * @param {Function} params.setSnackbarMessage - Function to update snackbar message
 * @param {Function} params.setSnackbarSeverity - Function to update snackbar severity
 * @param {Function} params.setSnackbarOpen - Function to update snackbar open state
 * @param {Function} params.makeBotMove - Function to make bot move
 * @param {Function} params.setMoveHistory - Function to update move history
 * @returns {Object} Object containing the updated rack and pool
 */
export const handleExchange = ({
  tilesToExchange,
  currentRack,
  pool,
  currentPlayer,
  playerName,
  isBotMode,
  boardCoords,
  player1points,
  player2points,
  setPlayer1Rack,
  setPlayer2Rack,
  setPool,
  setTilesToExchange,
  setCurrentPlayer,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  makeBotMove,
  setMoveHistory
}) => {
  if (tilesToExchange.length === 0) {
    setSnackbarMessage('Please select tiles to exchange');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    return null;
  }

  if (pool.length < 7) {
    setSnackbarMessage('Cannot exchange when there are fewer than 7 tiles in the pool');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    return null;
  }

  if (pool.length < tilesToExchange.length) {
    setSnackbarMessage('Not enough tiles in pool to exchange');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    return null;
  }

  const newRack = [...currentRack];
  const newPool = [...pool];

  // Sort tiles by index in descending order to avoid index shifting issues
  const sortedTiles = [...tilesToExchange].sort((a, b) => b.index - a.index);
  
  // Remove selected tiles from rack
  sortedTiles.forEach(({ index }) => {
    if (index < newRack.length) {
      newRack.splice(index, 1);
    }
  });

  // Add new tiles from pool
  for (let i = 0; i < tilesToExchange.length; i++) {
    const randomIndex = Math.floor(Math.random() * newPool.length);
    newRack.push(newPool[randomIndex]);
    newPool.splice(randomIndex, 1);
  }

  // Update state with alphabetized rack
  if (currentPlayer === 1) {
    setPlayer1Rack(newRack);
  } else {
    setPlayer2Rack(newRack);
  }
  setPool(newPool);
  setTilesToExchange([]);

  // Switch to next player
  setCurrentPlayer(prev => prev === 1 ? 2 : 1);
  setSnackbarMessage(`${playerName} exchanged ${tilesToExchange.length} tiles`);
  setSnackbarSeverity('info');
  setSnackbarOpen(true);

  // If next player is bot, make bot move
  if (isBotMode && currentPlayer === 2) {
    makeBotMove();
  }

  // Add exchange move to history
  setMoveHistory(prev => [...prev, {
    beforeBoard: JSON.parse(JSON.stringify(boardCoords)),
    afterBoard: JSON.parse(JSON.stringify(boardCoords)), // Same board state for exchange
    player: playerName,
    score: 0,
    rack: newRack.join(''),
    total: currentPlayer === 1 ? player1points : player2points,
    word: 'Exchange'
  }]);

  return { newRack, newPool };
}; 