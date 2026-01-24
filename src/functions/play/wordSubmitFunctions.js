import { alphabetizeRack, removeTilesByCount } from './rackFunctions.js';
import { useGameStore } from '../../stores/gameStore';
import { handleGameEnd } from './gameEndFunctions';
import { validateMoveClient } from './validateMoveClient.js';
import { calculateLeave } from './leaveFunctions.js';
import { analyzeMove } from './moveCoachAnalysis.js';

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
      player1points: player1points,
      player2points: player2points,
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
  const { switchToNextPlayer } = useGameStore.getState();
  switchToNextPlayer();
  setSelectedBoardPosition(null);
  setSelectedTiles([]);
  setArrowDirection('right');

  // Prepare move coach data (async, non-blocking) - only if enabled
  // Save board state before move for board control calculation
  const boardBeforeMove = JSON.parse(JSON.stringify(boardCoords));
  
  // Capture tile count BEFORE clearing selectedTiles (for bingo detection)
  // Count all tiles placed, including blanks (blanks are represented as '*' in selectedTiles)
  // selectedTiles structure: [{ tile: 'A' or '*', row, col }, ...]
  // A bingo uses all 7 tiles from the rack, so we just need to count selectedTiles.length
  const tilesPlacedCount = selectedTiles.length;
  
  // Debug: log what tiles were placed
  console.log('🎯 Tiles placed for bingo check:', {
    tilesPlacedCount,
    selectedTiles: selectedTiles.map(t => ({ tile: t.tile, row: t.row, col: t.col })),
    hasBlanks: selectedTiles.some(t => t.tile === '*')
  });
  
  setTimeout(async () => {
    try {
      const { setMoveCoachData, setShowMoveCoach, topMoves, leaveValues, moveCoachEnabled, theoYellEnabled } = useGameStore.getState();
      
      // Only proceed if Move Coach OR Theo Yell is enabled
      if (!moveCoachEnabled && !theoYellEnabled) {
        return;
      }
      
      // Calculate leave for the move
      // Use the captured selectedTiles from closure (before it was cleared)
      const moveForLeave = {
        tiles: selectedTiles.map(t => ({
          letter: t.tile === '*' ? '?' : t.tile, // Convert blank representation
          isNew: true,
          row: t.row,
          col: t.col,
          isBlank: t.tile === '*' // Mark if it's a blank
        })),
        word: result.words ? result.words[0] : 'Unknown'
      };
      
      const leave = calculateLeave(moveForLeave, playerRack);
      
      // Fetch leave value if not cached
      let leaveValue = leaveValues[leave] || 0;
      if (!leaveValues[leave]) {
        try {
          const leaveResponse = await fetch('/.netlify/functions/getLeaveValues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leaves: [leave] })
          });
          if (leaveResponse.ok) {
            const leaveData = await leaveResponse.json();
            leaveValue = leaveData.leaveValues?.[leave] || 0;
          }
        } catch (err) {
          console.warn('Could not fetch leave value for coach:', err);
        }
      }

      // Fetch board control for this move (use board state before move)
      let boardControl = 0;
      try {
        const controlResponse = await fetch('/.netlify/functions/getBoardControl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            board: boardBeforeMove,
            moves: [{
              word: result.words ? result.words[0] : 'Unknown',
              tiles: moveForLeave.tiles
            }]
          })
        });
        if (controlResponse.ok) {
          const controlData = await controlResponse.json();
          const metrics = controlData.moveMetrics?.[0];
          if (metrics) {
            boardControl = metrics.boardControl || 0;
          }
        }
      } catch (err) {
        console.warn('Could not fetch board control for coach:', err);
      }

      // Prepare move coach data
      const coachData = {
        score,
        word: result.words ? result.words[0] : 'Unknown',
        leave,
        leaveValue,
        boardControl,
        player1points: currentPlayer === 1 ? runningTotal : player1points,
        player2points: currentPlayer === 2 ? runningTotal : player2points,
        currentPlayer,
        moveNumber: (useGameStore.getState().moveHistory || []).length
      };

      // Analyze the move to get rating
      const analysis = analyzeMove(coachData, topMoves, {
        player1points: coachData.player1points,
        player2points: coachData.player2points,
        currentPlayer: coachData.currentPlayer,
        moveHistory: useGameStore.getState().moveHistory || []
      });

      // Add analysis to coach data
      coachData.overallRating = analysis.overallRating;
      coachData.analysisScore = analysis.score;

      setMoveCoachData(coachData);
      // Auto-show the coach only if Move Coach is enabled (not just Theo Yell)
      if (moveCoachEnabled) {
        setShowMoveCoach(true);
      }
      
      // Trigger Theo yell if enabled based on criteria
      const { 
        theoYellEnabled: theoYellEnabledState,
        theoYellCriteria,
        theoYellScoreThreshold
      } = useGameStore.getState();
      
      let shouldYell = false;
      
      if (theoYellEnabledState) {
        if (theoYellCriteria === 'score') {
          // Check if move score is below threshold
          shouldYell = score < theoYellScoreThreshold;
          console.log('🎯 Score-based check:', { 
            score, 
            threshold: theoYellScoreThreshold, 
            shouldYell 
          });
        } else if (theoYellCriteria === 'bingo') {
          // Check if player missed a bingo
          // A bingo is when you use all 7 tiles from your rack
          // Use the captured count from before selectedTiles was cleared
          const playerMoveIsBingo = tilesPlacedCount === 7;
          
          // Check if there's a bingo available in top moves
          // A bingo move uses exactly 7 tiles from the rack
          const hasBingoAvailable = topMoves && topMoves.some(move => {
            if (!move.tiles) return false;
            // Count only new tiles (tiles from the rack)
            // This includes both regular tiles and blanks
            const newTilesCount = move.tiles.filter(tile => tile.isNew !== false).length;
            return newTilesCount === 7;
          });
          
          shouldYell = hasBingoAvailable && !playerMoveIsBingo;
          console.log('🎯 Bingo-based check:', { 
            playerMoveIsBingo,
            playerTilesUsed: tilesPlacedCount,
            hasBingoAvailable,
            topMovesLength: topMoves?.length,
            topMovesSample: topMoves?.slice(0, 3).map(m => ({
              word: m.word,
              tilesCount: m.tiles?.length,
              newTilesCount: m.tiles?.filter(t => t.isNew !== false).length
            })),
            shouldYell 
          });
        }
      }
      
      console.log('🎯 Move Coach Analysis:', { 
        rating: analysis.overallRating, 
        score: analysis.score, 
        theoYellEnabled: theoYellEnabledState,
        theoYellCriteria,
        shouldYell 
      });
      
      if (shouldYell) {
        // Signal that Theo should yell (we'll handle this in Play component)
        const isBingoMiss = theoYellCriteria === 'bingo' && 
          topMoves && topMoves.some(move => {
            if (!move.tiles) return false;
            const newTilesCount = move.tiles.filter(tile => tile.isNew !== false).length;
            return newTilesCount === 7;
          }) && 
          selectedTiles.length !== 7;
        
        console.log('🔊 Setting shouldTheoYell to true!', { isBingoMiss });
        useGameStore.getState().setShouldTheoYell(true, isBingoMiss);
      }
    } catch (error) {
      console.warn('Error preparing move coach data:', error);
    }
  }, 500); // Small delay to let UI update first
}; 