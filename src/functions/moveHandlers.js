import { highlightPreviousMove, updateBoard } from "./boardFunctions";

// Main handleMove function that uses pre-parsed moves
export const handleMove = (superLastMoveIndex, lastMoveIndex, thisMoveIndex, nextMoveIndex, type, state, parsedMoves) => {
  // Get move objects from parsed moves
  const moves = {
    superlastmove: parsedMoves[superLastMoveIndex] || null,
    lastmove: parsedMoves[lastMoveIndex] || null,
    thismove: parsedMoves[thisMoveIndex] || null,
    nextmove: parsedMoves[nextMoveIndex] || null
  };

  // Handle move based on type 
  if (type === "previous") {
    handlePreviousMoveWithParsedMoves(moves, state, parsedMoves);
  } else {
    handleNextMoveWithParsedMoves(moves, state, parsedMoves);
  }
};

const handlePreviousMoveWithParsedMoves = (moves, state, parsedMoves) => {
  const { setBoardCoords, setCurrentMoveCoords, setPlayer1points, setPlayer2points, setPointsScored, boardCoords, origBoard } = state;
  
  const thisMove = moves['thismove'];
  const nextMove = moves['nextmove'];
  const firstMovePlayerName = parsedMoves[0]?.player || 'empty';
  const thisMovePlayerName = thisMove?.player || 'empty';
  
  // Find current move index for saved games
  const currentMoveIndex = parsedMoves.findIndex(m => m === nextMove);
  const thisMoveIndex = parsedMoves.findIndex(m => m === thisMove);

  // Handle board updates
  if (thisMove?.player === nextMove?.player && thisMove?.location === "--") {
    updateBoardAndPoolWithParsedMove("add", thisMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, parsedMoves, thisMoveIndex);
  } else if (nextMove?.location && nextMove.location[0] !== "-") {
    updateBoardAndPoolWithParsedMove("remove", nextMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, parsedMoves, currentMoveIndex);
    
    // Highlighting is now handled inside updateBoardWithBoardDiff for saved games
    // For regular games, use location/word
    if (thisMove && !thisMove.isSavedGame && thisMove.location && thisMove.location[0] !== "-") {
      setCurrentMoveCoords(highlightPreviousMove(thisMove.location, thisMove.word, boardCoords));
    }
  } else if (nextMove?.location === "--") {
    updateBoardAndPoolWithParsedMove("add", thisMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, parsedMoves, thisMoveIndex);
  }

  // Update scores
  updateScoresWithParsedMoves(moves, thisMovePlayerName, firstMovePlayerName, setPlayer1points, setPlayer2points);
  setPointsScored(thisMove?.score || 0);
};

const handleNextMoveWithParsedMoves = (moves, state, parsedMoves) => {
  const { setBoardCoords, setCurrentMoveCoords, setPlayer1points, setPlayer2points, setPointsScored, boardCoords, origBoard } = state;
  
  const thisMove = moves['thismove'];
  const lastMove = moves['lastmove'];
  const firstMovePlayerName = parsedMoves[0]?.player || 'empty';
  const thisMovePlayerName = thisMove?.player || 'empty';
  
  // Find current move index for saved games
  const thisMoveIndex = parsedMoves.findIndex(m => m === thisMove);
  const lastMoveIndex = parsedMoves.findIndex(m => m === lastMove);

  // Handle board updates
  if (thisMove?.player === lastMove?.player && thisMove?.location === "--") {
    updateBoardAndPoolWithParsedMove("remove", lastMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, parsedMoves, lastMoveIndex);
  } else if (thisMove?.location && thisMove.location[0] !== "-") {
    updateBoardAndPoolWithParsedMove("add", thisMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, parsedMoves, thisMoveIndex);
  }

  // Update scores
  if (thisMove?.player !== lastMove?.player) {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer1points(thisMove?.total || 0);
    } else {
      setPlayer2points(thisMove?.total || 0);
    }
  } else {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer1points(thisMove?.total || thisMove?.score || 0);
    } else {
      setPlayer2points(thisMove?.score || thisMove?.total || 0);
    }
  }

  setPointsScored(thisMove?.score || 0);
};

const updateBoardAndPoolWithParsedMove = (type, move, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, parsedMoves, currentMoveIndex) => {
  if (!move) return;
  
  // For saved games, use boardDiff directly instead of location/word
  if (move.isSavedGame && move.boardDiff) {
    updateBoardWithBoardDiff(move.boardDiff, type, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, parsedMoves, currentMoveIndex);
    return;
  }
  
  // For regular GCG games, use location and word
  const props = { location: move.location, play: move.word, type, boardCoords, origBoard };
  const board = updateBoard(props);
  setCurrentMoveCoords(board[0]);
  setBoardCoords(board[1]);
};

// Helper function to update board using boardDiff (for saved games)
const updateBoardWithBoardDiff = (boardDiff, type, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, parsedMoves, currentMoveIndex) => {
  if (!boardDiff || boardDiff.length === 0) return;
  
  let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
  let newBoardCoords;
  let curMoveCoords = [];
  
  if (type === "add") {
    // For saved games, rebuild board from scratch up to currentMoveIndex to ensure correctness
    // This prevents issues where the board state might already have future moves applied
    if (parsedMoves && currentMoveIndex !== undefined && currentMoveIndex >= 0) {
      newBoardCoords = parsedOrigBoardCoords.map(row => row.map(cell => cell));
      
      // Apply all moves up to and including the current move
      for (let i = 0; i <= currentMoveIndex; i++) {
        const move = parsedMoves[i];
        if (move && move.boardDiff && move.boardDiff.length > 0) {
          move.boardDiff.forEach(({ row, col, value }) => {
            if (row !== undefined && col !== undefined && row >= 0 && row < 15 && col >= 0 && col < 15) {
              newBoardCoords[row][col] = value;
            }
          });
        }
      }
      
      // Get coordinates for highlighting the current move
      if (parsedMoves[currentMoveIndex] && parsedMoves[currentMoveIndex].boardDiff) {
        parsedMoves[currentMoveIndex].boardDiff.forEach(({ row, col }) => {
          if (row !== undefined && col !== undefined && row >= 0 && row < 15 && col >= 0 && col < 15) {
            curMoveCoords.push([row, col]);
          }
        });
      }
    } else {
      // Fallback: just place the tiles (for non-saved games or edge cases)
      newBoardCoords = boardCoords.map(row => [...row]); // Deep copy
      boardDiff.forEach(({ row, col, value }) => {
        if (row !== undefined && col !== undefined && row >= 0 && row < 15 && col >= 0 && col < 15) {
          newBoardCoords[row][col] = value;
          curMoveCoords.push([row, col]);
        }
      });
    }
  } else {
    // Remove: rebuild board from scratch by applying all moves up to (but not including) this move
    // This is necessary because we don't know what the board looked like before this move
    newBoardCoords = parsedOrigBoardCoords.map(row => row.map(cell => cell));
    
    // Apply all moves up to the move before the one we're removing
    if (parsedMoves && currentMoveIndex !== undefined && currentMoveIndex > 0) {
      for (let i = 0; i < currentMoveIndex - 1; i++) {
        const move = parsedMoves[i];
        if (move && move.boardDiff && move.boardDiff.length > 0) {
          move.boardDiff.forEach(({ row, col, value }) => {
            if (row !== undefined && col !== undefined && row >= 0 && row < 15 && col >= 0 && col < 15) {
              newBoardCoords[row][col] = value;
            }
          });
        }
      }
    }
    
    // Get coordinates for highlighting the previous move
    if (currentMoveIndex > 0 && parsedMoves[currentMoveIndex - 1]) {
      const prevMove = parsedMoves[currentMoveIndex - 1];
      if (prevMove.boardDiff) {
        prevMove.boardDiff.forEach(({ row, col }) => {
          if (row !== undefined && col !== undefined && row >= 0 && row < 15 && col >= 0 && col < 15) {
            curMoveCoords.push([row, col]);
          }
        });
      }
    }
  }
  
  setCurrentMoveCoords(curMoveCoords);
  setBoardCoords(newBoardCoords);
};

const updateScoresWithParsedMoves = (moves, thisMovePlayerName, firstMovePlayerName, setPlayer1points, setPlayer2points) => {
  const thisMove = moves['thismove'];
  const nextMove = moves['nextmove'];
  const lastMove = moves['lastmove'];
  
  if (thisMove?.player !== nextMove?.player) {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer2points(lastMove?.total || lastMove?.score || 0);
    } else {
      if (thisMove?.player !== lastMove?.player) {
        setPlayer1points(lastMove?.total || lastMove?.score || 0);
      } else {
        setPlayer1points(moves['superlastmove']?.total || 0);
      }
    }
  } else {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer1points(thisMove?.total || 0);
    } else {
      setPlayer2points(thisMove?.total || 0);
    }
  }
};

 