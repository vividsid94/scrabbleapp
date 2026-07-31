import { origBoard, origPool } from '../components/AppContent/References/staticData';
import { calculatePoolFromBoard } from './poolFunctions';
import { markBlanksLowercase } from './play/boardApiUtils';

// Removes each letter in `rack` (array of single-char strings, '?' for a
// blank) from `pool` (a string) once - same replace-once semantics
// calculatePoolFromBoard itself already uses, so a rack tile can never
// accidentally remove more than one matching tile from the pool string.
const removeRackFromPoolString = (pool, rack) =>
  rack.reduce((remaining, tile) => remaining.replace(tile, ''), pool);

// Reconstructs everything the Sandbox board/rack/score UI needs to display
// `result` (one finished game - see finalizeBulkGame in sandboxStore.js
// for exactly what it carries) as of `turnIndex` (-1 =
// opening position before any turn has played, result.moveHistory.length-1
// = final position). Returns a plain object meant to be spread straight
// into the store's set() using the SAME field names the live game already
// writes, so Sandbox.js's <Board> and SandboxPlayerInfo.js's Live-section
// reads can't tell a live game from a replayed one - no rendering code
// needs to change for viewing to work.
export const buildSandboxViewState = (result, turnIndex) => {
  const { moveHistory, blankTiles, player1Name, player2Name, player1FinalRack, player2FinalRack } = result;

  const played = moveHistory.slice(0, turnIndex + 1);

  const boardCoords = JSON.parse(origBoard).map(row => row.map(Number));
  let player1points = 0;
  let player2points = 0;
  played.forEach(turn => {
    turn.boardDiff.forEach(d => { boardCoords[d.row][d.col] = d.value; });
    if (turn.player === player1Name) player1points = turn.total;
    else if (turn.player === player2Name) player2points = turn.total;
  });

  const currentBlankTiles = blankTiles.filter(b => b.turnIndex <= turnIndex);

  // A player's rack only changes on their OWN turn, so it stays constant
  // between the end of their last move and the start of their next one -
  // meaning the rack recorded on their NEAREST turn at or after the
  // current position IS their current rack right now. Falls back to their
  // final recorded rack when no such turn remains (game ended on the
  // other player's move) - also correctly covers turnIndex === -1 (the
  // opening position), where "nearest turn at or after" is just each
  // player's own first move, i.e. their initial 7-tile deal.
  const rackFor = (playerName, fallback) => {
    const upcoming = moveHistory.slice(turnIndex + 1).find(t => t.player === playerName);
    return upcoming ? upcoming.rack.split('') : fallback;
  };
  const player1Rack = rackFor(player1Name, player1FinalRack);
  const player2Rack = rackFor(player2Name, player2FinalRack);

  const nextTurn = moveHistory[turnIndex + 1];
  const lastPlayed = played[played.length - 1];
  const currentPlayer = nextTurn
    ? (nextTurn.player === player1Name ? 1 : 2)
    : (lastPlayed && lastPlayed.player === player1Name ? 1 : 2);

  // calculatePoolFromBoard expects blanks written as lowercase letters (the
  // convention Viewer's own GCG-derived boards use) - Sandbox's boardCoords
  // instead always stores the plain uppercase letter with blank-ness
  // tracked separately in blankTiles, so it has to be converted first or
  // every blank on the board would be miscounted as consuming its real
  // letter's pool count instead of the blank count.
  const poolAfterBoard = calculatePoolFromBoard(markBlanksLowercase(boardCoords, currentBlankTiles), origPool);
  const pool = removeRackFromPoolString(removeRackFromPoolString(poolAfterBoard, player1Rack), player2Rack);

  return {
    moveHistory: played,
    boardCoords,
    blankTiles: currentBlankTiles,
    player1points, player2points,
    player1Rack, player2Rack,
    currentPlayer,
    pool: pool.split(''),
  };
};
