import { highlightPreviousMove, updateBoard } from "./boardFunctions";

// Main handleMove function that uses pre-parsed moves
export const handleMove = (superLastMoveIndex, lastMoveIndex, thisMoveIndex, nextMoveIndex, type, state, parsedMoves) => {
  console.log(parsedMoves);
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

  // Handle board updates
  if (thisMove?.player === nextMove?.player && thisMove?.location === "--") {
    updateBoardAndPoolWithParsedMove("add", thisMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords);
  } else if (nextMove?.location && nextMove.location[0] !== "-") {
    updateBoardAndPoolWithParsedMove("remove", nextMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords);
    
    if (thisMove && thisMove.location && thisMove.location[0] !== "-") {
      setCurrentMoveCoords(highlightPreviousMove(thisMove.location, thisMove.word, boardCoords));
    }
  } else if (nextMove?.location === "--") {
    updateBoardAndPoolWithParsedMove("add", thisMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords);
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

  // Handle board updates
  if (thisMove?.player === lastMove?.player && thisMove?.location === "--") {
    updateBoardAndPoolWithParsedMove("remove", lastMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords);
  } else if (thisMove?.location && thisMove.location[0] !== "-") {
    updateBoardAndPoolWithParsedMove("add", thisMove, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords);
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

const updateBoardAndPoolWithParsedMove = (type, move, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords) => {
  if (!move) return;
  
  const props = { location: move.location, play: move.word, type, boardCoords, origBoard };
  const board = updateBoard(props);
  setCurrentMoveCoords(board[0]);
  setBoardCoords(board[1]);
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

 