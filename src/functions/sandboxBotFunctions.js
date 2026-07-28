// Pure, store-agnostic bot move-generation and personality logic for
// Sandbox's bot-vs-bot series. Reuses the same endpoints/patterns already
// proven elsewhere in the app (viewerStore.js's fetchAnalysisTopMoves for the
// move+exchange fetch/merge, botFunctions.js's Tess formula for defense
// evaluation) but duplicates rather than imports them - see the Sandbox
// plan's "why a new store" section for why: those originals are hard-wired
// to gameStore.js's asymmetric human-vs-bot shape and carry side effects
// inappropriate for an unattended simulation.

// All non-empty subsets of the rack, grouped by size ascending (1-tile
// exchanges first, up to a full exchange) - deliberately uncapped. An
// earlier session bug found capping this list made large/valuable exchanges
// (e.g. swapping 5-6 tiles to keep just 1-2 good ones) structurally
// unreachable no matter how good they'd score.
const generateExchangeCombinations = (rack) => {
  const combinations = [];
  const n = rack.length;
  for (let size = 1; size <= n; size++) {
    const combo = [];
    const backtrack = (start) => {
      if (combo.length === size) {
        combinations.push([...combo]);
        return;
      }
      for (let i = start; i < n; i++) {
        combo.push(rack[i]);
        backtrack(i + 1);
        combo.pop();
      }
    };
    backtrack(0);
  }
  return combinations;
};

const calculateExchangeLeave = (rack, tilesToExchange) => {
  const remaining = [...rack];
  tilesToExchange.forEach(tile => {
    const index = remaining.indexOf(tile);
    if (index !== -1) remaining.splice(index, 1);
  });
  return remaining.sort().join('');
};

// Fetches word plays (via the existing, already-proven getTopMoves pipeline,
// which computes leave/leaveValue/totalValue server-side) and merges in
// client-side exchange candidates (which getTopMoves never generates),
// ranked together by totalValue - same pipeline shape as
// viewerStore.js's fetchAnalysisTopMoves.
export const fetchSandboxMoves = async ({ boardCoords, rack, pool }) => {
  const response = await fetch('/.netlify/functions/getTopMoves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: boardCoords, letters: rack })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const wordMoves = (data.moves || []).filter(move => move.word && move.word.trim() !== '');

  let exchangeMoves = [];
  if (pool && pool.length >= 7) {
    const combos = generateExchangeCombinations(rack);
    const leaves = combos.map(tiles => calculateExchangeLeave(rack, tiles));
    const uniqueLeaves = [...new Set(leaves)];

    let leaveValues = {};
    try {
      const leaveResponse = await fetch('/.netlify/functions/getLeaveValues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaves: uniqueLeaves })
      });
      if (leaveResponse.ok) {
        const leaveData = await leaveResponse.json();
        leaveValues = leaveData.leaveValues || {};
      }
    } catch (error) {
      console.error('Error fetching exchange leave values for sandbox move:', error);
    }

    exchangeMoves = combos.map((tiles, i) => {
      const leave = leaves[i];
      const leaveValue = leaveValues[leave] || 0;
      return {
        word: `Exchange ${tiles.join('')}`,
        score: 0,
        tiles: tiles.map(tile => ({ letter: tile, isNew: false })),
        direction: 'exchange',
        startPosition: 'Exchange',
        leave,
        leaveValue,
        totalValue: leaveValue,
        isExchange: true,
        tilesExchanged: tiles
      };
    });
  }

  return [...wordMoves, ...exchangeMoves].sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
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
// already-sorted (by totalValue) move list. Only the three bots Sandbox
// currently supports: Theo (best move, the default/fallback for anything
// else), Tess (defense-adjusted, see above), Intermediate (5th-best,
// matching botFunctions.js's existing index convention).
export const pickBotMove = async ({ sortedMoves, botName, boardCoords, pool }) => {
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

  if (botName === 'Intermediate' && sortedMoves.length >= 5) {
    return sortedMoves[4];
  }

  return sortedMoves[0]; // Theo / default
};
