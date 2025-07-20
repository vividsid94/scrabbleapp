// GCG Generator for Bot Moves
// Uses perfect startPosition data from bot API instead of deriving from board state

/**
 * Formats a player name for .gcg format (replace spaces with underscores)
 * @param {string} playerName - The player name
 * @returns {string} Formatted player name
 */
export const formatPlayerName = (playerName) => {
  return playerName.replace(/\s+/g, '_');
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
 * Generates .gcg content from bot move data - uses perfect startPosition from API
 * @param {Array} moveHistory - Array of moves in the game
 * @param {string} player1Name - Name of player 1
 * @param {string} player2Name - Name of player 2
 * @param {Array} player1Rack - Player 1's current rack
 * @param {Array} player2Rack - Player 2's current rack
 * @returns {string} .gcg file content
 */
export const generateGCGContentForBotMoves = (moveHistory, player1Name, player2Name, player1Rack = [], player2Rack = []) => {
  let gcgContent = '#character-encoding UTF-8\n';
  
  // Add player information
  gcgContent += `#player1 ${formatPlayerName(player1Name)} ${player1Name}\n`;
  gcgContent += `#player2 ${formatPlayerName(player2Name)} ${player2Name}\n`;
  
  let player1Total = 0;
  let player2Total = 0;
  
  // Process each move
  moveHistory.forEach((move, index) => {
    const { score, player, word, boardDiff, rack, startPosition, direction } = move;
    
    // Determine which player made the move
    const isPlayer1 = player === player1Name;
    const playerName = formatPlayerName(player);
    
    // Handle special cases
    let displayWord = word;
    let displayScore = score;
    
    if (score === 0 && player && player.includes('exchanged')) {
      displayWord = 'Exchange';
    } else if (score === 0 && (!displayWord || displayWord === '')) {
      displayWord = 'Pass';
    }
    
    // Convert word to .gcg format (replace parentheses with dots)
    displayWord = convertWordToGCGFormat(displayWord);
    
    // Get location - use perfect startPosition from bot API
    let location = '--'; // Default for passes/exchanges
    if (startPosition && displayWord !== 'Pass' && displayWord !== 'Exchange') {
      location = startPosition;
    }
    
    // Get rack display
    const rackDisplay = rack || '';
    
    // Update running totals
    if (isPlayer1) {
      player1Total += displayScore;
    } else {
      player2Total += displayScore;
    }
    
    // Format the move line
    // Format: >PlayerName: RACK LOCATION WORD +SCORE TOTAL
    const scoreDisplay = displayScore > 0 ? `+${displayScore}` : displayScore.toString();
    const totalDisplay = isPlayer1 ? player1Total : player2Total;
    
    gcgContent += `>${playerName}: ${rackDisplay} ${location} ${displayWord} ${scoreDisplay} ${totalDisplay}\n`;
    
    // Handle going out (rack is empty)
    const isGoingOut = rack && rack.length === 0;
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