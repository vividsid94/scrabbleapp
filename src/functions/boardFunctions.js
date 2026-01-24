import { letterLookup } from "../components/AppContent/References/staticData";
import Cell from "../components/AppContent/Board/Cell";
import cellType from "../components/AppContent/Board/cellType";
import { parseGCG } from "../utils/gcgParser.js";

// Process a parsed move with through letter logic
export const processParsedMove = (parsedMove, currentMoveCoords) => {
  if (!parsedMove) return "N/A";
  
  let play;
  
  // Handle different move types
  if (parsedMove.location === '--') {
    // Challenge
    play = "Challenge";
  } else if (parsedMove.word) {
    // Normal play
    play = parsedMove.word;
  } else {
    // Pass or other special case
    play = parsedMove.location || "Pass";
  }
  
  // Apply through letter processing
  const letters = currentMoveCoords.filter(element => /^\s*[A-Za-z]\s*$/.test(element));
  let result = play;
  letters.forEach((letter) => {
    result = result.replace(".", "(" + letter + ")");
    result = result.replace(")(", "");
  });
  
  return result;
};

export const getMove = (moveString, currentMoveCoords, parsedMoves = null, moveIndex = 0) => {
    let move;
    
    // Handle negative moveIndex (initial state)
    if (moveIndex < 0) {
      if (moveString) {
        const parsedMoves = parseGCG(moveString);
        move = parsedMoves.length > 0 ? parsedMoves[0] : null;
      } else {
        move = null;
      }
    } else if (parsedMoves && parsedMoves[moveIndex]) {
      // Use pre-parsed move data
      move = parsedMoves[moveIndex];
    } else if (moveString) {
      // Fallback to parsing (for backward compatibility)
      const parsedMoves = parseGCG(moveString);
      move = parsedMoves.length > 0 ? parsedMoves[0] : null;
    } else {
      move = null;
    }
    
    return processParsedMove(move, currentMoveCoords);
}

export const extractLocation = (str) => {
    if (!str) {
        console.warn('extractLocation called with null/undefined str:', str);
        return [null, null];
    }
    let parts = str.match(/^(\d+)(\D+)|^(\D+)(\d+)$/);
    if (!parts) {
        console.warn('extractLocation regex match failed for str:', str);
        return [null, null];
    }
    let part1 = parts[1] || parts[3];
    let part2 = parts[2] || parts[4];
    return [part1, part2];
} 

export const highlightPreviousMove = (location, play, boardCoords) => {
    let curMoveCoords = [];
    const locationParts = extractLocation(location);
    const part1 = locationParts[0]; 
    const part2 = locationParts[1];
    
    // Return empty array if location is invalid
    if (!part1 || !part2) {
        return curMoveCoords;
    }
    
    let i, coord1, coord2;
    if (Number.isInteger(Number(part1))) {
      // Horizontal play
      coord1 = part1 - 1;
      coord2 = letterLookup[part2.toUpperCase()] - 1; 
      for (i = 0; i < play.length; i++) {
        if (play[i] !== '.') {
          curMoveCoords.push([coord1, coord2 + i]);
        } else {
          curMoveCoords.push(boardCoords[coord1][coord2 + i]);
        }
      }
    } else {
      // Vertical play
      coord1 = part2 - 1;
      coord2 = letterLookup[part1.toUpperCase()] - 1;
      for (i = 0; i < play.length; i++) {
        if (play[i] !== '.') {
          curMoveCoords.push([coord1 + i, coord2]);
        } else {
          curMoveCoords.push(boardCoords[coord1 + i][coord2]);
        }
      }
    }
    return curMoveCoords;
} 

export const createBoard = (boardCoords = [], currentMoveCoords = [], tiles = [], theme = "STANDARD", color, complementaryColor, blankTiles = [], lastMoveCoordinates = [], lightMode = 'dark', invalidWordCoords = [], premiumSquares = null) => {
  // Create a mapping from (row, col) to premium square type if premiumSquares is provided
  const premiumSquareMap = {};
  if (premiumSquares && Array.isArray(premiumSquares)) {
    premiumSquares.forEach(square => {
      const key = `${square.row},${square.col}`;
      // Map backend types to board number system:
      // "DLS" -> 1, "TLS" -> 2, "DWS" -> 3, "TWS" -> 4, "CENTER" -> 0 (or could be 3)
      if (square.type === 'DLS') {
        premiumSquareMap[key] = 1;
      } else if (square.type === 'TLS') {
        premiumSquareMap[key] = 2;
      } else if (square.type === 'DWS') {
        premiumSquareMap[key] = 3;
      } else if (square.type === 'TWS') {
        premiumSquareMap[key] = 4;
      } else if (square.type === 'CENTER') {
        premiumSquareMap[key] = 0; // Center is just a regular cell visually
      }
    });
  }
  
  return (
      boardCoords.map((row, rowIndex) => (
          row.map((col, colIndex) => {
          const isCurrentMove = currentMoveCoords.some(coord => coord[0] === rowIndex && coord[1] === colIndex);
          const lightenedCell = isCurrentMove;
          const isBlank = blankTiles.some(tile => {
            const matches = tile.row === rowIndex && tile.col === colIndex;
            return matches;
          });
          const isLastMove = lastMoveCoordinates.some(coord => coord.row === rowIndex && coord.col === colIndex);
          const isInvalidWord = invalidWordCoords.some(coord => coord.row === rowIndex && coord.col === colIndex);
          
          // For blank tiles, we need to pass the lowercase letter to show the curved effect
          let displayLetter = col;
          if (isBlank && typeof col === 'string' && col.length === 1) {
            displayLetter = col.toLowerCase();
          }
          
          // Determine the premium square type for this cell (if available)
          const premiumSquareType = premiumSquareMap[`${rowIndex},${colIndex}`];
          
          // If premiumSquares is provided and there's no tile, use the premium square type
          // If there's a tile, pass the tile letter but also pass the premium square type for background
          let cellTypeValue = displayLetter;
          if (premiumSquareType !== undefined && typeof col !== 'string') {
            // No tile, use the premium square type for both value and background
            cellTypeValue = premiumSquareType;
          }
          
          return Cell({
            rowIndex,
            colIndex,
            bonus: cellType(cellTypeValue, lightenedCell, lightMode, premiumSquareType),
            type: "board",
            theme,
            tiles,
            color,
            isBlank,
            isLastMove,
            isInvalidWord
          });
          })
      ))
  ); 
}

export const updateBoard = ({location, play, type, boardCoords, origBoard}) => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number))
    let newBoardCoords = [...boardCoords];
    let curMoveCoords = [];
    const locationParts = extractLocation(location);
    const part1 = locationParts[0]; 
    const part2 = locationParts[1];
    let i, coord1, coord2;
    if (Number.isInteger(Number(part1))) {
      // Horizontal play
      coord1 = part1 - 1;
      coord2 = letterLookup[part2.toUpperCase()] - 1; 
      for (i = 0; i < play.length; i++) {
        if (play[i] !== '.') {
          newBoardCoords[coord1][coord2 + i] = type === "add" ? play[i] : parsedOrigBoardCoords[coord1][coord2 + i];
          curMoveCoords.push([coord1, coord2 + i]);
        } else {
          curMoveCoords.push(boardCoords[coord1][coord2 + i]);
        }
      }
    } else {
      // Vertical play
      coord1 = part2 - 1;
      coord2 = letterLookup[part1.toUpperCase()] - 1;
      for (i = 0; i < play.length; i++) {
        if (play[i] !== '.') {
          newBoardCoords[coord1 + i][coord2] = type === "add" ? play[i] : parsedOrigBoardCoords[coord1 + i][coord2];
          curMoveCoords.push([coord1 + i, coord2]);
        } else {
          curMoveCoords.push(boardCoords[coord1 + i][coord2]);
        }
      }
    }
    return [curMoveCoords, newBoardCoords];
} 