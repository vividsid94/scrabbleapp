// The board array only ever stores the displayed letter (uppercase) - blank-
// ness is tracked separately in the store's blankTiles list. The Go move-
// generation service (netlify_functions/normalizeBoard.js) follows GCG's own
// convention for telling blanks apart from real tiles in a board string:
// lowercase = blank, uppercase = real. Any request that sends a board to that
// service has to lowercase blank positions itself first, or the service has
// no way to know a previously-placed blank isn't a full-value real tile.
export const markBlanksLowercase = (board, blankTiles) => {
  if (!blankTiles || blankTiles.length === 0) return board;
  const blankSet = new Set(blankTiles.map(t => `${t.row},${t.col}`));
  return board.map((row, r) =>
    row.map((cell, c) => (
      typeof cell === 'string' && blankSet.has(`${r},${c}`) ? cell.toLowerCase() : cell
    ))
  );
};
