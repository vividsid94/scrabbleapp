const { handler } = require('@netlify/functions');
const { isValidWord } = require('../../src/utils/dictionary');

exports.handler = handler(async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { board, move, isFirstMove } = JSON.parse(event.body);
    
    // Validate move structure
    if (!Array.isArray(move.tiles) || !move.startPosition || !move.direction) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid move structure' })
      };
    }

    // Check if all tiles are placed in a straight line
    const { startPosition, direction, tiles } = move;
    const positions = [];
    let currentRow = startPosition.row;
    let currentCol = startPosition.col;

    for (const tile of tiles) {
      positions.push({ row: currentRow, col: currentCol });
      if (direction === 'right') {
        currentCol++;
      } else {
        currentRow++;
      }
    }

    // Check if positions are within board bounds
    if (positions.some(pos => pos.row < 0 || pos.row >= 15 || pos.col < 0 || pos.col >= 15)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Move is outside board bounds' })
      };
    }

    // For first move, check if center square is covered
    if (isFirstMove) {
      const centerSquare = { row: 7, col: 7 };
      if (!positions.some(pos => pos.row === centerSquare.row && pos.col === centerSquare.col)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'First move must cover center square' })
        };
      }
    } else {
      // For subsequent moves, check if it connects to existing tiles
      let connectsToExisting = false;
      for (const pos of positions) {
        // Check adjacent squares
        const adjacentPositions = [
          { row: pos.row - 1, col: pos.col },
          { row: pos.row + 1, col: pos.col },
          { row: pos.row, col: pos.col - 1 },
          { row: pos.row, col: pos.col + 1 }
        ];

        for (const adjPos of adjacentPositions) {
          if (adjPos.row >= 0 && adjPos.row < 15 && adjPos.col >= 0 && adjPos.col < 15) {
            if (board[adjPos.row][adjPos.col] !== 0) {
              connectsToExisting = true;
              break;
            }
          }
        }
        if (connectsToExisting) break;
      }

      if (!connectsToExisting) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Move must connect to existing tiles' })
        };
      }
    }

    // Check if all formed words are valid
    const words = [];
    
    // Get main word
    let mainWord = '';
    for (const pos of positions) {
      mainWord += board[pos.row][pos.col] || tiles[positions.indexOf(pos)];
    }
    words.push(mainWord);

    // Get perpendicular words
    for (const pos of positions) {
      let word = '';
      let currentPos = { ...pos };
      
      // Move backward to start of word
      while (currentPos.row >= 0 && currentPos.col >= 0) {
        const tile = board[currentPos.row][currentPos.col];
        if (!tile) break;
        word = tile + word;
        if (direction === 'right') {
          currentPos.row--;
        } else {
          currentPos.col--;
        }
      }

      // Move forward to end of word
      currentPos = { ...pos };
      if (direction === 'right') {
        currentPos.row++;
      } else {
        currentPos.col++;
      }
      while (currentPos.row < 15 && currentPos.col < 15) {
        const tile = board[currentPos.row][currentPos.col];
        if (!tile) break;
        word += tile;
        if (direction === 'right') {
          currentPos.row++;
        } else {
          currentPos.col++;
        }
      }

      if (word.length > 1) {
        words.push(word);
      }
    }

    // Validate all words
    for (const word of words) {
      const isValid = await isValidWord(word);
      console.log(`Word "${word}" is ${isValid ? 'valid' : 'invalid'}`);
      // Don't return error for invalid words, just log them
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        valid: true,
        words,
        score: calculateScore(words, positions, board)
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
});

function calculateScore(words, positions, board) {
  let totalScore = 0;
  let wordMultiplier = 1;

  for (const word of words) {
    let wordScore = 0;
    for (let i = 0; i < word.length; i++) {
      const pos = positions[i];
      const tileValue = getTileValue(word[i]);
      const squareMultiplier = getSquareMultiplier(board[pos.row][pos.col]);
      
      if (squareMultiplier.type === 'letter') {
        wordScore += tileValue * squareMultiplier.value;
      } else {
        wordScore += tileValue;
        wordMultiplier *= squareMultiplier.value;
      }
    }
    totalScore += wordScore * wordMultiplier;
  }

  // Bonus for using all tiles
  if (positions.length === 7) {
    totalScore += 50;
  }

  return totalScore;
}

function getTileValue(letter) {
  const values = {
    'A': 1, 'E': 1, 'I': 1, 'O': 1, 'U': 1, 'L': 1, 'N': 1, 'S': 1, 'T': 1, 'R': 1,
    'D': 2, 'G': 2,
    'B': 3, 'C': 3, 'M': 3, 'P': 3,
    'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
    'K': 5,
    'J': 8, 'X': 8,
    'Q': 10, 'Z': 10
  };
  return values[letter] || 0;
}

function getSquareMultiplier(squareValue) {
  switch (squareValue) {
    case 1: return { type: 'letter', value: 2 }; // DL
    case 2: return { type: 'letter', value: 3 }; // TL
    case 3: return { type: 'word', value: 2 };   // DW
    case 4: return { type: 'word', value: 3 };   // TW
    default: return { type: 'letter', value: 1 };
  }
} 