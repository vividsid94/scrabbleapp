import { highlightPreviousMove, updateBoard } from "./boardFunctions";
import { addToPool, removeFromPool } from "./poolFunctions";

export const handleMove = (superLastMove, lastMove, thisMove, nextMove, type, state) => {
  // Clean up move strings
  const moves = {
    superlastmove: cleanMove(superLastMove),
    lastmove: cleanMove(lastMove),
    thismove: cleanMove(thisMove),
    nextmove: cleanMove(nextMove)
  };

  // Parse move details
  for (const id in moves) {
    const move = moves[id];
    if (move.parts) {
      move.location = move.parts[2];
      move.play = move.parts[3];
      move.points = move.parts[4];
      move.score = move.parts[5];
    }
  }

  // Handle move based on type 
  if (type === "previous") {
    handlePreviousMove(moves, state);
  } else {
    handleNextMove(moves, state);
  }
};

const cleanMove = (move) => {
  const cleanedMove = move ? move.replace(/\s+/g, ' ') : null;
  return {
    move: cleanedMove,
    parts: cleanedMove ? cleanedMove.split(" ") : null,
    location: null,
    play: null,
    points: null,
    score: null 
  };
};

const handlePreviousMove = (moves, state) => {
  const { setBoardCoords, setPool, setCurrentMoveCoords, setPlayer1points, setPlayer2points, setPointsScored, boardCoords, origBoard, moveSet } = state;
  
  const moveName = moves['thismove'].move ? moves['thismove'].parts[0] : 'empty';
  const nextMoveName = moves['nextmove'].move ? moves['nextmove'].parts[0] : 'empty';
  const firstMovePlayerName = moveSet[0].split(" ")[0];
  const thisMovePlayerName = moves['thismove'].move ? moves['thismove'].parts[0] : 'empty';

  // Handle board updates
  if (moveName === nextMoveName && moves['thismove'].location === "--") {
    updateBoardAndPool("add", moves['thismove'], boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, setPool, pool => removeFromPool(moves['thismove'].play, pool));
  } else if (moves['nextmove'].location && moves['nextmove'].location[0] !== "-") {
    updateBoardAndPool("remove", moves['nextmove'], boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, setPool, pool => addToPool(moves['nextmove'].play, pool));
    
    if (moves['thismove'].move && moves['thismove'].location[0] !== "-") {
      setCurrentMoveCoords(highlightPreviousMove(moves['thismove'].location, moves['thismove'].play, boardCoords));
    }
  } else if (moves['nextmove'].location === "--") {
    updateBoardAndPool("add", moves['thismove'], boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, setPool, pool => removeFromPool(moves['thismove'].play, pool));
  }

  // Update scores
  updateScores(moves, moveName, nextMoveName, thisMovePlayerName, firstMovePlayerName, setPlayer1points, setPlayer2points);
  setPointsScored(moves['thismove'].points);
};

const handleNextMove = (moves, state) => {
  const { setBoardCoords, setPool, setCurrentMoveCoords, setPlayer1points, setPlayer2points, setPointsScored, boardCoords, origBoard, moveSet } = state;
  
  const moveName = moves['thismove'].move ? moves['thismove'].parts[0] : 'empty';
  const lastMoveName = moves['lastmove'].move ? moves['lastmove'].parts[0] : 'empty';
  const firstMovePlayerName = moveSet[0].split(" ")[0];
  const thisMovePlayerName = moves['thismove'].parts[0];

  // Handle board updates
  if (moveName === lastMoveName && moves['thismove'].location === "--") {
    updateBoardAndPool("remove", moves['lastmove'], boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, setPool, pool => addToPool(moves['lastmove'].play, pool));
  } else if (moves['thismove'].location && moves['thismove'].location[0] !== "-") {
    updateBoardAndPool("add", moves['thismove'], boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, setPool, pool => removeFromPool(moves['thismove'].play, pool));
  }

  // Update scores
  if (moveName !== lastMoveName) {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer1points(moves['thismove'].score);
    } else {
      setPlayer2points(moves['thismove'].score);
    }
  } else {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer1points(moves['thismove'].score || moves['thismove'].points);
    } else {
      setPlayer2points(moves['thismove'].points || moves['thismove'].score);
    }
  }

  setPointsScored(moves['thismove'].points);
};

const updateBoardAndPool = (type, move, boardCoords, origBoard, setCurrentMoveCoords, setBoardCoords, setPool, poolUpdater) => {
  const props = { location: move.location, play: move.play, type, boardCoords, origBoard };
  const board = updateBoard(props);
  setCurrentMoveCoords(board[0]);
  setBoardCoords(board[1]);
  setPool(poolUpdater);
};

const updateScores = (moves, moveName, nextMoveName, thisMovePlayerName, firstMovePlayerName, setPlayer1points, setPlayer2points) => {
  if (moveName !== nextMoveName) {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer2points(moves['lastmove'].move ? (moves['lastmove'].score || moves['lastmove'].points) : 0);
    } else {
      if (moveName !== moves['lastmove'].parts[0]) {
        setPlayer1points(moves['lastmove'].move ? (moves['lastmove'].score || moves['lastmove'].points) : 0);
      } else {
        setPlayer1points(moves['superlastmove'].move ? moves['superlastmove'].score : 0);
      }
    }
  } else {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer1points(moves['thismove'].score);
    } else {
      setPlayer2points(moves['thismove'].score);
    }
  }
}; 