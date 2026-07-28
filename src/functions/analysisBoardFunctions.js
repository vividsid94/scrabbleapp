// Pure helpers for Analysis Mode's board overlays. Ported from the old
// SimulationModal's ownership color logic, now that the modal itself is gone.

export const getOwnershipColor = (ownership) => {
  if (ownership === 'selected') {
    return { bg: 'rgba(158, 158, 158, 0.9)', textColor: 'white' }; // Silver/grey for our initially committed/previewed move
  }
  if (ownership === 'player') {
    return { bg: 'rgba(33, 150, 243, 0.9)', textColor: 'white' }; // Blue for the player's simulated reply tiles
  }
  if (ownership === 'opponent') {
    return { bg: 'rgba(244, 67, 54, 0.9)', textColor: 'white' }; // Red for the opponent's simulated tiles
  }
  return { bg: 'rgba(255, 255, 255, 1)', textColor: '#333' }; // White for tiles that already existed on the board
};

// Ice-cold blue (never landed on) through purple to red-hot (landed on
// almost as often as the hottest cell in this run), normalized against
// whichever cell got touched the most. A single continuous 3-stop
// interpolation, so intensity=0 falls out of the formula naturally instead of
// being a separate hardcoded case - the old version had a special-cased
// intensity===0 color that didn't match what the general formula produced
// for any intensity just barely above 0, causing a visible jump straight to
// vivid pink for every touched cell instead of a smooth ramp from blue.
const HEAT_COLOR_STOPS = [
  { at: 0, r: 140, g: 180, b: 255 },   // cold - never landed on
  { at: 0.5, r: 180, g: 100, b: 220 }, // purple - landed on sometimes
  { at: 1, r: 255, g: 40, b: 40 }      // red-hot - landed on almost as often as the hottest cell
];

export const getHeatColor = (heatValue, maxCount) => {
  const denominator = maxCount || 1;
  const intensity = Math.min((heatValue || 0) / denominator, 1);

  let lower = HEAT_COLOR_STOPS[0];
  let upper = HEAT_COLOR_STOPS[HEAT_COLOR_STOPS.length - 1];
  for (let i = 0; i < HEAT_COLOR_STOPS.length - 1; i++) {
    if (intensity >= HEAT_COLOR_STOPS[i].at && intensity <= HEAT_COLOR_STOPS[i + 1].at) {
      lower = HEAT_COLOR_STOPS[i];
      upper = HEAT_COLOR_STOPS[i + 1];
      break;
    }
  }

  const t = (intensity - lower.at) / (upper.at - lower.at);
  const r = Math.round(lower.r + (upper.r - lower.r) * t);
  const g = Math.round(lower.g + (upper.g - lower.g) * t);
  const b = Math.round(lower.b + (upper.b - lower.b) * t);
  const alpha = (0.5 + intensity * 0.5).toFixed(2);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// The shared "selected move" baseline frame - our candidate move applied to
// the real board, tagged 'selected' so it renders as silver/grey. Used both
// by Preview/Heat Map's engines (as the first frame of their run) and by the
// move list's selection handler (so the grey tiles show up on the board the
// instant a row is clicked, without waiting for Run).
export const buildSelectedMoveFrame = (move, boardCoords) => {
  const board = Array(15).fill().map(() => Array(15).fill(''));
  boardCoords.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (typeof cell === 'string' && cell !== '') {
        board[rowIndex][colIndex] = cell;
      }
    });
  });
  move.tiles.forEach(tile => {
    if (tile.isNew) {
      board[tile.row][tile.col] = tile.letter;
    }
  });

  const tileOwnership = board.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (typeof cell !== 'string' || cell === '') return null;
      const isOurMove = move.tiles.some(t => t.row === rowIndex && t.col === colIndex && t.isNew);
      return isOurMove ? 'selected' : 'existing';
    })
  );

  return { board, tileOwnership, move: 'selected', iteration: null };
};

// Builds a 15x15 grid of ghost tiles to overlay on the real board for a given
// simulated frame - null where the real committed board already has a tile
// there (so we never draw a ghost on top of a real, already-placed letter)
// or where the frame has no tile in that cell.
export const buildGhostOverlayGrid = (frame, boardCoords) => {
  if (!frame || !frame.board || !boardCoords) return null;

  return frame.board.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (typeof cell !== 'string' || cell === '') return null;
      const alreadyCommitted = typeof boardCoords[rowIndex]?.[colIndex] === 'string';
      if (alreadyCommitted) return null;

      const ownership = frame.tileOwnership?.[rowIndex]?.[colIndex] || 'existing';
      // iteration is null for the shared "selected move" baseline frame, and
      // a 0-indexed repetition number for every later opponent/player frame -
      // used to badge tiles with which repetition they belong to.
      return { letter: cell, ownership, iteration: frame.iteration ?? null };
    })
  );
};

// Toggles one cell in/out of a Lane Isolation selection. Rules adapted from
// the real move-shape validator (src/functions/play/validateMoveClient.js's
// validatePlacement) but applied to plain clicked coordinates instead of a
// diffed before/after board, since there's no letter here yet - the user is
// picking empty target squares, not placing tiles. Occupied cells (real board
// or the candidate move's tentative tiles) are silently ignored; the 7-tile
// cap matches rack size. Returns the same array reference when nothing
// changes, so callers can skip a state update.
export const toggleLaneCell = (laneSelection, selectedMove, boardCoords, cell) => {
  if (!selectedMove) return laneSelection;

  const combinedBoard = buildSelectedMoveFrame(selectedMove, boardCoords).board;
  if (typeof combinedBoard[cell.row]?.[cell.col] === 'string' && combinedBoard[cell.row][cell.col] !== '') {
    return laneSelection;
  }

  const exists = laneSelection.some(c => c.row === cell.row && c.col === cell.col);
  if (exists) {
    return laneSelection.filter(c => !(c.row === cell.row && c.col === cell.col));
  }
  if (laneSelection.length >= 7) return laneSelection;
  return [...laneSelection, cell];
};

// Computes a fresh lane selection for a drag gesture from an anchor cell
// (where the mouse/touch went down) to wherever it currently is - snapped to
// whichever axis (row or column) has moved further, so small wobble in a real
// mouse or finger drag doesn't accidentally break the straight-line
// requirement. Only empty cells are included (gaps over existing tiles are
// skipped, same as a real move would skip over them), capped at 7 like a
// rack. Replaces the whole selection rather than toggling, since a drag is
// "draw this line," not "add one more square" - that's still what a plain
// click (via toggleLaneCell) is for.
export const computeLaneDragSpan = (anchor, current, selectedMove, boardCoords) => {
  if (!selectedMove) return [];

  const combinedBoard = buildSelectedMoveFrame(selectedMove, boardCoords).board;
  const isOccupied = (row, col) => typeof combinedBoard[row]?.[col] === 'string' && combinedBoard[row][col] !== '';

  const rowDelta = Math.abs(current.row - anchor.row);
  const colDelta = Math.abs(current.col - anchor.col);

  const cells = [];
  if (rowDelta >= colDelta) {
    const startRow = Math.min(anchor.row, current.row);
    const endRow = Math.max(anchor.row, current.row);
    for (let r = startRow; r <= endRow && cells.length < 7; r++) {
      if (!isOccupied(r, anchor.col)) cells.push({ row: r, col: anchor.col });
    }
  } else {
    const startCol = Math.min(anchor.col, current.col);
    const endCol = Math.max(anchor.col, current.col);
    for (let c = startCol; c <= endCol && cells.length < 7; c++) {
      if (!isOccupied(anchor.row, c)) cells.push({ row: anchor.row, col: c });
    }
  }

  return cells;
};

// Is this Lane Isolation selection a legal move shape? Same three geometric
// rules as validatePlacement: single row/col, gaps only where the combined
// board (real board + candidate move) already has a tile, and the whole
// selection must connect to something existing (or cover the center star).
export const validateLaneSelection = (cells, combinedBoard) => {
  if (!cells || cells.length === 0) {
    return { isValid: false, reason: 'Select at least one empty square' };
  }
  if (cells.length > 7) {
    return { isValid: false, reason: 'A move can place at most 7 tiles' };
  }

  const isOccupied = (row, col) => typeof combinedBoard[row]?.[col] === 'string' && combinedBoard[row][col] !== '';

  if (cells.length > 1) {
    const firstRow = cells[0].row;
    const firstCol = cells[0].col;
    const allSameRow = cells.every(c => c.row === firstRow);
    const allSameCol = cells.every(c => c.col === firstCol);

    if (!allSameRow && !allSameCol) {
      return { isValid: false, reason: 'Squares must form a single line' };
    }

    if (allSameRow) {
      const cols = cells.map(c => c.col).sort((a, b) => a - b);
      for (let i = 0; i < cols.length - 1; i++) {
        if (cols[i + 1] - cols[i] > 1) {
          for (let c = cols[i] + 1; c < cols[i + 1]; c++) {
            if (!isOccupied(firstRow, c)) {
              return { isValid: false, reason: 'Gaps must be filled by existing tiles' };
            }
          }
        }
      }
    } else {
      const rows = cells.map(c => c.row).sort((a, b) => a - b);
      for (let i = 0; i < rows.length - 1; i++) {
        if (rows[i + 1] - rows[i] > 1) {
          for (let r = rows[i] + 1; r < rows[i + 1]; r++) {
            if (!isOccupied(r, firstCol)) {
              return { isValid: false, reason: 'Gaps must be filled by existing tiles' };
            }
          }
        }
      }
    }
  }

  let isAdjacent = false;
  let isOnStar = false;
  for (const { row, col } of cells) {
    const deltas = [{ dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 }];
    for (const { dr, dc } of deltas) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && isOccupied(nr, nc)) {
        isAdjacent = true;
        break;
      }
    }
    if (row === 7 && col === 7) isOnStar = true;
  }
  if (!isAdjacent && !isOnStar) {
    return { isValid: false, reason: 'Must connect to an existing tile (or cover the center square)' };
  }

  return { isValid: true, reason: null };
};

// "Iteration 3 of 5" for whichever frame is currently shown - null for the
// shared baseline "selected move" frame (iteration null) or when there's
// nothing to show yet. Shared so the board-level badge (one label, shown
// once) and the panel's own step header stay in sync.
export const buildIterationLabel = (frames, stepIndex) => {
  if (!frames || frames.length === 0) return null;
  const frame = frames[stepIndex];
  if (!frame || frame.iteration === null || frame.iteration === undefined) return null;

  const totalIterations = Math.max(...frames.map(f => f.iteration ?? -1)) + 1;
  return `Iteration ${frame.iteration + 1} of ${totalIterations}`;
};
