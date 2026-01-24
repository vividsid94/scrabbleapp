import { alphabetizeRack, removeTilesByCount } from './rackFunctions';

// Add debounce mechanism
let lastKeyPressTime = 0;
const DEBOUNCE_DELAY = 50; // milliseconds

// Add submission guard using timeout to prevent double-submission
let submissionTimeout = null;
let lastSubmissionTime = 0;
const SUBMISSION_COOLDOWN = 1000; // 1 second cooldown instead of 3 second timeout

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
  playerMoveSound,
  arrowDirection,
  origBoard,
  // Additional parameters for keyboard shortcuts
  gameStarted,
  gameEnded,
  handlePass,
  handleExchangeClick,
  handlePlayTopMove,
  isPlayerThinking,
  isBotThinking
}) => {
  // Prevent rapid key presses
  const now = Date.now();
  if (now - lastKeyPressTime < DEBOUNCE_DELAY) {
    e.preventDefault();
    return;
  }
  lastKeyPressTime = now;

  // Handle keyboard shortcuts first (don't require selectedBoardPosition)
  if (gameStarted && !gameEnded && !isPlayerThinking && !isBotThinking) {
    const key = e.key.toLowerCase();
    
    // Handle number keys for actions
    if (key === '1') {
      e.preventDefault();
      handlePass();
      return;
    } else if (key === '2') {
      e.preventDefault();
      handleExchangeClick();
      return;
    } else if (key === '3') {
      e.preventDefault();
      handlePlayTopMove();
      return;
    }
  }

  if (!selectedBoardPosition) return;

  const { row, col } = selectedBoardPosition;
  const key = e.key.toUpperCase();

  // Prevent modifier keys
  if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) {
    e.preventDefault();
    return;
  }

  // Handle arrow keys
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    setArrowDirection('right');
    return;
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    setArrowDirection('down');
    return;
  }

  // Handle enter key with cooldown-based submission guard
  if (e.key === 'Enter') {
    console.log('🔍 Enter key pressed - handleKeyDown');
    e.preventDefault();
    
    const now = Date.now();
    
    // Prevent double-submission using cooldown
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
      console.log('🚫 Enter blocked - cooldown active, time remaining:', SUBMISSION_COOLDOWN - (now - lastSubmissionTime), 'ms');
      return;
    }
    
    // Only submit if there are tiles placed
    if (!selectedTiles || !Array.isArray(selectedTiles) || selectedTiles.length === 0) {
      console.log('🚫 Enter blocked - no tiles selected:', selectedTiles);
      return;
    }
    
    console.log('✅ Enter processing - submitting word with tiles:', selectedTiles);
    
    // Update last submission time
    lastSubmissionTime = now;
    console.log('⏰ Submission cooldown set, next allowed at:', new Date(now + SUBMISSION_COOLDOWN).toLocaleTimeString());
    
    // Submit the word
    console.log('🚀 Calling handleWordSubmit...');
    handleWordSubmit(playerMoveSound);
    
    return;
  }

  // Handle backspace
  if (e.key === 'Backspace') {
    e.preventDefault();
    const newTempBoard = [...tempBoardCoords];
    
    // Debug: Log what selectedTiles is
    console.log('selectedTiles in handleKeyDown:', selectedTiles, typeof selectedTiles);
    
    // Determine the actual direction of the placed tiles
    let actualDirection = arrowDirection;
    if (selectedTiles && Array.isArray(selectedTiles) && selectedTiles.length > 1) {
      // Find the actual first and last tiles placed by examining positions
      let minRow = Infinity, maxRow = -Infinity;
      let minCol = Infinity, maxCol = -Infinity;
      
      selectedTiles.forEach(tile => {
        minRow = Math.min(minRow, tile.row);
        maxRow = Math.max(maxRow, tile.row);
        minCol = Math.min(minCol, tile.col);
        maxCol = Math.max(maxCol, tile.col);
      });
      
      // Determine direction based on the span of tiles
      if (minRow === maxRow) {
        // All tiles in same row = horizontal move
        actualDirection = 'right';
      } else if (minCol === maxCol) {
        // All tiles in same column = vertical move
        actualDirection = 'down';
      }
    }
    
    // Find the actual last tile that was placed
    let lastPlacedTile = null;
    if (selectedTiles && Array.isArray(selectedTiles) && selectedTiles.length > 0) {
      if (actualDirection === 'right') {
        // For horizontal moves, find the rightmost tile
        lastPlacedTile = selectedTiles.reduce((last, current) => 
          current.col > last.col ? current : last
        );
      } else {
        // For vertical moves, find the bottommost tile
        lastPlacedTile = selectedTiles.reduce((last, current) => 
          current.row > last.row ? current : last
        );
      }
    }
    
    if (lastPlacedTile) {
      const lastRow = lastPlacedTile.row;
      const lastCol = lastPlacedTile.col;
      
      if (lastRow >= 0 && lastCol >= 0 && Number.isInteger(boardCoords[lastRow][lastCol])) {
        const tileToRemove = newTempBoard[lastRow][lastCol];
        
        if (typeof tileToRemove === 'string' && tileToRemove.length === 1) {
          const originalBoard = JSON.parse(origBoard);
          newTempBoard[lastRow][lastCol] = originalBoard[lastRow][lastCol];
          setTempBoardCoords(newTempBoard);
          
          const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
          // Find the tile that was placed at this position
          const placedTile = selectedTiles && selectedTiles.find(tile => tile.row === lastRow && tile.col === lastCol);
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
            const currentSelectedTiles = selectedTiles || [];
            const newSelectedTiles = currentSelectedTiles.filter(tile => !(tile.row === lastRow && tile.col === lastCol));
            setSelectedTiles(newSelectedTiles);
          }
          
          // Reset preview score
          setPreviewScore(null);
          setPreviewScorePosition(null);
        }
      }
    }
    
    // Always update cursor position to the position of the removed tile
    if (lastPlacedTile) {
      const lastRow = lastPlacedTile.row;
      const lastCol = lastPlacedTile.col;
      
      setSelectedBoardPosition({ row: lastRow, col: lastCol });
    }
    return;
  }

  // Handle letter keys
  if (!/[A-Z]/.test(key)) {
    e.preventDefault();
    return;
  }

  e.preventDefault();

  // Check if there's already a tile at this position
  if (typeof boardCoords[row][col] === 'string' || typeof tempBoardCoords[row][col] === 'string') {
    return;
  }

  const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const tileIndex = currentRack.indexOf(key);
  const blankIndex = currentRack.indexOf('?') !== -1 ? currentRack.indexOf('?') : currentRack.indexOf('*');
      
  // If we don't have the letter and don't have a blank, return
  if (tileIndex === -1 && blankIndex === -1) {
    return;
  }

  if (!Number.isInteger(boardCoords[row][col])) {
    return;
  }

  const newTempBoard = [...tempBoardCoords];
  const newBlankTiles = [...blankTiles];
  let newRack = [...currentRack];

  // Always use the actual letter if we have it
  if (tileIndex !== -1) {
    const tileToPlace = newRack[tileIndex];
    // Remove the tile from the rack immediately when typing
    newRack.splice(tileIndex, 1);
    newTempBoard[row][col] = key;
    const currentSelectedTiles = selectedTiles || [];
    setSelectedTiles([...currentSelectedTiles, { tile: tileToPlace, row, col }]);
  } 
  // Only use the blank tile if we don't have the letter
  else if (blankIndex !== -1) {
    const tileToPlace = newRack[blankIndex];
    // Remove the blank tile from the rack immediately when typing
    newRack.splice(blankIndex, 1);
    newTempBoard[row][col] = key;
    newBlankTiles.push({ row, col });
    setBlankTiles(newBlankTiles);
    const currentSelectedTiles = selectedTiles || [];
    setSelectedTiles([...currentSelectedTiles, { tile: tileToPlace, row, col }]);
  }

  // Update the rack immediately when typing
  if (currentPlayer === 1) {
    setPlayer1Rack(alphabetizeRack(newRack));
  } else {
    setPlayer2Rack(alphabetizeRack(newRack));
  }

  setTempBoardCoords(newTempBoard);

  // Move to next position
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
 * @param {boolean} params.gameEnded - Whether the game has ended
 * @param {Function} params.handlePass - Function to handle pass action
 * @param {Function} params.handleExchangeClick - Function to handle exchange action
 * @param {Function} params.handlePlayTopMove - Function to handle playing top move
 * @param {boolean} params.isPlayerThinking - Whether the player is thinking
 * @param {boolean} params.isBotThinking - Whether the bot is thinking
 * @returns {void}
 */
export const handleKeyPress = ({
  event,
  gameStarted,
  gameEnded,
  handlePass,
  handleExchangeClick,
  handlePlayTopMove,
  isPlayerThinking,
  isBotThinking
}) => {
  if (!gameStarted || gameEnded || isPlayerThinking || isBotThinking) return;

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