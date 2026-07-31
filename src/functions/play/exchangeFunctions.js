import { useGameStore } from '../../stores/gameStore';
import { alphabetizeRack } from './rackFunctions';

/**
 * Folds any tiles typed onto the board but not yet submitted back into the
 * current player's rack, clearing their board squares - exactly like
 * abandoning the placement without submitting.
 *
 * keyboardFunctions.js splices a tile out of player1Rack/player2Rack the
 * instant it's typed onto the board, so a mid-placement rack is already
 * short; the placed tiles only still exist in selectedTiles/
 * tempBoardCoords. Both the exchange modal (so it displays the player's
 * true full rack, not just whatever's left) and handleExchange below (so
 * confirming never silently drops the staged tiles) call this first.
 *
 * @returns {string[]} the restored, full rack for the current player
 */
export const returnStagedTilesToRack = () => {
  const {
    selectedTiles,
    tempBoardCoords,
    origBoardCoords,
    blankTiles,
    player1Rack,
    player2Rack,
    currentPlayer,
    setTempBoardCoords,
    setSelectedTiles,
    setBlankTiles,
    setPlayer1Rack,
    setPlayer2Rack,
    setPreviewScore,
    setPreviewScorePosition,
  } = useGameStore.getState();

  const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const stagedTiles = selectedTiles || [];
  if (stagedTiles.length === 0) {
    return currentRack;
  }

  const clearedBoard = tempBoardCoords.map(row => [...row]);
  stagedTiles.forEach(({ row, col }) => {
    clearedBoard[row][col] = origBoardCoords[row][col];
  });
  setTempBoardCoords(clearedBoard);
  setBlankTiles((blankTiles || []).filter(
    b => !stagedTiles.some(t => t.row === b.row && t.col === b.col)
  ));
  setSelectedTiles([]);
  setPreviewScore(null);
  setPreviewScorePosition(null);

  const restoredRack = alphabetizeRack([
    ...currentRack,
    ...stagedTiles.map(t => (t.tile === '*' ? '?' : t.tile)),
  ]);
  if (currentPlayer === 1) {
    setPlayer1Rack(restoredRack);
  } else {
    setPlayer2Rack(restoredRack);
  }
  return restoredRack;
};

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
export const handleExchange = () => {
  console.log('handleExchange called');
  
  const storeState = useGameStore.getState();
  console.log('Full store state keys:', Object.keys(storeState));
  
  const {
    tilesToExchange,
    currentPlayer,
    pool,
    player1Name,
    player2Name,
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
    setMoveHistory
  } = storeState;

  console.log('Exchange function state:', { currentPlayer, tilesToExchange, pool: pool.length, isBotMode });
  console.log('Exchange function setters:', { 
    setPlayer1Rack: typeof setPlayer1Rack, 
    setPlayer2Rack: typeof setPlayer2Rack,
    setMoveHistory: typeof setMoveHistory,
    setCurrentPlayer: typeof setCurrentPlayer 
  });

  if (tilesToExchange.length === 0) {
    console.log('No tiles selected for exchange');
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

  // Defense in depth: the modal already calls returnStagedTilesToRack() when
  // it opens (see Play.js/Scrabble3DPlay.js's exchange-modal-open handlers),
  // so this is normally a no-op by the time confirm runs. Kept here too so
  // handleExchange can never itself be the thing that drops staged tiles,
  // regardless of how it gets invoked.
  const restoredRack = returnStagedTilesToRack();

  const newRack = [...restoredRack];
  const newPool = [...pool];

  // Sort tiles by index in descending order to avoid index shifting issues.
  // Indices in tilesToExchange were assigned against player1Rack/
  // player2Rack as the modal displayed it - already restored by
  // returnStagedTilesToRack() at modal-open time, so no new staging can
  // have happened since (typing requires the modal to be closed). The
  // call above is therefore a no-op here and restoredRack === that same
  // array, keeping the indices valid.
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

  // Add exchanged tiles back to pool
  const exchangedTileLetters = tilesToExchange.map(t => t.tile);
  newPool.push(...exchangedTileLetters);

  // Update state with alphabetized rack
  if (currentPlayer === 1) {
    setPlayer1Rack(newRack);
  } else {
    setPlayer2Rack(newRack);
  }
  setPool(newPool);
  setTilesToExchange([]);

  // Switch to next player (handles 2 turns mode)
  const { switchToNextPlayer, setTopMoves } = useGameStore.getState();
  switchToNextPlayer();
  // Same gap as handleWordSubmit/handlePass - exchanging never cleared the
  // "Ask Theo" candidate list, so it could stay visible through the bot's
  // next turn.
  setTopMoves([]);

  // Add exchange move to history
  // NOTE: rack is the PRE-exchange rack (what the player held when choosing
  // to exchange, including any tiles that were staged on the board), not
  // newRack (post-draw) - GCG export needs the former.
  const currentHistory = useGameStore.getState().moveHistory || [];
  setMoveHistory([...currentHistory, {
    beforeBoard: JSON.parse(JSON.stringify(boardCoords)),
    afterBoard: JSON.parse(JSON.stringify(boardCoords)), // Same board state for exchange
    player: currentPlayer === 1 ? player1Name : player2Name,
    score: 0,
    rack: restoredRack.join(''),
    tilesExchanged: exchangedTileLetters.join(''),
    total: currentPlayer === 1 ? player1points : player2points,
    word: 'Exchange'
  }]);

  return { newRack, newPool };
}; 