// Convert 1D array to 2D grid
const convertToGrid = (board) => {
  if (!board || !Array.isArray(board)) return [];
  const grid = [];
  for (let i = 0; i < 4; i++) {
    grid.push(board.slice(i * 4, (i + 1) * 4));
  }
  return grid;
};

// Get all adjacent cells for a given position
const getAdjacentCells = (row, col) => {
  const adjacent = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newRow = row + i;
      const newCol = col + j;
      if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
        adjacent.push([newRow, newCol]);
      }
    }
  }
  return adjacent;
};

// DFS to find all possible words
const findWords = (grid, dictionary, minLength = 3) => {
  // Return empty array if dictionary is not loaded or grid is invalid
  if (!dictionary || !dictionary.size || !grid || !Array.isArray(grid) || grid.length !== 4) {
    return [];
  }

  const words = new Set();
  const visited = Array(4).fill().map(() => Array(4).fill(false));

  const dfs = (row, col, currentWord, visited) => {
    // Validate grid cell
    if (!grid[row] || !grid[row][col]) return;

    // Check if current word is in dictionary
    if (currentWord.length >= minLength && dictionary.has(currentWord)) {
      words.add(currentWord);
    }

    // Get adjacent cells
    const adjacent = getAdjacentCells(row, col);

    // Try each adjacent cell
    for (const [newRow, newCol] of adjacent) {
      if (!visited[newRow][newCol] && grid[newRow] && grid[newRow][newCol]) {
        visited[newRow][newCol] = true;
        const letter = grid[newRow][newCol];
        dfs(newRow, newCol, currentWord + letter, visited);
        visited[newRow][newCol] = false;
      }
    }
  };

  // Start DFS from each cell
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid[i] && grid[i][j]) {
        visited[i][j] = true;
        dfs(i, j, grid[i][j], visited);
        visited[i][j] = false;
      }
    }
  }

  return Array.from(words);
};

// Calculate score for a word
const calculateWordScore = (word) => {
  if (!word) return 0;
  const length = word.length;
  if (length <= 2) return 0;
  if (length <= 4) return 1;
  if (length === 5) return 2;
  if (length === 6) return 3;
  if (length === 7) return 5;
  return 11;
};

// Find all possible words and their scores
const findAllPossibleWords = (board, dictionary) => {
  if (!board || !Array.isArray(board) || board.length === 0) return [];
  
  const grid = convertToGrid(board);
  if (!grid || grid.length === 0) return [];
  
  const words = findWords(grid, dictionary);
  
  return words.map(word => ({
    word,
    score: calculateWordScore(word)
  })).sort((a, b) => b.score - a.score);
};

// Check if a word can be formed on the board
const canFormWord = (board, word) => {
  if (!board || !Array.isArray(board) || board.length === 0 || !word) return false;
  
  const grid = convertToGrid(board);
  if (!grid || grid.length === 0) return false;
  
  const visited = Array(4).fill().map(() => Array(4).fill(false));

  const dfs = (row, col, index) => {
    if (index === word.length) return true;
    if (row < 0 || row >= 4 || col < 0 || col >= 4) return false;
    if (visited[row][col]) return false;
    if (!grid[row] || !grid[row][col] || grid[row][col] !== word[index]) return false;

    visited[row][col] = true;
    const adjacent = getAdjacentCells(row, col);
    
    for (const [newRow, newCol] of adjacent) {
      if (dfs(newRow, newCol, index + 1)) {
        return true;
      }
    }

    visited[row][col] = false;
    return false;
  };

  // Try starting from each cell
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid[i] && grid[i][j] && dfs(i, j, 0)) {
        return true;
      }
    }
  }

  return false;
};

export {
  convertToGrid,
  getAdjacentCells,
  findWords,
  calculateWordScore,
  findAllPossibleWords,
  canFormWord
}; 