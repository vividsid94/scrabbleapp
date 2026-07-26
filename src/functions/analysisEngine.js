// Store-agnostic Analysis Mode engine - shared by src/stores/gameStore.js
// (Play) and src/stores/viewerStore.js (Viewer). Each store keeps a thin
// wrapper action that builds the {boardCoords, rack, pool} shape from its own
// state and forwards a `setAnalysisState` callback here; none of this file
// touches zustand directly, so it has no idea which store is calling it.

// Analysis Mode: a single self-contained slice rather than flat top-level
// fields, so exiting/resetting is one assignment and nothing here can leak
// into the real board/rack/timer state it's meant to preview alongside.
export const DEFAULT_ANALYSIS_STATE = {
  active: false,
  layer: 'preview', // 'preview' | 'heatmap' | 'opponentResponses'
  selectedMove: null,
  frames: [], // array of {board, tileOwnership, move} snapshots from simulateMove's onProgress callback
  stepIndex: 0,
  isRunning: false,
  error: null,
  heatMap: null, // heat map layer's occupancy grid
  opponentResponses: null // opponent responses layer's per-move {avgScore, bingoPercent, ...} map
};

// simulateMove/runHeatMapSimulation only ever read "our" rack from
// gameState.player1Rack (since currentPlayer is fixed to 1 below) - the
// opponent's rack/score are never actually used, a fresh random rack is
// always generated for them internally. So any caller only needs to supply
// the rack of whoever's move is being analyzed, not a full two-player state.
//
// Preview shows exactly 2 plies per run (opponent's reply, then our reply),
// repeated over `numSimulations` independent random continuations - each
// repetition draws a fresh random opponent rack, so it's a genuinely
// different look each time, not the same two plies shown 5x. The very first
// "selected" frame (our chosen move, freshly applied to the real board) is
// identical across every repetition, so it's kept just once as a shared
// baseline instead of being repeated per iteration. Every later frame is
// tagged with which 0-indexed repetition it belongs to, so the UI can badge
// tiles with "iteration 1", "iteration 2", etc.
export const runMovePreviewEngine = async ({ move, boardCoords, rack, pool, numSimulations = 5, turnsPerSim = 2 }, setAnalysisState) => {
  setAnalysisState({ isRunning: true, error: null });

  const frames = [];
  let iteration = 0;
  let selectedFrameShown = false;

  const onProgress = (progress, previewData) => {
    if (!previewData) return;

    if (previewData.move === 'selected') {
      if (!selectedFrameShown) {
        frames.push({ ...previewData, iteration: null });
        selectedFrameShown = true;
      } else {
        // A later "selected" frame marks the start of the next repetition.
        iteration += 1;
      }
      return;
    }

    frames.push({ ...previewData, iteration });
  };

  try {
    const { simulateMove } = await import('./simulationFunctions');
    await simulateMove(
      move,
      { boardCoords, currentPlayer: 1, player1Rack: rack, player2Rack: [], player1points: 0, player2points: 0, pool },
      onProgress,
      { numSimulations, turnsPerSim }
    );
    setAnalysisState({ selectedMove: move, frames, stepIndex: 0, isRunning: false });
  } catch (error) {
    console.error('Error running analysis move preview:', error);
    setAnalysisState({ isRunning: false, error: error.message });
  }
};

export const runHeatMapEngine = async ({ move, boardCoords, rack, pool, numSimulations = 20 }, setAnalysisState) => {
  setAnalysisState({ isRunning: true, error: null, selectedMove: move });

  const gameState = { boardCoords, currentPlayer: 1, player1Rack: rack, player2Rack: [], player1points: 0, player2points: 0, pool };
  const shouldStopRef = { current: false };

  try {
    const { runHeatMapSimulation } = await import('./simulationFunctions');
    await runHeatMapSimulation(
      move,
      gameState,
      { numSimulations, turnsPerSim: 1 },
      {
        onHeatMapUpdate: (heatMapGrid) => {
          setAnalysisState({ heatMap: { grid: heatMapGrid, maxSimulations: numSimulations } });
        },
        onError: (message) => setAnalysisState({ isRunning: false, error: message }),
        onComplete: () => setAnalysisState({ isRunning: false }),
        shouldStopRef
      }
    );
  } catch (error) {
    console.error('Error running analysis heat map:', error);
    setAnalysisState({ isRunning: false, error: error.message });
  }
};

// Opponent Responses: bulk per-move stats (avg score / bingo %) from the
// Railway bulk-move-gen endpoint - one server-side call per move, run in
// parallel, instead of the ply-by-ply client-driven simulation the other
// layers use. Ported from the old Metrics2Modal's analyzeAllMoves.
export const runOpponentResponsesEngine = async ({ moves, boardCoords, pool, iterations = 20 }, setAnalysisState) => {
  if (!moves || moves.length === 0) return;

  setAnalysisState({ isRunning: true, error: null });

  const movesToAnalyze = moves.slice(0, 10);
  // pool arrives as an Array from gameStore (after the first move) or a
  // string from viewerStore (always recomputed via calculatePoolFromBoard) -
  // spreading works for both, .join('') alone would throw on a plain string.
  const tilePoolString = [...pool].join('');

  try {
    const results = await Promise.all(movesToAnalyze.map(async (move) => {
      try {
        const cleanBoard = Array(15).fill().map(() => Array(15).fill(''));
        boardCoords.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (typeof cell === 'string' && cell !== '') {
              cleanBoard[rowIndex][colIndex] = cell;
            }
          });
        });
        move.tiles.forEach(tile => {
          if (tile.isNew) {
            cleanBoard[tile.row][tile.col] = tile.letter;
          }
        });

        const response = await fetch('https://scrabble-move-generator-production.up.railway.app/bulk-move-gen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ board: cleanBoard, tilePool: tilePoolString, iterations })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { word: move.word, data };
      } catch (error) {
        return { word: move.word, error: error.message };
      }
    }));

    const resultsMap = {};
    results.forEach(({ word, data, error }) => {
      resultsMap[word] = { data, error };
    });

    setAnalysisState({ opponentResponses: resultsMap, isRunning: false });
  } catch (error) {
    console.error('Error running opponent response analysis:', error);
    setAnalysisState({ isRunning: false, error: error.message });
  }
};
