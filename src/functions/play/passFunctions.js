import { alphabetizeRack } from './rackFunctions';
import { useGameStore } from '../../stores/gameStore';

/**
 * Handles a player passing their turn
 * @returns {void}
 */
export const handlePass = () => {
  const storeState = useGameStore.getState();
  
  const {
    consecutivePasses,
    setConsecutivePasses,
    setSnackbarMessage,
    setSnackbarSeverity,
    setSnackbarOpen,
    currentPlayer,
    player1Rack,
    player2Rack,
    boardCoords,
    tempBoardCoords,
    setPlayer1Rack,
    setPlayer2Rack,
    setMoveHistory,
    player1Name,
    player2Name,
    player1points,
    player2points,
    setCurrentPlayer,
    setTempBoardCoords,
    setSelectedTiles,
    setSelectedBoardPosition,
    isBotMode
  } = storeState;

  try {
    const currentConsecutivePasses = useGameStore.getState().consecutivePasses || 0;
    setConsecutivePasses(currentConsecutivePasses + 1);
    
    // Check if game should end (six consecutive passes)
    if (currentConsecutivePasses >= 5) {
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
    const currentHistory = useGameStore.getState().moveHistory || [];
    const newMove = {
      beforeBoard: JSON.parse(JSON.stringify(boardCoords)),
      afterBoard: JSON.parse(JSON.stringify(boardCoords)), // Same board state for pass
      player: currentPlayer === 1 ? player1Name : player2Name,
      score: 0,
      rack: alphabetizeRack(restoredRack).join(''),
      total: currentPlayer === 1 ? player1points : player2points,
      word: 'Pass'
    };
    setMoveHistory([...currentHistory, newMove]);

    // Switch to next player (handles 2 turns mode)
    const { switchToNextPlayer } = useGameStore.getState();
    switchToNextPlayer();
    
    setSnackbarMessage(currentPlayer === 1 ? "You passed your turn" : `${player2Name} passed their turn`);
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    
    // Reset the board state
    setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
    setSelectedTiles([]);
    setSelectedBoardPosition(null);
  } catch (error) {
    console.error('Error in pass function:', error);
  }
}; 