// Store-agnostic Analysis Mode engine - shared by src/stores/gameStore.js
// (Play) and src/stores/viewerStore.js (Viewer). Each store keeps a thin
// wrapper action that builds the {boardCoords, rack, pool} shape from its own
// state and forwards a `setAnalysisState` callback here; none of this file
// touches zustand directly, so it has no idea which store is calling it.

import { calculateLeave } from './play/leaveFunctions';

// Analysis Mode: a single self-contained slice rather than flat top-level
// fields, so exiting/resetting is one assignment and nothing here can leak
// into the real board/rack/timer state it's meant to preview alongside.
export const DEFAULT_ANALYSIS_STATE = {
  active: false,
  layer: 'preview', // 'preview' | 'heatmap' | 'opponentResponses'
  selectedMove: null,
  frames: [], // array of {board, tileOwnership, move, iteration} snapshots, one per preview ply
  stepIndex: 0,
  isRunning: false,
  error: null,
  heatMap: null, // heat map layer's occupancy grid
  opponentResponses: null // opponent responses layer's per-move {avgScore, bingoPercent, ...} map
};

// Preview shows exactly 2 plies per run (opponent's reply, then our reply),
// repeated over `numSimulations` independent random continuations. Backed by
// a single call to the Railway bulk-move-gen endpoint's includeMoveDetails
// mode, which returns per-iteration {opponentMove, ourReply} detail instead
// of just the aggregate stats the other layers use - one network round trip
// for all repetitions, rather than 2*numSimulations sequential getTopMoves
// calls. The very first "selected" frame (our chosen move, freshly applied to
// the real board) is identical across every repetition, so it's kept just
// once as a shared baseline instead of being repeated per iteration. Every
// later frame is tagged with which 0-indexed repetition it belongs to, so the
// UI can badge tiles with "iteration 1", "iteration 2", etc. Tile ownership
// is sticky/cumulative (once a tile is marked 'player' or 'opponent' it stays
// that color in later frames of the same iteration) rather than only marking
// whichever tiles were placed in that exact ply, since a run only ever shows
// 2 plies and the earlier ply's tiles staying visible as "ours"/"theirs" is
// clearer than having them fade back to neutral one step later.
//
// Our reply's rack isn't fully random - we know our own leave (whatever's
// left in `rack` after playing `move`), so it's pinned via `ourLeave` and the
// server only randomizes the rest. Those leave tiles are stripped out of the
// tilePool sent up front, so the same physical tile can never simultaneously
// be drawn for the opponent's random rack and be sitting in ours.
export const runMovePreviewEngine = async ({ move, boardCoords, rack, pool, numSimulations = 5 }, setAnalysisState) => {
  setAnalysisState({ isRunning: true, error: null });

  try {
    const baseBoard = Array(15).fill().map(() => Array(15).fill(''));
    boardCoords.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (typeof cell === 'string' && cell !== '') {
          baseBoard[rowIndex][colIndex] = cell;
        }
      });
    });
    move.tiles.forEach(tile => {
      if (tile.isNew) {
        baseBoard[tile.row][tile.col] = tile.letter;
      }
    });

    // pool arrives as an Array from gameStore (after the first move) or a
    // string from viewerStore (always recomputed via calculatePoolFromBoard) -
    // spreading works for both, .join('') alone would throw on a plain string.
    const fullTilePoolString = [...pool].join('');

    const ourLeave = calculateLeave(move, rack);
    let tilePoolString = fullTilePoolString;
    for (const letter of ourLeave) {
      tilePoolString = tilePoolString.replace(letter, '');
    }

    const response = await fetch('https://scrabble-move-generator-production.up.railway.app/bulk-move-gen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board: baseBoard, tilePool: tilePoolString, iterations: numSimulations, includeMoveDetails: true, ourLeave })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const baselineOwnership = baseBoard.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (typeof cell !== 'string' || cell === '') return null;
        const isOurMove = move.tiles.some(t => t.row === rowIndex && t.col === colIndex && t.isNew);
        return isOurMove ? 'player' : 'existing';
      })
    );

    const frames = [{ board: baseBoard, tileOwnership: baselineOwnership, move: 'selected', iteration: null }];

    (data.iterationDetails || []).forEach((detail, iterationIndex) => {
      const iterBoard = baseBoard.map(row => [...row]);
      const iterOwnership = baselineOwnership.map(row => [...row]);

      if (detail.opponentMove) {
        detail.opponentMove.tiles.forEach(tile => {
          if (tile.isNew) {
            iterBoard[tile.row][tile.col] = tile.letter;
            iterOwnership[tile.row][tile.col] = 'opponent';
          }
        });
        frames.push({ board: iterBoard.map(row => [...row]), tileOwnership: iterOwnership.map(row => [...row]), move: 'opponent', iteration: iterationIndex });
      }

      if (detail.ourReply) {
        detail.ourReply.tiles.forEach(tile => {
          if (tile.isNew) {
            iterBoard[tile.row][tile.col] = tile.letter;
            iterOwnership[tile.row][tile.col] = 'player';
          }
        });
        frames.push({ board: iterBoard.map(row => [...row]), tileOwnership: iterOwnership.map(row => [...row]), move: 'player', iteration: iterationIndex });
      }
    });

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
