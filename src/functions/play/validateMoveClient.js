/**
 * Client-side move validation
 * Validates placement rules client-side and uses Go service for word validation
 */

const GO_SERVICE_URL = 'https://scrabble-move-generator-production.up.railway.app';

/**
 * Find all new words formed by placed tiles
 */
function findNewWords(beforeBoard, afterBoard, placedTiles) {
  const newWords = new Set();
  
  // Helper function to get word at position
  function getWordAt(board, row, col, direction) {
    let word = "";
    let r = row;
    let c = col;

    if (direction === "horizontal") {
      while (c >= 0 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
        c--;
      }
      c++;
      while (c < 15 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
        word += board[r][c];
        c++;
      }
    } else if (direction === "vertical") {
      while (r >= 0 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
        r--;
      }
      r++;
      while (r < 15 && typeof board[r][c] === 'string' && board[r][c].match(/[A-Z]/)) {
        word += board[r][c];
        r++;
      }
    }
    return word.length > 1 ? word : null;
  }

  for (const tile of placedTiles) {
    const { row, col } = tile;

    const horizontalWord = getWordAt(afterBoard, row, col, "horizontal");
    if (horizontalWord) {
      newWords.add(horizontalWord);
    }

    const verticalWord = getWordAt(afterBoard, row, col, "vertical");
    if (verticalWord) {
      newWords.add(verticalWord);
    }
  }

  return Array.from(newWords);
}

/**
 * Validate placement rules client-side (fast, no API call)
 */
function validatePlacement(beforeBoard, afterBoard) {
  const placedTiles = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (typeof afterBoard[r][c] === 'string' && afterBoard[r][c].match(/[A-Z]/) && 
          (typeof beforeBoard[r][c] !== 'string' || !beforeBoard[r][c].match(/[A-Z]/))) {
        placedTiles.push({ row: r, col: c, letter: afterBoard[r][c] });
      }
    }
  }

  const numPlaced = placedTiles.length;
  if (numPlaced === 0) {
    return { isValid: false, reason: 'No tiles placed', words: [] };
  }

  // Check if tiles are in a straight line
  if (numPlaced > 1) {
    const firstRow = placedTiles[0].row;
    const firstCol = placedTiles[0].col;
    const allSameRow = placedTiles.every(tile => tile.row === firstRow);
    const allSameCol = placedTiles.every(tile => tile.col === firstCol);

    if (!allSameRow && !allSameCol) {
      return { isValid: false, reason: 'Tiles must be placed in a straight line', words: [] };
    }

    // Check for gaps
    if (allSameRow) {
      const cols = placedTiles.map(tile => tile.col).sort((a, b) => a - b);
      for (let i = 0; i < cols.length - 1; i++) {
        if (cols[i + 1] - cols[i] > 1) {
          for (let c = cols[i] + 1; c < cols[i + 1]; c++) {
            if (typeof beforeBoard[firstRow][c] !== 'string' || !beforeBoard[firstRow][c].match(/[A-Z]/)) {
              return { isValid: false, reason: 'Gaps between tiles are not allowed', words: [] };
            }
          }
        }
      }
    } else if (allSameCol) {
      const rows = placedTiles.map(tile => tile.row).sort((a, b) => a - b);
      for (let i = 0; i < rows.length - 1; i++) {
        if (rows[i + 1] - rows[i] > 1) {
          for (let r = rows[i] + 1; r < rows[i + 1]; r++) {
            if (typeof beforeBoard[r][firstCol] !== 'string' || !beforeBoard[r][firstCol].match(/[A-Z]/)) {
              return { isValid: false, reason: 'Gaps between tiles are not allowed', words: [] };
            }
          }
        }
      }
    }
  }

  // Check adjacency and center star
  let isAdjacent = false;
  let isOnStar = false;

  for (const tile of placedTiles) {
    const { row, col } = tile;
    const adjacentSquares = [
      { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 }
    ];

    for (const { dr, dc } of adjacentSquares) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
        if (typeof beforeBoard[newRow][newCol] === 'string' && beforeBoard[newRow][newCol].match(/[A-Z]/)) {
          isAdjacent = true;
          break;
        }
      }
    }

    if (row === 7 && col === 7) {
      isOnStar = true;
    }
  }

  if (!isAdjacent && !isOnStar) {
    return { isValid: false, reason: 'First move must cover center star or connect to existing tiles', words: [] };
  }

  // Find all new words
  const newWords = findNewWords(beforeBoard, afterBoard, placedTiles);
  if (newWords.length === 0) {
    return { isValid: false, reason: 'No valid words formed', words: [] };
  }

  return { isValid: true, words: newWords, placedTiles };
}

/**
 * Validate words using Go service (bulk validation)
 */
async function validateWords(words) {
  try {
    const response = await fetch(`${GO_SERVICE_URL}/validate-words`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words: words })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const results = {};
    
    if (data.words && Array.isArray(data.words)) {
      // Convert array format to object format
      for (const item of data.words) {
        results[item.word] = item.isValid;
      }
    } else if (data.results) {
      return data.results;
    }
    
    return results;
  } catch (error) {
    console.error('Error validating words:', error);
    throw error;
  }
}

/**
 * Main validation function - validates placement client-side, then words via Go service
 * @param {Array} beforeBoard - Board state before move
 * @param {Array} afterBoard - Board state after move
 * @param {Function} setMoveStatus - Optional function to update move status
 */
export async function validateMoveClient(beforeBoard, afterBoard, setMoveStatus = null) {
  // Step 1: Validate placement rules (fast, client-side)
  if (setMoveStatus) setMoveStatus('Checking placement...');
  const placementResult = validatePlacement(beforeBoard, afterBoard);
  if (!placementResult.isValid) {
    if (setMoveStatus) setMoveStatus(null);
    return placementResult;
  }

  // Step 2: Validate words using Go service (bulk validation)
  if (setMoveStatus) setMoveStatus('Validating words...');
  const wordValidationResults = await validateWords(placementResult.words);
  for (const word of placementResult.words) {
    if (!wordValidationResults[word]) {
      if (setMoveStatus) setMoveStatus(null);
      return { isValid: false, reason: `Invalid word: ${word}`, words: placementResult.words };
    }
  }

  if (setMoveStatus) setMoveStatus(null);
  return { isValid: true, words: placementResult.words };
}

