import { alphabetizeRack } from './rackFunctions';

export const handleKeyDown = ({
  e,
  selectedBoardPosition,
  boardCoords,
  tempBoardCoords,
  currentPlayer,
  player1Rack,
  player2Rack,
  selectedTiles,
  blankTiles,
  setSelectedBoardPosition,
  setArrowDirection,
  setTempBoardCoords,
  setSelectedTiles,
  setPlayer1Rack,
  setPlayer2Rack,
  setBlankTiles,
  setPreviewScore,
  setPreviewScorePosition,
  handleWordSubmit,
  arrowDirection,
  origBoard
}) => {
  if (!selectedBoardPosition) return;

  const { row, col } = selectedBoardPosition;
  const key = e.key.toUpperCase();

  if (e.altKey || e.shiftKey) {
    e.preventDefault();
    return;
  }

  if (e.key === 'ArrowRight') {
    setArrowDirection('right');
    return;
  } else if (e.key === 'ArrowDown') {
    setArrowDirection('down');
    return;
  }

  if (e.key === 'Enter') {
    handleWordSubmit();
    return;
  }

  if (e.key === 'Backspace') {
    const newTempBoard = [...tempBoardCoords];
    const lastRow = arrowDirection === 'right' ? row : row - 1;
    const lastCol = arrowDirection === 'right' ? col - 1 : col;
    
    if (lastRow >= 0 && lastCol >= 0 && Number.isInteger(boardCoords[lastRow][lastCol])) {
      const tileToRemove = newTempBoard[lastRow][lastCol];
      
      if (typeof tileToRemove === 'string' && tileToRemove.length === 1) {
        const originalBoard = JSON.parse(origBoard);
        newTempBoard[lastRow][lastCol] = originalBoard[lastRow][lastCol];
        setTempBoardCoords(newTempBoard);
        
        const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
        // Find the tile that was placed at this position
        const placedTile = selectedTiles.find(tile => tile.row === lastRow && tile.col === lastCol);
        if (placedTile) {
          const tileToAdd = placedTile.tile === '*' ? '?' : placedTile.tile;
          const newRack = [...currentRack, tileToAdd];
          if (currentPlayer === 1) {
            setPlayer1Rack(alphabetizeRack(newRack));
          } else {
            setPlayer2Rack(alphabetizeRack(newRack));
          }

          // Remove from blankTiles if it was a blank
          if (placedTile.tile === '*') {
            setBlankTiles(prev => prev.filter(tile => !(tile.row === lastRow && tile.col === lastCol)));
          }

          // Update selectedTiles to match what's actually on the board
          setSelectedTiles(prevTiles => prevTiles.filter(tile => !(tile.row === lastRow && tile.col === lastCol)));
        }
        
        // Reset preview score
        setPreviewScore(null);
        setPreviewScorePosition(null);
      }
    }
    
    if (arrowDirection === 'right') {
      if (col > 0) {
        setSelectedBoardPosition({ row, col: col - 1 });
      }
    } else {
      if (row > 0) {
        setSelectedBoardPosition({ row: row - 1, col });
      }
    }
    return;
  }

  if (!/[A-Z]/.test(key)) return;

  // Check if there's already a tile at this position (either in boardCoords or tempBoardCoords)
  if (typeof boardCoords[row][col] === 'string' || typeof tempBoardCoords[row][col] === 'string') {
    return;
  }

  const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const tileIndex = currentRack.indexOf(key);
  // Check for both '?' and '*' as blank tiles
  const blankIndex = currentRack.indexOf('?') !== -1 ? currentRack.indexOf('?') : currentRack.indexOf('*');
      
  // If we don't have the letter and don't have a blank, return
  if (tileIndex === -1 && blankIndex === -1) {
    return;
  }

  if (!Number.isInteger(boardCoords[row][col])) {
    return;
  }

  const newRack = [...currentRack];
  const newTempBoard = [...tempBoardCoords];
  const newBlankTiles = [...blankTiles];

  // Always use the actual letter if we have it
  if (tileIndex !== -1) {
    const tileToPlace = newRack[tileIndex]; // Get the actual tile from the rack
    newRack.splice(tileIndex, 1);
    newTempBoard[row][col] = key;
    setSelectedTiles(prevTiles => [...prevTiles, { tile: tileToPlace, row, col }]); // Store the actual tile with its position
  } 
  // Only use the blank tile if we don't have the letter
  else if (blankIndex !== -1) {
    const tileToPlace = newRack[blankIndex]; // Get the actual blank tile from the rack
    newRack.splice(blankIndex, 1);
    newTempBoard[row][col] = key;
    newBlankTiles.push({ row, col });
    setBlankTiles(newBlankTiles);
    setSelectedTiles(prevTiles => [...prevTiles, { tile: tileToPlace, row, col }]); // Store the actual blank tile with its position
  }

  if (currentPlayer === 1) {
    setPlayer1Rack(alphabetizeRack(newRack));
  } else {
    setPlayer2Rack(alphabetizeRack(newRack));
  }

  setTempBoardCoords(newTempBoard);

  if (arrowDirection === 'right') {
    let nextCol = col + 1;
    while (nextCol <= 14 && !Number.isInteger(boardCoords[row][nextCol])) {
      nextCol++;
    }
    if (nextCol <= 14) {
      setSelectedBoardPosition({ row, col: nextCol });
    }
  } else {
    let nextRow = row + 1;
    while (nextRow <= 14 && !Number.isInteger(boardCoords[nextRow][col])) {
      nextRow++;
    }
    if (nextRow <= 14) {
      setSelectedBoardPosition({ row: nextRow, col });
    }
  }
};

/**
 * Handles keyboard shortcuts for game actions
 * @param {Object} params - The parameters object
 * @param {KeyboardEvent} params.event - The keyboard event
 * @param {boolean} params.gameStarted - Whether the game has started
 * @param {Function} params.handlePass - Function to handle pass action
 * @param {Function} params.handleExchangeClick - Function to handle exchange action
 * @param {Function} params.handlePlayTopMove - Function to handle playing top move
 * @returns {void}
 */
export const handleKeyPress = ({
  event,
  gameStarted,
  handlePass,
  handleExchangeClick,
  handlePlayTopMove
}) => {
  if (!gameStarted) return;

  const key = event.key.toLowerCase();
  
  // Handle number keys for actions
  if (key === '1') {
    handlePass();
  } else if (key === '2') {
    handleExchangeClick();
  } else if (key === '3') {
    handlePlayTopMove();
  }
}; 