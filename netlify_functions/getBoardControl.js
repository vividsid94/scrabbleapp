const { normalizeBoard } = require('./normalizeBoard');
const loadDictionary = require('./loadDictionary');
const { generateMoves } = require('./generateMoves');

// Helper function to count open playable squares
const countOpenSquares = (board) => {
  let count = 0;
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      // Check if square is empty and adjacent to a played tile
      if (typeof board[row][col] !== 'string') {
        // Check adjacent squares (up, down, left, right)
        const hasAdjacentTile = 
          (row > 0 && typeof board[row-1][col] === 'string') ||
          (row < 14 && typeof board[row+1][col] === 'string') ||
          (col > 0 && typeof board[row][col-1] === 'string') ||
          (col < 14 && typeof board[row][col+1] === 'string');
        
        if (hasAdjacentTile) {
          count++;
        }
      }
    }
  }
  return count;
};

// Helper function to calculate defensive value
const calculateDefensiveValue = (board, move) => {
  let defensiveScore = 0;
  const newBoard = JSON.parse(JSON.stringify(board));
  
  // Place the move on the board
  for (const tile of move.tiles) {
    if (tile.isNew) {
      newBoard[tile.row][tile.col] = tile.letter;
    }
  }
  
  // Count how many high-scoring opportunities are blocked
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (typeof newBoard[row][col] === 'string') {
        // Check for premium squares being blocked
        if (row === 0 || row === 14 || col === 0 || col === 14) {
          defensiveScore += 2; // Blocking edges
        }
        if ((row === 0 || row === 14) && (col === 0 || col === 14)) {
          defensiveScore += 3; // Blocking corners
        }
        if (row === 7 && col === 7) {
          defensiveScore += 4; // Blocking center
        }
      }
    }
  }
  
  return defensiveScore;
};

// Helper function to calculate board control
const calculateBoardControl = (board, move) => {
  let controlScore = 0;
  const newBoard = JSON.parse(JSON.stringify(board));
  
  // Place the move on the board
  for (const tile of move.tiles) {
    if (tile.isNew) {
      newBoard[tile.row][tile.col] = tile.letter;
    }
  }
  
  // Calculate control based on:
  // 1. Number of open squares created
  // 2. Strategic positioning
  // 3. Connection to existing words
  
  // Count open squares before and after
  const openSquaresBefore = countOpenSquares(board);
  const openSquaresAfter = countOpenSquares(newBoard);
  const openSquaresDiff = openSquaresBefore - openSquaresAfter;
  
  // Scale the open squares impact to a range of -20 to 20
  controlScore += (openSquaresDiff / 5) * 20;
  
  // Add points for strategic positioning
  for (const tile of move.tiles) {
    if (tile.isNew) {
      // Center control
      if (Math.abs(tile.row - 7) <= 2 && Math.abs(tile.col - 7) <= 2) {
        controlScore += 15;
      }
      
      // Edge control
      if (tile.row === 0 || tile.row === 14 || tile.col === 0 || tile.col === 14) {
        controlScore += 10;
      }
      
      // Corner control
      if ((tile.row === 0 || tile.row === 14) && (tile.col === 0 || tile.col === 14)) {
        controlScore += 20;
      }
    }
  }
  
  // Scale the final score to be between -50 and 50
  const maxPossibleScore = 55; // Maximum possible score from positioning
  const scaledScore = (controlScore / maxPossibleScore) * 50;
  
  return Math.max(-50, Math.min(50, scaledScore));
};

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { board, moves } = JSON.parse(event.body);
    
    if (!Array.isArray(board) || !Array.isArray(moves)) {
      throw new Error('Invalid input: board and moves must be arrays');
    }

    const normalizedBoard = normalizeBoard(board);
    
    // Calculate metrics for each move
    const moveMetrics = moves.map(move => {
      const defensiveValue = calculateDefensiveValue(normalizedBoard, move);
      const boardControl = calculateBoardControl(normalizedBoard, move);
      
      return {
        move: move.word,
        defensiveValue,
        boardControl,
        totalControl: defensiveValue + boardControl
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ moveMetrics })
    };

  } catch (error) {
    console.error('Error in getBoardControl:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 