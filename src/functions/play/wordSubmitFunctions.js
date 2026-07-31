import { alphabetizeRack, removeTilesByCount } from './rackFunctions.js';
import { useGameStore } from '../../stores/gameStore';
import { handleGameEnd } from './gameEndFunctions';
import { validateMoveClient } from './validateMoveClient.js';

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
export const handleWordSubmit = async (playerMoveSound) => {
  console.log('🎯 handleWordSubmit called');
  
  const {
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
    getBoardDiff
  } = useGameStore.getState();
  
  console.log('📊 Word submit state:', {
    selectedTiles: selectedTiles?.length || 0,
    currentPlayer,
    selectedBoardPosition
  });

  // Set move status
  const { setMoveStatus, previewScore } = useGameStore.getState();

  // Validate using client-side placement validation + local dictionary (with API fallback)
  let result;
  try {
    result = await validateMoveClient(boardCoords, tempBoardCoords, setMoveStatus);
  } catch (error) {
    console.error('Validation error:', error);
    setMoveStatus(null);
    setSnackbarMessage('Validation failed. Please try again.');
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    
    // Return tiles to the current player's rack
    const rackToUpdate = currentPlayer === 1 ? player1Rack : player2Rack;
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
  
  if (!result.isValid) {
    setMoveStatus(null);
    const { setInvalidWordCoords } = useGameStore.getState();
    
    console.log('Invalid word submission:', {
      reason: result.reason || 'Word not found in dictionary',
      invalidWords: result.invalidWords || [],
      invalidWordCoords: result.invalidWordCoords || [],
      position: selectedBoardPosition,
      direction: arrowDirection
    });

    // Set invalid word coordinates for visual highlighting
    // Tiles stay on board - user can manually remove them
    if (result.invalidWordCoords && result.invalidWordCoords.length > 0) {
      setInvalidWordCoords(result.invalidWordCoords);
      // Clear invalid coords after 3 seconds (visual feedback duration)
      setTimeout(() => {
        setInvalidWordCoords([]);
      }, 3000);
    }
    
    // Don't return tiles to rack - let user see the error and decide what to do

    // No snackbar - visual feedback only (red border + animation)
    return;
  }
  
  // Clear invalid word coords on successful validation
  const { setInvalidWordCoords: clearInvalidCoords } = useGameStore.getState();
  clearInvalidCoords([]);

  // Use the preview score that's already calculated client-side
  const score = previewScore || 0;
  
  // Clear move status
  setMoveStatus(null);

  // Play player move sound
  if (playerMoveSound && playerMoveSound.play) {
    playerMoveSound.play();
  }

  // Tiles placed on the board are removed from the rack as soon as they're typed/placed,
  // so by the time we get here player1Rack/player2Rack is already the post-move LEAVE, not
  // the pre-move rack GCG needs. Reconstruct the real pre-move rack by adding back the
  // tiles this move just used (from selectedTiles, converting '*' to '?' to match the
  // rack's own blank convention) - for a bingo the leave is empty, which is exactly why
  // the rack field was disappearing entirely for those moves.
  const playerRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const preMoveRack = alphabetizeRack([
    ...playerRack,
    ...selectedTiles.map(t => (t.tile === '*' ? '?' : t.tile))
  ]).join('');
  // Calculate running total
  const runningTotal = currentPlayer === 1 ? player1points + score : player2points + score;

  // Store only the differences in board states
  const boardDiff = getBoardDiff(boardCoords, tempBoardCoords);
  const moveHistoryEntry = {
    boardDiff,
    player: currentPlayer === 1 ? player1Name : player2Name,
    score,
    rack: preMoveRack,
    total: runningTotal,
    word: result.words ? result.words[0] : 'Unknown'
  };

  // Add move to history
  const currentHistory = useGameStore.getState().moveHistory || [];
  setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);

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

  // Tiles are already removed from rack when typing, so no need to remove them again
  // Just use the current rack as is
  const newRack = [...playerRack];
  
  if (currentPlayer === 1) {
    setPlayer1Rack(alphabetizeRack(newRack));
  } else {
    setPlayer2Rack(alphabetizeRack(newRack));
  }

  // Check if game should end
  if (newRack.length === 0 && pool.length === 0) {
    await handleGameEnd({
      winnerRack: newRack,
      winnerName: currentPlayer === 1 ? player1Name : player2Name,
      loserRack: currentPlayer === 1 ? player2Rack : player1Rack,
      loserPoints: currentPlayer === 1 ? player2points : player1points,
      player1Rack: player1Rack,
      player2Rack: player2Rack,
      // Use the freshly computed total for whoever just moved — player1points/
      // player2points here are still the pre-move values (state hasn't flushed yet)
      player1points: currentPlayer === 1 ? runningTotal : player1points,
      player2points: currentPlayer === 2 ? runningTotal : player2points,
      player1Name: player1Name,
      player2Name: player2Name,
      autoPlayBest: false, // We don't have access to autoPlayBest here, but it's not critical
      setPlayer1points: setPlayer1points,
      setPlayer2points: setPlayer2points,
      setSnackbarMessage: setSnackbarMessage,
      setSnackbarSeverity: setSnackbarSeverity,
      setSnackbarOpen: setSnackbarOpen,
      setAutoPlayBest: () => {} // We don't have access to setAutoPlayBest here, but it's not critical
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
  
  // Switch to next player (handles 2 turns mode)
  const { switchToNextPlayer, setTopMoves } = useGameStore.getState();
  switchToNextPlayer();
  setSelectedBoardPosition(null);
  setSelectedTiles([]);
  setArrowDirection('right');
  // Unlike handlePlayTopMove/the bot's own turn-end cleanup, this path never
  // cleared the "Ask Theo" candidate list on commit - so if it was left
  // expanded, the player's stale pre-move candidates stayed visible straight
  // through the bot's next turn.
  setTopMoves([]);

  // Theo Yell check - runs synchronously right here (no artificial delay -
  // everything it needs, including bingo availability, is already computed
  // by the time a move is submitted; see TheoYellOverlay.js for the
  // background bingo-availability check that keeps this instant).
  try {
    const { theoYellEnabled, theoYellCriteria, theoYellScoreThreshold, theoYellBingoAvailable } = useGameStore.getState();

    if (theoYellEnabled) {
      let shouldYell = false;

      if (theoYellCriteria === 'score') {
        // Check if move score is below threshold
        shouldYell = score < theoYellScoreThreshold;
      } else if (theoYellCriteria === 'bingo') {
        // A bingo uses all 7 tiles from the rack. theoYellBingoAvailable is
        // set by TheoYellOverlay's own background check at the start of
        // this turn (using the player's full starting rack), independent
        // of whether the player ever opened the "Ask Theo" panel.
        const playerMoveIsBingo = selectedTiles.length === 7;
        shouldYell = theoYellBingoAvailable && !playerMoveIsBingo;
      }

      if (shouldYell) {
        useGameStore.getState().setShouldTheoYell(true, theoYellCriteria === 'bingo');
      }
    }
  } catch (error) {
    console.warn('Error checking Theo yell criteria:', error);
  }
};