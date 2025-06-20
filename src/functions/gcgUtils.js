// Utility functions for generating .gcg (Game Control Protocol) files

/**
 * Formats a move location from board coordinates to .gcg format
 * @param {Array} boardDiff - Array of tile changes
 * @param {string} word - The word being played (to check if it starts with a dot)
 * @returns {string} Location in .gcg format (e.g., "8G", "A7")
 */
export const formatGCGLocation = (boardDiff, word = '') => {
  if (!boardDiff || boardDiff.length === 0) {
    return '';
  }

  // Find the first changed tile
  const firstTile = boardDiff[0];
  let firstRow = firstTile.row;
  let firstCol = firstTile.col;
  
  // Determine direction by analyzing the pattern of placed tiles
  let isHorizontal = false;
  
  if (boardDiff.length > 1) {
    // Multiple tiles placed - check if they're in the same row or column
    const allSameRow = boardDiff.every(tile => tile.row === firstRow);
    const allSameCol = boardDiff.every(tile => tile.col === firstCol);
    
    if (allSameRow && !allSameCol) {
      isHorizontal = true;
    } else if (allSameCol && !allSameRow) {
      isHorizontal = false;
    } else {
      // Mixed placement - need to analyze further
      const rowSpan = Math.max(...boardDiff.map(t => t.row)) - Math.min(...boardDiff.map(t => t.row));
      const colSpan = Math.max(...boardDiff.map(t => t.col)) - Math.min(...boardDiff.map(t => t.col));
      
      // If tiles span more columns than rows, it's likely horizontal
      isHorizontal = colSpan > rowSpan;
    }
  } else if (boardDiff.length === 1 && word && word.includes('.')) {
    // Single tile with dots - analyze word structure
    const dotPositions = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] === '.') {
        dotPositions.push(i);
      }
    }
    
    // If dots are consecutive, it's likely horizontal
    if (dotPositions.length > 1) {
      const isConsecutive = dotPositions.every((pos, index) => 
        index === 0 || pos === dotPositions[index - 1] + 1
      );
      if (isConsecutive) {
        isHorizontal = true;
      }
    }
    
    // If we still can't determine, check if the word has more letters than dots
    // and if the new tile is at the beginning or end
    if (dotPositions.length === 0) {
      // No dots, can't determine from word structure
      isHorizontal = true; // Default assumption
    } else {
      // Check if the new tile is at the beginning or end of the word
      const newTilePositions = [];
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== '.') {
          newTilePositions.push(i);
        }
      }
      
      // If new tiles are at the beginning or end, it's likely horizontal
      if (newTilePositions.length > 0) {
        const firstNewTile = newTilePositions[0];
        const lastNewTile = newTilePositions[newTilePositions.length - 1];
        
        if (firstNewTile === 0 || lastNewTile === word.length - 1) {
          isHorizontal = true;
        }
      }
    }
  } else {
    // Single tile, no dots - can't determine direction from this alone
    isHorizontal = true; // Default assumption
  }
  
  // If the word starts with dots (existing letters), adjust the starting position
  if (word && word.startsWith('.')) {
    // Count the number of leading dots
    const leadingDots = word.match(/^\.+/)[0].length;
    
    if (isHorizontal) {
      // For horizontal words, move the starting column back by the number of dots
      firstCol = Math.max(0, firstCol - leadingDots);
    } else {
      // For vertical words, move the starting row back by the number of dots
      firstRow = Math.max(0, firstRow - leadingDots);
    }
  }
  
  // Format the position (convert 0-14 to 1-15 for rows, 0-14 to A-O for columns)
  const row = firstRow + 1;
  const col = String.fromCharCode(65 + firstCol);
  
  // For horizontal words: row + column (e.g., "1A", "8H")
  // For vertical words: column + row (e.g., "A1", "H8")
  const position = isHorizontal ? `${row}${col}` : `${col}${row}`;
  
  return position;
};

/**
 * Extracts the word played from boardDiff
 * @param {Array} boardDiff - Array of tile changes
 * @returns {string} The word played
 */
export const extractWordFromBoardDiff = (boardDiff) => {
  if (!boardDiff || boardDiff.length === 0) {
    return '';
  }

  // Sort tiles by position to reconstruct the word
  const sortedTiles = [...boardDiff].sort((a, b) => {
    if (a.row !== b.row) {
      return a.row - b.row; // Sort by row first
    }
    return a.col - b.col; // Then by column
  });

  // Extract the letters and join them - use 'value' property
  return sortedTiles.map(tile => tile.value).join('');
};

/**
 * Converts a word with parentheses to .gcg format with dots
 * @param {string} word - The word (e.g., "VINE(G)AR")
 * @returns {string} The word in .gcg format (e.g., "VINE.AR")
 */
export const convertWordToGCGFormat = (word) => {
  if (!word) return '';
  
  // Replace parentheses with dots for .gcg format
  // Example: "VINE(G)AR" becomes "VINE.AR"
  return word.replace(/\([A-Z]\)/g, '.');
};

/**
 * Formats a player name for .gcg format (replace spaces with underscores)
 * @param {string} playerName - The player name
 * @returns {string} Formatted player name
 */
export const formatPlayerName = (playerName) => {
  return playerName.replace(/\s+/g, '_');
};

/**
 * Generates .gcg content from game data
 * @param {Array} moveHistory - Array of moves in the game
 * @param {string} player1Name - Name of player 1
 * @param {string} player2Name - Name of player 2
 * @returns {string} .gcg file content
 */
export const generateGCGContent = (moveHistory, player1Name, player2Name) => {
  let gcgContent = '#character-encoding UTF-8\n';
  
  // Add player information
  gcgContent += `#player1 ${formatPlayerName(player1Name)} ${player1Name}\n`;
  gcgContent += `#player2 ${formatPlayerName(player2Name)} ${player2Name}\n`;
  
  let player1Total = 0;
  let player2Total = 0;
  
  // Process each move
  moveHistory.forEach((move, index) => {
    const { score, player, word, boardDiff, rack } = move;
    
    // Determine which player made the move
    const isPlayer1 = player === player1Name;
    const playerName = formatPlayerName(player);
    
    // Handle special cases
    let displayWord = word;
    let displayScore = score;
    
    if (!displayWord && boardDiff) {
      try {
        displayWord = extractWordFromBoardDiff(boardDiff);
      } catch (error) {
        displayWord = 'Error';
      }
    }
    
    if (score === 0 && player && player.includes('exchanged')) {
      displayWord = 'Exchange';
    } else if (score === 0 && (!displayWord || displayWord === '')) {
      displayWord = 'Pass';
    }
    
    // Convert word to .gcg format (replace parentheses with dots)
    displayWord = convertWordToGCGFormat(displayWord);
    
    // Get location
    const location = formatGCGLocation(boardDiff, displayWord);
    
    // Update running totals
    if (isPlayer1) {
      player1Total += displayScore;
    } else {
      player2Total += displayScore;
    }
    
    // Format the move line
    // Format: >PlayerName: RACK LOCATION WORD +SCORE TOTAL
    const rackDisplay = rack || '';
    const locationDisplay = location || '';
    const wordDisplay = displayWord || '';
    const scoreDisplay = displayScore > 0 ? `+${displayScore}` : displayScore.toString();
    const totalDisplay = isPlayer1 ? player1Total : player2Total;
    
    gcgContent += `>${playerName}: ${rackDisplay} ${locationDisplay} ${wordDisplay} ${scoreDisplay} ${totalDisplay}\n`;
  });
  
  return gcgContent;
};

/**
 * Downloads a .gcg file
 * @param {string} content - The .gcg file content
 * @param {string} filename - The filename for the download
 */
export const downloadGCGFile = (content, filename = 'scrabble_game.gcg') => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 