import { letterLookup } from "../components/AppContent/References/staticData";
import Cell from "../components/AppContent/Board/Cell";
import cellType from "../components/AppContent/Board/cellType";
import { parseGCG } from "../utils/gcgParser.js";

export const getMove = (moveString, currentMoveCoords, parsedMoves = null, moveIndex = 0) => {
    let play;
    
    // Handle negative moveIndex (initial state)
    if (moveIndex < 0) {
      if (moveString) {
        const parsedMoves = parseGCG(moveString);
        if (parsedMoves.length > 0) {
          const move = parsedMoves[0];
          if (move.location === '--') {
            play = "Challenge";
          } else if (move.word) {
            play = move.location + " " + move.word;
          } else {
            play = move.location || "Pass";
          }
        } else {
          play = "N/A";
        }
      } else {
        play = "N/A";
      }
    } else if (parsedMoves && parsedMoves[moveIndex]) {
      // Use pre-parsed move data
      console.log(`🔍 getMove using pre-parsed data for move ${moveIndex}`);
      const move = parsedMoves[moveIndex];
    
      // Handle different move types
      if (move.location === '--') {
        // Challenge
        play = "Challenge";
      } else if (move.word) {
        // Normal play
        play = move.location + " " + move.word;
      } else {
        // Pass or other special case
        play = move.location || "Pass";
      }
    } else if (moveString) {
      // Fallback to parsing (for backward compatibility)
      console.log(`🔍 getMove falling back to parsing for move ${moveIndex}`);
      const parsedMoves = parseGCG(moveString);
      
      if (parsedMoves.length > 0) {
        const move = parsedMoves[0]; // Get first move from the string
        
        // Handle different move types
        if (move.location === '--') {
          // Challenge
          play = "Challenge";
        } else if (move.word) {
          // Normal play
          play = move.location + " " + move.word;
        } else {
          // Pass or other special case
          play = move.location || "Pass";
        }
      } else {
        play = "N/A";
      }
    } else {
      play = "N/A";
    }
    
    const letters = currentMoveCoords.filter(element => /^\s*[A-Za-z]\s*$/.test(element));
    let result = play;
    letters.forEach((letter) => {
      result = result.replace(".", "(" + letter + ")");
      result = result.replace(")(", "");
    });
    return result;
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

export const createBoard = (boardCoords = [], currentMoveCoords = [], tiles = [], theme = "STANDARD", color, complementaryColor, blankTiles = [], lastMoveCoordinates = []) => {
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
          
          // For blank tiles, we need to pass the lowercase letter to show the curved effect
          let displayLetter = col;
          if (isBlank && typeof col === 'string' && col.length === 1) {
            displayLetter = col.toLowerCase();
          }
          
          return Cell({
            rowIndex,
            colIndex,
            bonus: cellType(displayLetter, lightenedCell),
            type: "board",
            theme,
            tiles,
            color,
            isBlank,
            isLastMove
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