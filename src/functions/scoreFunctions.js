// Letter scores for each tile
export const letterScores = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
  'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
  'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10, '?': 0
};

/**
 * Convert premiumSquares array to boardMultipliers format (15x15 array)
 * @param {Array} premiumSquares - Array of {row, col, type} objects
 * @returns {Array} 15x15 array where values are: 0=normal, 1=DLS, 2=TLS, 3=DWS, 4=TWS
 */
export function premiumSquaresToBoardMultipliers(premiumSquares) {
  // Initialize 15x15 array with zeros
  const boardMultipliers = Array(15).fill(null).map(() => Array(15).fill(0));
  
  if (premiumSquares && Array.isArray(premiumSquares)) {
    premiumSquares.forEach(square => {
      const { row, col, type } = square;
      if (row >= 0 && row < 15 && col >= 0 && col < 15) {
        // Map backend types to board multiplier values:
        // DLS -> 1, TLS -> 2, DWS -> 3, TWS -> 4, CENTER -> 0
        if (type === 'DLS') {
          boardMultipliers[row][col] = 1;
        } else if (type === 'TLS') {
          boardMultipliers[row][col] = 2;
        } else if (type === 'DWS') {
          boardMultipliers[row][col] = 3;
        } else if (type === 'TWS') {
          boardMultipliers[row][col] = 4;
        }
        // CENTER and others remain 0
      }
    });
  }
  
  return boardMultipliers;
}

// Helper function to get word score
function getWordScore(wordTiles, placedTiles, boardMultipliers) {
  let wordScore = 0;
  let wordMultiplier = 1;
  const usedPremiumSquares = new Set();

  for (const tile of wordTiles) {
    const letter = tile.letter;
    const row = tile.row;
    const col = tile.col;
    const letterScore = letterScores[letter];
    let letterMultiplier = 1;

    const isNewTile = placedTiles.some(pt => pt.row === row && pt.col === col);
    if (isNewTile) {
      const premiumType = boardMultipliers[row][col];
      if (premiumType === 3) { // Double word
        if (!usedPremiumSquares.has(`DW-${row}-${col}`)) {
          wordMultiplier *= 2;
          usedPremiumSquares.add(`DW-${row}-${col}`);
        }
      } else if (premiumType === 1) { // Double letter
        letterMultiplier = 2;
      } else if (premiumType === 2) { // Triple letter
        letterMultiplier = 3;
      } else if (premiumType === 4) { // Triple word
        if (!usedPremiumSquares.has(`TW-${row}-${col}`)) {
          wordMultiplier *= 3;
          usedPremiumSquares.add(`TW-${row}-${col}`);
        }
      }
    }

    wordScore += letterScore * letterMultiplier;
  }

  return wordScore * wordMultiplier;
}

// Helper function to find complete word
function findWord(board, startRow, startCol, direction) {
  let wordTiles = [];
  let currentRow = startRow;
  let currentCol = startCol;

  if (direction === 'horizontal') {
    while (currentCol >= 0 && typeof board[currentRow][currentCol] === 'string' && 
           board[currentRow][currentCol].match(/[A-Z]/)) {
      currentCol--;
    }
    currentCol++;
    while (currentCol < 15 && typeof board[currentRow][currentCol] === 'string' && 
           board[currentRow][currentCol].match(/[A-Z]/)) {
      wordTiles.push({
        letter: board[currentRow][currentCol],
        row: currentRow,
        col: currentCol
      });
      currentCol++;
    }
  } else if (direction === 'vertical') {
    while (currentRow >= 0 && typeof board[currentRow][currentCol] === 'string' && 
           board[currentRow][currentCol].match(/[A-Z]/)) {
      currentRow--;
    }
    currentRow++;
    while (currentRow < 15 && typeof board[currentRow][currentCol] === 'string' && 
           board[currentRow][currentCol].match(/[A-Z]/)) {
      wordTiles.push({
        letter: board[currentRow][currentCol],
        row: currentRow,
        col: currentCol
      });
      currentRow++;
    }
  }

  return wordTiles.length > 1 ? wordTiles : [];
}

// Main function to calculate score
export function calculateScore(beforeBoard, afterBoard, boardMultipliers) {
  let totalScore = 0;
  const formedWords = new Set();
  const placedTiles = [];

  // Find placed tiles
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/) &&
          (typeof beforeBoard[r][c] !== 'string' || !beforeBoard[r][c].match(/[A-Z]/))) {
        placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
      }
    }
  }

  if (placedTiles.length === 0) return 0;

  // Score all words
  for (const placedTile of placedTiles) {
    const r = placedTile.row;
    const c = placedTile.col;

    // Check horizontal word
    const horizontalWord = findWord(afterBoard, r, c, 'horizontal');
    if (horizontalWord.length > 0) {
      const wordString = horizontalWord.map(t => t.letter).join('');
      if (!formedWords.has(wordString)) {
        totalScore += getWordScore(horizontalWord, placedTiles, boardMultipliers);
        formedWords.add(wordString);
      }
    }

    // Check vertical word
    const verticalWord = findWord(afterBoard, r, c, 'vertical');
    if (verticalWord.length > 0) {
      const wordString = verticalWord.map(t => t.letter).join('');
      if (!formedWords.has(wordString)) {
        totalScore += getWordScore(verticalWord, placedTiles, boardMultipliers);
        formedWords.add(wordString);
      }
    }
  }

  // Add 50-point bonus for using all 7 tiles
  if (placedTiles.length === 7) {
    totalScore += 50;
  }

  return totalScore;
} 