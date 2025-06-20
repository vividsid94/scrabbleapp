// Utility functions for generating .gcg (Game Control Protocol) files

/**
 * Formats a move location from board coordinates to .gcg format
 * @param {Array} boardDiff - Array of tile changes
 * @param {string} word - The word being played (to check if it starts with a dot)
 * @param {Array} boardState - The current board state to check for existing tiles
 * @returns {string} Location in .gcg format (e.g., "8G", "A7")
 */
export const formatGCGLocation = (boardDiff, word = '', boardState = null) => {
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
  } else {
    // Single tile - analyze word structure and boardDiff to determine direction
    const dotPositions = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] === '.') {
        dotPositions.push(i);
      }
    }
    
    // If the word starts with dots, we need to look at the boardDiff more carefully
    if (word && word.startsWith('.')) {
      // For words starting with dots, check if the new tile is placed in a way that suggests direction
      // Look at the position of the new tile relative to existing tiles
      
      // If we have a single tile placed and the word starts with dots,
      // we need to determine if it's extending horizontally or vertically
      
      // For now, let's use a heuristic: if the word has more dots than letters, it's likely vertical
      // because vertical words often connect to existing horizontal words
      const newTileCount = word.length - dotPositions.length;
      if (newTileCount === 1 && dotPositions.length > 0) {
        // Single new tile with existing tiles - likely vertical (connecting to horizontal word)
        isHorizontal = false;
      } else {
        // Default to horizontal for other cases
        isHorizontal = true;
      }
    } else {
      // No dots at start - can't determine direction from this alone
      isHorizontal = true; // Default assumption
    }
  }
  
  // If the word starts with dots (existing letters), check both possible positions
  if (word && word.startsWith('.')) {
    // Count the number of leading dots
    const leadingDots = word.match(/^\.+/)[0].length;
    
    if (isHorizontal) {
      // For horizontal words, check if there's a tile one column back
      if (boardState && firstCol > 0) {
        const hasTileOneBack = boardState[firstRow] && boardState[firstRow][firstCol - 1] && 
                              typeof boardState[firstRow][firstCol - 1] === 'string';
        if (hasTileOneBack) {
          // There's a tile one column back, so adjust the position
          firstCol = Math.max(0, firstCol - leadingDots);
        }
        // If no tile one back, keep the original position
      } else {
        // No board state available, assume adjustment is needed
        firstCol = Math.max(0, firstCol - leadingDots);
      }
    } else {
      // For vertical words, check if there's a tile one row back
      if (boardState && firstRow > 0) {
        const hasTileOneBack = boardState[firstRow - 1] && boardState[firstRow - 1][firstCol] && 
                              typeof boardState[firstRow - 1][firstCol] === 'string';
        if (hasTileOneBack) {
          // There's a tile one row back, so adjust the position
          firstRow = Math.max(0, firstRow - leadingDots);
        }
        // If no tile one back, keep the original position
      } else {
        // No board state available, assume adjustment is needed
        firstRow = Math.max(0, firstRow - leadingDots);
      }
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
 * @param {Array} boardState - The current board state to check for existing tiles
 * @param {Array} player1Rack - Player 1's current rack
 * @param {Array} player2Rack - Player 2's current rack
 * @param {Array} pool - Current tile pool
 * @returns {string} .gcg file content
 */
export const generateGCGContent = (moveHistory, player1Name, player2Name, boardState = null, player1Rack = [], player2Rack = [], pool = []) => {
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
    const location = formatGCGLocation(boardDiff, displayWord, boardState);
    
    // Check if this move caused the player to go out (rack is empty)
    const isGoingOut = rack && rack.length === 0;
    
    // If player is going out, we need to handle the opponent's remaining tiles
    if (isGoingOut) {
      // Find the opponent's rack from the next move or calculate it
      // For now, we'll assume the opponent's rack is available in the move data
      // This might need to be enhanced based on how the move history is structured
      
      // If this is the last move and the player went out, we need to show opponent's tiles
      if (index === moveHistory.length - 1) {
        // This is the final move where someone went out
        // We need to show the opponent's remaining tiles in parentheses
        // For now, we'll add a placeholder - this would need to be calculated from the game state
        displayWord = displayWord || 'OUT';
      }
    }
    
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
    
    // If this move caused the player to go out, add the opponent's remaining tiles
    if (isGoingOut && index === moveHistory.length - 1) {
      // This is the final move where someone went out
      // Calculate opponent's remaining tiles and their value
      const opponentRack = isPlayer1 ? player2Rack : player1Rack;
      const opponentName = isPlayer1 ? player2Name : player1Name;
      const opponentPlayerName = formatPlayerName(opponentName);
      
      if (opponentRack && opponentRack.length > 0) {
        // Calculate the value of opponent's remaining tiles
        const tileValue = calculateTileValue(opponentRack);
        
        // Add the tile value to the opponent's score
        if (isPlayer1) {
          player2Total += tileValue;
        } else {
          player1Total += tileValue;
        }
        
        // Format: >OpponentName: (REMAINING_TILES) +TILE_VALUE FINAL_TOTAL
        const remainingTiles = opponentRack.join('');
        gcgContent += `>${opponentPlayerName}: (${remainingTiles}) +${tileValue} ${isPlayer1 ? player2Total : player1Total}\n`;
      }
    }
  });
  
  return gcgContent;
};

/**
 * Calculates the total value of tiles in a rack
 * @param {Array} rack - Array of tile letters
 * @returns {number} Total value of the tiles
 */
const calculateTileValue = (rack) => {
  return rack.reduce((sum, tile) => {
    const value = tile === '?' || tile === '*' ? 0 : 
      tile === 'A' || tile === 'E' || tile === 'I' || tile === 'O' || tile === 'U' || 
      tile === 'L' || tile === 'N' || tile === 'S' || tile === 'T' || tile === 'R' ? 1 :
      tile === 'D' || tile === 'G' ? 2 :
      tile === 'B' || tile === 'C' || tile === 'M' || tile === 'P' ? 3 :
      tile === 'F' || tile === 'H' || tile === 'V' || tile === 'W' || tile === 'Y' ? 4 :
      tile === 'K' ? 5 :
      tile === 'J' || tile === 'X' ? 8 :
      tile === 'Q' || tile === 'Z' ? 10 : 0;
    return sum + value;
  }, 0);
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