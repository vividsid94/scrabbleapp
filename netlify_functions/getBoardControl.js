const { normalizeBoard } = require('./normalizeBoard');

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

// Helper function to calculate tile density
const calculateTileDensity = (board) => {
  const tiles = [];
  
  // Collect all tile positions
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (typeof board[row][col] === 'string') {
        tiles.push({ row, col });
      }
    }
  }
  
  if (tiles.length <= 1) return 0;
  
  // Calculate the center of mass of all tiles
  let centerRow = 0;
  let centerCol = 0;
  for (const tile of tiles) {
    centerRow += tile.row;
    centerCol += tile.col;
  }
  centerRow /= tiles.length;
  centerCol /= tiles.length;
  
  // Calculate the average distance from center
  let totalDistanceFromCenter = 0;
  for (const tile of tiles) {
    const distance = Math.sqrt(
      Math.pow(tile.row - centerRow, 2) + 
      Math.pow(tile.col - centerCol, 2)
    );
    totalDistanceFromCenter += distance;
  }
  const averageDistanceFromCenter = totalDistanceFromCenter / tiles.length;
  
  // Calculate how many tiles are adjacent to each other
  let adjacentPairs = 0;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const tile1 = tiles[i];
      const tile2 = tiles[j];
      const distance = Math.abs(tile1.row - tile2.row) + Math.abs(tile1.col - tile2.col);
      if (distance === 1) { // Manhattan distance of 1 means adjacent
        adjacentPairs++;
      }
    }
  }
  
  // Calculate density score based on both metrics
  // 1. Average distance from center (0 to 10)
  // 2. Ratio of adjacent pairs to total possible pairs (0 to 40)
  const maxDistanceFromCenter = 10; // Maximum reasonable distance from center
  const centerScore = 10 * (1 - (averageDistanceFromCenter / maxDistanceFromCenter));
  
  const maxPossiblePairs = (tiles.length * (tiles.length - 1)) / 2;
  const adjacencyScore = 40 * (adjacentPairs / maxPossiblePairs);
  
  const densityScore = centerScore + adjacencyScore - 25; // Center around 0
  
  return Math.max(-50, Math.min(50, densityScore));
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
  // 1. Tile density (80%)
  // 2. Number of open squares created (10%)
  // 3. Strategic positioning (10%)
  
  // Get tile density score (80% weight)
  const densityScore = calculateTileDensity(newBoard);
  controlScore += densityScore * 4; // 80% of total
  
  // Count open squares before and after (10% weight)
  const openSquaresBefore = countOpenSquares(board);
  const openSquaresAfter = countOpenSquares(newBoard);
  const openSquaresDiff = openSquaresBefore - openSquaresAfter;
  controlScore += (openSquaresDiff / 5) * 5; // 10% of total
  
  // Add points for strategic positioning (10% weight)
  for (const tile of move.tiles) {
    if (tile.isNew) {
      // Center control
      if (Math.abs(tile.row - 7) <= 2 && Math.abs(tile.col - 7) <= 2) {
        controlScore += 2.5; // Part of 10%
      }
      
      // Edge control
      if (tile.row === 0 || tile.row === 14 || tile.col === 0 || tile.col === 14) {
        controlScore += 2.5; // Part of 10%
      }
      
      // Corner control
      if ((tile.row === 0 || tile.row === 14) && (tile.col === 0 || tile.col === 14)) {
        controlScore += 5; // Part of 10%
      }
    }
  }
  
  // Scale the final score to be between -50 and 50
  const maxPossibleScore = 250; // Adjusted for new weights (200 for density, 25 for open squares, 25 for positioning)
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
      const tileDensity = calculateTileDensity(normalizedBoard);
      
      return {
        move: move.word,
        defensiveValue,
        boardControl,
        tileDensity,
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