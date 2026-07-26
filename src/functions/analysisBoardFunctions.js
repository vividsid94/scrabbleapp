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

// Ported from the old SimulationModal's heat map color gradient: ice-cold blue
// (never landed on) through purple to red-hot (landed on almost every
// iteration), normalized against how many iterations were run.
export const getHeatColor = (heatValue, maxSimulations) => {
  const denominator = maxSimulations || 5;
  const intensity = Math.min((heatValue || 0) / denominator, 1);

  if (intensity === 0) {
    return 'rgba(140, 180, 255, 0.8)';
  }
  if (intensity < 0.5) {
    const blueIntensity = 1 - (intensity * 2);
    return `rgba(${150 + blueIntensity * 105}, ${200 - blueIntensity * 100}, 255, ${0.3 + intensity * 0.4})`;
  }
  const redIntensity = (intensity - 0.5) * 2;
  return `rgba(255, ${100 - redIntensity * 100}, ${100 - redIntensity * 100}, ${0.7 + redIntensity * 0.3})`;
};

// Builds a 15x15 grid of ghost tiles to overlay on the real board for a given
// simulated frame - null where the real committed board already has a tile
// there (so we never draw a ghost on top of a real, already-placed letter)
// or where the frame has no tile in that cell.
export const buildGhostOverlayGrid = (frame, boardCoords) => {
  if (!frame || !frame.board || !boardCoords) return null;

  return frame.board.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (typeof cell !== 'string') return null;
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
