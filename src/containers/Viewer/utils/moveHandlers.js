import { highlightPreviousMove, updateBoard } from "../../../functions/boardFunctions.js";
import { addToPool, removeFromPool } from "../../../functions/poolFunctions.js";

export const handleMove = (superLastMove, lastMove, thisMove, nextMove, type, state) => {
  const { setBoardCoords, setPool, setCurrentMoveCoords, setPlayer1points, setPlayer2points, setPointsScored, boardCoords, pool, moveSet, origBoard } = state;

  superLastMove = superLastMove ? superLastMove.replace(/\s+/g, ' ') : superLastMove;
  lastMove = lastMove ? lastMove.replace(/\s+/g, ' ') : lastMove;
  thisMove = thisMove ? thisMove.replace(/\s+/g, ' ') : thisMove;
  nextMove = nextMove ? nextMove.replace(/\s+/g, ' ') : nextMove;

  const moves = {
    superlastmove: { move: superLastMove, parts: superLastMove ? superLastMove.split(" ") : null, location: null, play: null, points: null, score: null },
    lastmove: { move: lastMove, parts: lastMove ? lastMove.split(" ") : null, location: null, play: null, points: null, score: null },
    thismove: { move: thisMove, parts: thisMove ? thisMove.split(" ") : null, location: null, play: null, points: null, score: null },
    nextmove: { move: nextMove, parts: nextMove ? nextMove.split(" ") : null, location: null, play: null, points: null, score: null }
  };

  console.log("MOVE superlastmove", superLastMove);
  console.log("MOVE lastmove", lastMove);
  console.log("MOVE thismove", thisMove);
  console.log("MOVE nextmove", nextMove);
  console.log("------------------------------------------")

  for (const id in moves) {
    const move = moves[id];
    move.location = move.parts ? move.parts[2] : null;
    move.play = move.parts ? move.parts[3] : null;
    move.points = move.parts ? move.parts[4] : null;
    move.score = move.parts ? move.parts[5] : null;
  }

  if (type === "previous") {
    handlePreviousMove(moves, state);
  } else {
    handleNextMove(moves, state);
  }
};

const handlePreviousMove = (moves, state) => {
  const { setBoardCoords, setPool, setCurrentMoveCoords, setPlayer1points, setPlayer2points, setPointsScored, boardCoords, pool, moveSet, origBoard } = state;
  const moveName = moves['thismove'].move ? moves['thismove'].parts[0] : 'empty';
  const lastMoveName = moves['lastmove'].move ? moves['lastmove'].parts[0] : 'empty';
  const nextMoveName = moves['nextmove'].move ? moves['nextmove'].parts[0] : 'empty';
  const firstMovePlayerName = moveSet[0].split(" ")[0];
  const thisMovePlayerName = moves['thismove'].move ? moves['thismove'].parts[0] : 'empty';

  if (moveName === nextMoveName && moves['thismove'].location === "--") {
    const props = { location: moves['thismove'].location, play: moves['thismove'].play, type: "add", boardCoords, origBoard };
    const board = updateBoard(props);
    setCurrentMoveCoords(board[0]);
    setBoardCoords(board[1]);
    setPool(removeFromPool(moves['thismove'].play, pool));
  } else if (moves['nextmove'].location[0] !== "-") {
    const props = { location: moves['nextmove'].location, play: moves['nextmove'].play, type: "remove", boardCoords, origBoard };
    const board = updateBoard(props);
    setCurrentMoveCoords(board[0]);
    setBoardCoords(board[1]);
    if (moves['thismove'].move !== undefined && moves['thismove'].location[0] !== "-") {
      setCurrentMoveCoords(highlightPreviousMove(moves['thismove'].location, moves['thismove'].play, boardCoords));
    }
    if (moveName !== nextMoveName)
      setPool(addToPool(moves['nextmove'].play, pool));
  } else if (moves['nextmove'].location === "--") {
    const props = { location: moves['thismove'].location, play: moves['thismove'].play, type: "add", boardCoords, origBoard };
    const board = updateBoard(props);
    setCurrentMoveCoords(board[0]);
    setBoardCoords(board[1]);
    setPool(removeFromPool(moves['thismove'].play, pool));
  }

  if (moveName !== nextMoveName) {
    if (thisMovePlayerName === firstMovePlayerName) {
      setPlayer2points(moves['lastmove'].move ? (moves['lastmove'].score ? moves['lastmove'].score : moves['lastmove'].points) : 0);
    } else {
      if (moveName !== lastMoveName) {
        setPlayer1points(moves['lastmove'].move ? (moves['lastmove'].score ? moves['lastmove'].score : moves['lastmove'].points) : 0);
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

  setPointsScored(moves['thismove'].points);
};

const handleNextMove = (moves, state) => {
  const { setBoardCoords, setPool, setCurrentMoveCoords, setPlayer1points, setPlayer2points, setPointsScored, boardCoords, pool, moveSet, origBoard } = state;
  const moveName = moves['thismove'].move ? moves['thismove'].parts[0] : 'empty';
  const lastMoveName = moves['lastmove'].move ? moves['lastmove'].parts[0] : 'empty';
  const firstMovePlayerName = moveSet[0].split(" ")[0];
  const thisMovePlayerName = moves['thismove'].parts[0];

  if (moveName === lastMoveName && moves['thismove'].location === "--") {
    const props = { location: moves['lastmove'].location, play: moves['lastmove'].play, type: "remove", boardCoords, origBoard };
    const board = updateBoard(props);
    setCurrentMoveCoords(board[0]);
    setBoardCoords(board[1]);
    setPool(addToPool(moves['lastmove'].play, pool));
  } else if (moves['thismove'].location[0] !== "-") {
    const props = { location: moves['thismove'].location, play: moves['thismove'].play, type: "add", boardCoords, origBoard };
    const board = updateBoard(props);
    setCurrentMoveCoords(board[0]);
    setBoardCoords(board[1]);
    setPool(removeFromPool(moves['thismove'].play, pool));
  }

  if (moveName !== lastMoveName) {
    if (thisMovePlayerName === firstMovePlayerName)
      setPlayer1points(moves['thismove'].score);
    else
      setPlayer2points(moves['thismove'].score);
  } else {
    if (thisMovePlayerName === firstMovePlayerName)
      setPlayer1points(moves['thismove'].score ? moves['thismove'].score : moves['thismove'].points);
    else {
      setPlayer2points(moves['thismove'].points ? moves['thismove'].points : moves['thismove'].score);
    }
  }

  setPointsScored(moves['thismove'].points);
}; 