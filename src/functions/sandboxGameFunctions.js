// Pure, store-agnostic Scrabble game-end logic for Sandbox's bot-vs-bot
// series. Deliberately independent of gameEndFunctions.js/passFunctions.js,
// which are hard-wired to gameStore.js and carry side effects (Supabase
// saves, victory-overlay UI, snackbars meant for a human) that don't belong
// in an unattended simulation.

const TILE_VALUES = {
  A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10
};

const rackValue = (rack) => (rack || []).reduce((sum, tile) => {
  if (tile === '?' || tile === '*') return sum;
  return sum + (TILE_VALUES[tile] || 0);
}, 0);

// Real Scrabble ends a game when either (a) one player empties their rack
// with an empty pool left, or (b) six consecutive scoreless turns pass -
// counting both passes AND zero-score exchanges as "scoreless", since both
// are scoreless under the real rule. Play's own passFunctions.js only counts
// explicit passes toward this (and doesn't even act on it - it's a TODO stub
// there); this is a deliberate small deviation, not a bug, so Sandbox can't
// stall forever against a bot that just keeps exchanging a bad rack.
export const checkGameEnd = ({ currentRack, pool, consecutiveScorelessTurns }) => {
  if ((currentRack || []).length === 0 && (pool || []).length === 0) {
    return 'emptied';
  }
  if (consecutiveScorelessTurns >= 6) {
    return 'sixPasses';
  }
  return null;
};

// Sums moveHistory fresh per player rather than trusting an incrementally
// tracked running total - src/functions/play/gameEndFunctions.js documents a
// real drift bug with the latter (a stale state snapshot can silently drop a
// move's points forever), so this avoids that class of bug entirely.
export const computeFinalScores = ({ moveHistory, player1Name, player2Name, endReason, player1Rack, player2Rack }) => {
  let player1Score = 0;
  let player2Score = 0;
  (moveHistory || []).forEach((move) => {
    const score = move.score || 0;
    if (move.player === player1Name) player1Score += score;
    else if (move.player === player2Name) player2Score += score;
  });

  if (endReason === 'emptied') {
    // Whoever emptied their rack gets 2x the OTHER player's remaining tile value.
    const player1Emptied = (player1Rack || []).length === 0;
    if (player1Emptied) {
      player1Score += rackValue(player2Rack) * 2;
    } else {
      player2Score += rackValue(player1Rack) * 2;
    }
  } else if (endReason === 'sixPasses') {
    // Each player's own remaining rack value is deducted from their own
    // score - a different rule than the rack-empty ending (documented in
    // src/functions/gcgUtils.js:219-227 as a gap that ending doesn't handle).
    player1Score -= rackValue(player1Rack);
    player2Score -= rackValue(player2Rack);
  }

  const winner = player1Score > player2Score
    ? player1Name
    : player2Score > player1Score
      ? player2Name
      : null; // tie

  return { player1Score, player2Score, winner };
};
