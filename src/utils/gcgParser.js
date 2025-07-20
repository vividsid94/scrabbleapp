/**
 * GCG Parser - Converts raw GCG format to structured move data
 * Handles variable field counts and different move types
 */

let parseCount = 0;

export const parseGCG = (gcgString) => {
  parseCount++;
  console.log(`🔍 parseGCG called ${parseCount} times`);
  
  const lines = gcgString.split('\n').filter(line => line.trim());
  const moves = [];
  
  for (const line of lines) {
    if (line.startsWith('>')) {
      const move = parseMoveLine(line);
      if (move) {
        moves.push(move);
      }
    }
  }
  
  return moves;
};

const parseMoveLine = (line) => {
  // Remove the '>' and split by spaces
  const content = line.substring(1);
  const parts = content.split(' ').filter(part => part.trim());
  
  if (parts.length < 3) return null;
  
  // First part is "Player:" (with colon)
  const playerPart = parts[0];
  const player = playerPart.substring(0, playerPart.length - 1); // Remove the colon
  
  // Second part is the rack
  const rack = parts[1];
  
  // Parse remaining fields by content
  const remainingParts = parts.slice(2);
  
  let location = null;
  let word = null;
  let score = null;
  let total = null;
  
  for (let i = 0; i < remainingParts.length; i++) {
    const part = remainingParts[i];
    
    // Check if it's a location (contains letter + number or is '--')
    if (isLocation(part)) {
      location = part;
    }
    // Check if it's a score (starts with + or -)
    else if (isScore(part)) {
      score = parseInt(part);
    }
    // Check if it's a word (contains letters, not just numbers)
    else if (isWord(part)) {
      word = part;
    }
    // Check if it's a total (just a number) - this should be last
    else if (isTotal(part)) {
      total = parseInt(part);
    }
  }
  
  return {
    player,
    rack,
    location,
    word,
    score,
    total
  };
};

const isLocation = (part) => {
  // Location patterns: 8F, A1, --, etc.
  return /^[A-O]\d+$|^\d+[A-O]$|^--$/.test(part);
};

const isScore = (part) => {
  // Score patterns: +123, -149, etc.
  return /^[+-]\d+$/.test(part);
};

const isTotal = (part) => {
  // Total patterns: just a number
  return /^\d+$/.test(part);
};

const isWord = (part) => {
  // Word patterns: contains letters, not just numbers
  // Handle words with lowercase letters (blank tiles) and periods
  return /^[A-Za-z.]+$/.test(part) && !/^\d+$/.test(part);
};

// Test function to validate our parser
export const testParser = () => {
  const testGCG = `#character-encoding UTF-8
#player1 Josh Josh
#player2 Noah Noah
>Josh: ?DFGOTU H7 FUG +14 14
>Noah: ACEEHIT I7 AHI +23 23
>Josh: ?ADEOOT J1 TAbOOED +68 82
>Noah: CEEERTW K5 EWE +29 52
>Josh: EEOPRTU 1H OU.PETER +149 231
>Josh: EEOPRTU --  -149 82`;

  const moves = parseGCG(testGCG);
  console.log('Parsed moves:', moves);
  return moves;
}; 