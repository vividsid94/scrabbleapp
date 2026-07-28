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
