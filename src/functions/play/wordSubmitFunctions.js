import { alphabetizeRack } from './rackFunctions';
import { removeTilesByCount } from './rackFunctions';

/**
 * Handles the submission of a word to the board
 * @param {Object} params - The parameters object
 * @param {Array} params.boardCoords - The current board state
 * @param {Array} params.tempBoardCoords - The temporary board state with uncommitted moves
 * @param {number} params.currentPlayer - The current player (1 or 2)
 * @param {Array} params.player1Rack - Player 1's rack
 * @param {Array} params.player2Rack - Player 2's rack
 * @param {Array} params.selectedTiles - Tiles selected for the current move
 * @param {Array} params.pool - The tile pool
 * @param {number} params.player1points - Player 1's score
 * @param {number} params.player2points - Player 2's score
 * @param {string} params.player1Name - Player 1's name
 * @param {string} params.player2Name - Player 2's name
 * @param {Array} params.blankTiles - Positions of blank tiles on the board
 * @param {Array} params.moveHistory - History of moves
 * @param {Object} params.selectedBoardPosition - The currently selected board position
 * @param {string} params.arrowDirection - The current arrow direction ('right' or 'down')
 * @param {Function} params.setBoardCoords - Function to update board state
 * @param {Function} params.setTempBoardCoords - Function to update temporary board state
 * @param {Function} params.setSelectedTiles - Function to update selected tiles
 * @param {Function} params.setSelectedBoardPosition - Function to update selected position
 * @param {Function} params.setArrowDirection - Function to update arrow direction
 * @param {Function} params.setPlayer1points - Function to update player 1's score
 * @param {Function} params.setPlayer2points - Function to update player 2's score
 * @param {Function} params.setPlayer1Rack - Function to update player 1's rack
 * @param {Function} params.setPlayer2Rack - Function to update player 2's rack
 * @param {Function} params.setPool - Function to update tile pool
 * @param {Function} params.setCurrentPlayer - Function to update current player
 * @param {Function} params.setMoveHistory - Function to update move history
 * @param {Function} params.setSnackbarMessage - Function to update snackbar message
 * @param {Function} params.setSnackbarSeverity - Function to update snackbar severity
 * @param {Function} params.setSnackbarOpen - Function to update snackbar visibility
 * @param {Function} params.handleGameEnd - Function to handle game end
 * @param {Function} params.getBoardDiff - Function to get board differences
 * @param {Object} params.playerMoveSound - Reference to player move sound
 * @returns {Promise<void>}
 */
export const handleWordSubmit = async ({
  boardCoords,
  tempBoardCoords,
  currentPlayer,
  player1Rack,
  player2Rack,
  selectedTiles,
  pool,
  player1points,
  player2points,
  player1Name,
  player2Name,
  blankTiles,
  moveHistory,
  selectedBoardPosition,
  arrowDirection,
  setBoardCoords,
  setTempBoardCoords,
  setSelectedTiles,
  setSelectedBoardPosition,
  setArrowDirection,
  setPlayer1points,
  setPlayer2points,
  setPlayer1Rack,
  setPlayer2Rack,
  setPool,
  setCurrentPlayer,
  setMoveHistory,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
  handleGameEnd,
  getBoardDiff,
  playerMoveSound
}) => {
  // Validate the move
  const response = await fetch('/.netlify/functions/gameLogic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'validate',
      beforeBoard: boardCoords,
      afterBoard: tempBoardCoords
    })
  });

  const validationResult = await response.json();
  if (!validationResult.isValid) {
    console.log('Invalid word submission:', {
      reason: validationResult.reason || 'Word not found in dictionary',
      word: validationResult.word || 'Unknown',
      position: selectedBoardPosition,
      direction: arrowDirection
    });

    // Show toast notification
    setSnackbarMessage(validationResult.reason);
    setSnackbarSeverity("error");
    setSnackbarOpen(true);

    // Return tiles to the current player's rack
    const rackToUpdate = currentPlayer === 1 ? player1Rack : player2Rack;
    // Extract just the tile values from selectedTiles
    const tilesToReturn = selectedTiles.map(tile => tile.tile);
    const updatedRack = [...rackToUpdate, ...tilesToReturn];
    if (currentPlayer === 1) {
      setPlayer1Rack(alphabetizeRack(updatedRack));
    } else {
      setPlayer2Rack(alphabetizeRack(updatedRack));
    }

    // Reset the board state
    setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
    setSelectedTiles([]);
    setSelectedBoardPosition(null);
    return;
  }

  // Calculate score
  const scoreResponse = await fetch('/.netlify/functions/gameLogic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'score',
      beforeBoard: boardCoords,
      afterBoard: tempBoardCoords
    })
  });

  const score = await scoreResponse.json();

  // Play player move sound
  playerMoveSound.current.play();

  // Get the current player's rack before making any changes
  const playerRack = currentPlayer === 1 ? player1Rack : player2Rack;
  // Calculate running total
  const runningTotal = currentPlayer === 1 ? player1points + score : player2points + score;

  // Store only the differences in board states
  const boardDiff = getBoardDiff(boardCoords, tempBoardCoords);
  const moveHistoryEntry = {
    boardDiff,
    player: currentPlayer === 1 ? player1Name : player2Name,
    score,
    rack: playerRack.join(''),
    total: runningTotal,
    word: validationResult.word
  };

  setMoveHistory(prev => [...prev.slice(-49), moveHistoryEntry]);

  // Update the board state
  setBoardCoords(tempBoardCoords);
  setTempBoardCoords(JSON.parse(JSON.stringify(tempBoardCoords)));
  setSelectedTiles([]);
  setSelectedBoardPosition(null);
  setArrowDirection('right');

  // Update player's points
  if (currentPlayer === 1) {
    setPlayer1points(runningTotal);
  } else {
    setPlayer2points(runningTotal);
  }

  // Remove played tiles from rack
  const tilesToRemove = selectedTiles.map(tile => tile.tile);
  console.log('🔍 DEBUG - Tile removal:', {
    playerRack: playerRack,
    selectedTiles: selectedTiles,
    tilesToRemove: tilesToRemove,
    rackLength: playerRack.length
  });
  
  const newRack = removeTilesByCount(playerRack, tilesToRemove);
  
  console.log('🔍 DEBUG - After removal:', {
    newRack: newRack,
    newRackLength: newRack.length,
    removedCount: playerRack.length - newRack.length
  });

  if (currentPlayer === 1) {
    setPlayer1Rack(alphabetizeRack(newRack));
  } else {
    setPlayer2Rack(alphabetizeRack(newRack));
  }

  // Check if game should end
  if (newRack.length === 0 && pool.length === 0) {
    handleGameEnd({
      winnerRack: newRack,
      winnerName: currentPlayer === 1 ? player1Name : player2Name,
      loserRack: currentPlayer === 1 ? player2Rack : player1Rack,
      loserPoints: currentPlayer === 1 ? player2points : player1points,
      player1Rack,
      player2Rack,
      player1points,
      player2points,
      player1Name,
      player2Name,
      autoPlayBest: false,
      setPlayer1points,
      setPlayer2points,
      setSnackbarMessage,
      setSnackbarSeverity,
      setSnackbarOpen,
      setAutoPlayBest: () => {}
    });
    return;
  }

  // Refill the current player's rack
  const newPool = [...pool];
  
  // Add new tiles from pool
  while (newRack.length < 7 && newPool.length > 0) {
    const randomIndex = Math.floor(Math.random() * newPool.length);
    newRack.push(newPool[randomIndex]);
    newPool.splice(randomIndex, 1);
  }

  if (currentPlayer === 1) {
    setPlayer1Rack(alphabetizeRack(newRack));
  } else {
    setPlayer2Rack(alphabetizeRack(newRack));
  }
  setPool(newPool);
  
  // Switch to next player
  setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  setSelectedBoardPosition(null);
  setSelectedTiles([]);
  setArrowDirection('right');
}; 