/**
 * Word Display Utilities
 * 
 * Common functions for displaying words in a user-friendly format
 */

/**
 * Convert a word with dots to show actual letters in parentheses
 * Example: ".HAMNOSE." becomes "(R)HAMNOSE(E)" where R and E are existing letters
 * 
 * @param {string} word - The word with dots representing existing tiles
 * @param {Array} board - The 15x15 board array
 * @param {number} startRow - Starting row position (0-based)
 * @param {number} startCol - Starting column position (0-based)
 * @param {string} direction - 'right' for horizontal, 'down' for vertical
 * @returns {string} The word with existing letters in parentheses
 */
export function convertWordWithDots(word, board, startRow, startCol, direction) {
  if (!word || !word.includes('.')) {
    return word; // No dots, return as is
  }
  
  let result = '';
  let wordIndex = 0;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    
    if (char === '.') {
      // This is an existing tile on the board
      let boardRow, boardCol;
      
      if (direction === 'down') {
        // Vertical placement: increment row
        boardRow = startRow + wordIndex;
        boardCol = startCol;
      } else {
        // Horizontal placement: increment column
        boardRow = startRow;
        boardCol = startCol + wordIndex;
      }
      
      // Get the actual letter from the board
      const actualLetter = board[boardRow] && board[boardRow][boardCol];
      if (actualLetter) {
        result += `(${actualLetter})`;
      } else {
        result += '.'; // Fallback if we can't find the letter
      }
    } else {
      // This is a new tile being placed
      result += char;
    }
    
    wordIndex++;
  }
  
  return result;
} 