// Generates .gcg (Game Chronology / "GCG") files from this app's internal
// move history, for interop with external Scrabble tools (Quackle, Zyzzyva,
// Woogles, cross-tables.com, etc).
//
// The previous version of this file tried to reconstruct each move's board
// position/direction and full word from heuristics on the isolated boardDiff
// of that one move (span-shape guessing, dot-counting on the word string).
// That's fundamentally unreliable - most plays are 1-2 new tiles hooking
// onto existing ones, which those heuristics can't disambiguate - and it
// produced malformed/incorrect .gcg files.
//
// This version instead replays the whole move history in order against an
// incrementally-built 15x15 board model, so at the moment each move is
// processed we know exactly what was already on the board (to find the
// move's true extent and correctly emit "." for pre-existing letters) and
// exactly where each of THIS move's new tiles sit (to know its real
// direction, not a guess).

const BOARD_SIZE = 15;

// Standard Scrabble letter values, used only for the end-of-game remaining-
// tile adjustment.
const LETTER_VALUES = {
  A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
};

const tileValue = (letter) => (letter === '?' || letter === '*' ? 0 : (LETTER_VALUES[letter] || 0));
const rackValue = (rack) => (rack || []).reduce((sum, t) => sum + tileValue(t), 0);

/**
 * Formats a player name for .gcg format (nickname field can't contain
 * spaces).
 */
export const formatPlayerName = (playerName) => (playerName || '').replace(/\s+/g, '_');

const colLetter = (col) => String.fromCharCode(65 + col);
const emptyBoard = () => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
const isOnBoard = (row, col) => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

// True if (row, col) is filled either on the board-as-of-before-this-move,
// or by one of this move's own newly-placed tiles.
const isOccupied = (board, newPositions, row, col) =>
  isOnBoard(row, col) && (board[row][col] !== null || newPositions.has(`${row},${col}`));

// Starting from a span [start, end] along one axis, expand outward through
// any occupied (pre-existing or newly-placed) squares to find the play's
// true full extent - not just the span of the newly-placed tiles.
function extendSpan(board, newPositions, fixedRow, fixedCol, horizontal, start, end) {
  if (horizontal) {
    while (start > 0 && isOccupied(board, newPositions, fixedRow, start - 1)) start--;
    while (end < BOARD_SIZE - 1 && isOccupied(board, newPositions, fixedRow, end + 1)) end++;
  } else {
    while (start > 0 && isOccupied(board, newPositions, start - 1, fixedCol)) start--;
    while (end < BOARD_SIZE - 1 && isOccupied(board, newPositions, end + 1, fixedCol)) end++;
  }
  return { start, end };
}

/**
 * Given the tiles newly placed this move and the board as it existed
 * immediately BEFORE this move, reconstructs the full played word (with "."
 * for any pre-existing letters it passes through/off) and its .gcg position
 * notation ("8H" for horizontal, "H8" for vertical).
 */
function resolvePlacement(boardDiff, boardBefore, blankSet) {
  if (!boardDiff || boardDiff.length === 0) return null;

  const newPositions = new Set(boardDiff.map((t) => `${t.row},${t.col}`));
  const letterAt = new Map(boardDiff.map((t) => [`${t.row},${t.col}`, t.value]));

  const rows = boardDiff.map((t) => t.row);
  const cols = boardDiff.map((t) => t.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  let isHorizontal;
  if (boardDiff.length > 1) {
    // A legal play's newly-placed tiles are always in a single row or
    // single column.
    isHorizontal = minRow === maxRow;
  } else {
    // A single new tile: direction is ambiguous from the tile alone, so
    // check which direction it actually extends into on the board. If it
    // extends both ways (forms a word in both directions), .gcg records the
    // longer one as the primary play; horizontal wins ties.
    const row = rows[0];
    const col = cols[0];
    const hSpan = extendSpan(boardBefore, newPositions, row, col, true, col, col);
    const vSpan = extendSpan(boardBefore, newPositions, row, col, false, row, row);
    const hLen = hSpan.end - hSpan.start + 1;
    const vLen = vSpan.end - vSpan.start + 1;
    isHorizontal = hLen >= vLen;
  }

  const span = isHorizontal
    ? extendSpan(boardBefore, newPositions, minRow, minCol, true, minCol, maxCol)
    : extendSpan(boardBefore, newPositions, minRow, minCol, false, minRow, maxRow);

  let word = '';
  for (let i = span.start; i <= span.end; i++) {
    const r = isHorizontal ? minRow : i;
    const c = isHorizontal ? i : minCol;
    const key = `${r},${c}`;
    if (newPositions.has(key)) {
      const letter = letterAt.get(key);
      word += blankSet.has(key) ? String(letter).toLowerCase() : letter;
    } else {
      word += '.';
    }
  }

  const startRow = isHorizontal ? minRow : span.start;
  const startCol = isHorizontal ? span.start : minCol;
  const position = isHorizontal
    ? `${startRow + 1}${colLetter(startCol)}`
    : `${colLetter(startCol)}${startRow + 1}`;

  return { word, position };
}

const rackString = (rack) => (Array.isArray(rack) ? rack.join('') : (rack || ''));

/**
 * Generates .gcg content from this game's move history.
 *
 * @param {Array} moveHistory - Moves in play order. Each entry is either a
 *   play ({boardDiff, player, score, rack, word}), a pass ({player, score:
 *   0, rack, word: 'Pass'}), or an exchange ({player, score: 0, rack,
 *   tilesExchanged, word: 'Exchange'}). `rack` in every case is the rack
 *   the player held BEFORE the move.
 * @param {string} player1Name
 * @param {string} player2Name
 * @param {Array} blankTiles - [{row, col}] for every blank tile currently on
 *   the board (cumulative, current game state - used to lowercase blanks in
 *   the exported word).
 * @param {Array} player1Rack - Player 1's current rack (for the end-of-game
 *   remaining-tile adjustment).
 * @param {Array} player2Rack - Player 2's current rack.
 * @param {Array} pool - Current tile pool (empty pool + one empty rack means
 *   that player went out).
 * @returns {string} .gcg file content.
 */
export const generateGCGContent = (
  moveHistory,
  player1Name,
  player2Name,
  blankTiles = [],
  player1Rack = [],
  player2Rack = [],
  pool = []
) => {
  // This app's "player1"/"player2" are fixed identities (You are always
  // player1, the bot is always player2), but .gcg's #player1/#player2
  // convention is positional - #player1 is whoever actually moves FIRST in
  // this particular game. Since this app supports the bot going first (a
  // coin flip at game start), those two things frequently disagree. Reader
  // tools like Quackle expect the header order to match the move sequence,
  // so get that from moveHistory itself rather than the app's fixed labels.
  const firstMoverName = (moveHistory && moveHistory.length > 0)
    ? moveHistory[0].player
    : player1Name;
  const secondMoverName = firstMoverName === player1Name ? player2Name : player1Name;

  const lines = [
    '#character-encoding UTF-8',
    `#player1 ${formatPlayerName(firstMoverName)} ${firstMoverName}`,
    `#player2 ${formatPlayerName(secondMoverName)} ${secondMoverName}`,
  ];

  const board = emptyBoard();
  const blankSet = new Set((blankTiles || []).map((t) => `${t.row},${t.col}`));

  // Track running totals by name, not by a "player1/player2" slot - avoids
  // needing to know which slot is which anywhere below.
  const totals = { [player1Name]: 0, [player2Name]: 0 };

  (moveHistory || []).forEach((move) => {
    const nick = formatPlayerName(move.player);
    const rack = rackString(move.rack);

    if (move.word === 'Pass') {
      lines.push(`>${nick}: ${rack} - +0 ${totals[move.player] || 0}`);
      return;
    }

    if (move.word === 'Exchange') {
      const exchanged = rackString(move.tilesExchanged);
      lines.push(`>${nick}: ${rack} -${exchanged} +0 ${totals[move.player] || 0}`);
      return;
    }

    // Regular play.
    const boardBefore = board.map((r) => [...r]);
    const placement = resolvePlacement(move.boardDiff, boardBefore, blankSet);

    // Apply this move's tiles so later moves see them as pre-existing.
    (move.boardDiff || []).forEach((t) => { board[t.row][t.col] = t.value; });

    const score = move.score || 0;
    totals[move.player] = (totals[move.player] || 0) + score;

    if (placement) {
      lines.push(`>${nick}: ${rack} ${placement.position} ${placement.word} +${score} ${totals[move.player]}`);
    } else {
      // No boardDiff on a "real" play shouldn't happen, but never silently
      // drop a scored move from the export.
      lines.push(`>${nick}: ${rack} - - +${score} ${totals[move.player]}`);
    }
  });

  // End-of-game remaining-tile adjustment for the "someone played their last
  // tile and the pool is empty" ending: the player who went out gets DOUBLE
  // the opponent's remaining tile value added to their own score; the
  // opponent's score is untouched.
  //
  // NOTE: this does not detect the other standard ending (six consecutive
  // scoreless turns, where instead EACH player's own remaining tiles are
  // deducted from their own score) - moveHistory doesn't currently carry an
  // explicit end-reason, so that case is left unhandled rather than guessed.
  const player1Empty = player1Rack.length === 0;
  const player2Empty = player2Rack.length === 0;
  if (pool.length === 0 && player1Empty !== player2Empty) {
    const outName = player1Empty ? player1Name : player2Name;
    const opponentRack = player1Empty ? player2Rack : player1Rack;
    const value = rackValue(opponentRack) * 2;
    if (value > 0) {
      totals[outName] = (totals[outName] || 0) + value;
      lines.push(`>${formatPlayerName(outName)}: (${rackString(opponentRack)}) +${value} ${totals[outName]}`);
    }
  }

  return lines.join('\n') + '\n';
};

/**
 * Downloads a .gcg file.
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
