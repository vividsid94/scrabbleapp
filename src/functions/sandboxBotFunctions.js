// Pure, store-agnostic bot move-generation and personality logic for
// Sandbox's bot-vs-bot series. Reuses the same endpoints/patterns already
// proven elsewhere in the app (viewerStore.js's fetchAnalysisTopMoves for the
// move+exchange fetch/merge, botFunctions.js's Tess formula for defense
// evaluation) but duplicates rather than imports them - see the Sandbox
// plan's "why a new store" section for why: those originals are hard-wired
// to gameStore.js's asymmetric human-vs-bot shape and carry side effects
// inappropriate for an unattended simulation.

// Fetches word plays + exchange candidates in one already-sorted,
// already-leave-scored list via the getTopMoves pipeline, which now computes
// leave/leaveValue/totalValue and generates exchanges server-side (Go's
// generateMovesHandler, reusing simulate.go's allExchangeCandidates).
export const fetchSandboxMoves = async ({ boardCoords, rack, pool }) => {
  const response = await fetch('/.netlify/functions/getTopMoves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: boardCoords, letters: rack, pool: (pool || []).length })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return (data.moves || []).filter(move => move.word && move.word.trim() !== '');
};

// Tess's exact defense-adjusted formula, duplicated from botFunctions.js/
// gameStore.js's runTessOpponentSims: adjustedValue = totalValue - 2x the
// opponent's simulated average reply score, evaluated over the top 15
// candidates via a 100-iteration bulk-move-gen simulation each, in parallel.
// Uses array-index correspondence (not move.word) to match simulation
// results back to their move, since multiple candidates can share the same
// word at different board positions - keying by word would silently
// collide/overwrite results for those (the same class of bug fixed earlier
// this session in AnalysisPanel.js's move-selection highlight).
const runTessOpponentSims = async (movesToEvaluate, boardCoords, pool) => {
  const tilePoolString = [...pool].join('');

  // Late-game the bag genuinely empties out - there's no random rack left to
  // simulate an opponent reply from, and bulk-move-gen rejects an empty
  // tilePool outright (400 "TilePool is required"). Treat "nothing left to
  // draw" as "no simulated threat" rather than making a doomed request.
  if (tilePoolString === '') {
    return movesToEvaluate.map(() => 0);
  }

  return Promise.all(movesToEvaluate.map(async (move) => {
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
        body: JSON.stringify({ board: cleanBoard, tilePool: tilePoolString, iterations: 100 })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.averageScore || 0;
    } catch (error) {
      console.error('Error running Tess opponent simulation for sandbox move:', error);
      return 0;
    }
  }));
};

// Picks a move for whichever bot personality is playing, from an
// already-sorted (by totalValue) move list. Two kinds: Tess (defense-
// adjusted, see above) and every "static" bot - Theo (rank 1) or a
// user-chosen Nth-ranked static bot - which just takes the (rank-1)th
// entry, falling back to the best move if the rack doesn't have enough
// legal options to reach that rank this turn. Mirrors the same rank-pick
// logic (and the same fallback) as simulate.go's Go-side implementation,
// used here only when Tess is on one side and the series can't take the
// bulk endpoint.
export const pickBotMove = async ({ sortedMoves, botName, rank, boardCoords, pool }) => {
  if (!sortedMoves || sortedMoves.length === 0) return null;

  if (botName === 'Tess') {
    const movesToEvaluate = sortedMoves.slice(0, 15);
    const opponentAvgScores = await runTessOpponentSims(movesToEvaluate, boardCoords, pool);
    const evaluated = movesToEvaluate.map((move, i) => ({
      ...move,
      adjustedValue: move.totalValue - (2 * opponentAvgScores[i])
    }));
    evaluated.sort((a, b) => b.adjustedValue - a.adjustedValue);
    return evaluated[0];
  }

  const idx = (rank || 1) - 1;
  if (idx >= 0 && idx < sortedMoves.length) {
    return sortedMoves[idx];
  }
  return sortedMoves[0]; // fallback: rank exceeds available candidates
};
