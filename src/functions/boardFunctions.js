import { letterLookup } from "../components/AppContent/References/staticData";
import Cell from "../components/AppContent/Board/Cell";
import cellType from "../components/AppContent/Board/CellType";
export const getMove = (moveString, currentMoveCoords) => {
    let play;
    if (moveString){
      let move = moveString.replace(/\s+/g, ' ');
      const parts = move.split(" ");
      play = parts[2] + " " + parts[3];
    }
    else{
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
    let parts = str.match(/^(\d+)(\D+)|^(\D+)(\d+)$/);
    let part1 = parts[1] || parts[3];
    let part2 = parts[2] || parts[4];
    return [part1, part2];
} 

export const highlightPreviousMove = (location, play, boardCoords) => {
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

export const createBoard = (boardCoords, currentMoveCoords, tiles, theme) => {
    return (
        boardCoords.map((row, rowIndex) => (
            row.map((col, colIndex) => {
            let border = { top: false, bottom: false, left: false, right: false };
            if (currentMoveCoords.some(coord => coord[0] === rowIndex && coord[1] === colIndex)) {  
                if (!currentMoveCoords.some(coord => coord[0] === rowIndex - 1 && coord[1] === colIndex)) {
                border.top = true;
                }
                if (!currentMoveCoords.some(coord => coord[0] === rowIndex + 1 && coord[1] === colIndex)) {
                border.bottom = true;
                }
                if (!currentMoveCoords.some(coord => coord[0] === rowIndex && coord[1] === colIndex - 1)) {
                border.left = true;
                }
                if (!currentMoveCoords.some(coord => coord[0] === rowIndex && coord[1] === colIndex + 1)) {
                border.right = true;
                }
                return Cell(rowIndex, colIndex, cellType(col, "standardColor", border, tiles), "board", theme, tiles);
            } else {
                return Cell(rowIndex, colIndex, cellType(col, "lightColor", border, tiles), "board", theme, tiles);
            }
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