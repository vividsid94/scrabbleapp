import { create } from 'zustand';
import { origBoard, origPool } from '../components/AppContent/References/staticData';
import { alphabetizeRack, removeTilesByCount } from '../functions/play/rackFunctions';
import { getBoardDiff } from '../functions/play/boardUtils';
import { generateGCGContent, downloadGCGFile, formatPlayerName } from '../functions/gcgUtils';
import { fetchSandboxMoves, pickBotMove } from '../functions/sandboxBotFunctions';
import { checkGameEnd, computeFinalScores } from '../functions/sandboxGameFunctions';

const dealRackFrom = (pool) => {
  const rack = [];
  for (let i = 0; i < 7 && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    rack.push(pool[index]);
    pool.splice(index, 1);
  }
  return alphabetizeRack(rack);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// The whole series already arrived in one response by the time replay runs,
// so there's nothing to wait on - this is 0 (not removed entirely) only so
// each turn still yields one tick back to the event loop between set()
// calls, keeping the tab responsive instead of blocking through a couple
// hundred turns in one synchronous burst.
const REPLAY_DELAY_MS = 0;

const drawUpTo7 = (rack, pool) => {
  const newRack = [...rack];
  const newPool = [...pool];
  while (newRack.length < 7 && newPool.length > 0) {
    const index = Math.floor(Math.random() * newPool.length);
    newRack.push(newPool[index]);
    newPool.splice(index, 1);
  }
  return { rack: alphabetizeRack(newRack), pool: newPool };
};

// Any matchup of "static" bots (Theo, or a user-chosen Nth-ranked static
// bot) runs entirely server-side in one call, so it can handle a much
// bigger series than the per-move client loop Tess still needs. Above this
// many games the bulk path also skips the animated replay (see
// startSeries) - nobody's watching 30+ games play out turn by turn.
const MAX_GAMES_STATIC = 500;
const MAX_GAMES_WITH_TESS = 30;
const REPLAY_GAME_LIMIT = 30;

const isStaticBot = (botName) => botName === 'Theo' || botName === 'Static';

const getMaxGamesForBots = (player1BotName, player2BotName) =>
  (isStaticBot(player1BotName) && isStaticBot(player2BotName)) ? MAX_GAMES_STATIC : MAX_GAMES_WITH_TESS;

// Theo is just rank 1 of the same "pick the Nth-ranked move" mechanism a
// user-chosen Static bot uses; Tess has no rank (she runs her own defense
// sim client-side and never reaches the bulk endpoint).
const getBotRank = (botName, staticRank) => {
  if (botName === 'Theo') return 1;
  if (botName === 'Static') return staticRank;
  return null;
};

// "Static" is the internal botName (matches the rank-based mechanism in
// simulate.go/sandboxBotFunctions.js); "SpeedyN" is just how it's displayed/
// named in the UI, GCGs, and results.
const getBotDisplayName = (botName, staticRank) =>
  botName === 'Static' ? `Speedy${staticRank}` : botName;

export const useSandboxStore = create((set, get) => ({
  // Live single-game state
  boardCoords: [],
  player1Rack: [],
  player2Rack: [],
  pool: [],
  currentPlayer: 1,
  player1points: 0,
  player2points: 0,
  moveHistory: [],
  blankTiles: [],
  consecutiveScorelessTurns: 0,
  gameStarted: false,
  player1Name: 'Theo_1',
  player2Name: 'Theo_2',

  // Series configuration - editable while not running
  player1BotName: 'Theo',
  player2BotName: 'Theo',
  // Only meaningful when the corresponding botName is 'Static' - which
  // ranked candidate (1-15) that side plays every turn.
  player1StaticRank: 5,
  player2StaticRank: 5,
  totalGames: 5,
  // Switching either side re-clamps totalGames immediately, so the input
  // never silently shows a number bigger than what'll actually run (e.g.
  // dropping from 200/Theo-Theo down to Tess shouldn't leave 200 displayed
  // when only 30 will start).
  setPlayer1BotName: (name) => set(state => ({
    player1BotName: name,
    totalGames: Math.min(state.totalGames, getMaxGamesForBots(name, state.player2BotName))
  })),
  setPlayer2BotName: (name) => set(state => ({
    player2BotName: name,
    totalGames: Math.min(state.totalGames, getMaxGamesForBots(state.player1BotName, name))
  })),
  setPlayer1StaticRank: (rank) => set({ player1StaticRank: Math.min(Math.max(1, rank || 1), 15) }),
  setPlayer2StaticRank: (rank) => set({ player2StaticRank: Math.min(Math.max(1, rank || 1), 15) }),
  setTotalGames: (n) => set(state => ({
    totalGames: Math.min(Math.max(1, n || 1), getMaxGamesForBots(state.player1BotName, state.player2BotName))
  })),

  // Series run state
  isRunning: false,
  currentGameIndex: 0,
  seriesResults: [],
  shouldStop: false,

  stopSeries: () => set({ shouldStop: true, isRunning: false }),

  // Plays exactly one game to completion, mutating local variables and
  // periodically syncing them to the store (not batched at the end, unlike
  // puzzleStore.js's perf-optimized executeFastPlayMoves) so the board
  // visibly steps through move by move. Returns the finished game's result,
  // or null if the series was stopped mid-game (no GCG generated for an
  // aborted game).
  playOneGame: async ({ gameIndex, player1BotName, player2BotName, player1Rank, player2Rank, player1Name, player2Name }) => {
    let boardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    let pool = origPool.split('');
    let player1Rack = dealRackFrom(pool);
    let player2Rack = dealRackFrom(pool);
    let player1points = 0;
    let player2points = 0;
    let moveHistory = [];
    let blankTiles = [];
    let consecutiveScorelessTurns = 0;
    let currentPlayer = Math.random() < 0.5 ? 1 : 2;

    set({
      boardCoords, player1Rack, player2Rack, pool, currentPlayer,
      player1points, player2points, moveHistory, blankTiles,
      consecutiveScorelessTurns, gameStarted: true, player1Name, player2Name
    });

    let endReason = null;

    while (!endReason) {
      if (get().shouldStop) return null;

      const botName = currentPlayer === 1 ? player1BotName : player2BotName;
      const rank = currentPlayer === 1 ? player1Rank : player2Rank;
      const playerName = currentPlayer === 1 ? player1Name : player2Name;
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      const currentPoints = currentPlayer === 1 ? player1points : player2points;

      let chosenMove = null;
      try {
        const sortedMoves = await fetchSandboxMoves({ boardCoords, rack: currentRack, pool });
        chosenMove = await pickBotMove({ sortedMoves, botName, rank, boardCoords, pool });
      } catch (error) {
        console.error('Sandbox move-fetch error:', error);
        chosenMove = null;
      }

      if (!chosenMove) {
        // No legal word play and no viable exchange - pass.
        consecutiveScorelessTurns += 1;
        moveHistory = [...moveHistory, {
          boardDiff: [], player: playerName, score: 0,
          rack: currentRack.join(''), total: currentPoints, word: 'Pass'
        }];
      } else if (chosenMove.isExchange) {
        consecutiveScorelessTurns += 1;
        const tilesToExchange = chosenMove.tilesExchanged || chosenMove.tiles.map(t => t.letter);
        const rackAfterRemoval = removeTilesByCount(currentRack, tilesToExchange);
        const { rack: newRack, pool: poolAfterDraw } = drawUpTo7(rackAfterRemoval, pool);
        pool = [...poolAfterDraw, ...tilesToExchange];

        moveHistory = [...moveHistory, {
          boardDiff: [], player: playerName, score: 0,
          rack: currentRack.join(''), tilesExchanged: tilesToExchange.join(''),
          total: currentPoints, word: 'Exchange',
          isBot: true // both sides are bots in Sandbox - hide exchanged tiles in display
        }];

        if (currentPlayer === 1) player1Rack = newRack; else player2Rack = newRack;
      } else {
        // Word play.
        consecutiveScorelessTurns = 0;
        const newBoard = boardCoords.map(row => [...row]);
        const usedLetters = [];
        const newBlanks = [];
        chosenMove.tiles.forEach(tile => {
          if (tile.isNew) {
            newBoard[tile.row][tile.col] = tile.letter;
            usedLetters.push(tile.isBlank ? '?' : tile.letter);
            if (tile.isBlank) newBlanks.push({ row: tile.row, col: tile.col });
          }
        });

        const rackAfterRemoval = removeTilesByCount(currentRack, usedLetters);
        const { rack: newRack, pool: poolAfterDraw } = drawUpTo7(rackAfterRemoval, pool);
        pool = poolAfterDraw;

        const newTotal = currentPoints + (chosenMove.score || 0);
        const boardDiff = getBoardDiff(boardCoords, newBoard);

        moveHistory = [...moveHistory, {
          boardDiff, player: playerName, score: chosenMove.score || 0,
          rack: currentRack.join(''), total: newTotal, word: chosenMove.word
        }];

        boardCoords = newBoard;
        blankTiles = [...blankTiles, ...newBlanks];
        if (currentPlayer === 1) { player1Rack = newRack; player1points = newTotal; }
        else { player2Rack = newRack; player2points = newTotal; }
      }

      const nextRack = currentPlayer === 1 ? player1Rack : player2Rack;
      endReason = checkGameEnd({ currentRack: nextRack, pool, consecutiveScorelessTurns });

      set({
        boardCoords, player1Rack, player2Rack, pool, player1points, player2points,
        moveHistory, blankTiles, consecutiveScorelessTurns, currentPlayer
      });

      if (!endReason) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        set({ currentPlayer });
      }
    }

    const { player1Score, player2Score, winner } = computeFinalScores({
      moveHistory, player1Name, player2Name, endReason, player1Rack, player2Rack
    });

    const gcgContent = generateGCGContent(moveHistory, player1Name, player2Name, blankTiles, player1Rack, player2Rack, pool);

    set({ player1points: player1Score, player2points: player2Score });

    return { gameIndex, player1Score, player2Score, winner, player1Name, player2Name, gcgContent };
  },

  // Replays one already-simulated game (from the Go /simulate-series bulk
  // endpoint) turn by turn into the store, so the board visibly steps
  // through even though the whole game's outcome was already decided
  // server-side in one shot. Mirrors playOneGame's per-turn set() shape so
  // the UI (which just reads moveHistory/boardCoords/racks) can't tell the
  // difference between this and a live-fetched game.
  replayBulkGame: async ({ gameData, gameIndex, player1Name, player2Name }) => {
    let boardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    let blankTiles = [];
    let moveHistory = [];
    let player1points = 0;
    let player2points = 0;

    set({
      boardCoords, player1Rack: [], player2Rack: [], pool: [], currentPlayer: 1,
      player1points, player2points, moveHistory, blankTiles,
      gameStarted: true, player1Name, player2Name
    });

    for (const turn of (gameData.turns || [])) {
      if (get().shouldStop) return null;

      const playerName = turn.player === 1 ? player1Name : player2Name;

      if (turn.type === 'pass') {
        moveHistory = [...moveHistory, {
          boardDiff: [], player: playerName, score: 0,
          rack: turn.rackBefore, total: turn.runningTotal, word: 'Pass'
        }];
      } else if (turn.type === 'exchange') {
        moveHistory = [...moveHistory, {
          boardDiff: [], player: playerName, score: 0,
          rack: turn.rackBefore, tilesExchanged: turn.tilesExchanged,
          total: turn.runningTotal, word: 'Exchange',
          isBot: true // both sides are bots in Sandbox - hide exchanged tiles in display
        }];
      } else {
        const newTiles = (turn.tiles || []).filter(t => t.isNew);
        const boardDiff = newTiles.map(t => ({ row: t.row, col: t.col, value: t.letter }));
        const newBoard = boardCoords.map(row => [...row]);
        boardDiff.forEach(d => { newBoard[d.row][d.col] = d.value; });
        boardCoords = newBoard;

        const newBlanks = newTiles.filter(t => t.isBlank).map(t => ({ row: t.row, col: t.col }));
        blankTiles = [...blankTiles, ...newBlanks];

        moveHistory = [...moveHistory, {
          boardDiff, player: playerName, score: turn.score,
          rack: turn.rackBefore, total: turn.runningTotal, word: turn.word
        }];
      }

      if (turn.player === 1) player1points = turn.runningTotal; else player2points = turn.runningTotal;

      const rackUpdate = turn.player === 1
        ? { player1Rack: turn.rackBefore.split('') }
        : { player2Rack: turn.rackBefore.split('') };

      set({
        boardCoords, moveHistory, blankTiles, player1points, player2points,
        currentPlayer: turn.player, ...rackUpdate
      });

      await sleep(REPLAY_DELAY_MS);
    }

    const winner = gameData.winner === 1 ? player1Name : gameData.winner === 2 ? player2Name : null;

    const gcgContent = generateGCGContent(
      moveHistory, player1Name, player2Name, blankTiles,
      (gameData.player1FinalRack || '').split(''),
      (gameData.player2FinalRack || '').split(''),
      (gameData.finalPool || '').split('')
    );

    set({
      player1Rack: (gameData.player1FinalRack || '').split(''),
      player2Rack: (gameData.player2FinalRack || '').split(''),
      pool: (gameData.finalPool || '').split('')
    });

    return {
      gameIndex,
      player1Score: gameData.player1Score,
      player2Score: gameData.player2Score,
      winner,
      player1Name,
      player2Name,
      gcgContent
    };
  },

  // Same data transform as replayBulkGame, but with no set()/delay per turn -
  // for series too big to sensibly animate (REPLAY_GAME_LIMIT+), nobody's
  // watching each of 30+ games play out, so just compute results and GCGs
  // directly. Returns the game's result plus the final display state
  // (board/racks/etc as of the LAST turn), which the caller applies only
  // once, for the final game in the series.
  finalizeBulkGame: ({ gameData, gameIndex, player1Name, player2Name }) => {
    let boardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    let blankTiles = [];
    let moveHistory = [];

    (gameData.turns || []).forEach(turn => {
      const playerName = turn.player === 1 ? player1Name : player2Name;

      if (turn.type === 'pass') {
        moveHistory.push({
          boardDiff: [], player: playerName, score: 0,
          rack: turn.rackBefore, total: turn.runningTotal, word: 'Pass'
        });
      } else if (turn.type === 'exchange') {
        moveHistory.push({
          boardDiff: [], player: playerName, score: 0,
          rack: turn.rackBefore, tilesExchanged: turn.tilesExchanged,
          total: turn.runningTotal, word: 'Exchange',
          isBot: true // both sides are bots in Sandbox - hide exchanged tiles in display
        });
      } else {
        const newTiles = (turn.tiles || []).filter(t => t.isNew);
        const boardDiff = newTiles.map(t => ({ row: t.row, col: t.col, value: t.letter }));
        const newBoard = boardCoords.map(row => [...row]);
        boardDiff.forEach(d => { newBoard[d.row][d.col] = d.value; });
        boardCoords = newBoard;

        const newBlanks = newTiles.filter(t => t.isBlank).map(t => ({ row: t.row, col: t.col }));
        blankTiles = [...blankTiles, ...newBlanks];

        moveHistory.push({
          boardDiff, player: playerName, score: turn.score,
          rack: turn.rackBefore, total: turn.runningTotal, word: turn.word
        });
      }
    });

    const winner = gameData.winner === 1 ? player1Name : gameData.winner === 2 ? player2Name : null;

    const gcgContent = generateGCGContent(
      moveHistory, player1Name, player2Name, blankTiles,
      (gameData.player1FinalRack || '').split(''),
      (gameData.player2FinalRack || '').split(''),
      (gameData.finalPool || '').split('')
    );

    return {
      result: {
        gameIndex,
        player1Score: gameData.player1Score,
        player2Score: gameData.player2Score,
        winner, player1Name, player2Name, gcgContent
      },
      finalDisplayState: {
        boardCoords, blankTiles, moveHistory,
        player1Rack: (gameData.player1FinalRack || '').split(''),
        player2Rack: (gameData.player2FinalRack || '').split(''),
        pool: (gameData.finalPool || '').split(''),
        player1points: gameData.player1Score,
        player2points: gameData.player2Score,
        player1Name, player2Name
      }
    };
  },

  startSeries: async () => {
    const { player1BotName, player2BotName, player1StaticRank, player2StaticRank } = get();
    // Defensive re-clamp in case bot selection changed after totalGames was
    // set (setPlayer1BotName/setPlayer2BotName already re-clamp on change,
    // but this is the last checkpoint before anything actually runs).
    const totalGames = Math.min(get().totalGames, getMaxGamesForBots(player1BotName, player2BotName));
    set({ isRunning: true, seriesResults: [], currentGameIndex: 0, shouldStop: false, totalGames });

    // Single source of truth for both display names (with same-bot
    // disambiguation) and ranks - computed once here and threaded through
    // playOneGame/replayBulkGame/finalizeBulkGame rather than each
    // re-deriving it.
    const player1BaseName = getBotDisplayName(player1BotName, player1StaticRank);
    const player2BaseName = getBotDisplayName(player2BotName, player2StaticRank);
    const sameBotName = player1BaseName === player2BaseName;
    const player1Name = sameBotName ? `${formatPlayerName(player1BaseName)}_1` : formatPlayerName(player1BaseName);
    const player2Name = sameBotName ? `${formatPlayerName(player2BaseName)}_2` : formatPlayerName(player2BaseName);
    const player1Rank = getBotRank(player1BotName, player1StaticRank);
    const player2Rank = getBotRank(player2BotName, player2StaticRank);

    // Any matchup where neither side is Tess can be decided entirely
    // server-side in one call - Theo/Static picks are just "the Nth-ranked
    // candidate," which needs no client-side simulation loop. Tess (defense
    // sims) isn't ported server-side, so a series involving her still uses
    // the per-move client loop.
    const useBulkPath = isStaticBot(player1BotName) && isStaticBot(player2BotName);

    if (useBulkPath) {
      try {
        const response = await fetch('https://scrabble-move-generator-production.up.railway.app/simulate-series', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ games: totalGames, player1Rank, player2Rank })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const games = data.games || [];

        // Past REPLAY_GAME_LIMIT games, skip the turn-by-turn animation
        // entirely and just compute each game's result/GCG directly -
        // nobody's watching 30+ games play out one move at a time. Only the
        // very last game's ending position gets shown, once everything's done.
        const skipReplay = games.length > REPLAY_GAME_LIMIT;

        for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
          if (get().shouldStop) break;
          set({ currentGameIndex: gameIndex });

          if (skipReplay) {
            const { result, finalDisplayState } = get().finalizeBulkGame({
              gameData: games[gameIndex], gameIndex, player1Name, player2Name
            });
            set(state => ({ seriesResults: [...state.seriesResults, result] }));
            if (gameIndex === games.length - 1) {
              set({ ...finalDisplayState, gameStarted: true });
            }
          } else {
            const result = await get().replayBulkGame({
              gameData: games[gameIndex], gameIndex, player1Name, player2Name
            });
            if (!result) break; // stopped mid-replay

            set(state => ({ seriesResults: [...state.seriesResults, result] }));
          }
          if (get().shouldStop) break;
        }
      } catch (error) {
        console.error('Sandbox bulk series error:', error);
      }

      set({ isRunning: false });
      return;
    }

    for (let gameIndex = 0; gameIndex < totalGames; gameIndex++) {
      if (get().shouldStop) break;
      set({ currentGameIndex: gameIndex });

      const result = await get().playOneGame({
        gameIndex, player1BotName, player2BotName, player1Rank, player2Rank, player1Name, player2Name
      });
      if (!result) break; // stopped mid-game

      set(state => ({ seriesResults: [...state.seriesResults, result] }));
      if (get().shouldStop) break;
    }

    set({ isRunning: false });
  },

  downloadGameGCG: (result) => {
    downloadGCGFile(result.gcgContent, `sandbox_${result.player1Name}_vs_${result.player2Name}_game${result.gameIndex + 1}.gcg`);
  }
}));
