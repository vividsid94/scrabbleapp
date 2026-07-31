import { create } from 'zustand';
import { origBoard, origPool } from '../components/AppContent/References/staticData';
import { alphabetizeRack, removeTilesByCount } from '../functions/play/rackFunctions';
import { getBoardDiff } from '../functions/play/boardUtils';
import { generateGCGContent, downloadGCGFile, formatPlayerName } from '../functions/gcgUtils';
import { fetchSandboxMoves, pickBotMove } from '../functions/sandboxBotFunctions';
import { checkGameEnd, computeFinalScores } from '../functions/sandboxGameFunctions';
import { buildSandboxViewState } from '../functions/sandboxViewFunctions';

const dealRackFrom = (pool) => {
  const rack = [];
  for (let i = 0; i < 7 && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    rack.push(pool[index]);
    pool.splice(index, 1);
  }
  return alphabetizeRack(rack);
};

// Which of RulesBot's six named rules (rulesbot.go) map to which per-turn
// flag simulate.go sets - see RulesBotImpact's comment there for what each
// one actually asks ("would dropping ONLY this rule have flipped the pick").
const RULESBOT_RULE_LABELS = [
  { key: 'rulesBotOpeningVowelImpacted', label: 'opening DLS vowel' },
  { key: 'rulesBotOpeningStarImpacted', label: 'opening star S' },
  { key: 'rulesBotClosenessImpacted', label: 'closeness' },
  { key: 'rulesBotVowelPremiumImpacted', label: 'TLS/TWS vowel' },
  { key: 'rulesBotHookImpacted', label: 'hook on premium' },
  { key: 'rulesBotLaneCountImpacted', label: 'bingo lane count' },
];

// Turns simulate.go's per-turn ruleImpacted/bingoAversionImpacted/
// rulesBotImpacted flags into a display-ready list: which turns a custom
// leave rule, bingo aversion, and/or RulesBot's defense rules actually
// changed the outcome of, vs. what this bot would have played without that
// specific mechanism - each A/B is computed server-side against the
// identical candidate list (see simulate.go's sameCandidate), this just
// formats it. A turn can be impacted by more than one mechanism at once,
// each with its own separate "instead of" counterfactual, since they
// answer different what-if questions. For RulesBot specifically, it's
// possible for the aggregate rulesBotImpacted to be true while none of the
// six individual flags are - that happens when no SINGLE rule's removal
// alone would have flipped the pick, only two or more together; the label
// falls back to a bare "RulesBot" rather than naming a rule in that case.
const extractImpactedTurns = (gameData, player1Name, player2Name) =>
  (gameData.turns || [])
    .map((turn, turnIndex) => ({ turn, turnIndex }))
    .filter(({ turn }) => turn.ruleImpacted || turn.bingoAversionImpacted || turn.rulesBotImpacted)
    .map(({ turn, turnIndex }) => {
      const reasons = [];
      if (turn.ruleImpacted) {
        reasons.push({
          label: 'leave rule',
          without: turn.baselineType === 'exchange'
            ? `Exchange ${turn.baselineTilesExchanged}`
            : `${turn.baselineWord} (${turn.baselineScore})`,
        });
      }
      if (turn.bingoAversionImpacted) {
        reasons.push({
          label: 'bingo aversion',
          without: turn.withoutAversionType === 'exchange'
            ? `Exchange ${turn.withoutAversionTilesExchanged}`
            : `${turn.withoutAversionWord} (${turn.withoutAversionScore})`,
        });
      }
      if (turn.rulesBotImpacted) {
        const firedRules = RULESBOT_RULE_LABELS.filter(r => turn[r.key]).map(r => r.label);
        reasons.push({
          label: firedRules.length > 0 ? `RulesBot: ${firedRules.join(', ')}` : 'RulesBot',
          without: turn.rulesBotBaselineType === 'exchange'
            ? `Exchange ${turn.rulesBotBaselineTilesExchanged}`
            : `${turn.rulesBotBaselineWord} (${turn.rulesBotBaselineScore})`,
        });
      }
      return {
        turnIndex,
        player: turn.player,
        playerName: turn.player === 1 ? player1Name : player2Name,
        actual: turn.type === 'exchange'
          ? `Exchange ${turn.tilesExchanged}`
          : `${turn.word} (${turn.score})`,
        reasons,
      };
    });

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

// Both matchup kinds now run entirely server-side in one call (see
// pickTessCandidate in simulate.go), and simulateSeriesHandler now runs
// games concurrently across a worker pool too - but a Tess bot's per-turn
// cost is still dramatically higher than a rank-based bot's (~20
// in-process opponent simulations x top 15 candidates, every turn), so a
// series involving her stays capped much lower - empirically settling
// around ~1.8-2.6s/game (Tess on one/both sides) vs ~22ms/game steady-state
// for a static-only matchup, post-parallelization. Above MAX_GAMES_STATIC/
// 30 games the bulk path also skips the animated replay (see startSeries) -
// nobody's watching 30+ games play out turn by turn.
const MAX_GAMES_STATIC = 500;
const MAX_GAMES_WITH_TESS = 30;
// RulesBot (rulesbot.go) does real per-candidate board-copy work every turn
// (unlike a rank-based pick, which is pure sorting) but nowhere near Tess's
// cost - measured ~170ms/game with one RulesBot side, ~314ms/game with both,
// vs ~28ms/game static-only and ~1.8-2.9s/game with Tess. 200 games caps the
// worst case (both sides RulesBot) at roughly the same order of magnitude
// wait as Tess's own 30-game cap at her worst case.
const MAX_GAMES_WITH_RULESBOT = 200;

// /simulate-series returns one complete JSON response (not a stream), so
// there's no real per-game progress to report while it's in flight - these
// are an empirically measured linear fit (base overhead + ms/game) against
// the deployed Railway endpoint, used only to drive an approximate,
// time-based progress fill for that wait. Re-measured after
// simulateSeriesHandler started running games concurrently across a worker
// pool (~4x throughput on this deployment) - the true relationship isn't
// perfectly linear anymore (small game counts get more parallelism benefit,
// since there's no queueing until games > worker count, so per-game cost is
// lower there than at steady state), but a straight-line fit is still a
// reasonable approximation for a progress bar. Re-measure again if the Go
// service's per-game cost or worker count changes meaningfully.
const SIMULATE_SERIES_BASE_MS = 90;
const SIMULATE_SERIES_PER_GAME_MS = 22;
// A Tess bot's per-turn cost is nothing like a rank-based bot's - her
// server-side pick (simulate.go's pickTessCandidate) runs ~20 in-process
// opponent simulations for each of the top 15 candidates, every turn - and
// unlike the static case, this cost doesn't shrink much from
// parallelization (Tess's own inner-candidate loop still runs sequentially
// within a game; only whole games run concurrently with each other).
// Measured post-parallelization: ~1.8-2s/game steady-state with one Tess
// side, ~2.6-3s/game with both sides Tess. Using the static-bot constant
// here would fill the bar to ~97% in a couple seconds and then sit there
// doing nothing for the rest of the wait - actively misleading, not just
// imprecise.
const SIMULATE_SERIES_PER_GAME_MS_ONE_TESS = 1800;
const SIMULATE_SERIES_PER_GAME_MS_BOTH_TESS = 2900;
// Same idea for RulesBot, measured against the same deployment - see
// MAX_GAMES_WITH_RULESBOT's comment for the raw numbers this comes from.
const SIMULATE_SERIES_PER_GAME_MS_ONE_RULESBOT = 175;
const SIMULATE_SERIES_PER_GAME_MS_BOTH_RULESBOT = 320;
// Never let the time-based estimate alone claim completion - real per-game
// progress (from the finalize/replay loop below) always takes over for the
// final stretch once the response actually lands.
const ESTIMATED_PROGRESS_CAP = 97;

// Tracks the one live estimate timer so it can be cleared from stopSeries
// too, not just the fetch's own success/error paths - module-level (not
// store state) since it's an implementation detail, not something any
// component needs to read.
let estimateIntervalId = null;
const clearEstimateInterval = () => {
  if (estimateIntervalId) {
    clearInterval(estimateIntervalId);
    estimateIntervalId = null;
  }
};

const isStaticBot = (botName) => botName === 'Theo' || botName === 'Static';
const isTessBot = (botName) => botName === 'Tess';

// Tess dominates cost whenever she's present on either side, regardless of
// what's on the other side (including RulesBot) - checked first for that
// reason. Otherwise, RulesBot on either side gets its own middle tier;
// both-static is the only combination cheap enough for MAX_GAMES_STATIC.
const getMaxGamesForBots = (player1BotName, player2BotName) => {
  if (isTessBot(player1BotName) || isTessBot(player2BotName)) return MAX_GAMES_WITH_TESS;
  if (player1BotName === 'RulesBot' || player2BotName === 'RulesBot') return MAX_GAMES_WITH_RULESBOT;
  return (isStaticBot(player1BotName) && isStaticBot(player2BotName)) ? MAX_GAMES_STATIC : MAX_GAMES_WITH_TESS;
};

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
// named in the UI, GCGs, and results - unless a SpecialSelection override
// mode is active, in which case rank is irrelevant (simulate.go ignores it
// entirely under SpecialSelection) so the name reflects the mode instead,
// everywhere a bot name shows up (toggle button, series labels, GCGs).
const getBotDisplayName = (botName, staticRank, specialSelection) => {
  if (botName !== 'Static') return botName;
  if (specialSelection === 'longestWord') return 'Longest Word';
  if (specialSelection === 'mostTiles') return 'Most Tiles';
  return `Speedy${staticRank}`;
};

// Converts the UI's editable rule rows (all fields optional/string-typed
// while being edited) into the exact shape simulate.go's LeaveRule expects -
// dropping any rule that's missing the letter(s) its type needs, so a
// half-filled row just gets ignored server-side rather than sent as a
// no-op or rejected.
const sanitizeLeaveRules = (rules) => (rules || [])
  .filter((r) => {
    if (r.type === 'containsLetter' || r.type === 'containsCount') return !!r.letter;
    if (r.type === 'containsAny' || r.type === 'containsAll') return !!r.letters;
    return true;
  })
  .map((r) => {
    const rule = { type: r.type };
    if (r.letter) rule.letter = r.letter;
    if (r.letters) rule.letters = r.letters;
    if (r.comparator) rule.comparator = r.comparator;
    if (r.type === 'containsCount' || r.type === 'vowelCount' || r.type === 'consonantCount' || r.type === 'lengthEquals') {
      rule.count = Number(r.count) || 0;
    }
    if (r.type === 'multiplier') {
      rule.multiplier = Number(r.multiplier) || 1;
    } else {
      rule.bonus = Number(r.bonus) || 0;
    }
    return rule;
  });

// Converts the UI's two independent checkboxes (probabilityEnabled,
// rankLimitEnabled) into simulate.go's BingoAversionRule shape - each
// mechanism's value is only sent if its own checkbox is on, so a
// half-configured/unchecked mechanism sends as 0 (which BingoAversionRule
// already treats as "disabled") rather than accidentally firing with a
// stale leftover value. Returns undefined (send nothing) if neither
// mechanism is enabled.
const buildBingoAversionPayload = (bingoAversion) => {
  if (!bingoAversion.probabilityEnabled && !bingoAversion.rankLimitEnabled) return undefined;
  return {
    probability: bingoAversion.probabilityEnabled ? bingoAversion.probability : 0,
    maxProbabilityRank: bingoAversion.rankLimitEnabled ? (bingoAversion.maxProbabilityRank || 0) : 0,
  };
};

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
  // 'Theo' is no longer offered as its own UI toggle option (she's
  // mechanically just Speedy at rank 1 - see SandboxPlayerInfo.js's
  // BOT_OPTIONS comment), so the default selection is 'Static' at rank 1
  // instead - same bot, just selected through the option that's actually
  // still in the UI.
  player1BotName: 'Static',
  player2BotName: 'Static',
  // Only meaningful when the corresponding botName is 'Static' - which
  // ranked candidate (1-15) that side plays every turn.
  player1StaticRank: 1,
  player2StaticRank: 1,
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

  // Speedy-only override modes (see simulate.go's BotConfig.SpecialSelection) -
  // '' (normal), 'longestWord', or 'mostTiles'. Deliberately mutually
  // exclusive with rank, LeaveRules, and BingoAversion (no conjunction
  // allowed), so the UI disables those controls whenever this is set
  // rather than trying to reconcile them.
  player1SpecialSelection: '',
  player2SpecialSelection: '',
  setPlayer1SpecialSelection: (value) => set({ player1SpecialSelection: value }),
  setPlayer2SpecialSelection: (value) => set({ player2SpecialSelection: value }),

  // Per-side leave-value rules (see simulate.go's LeaveRule) that let a
  // Theo/Static bot's candidate ranking diverge from the plain leaves.json
  // table - Tess ignores these entirely (simulate.go's pickTessCandidate
  // always uses baselineTotal), the UI hides the editor for her to match.
  player1LeaveRules: [],
  player2LeaveRules: [],
  addLeaveRule: (side) => set(state => ({
    [`player${side}LeaveRules`]: [...state[`player${side}LeaveRules`], { type: 'containsLetter', letter: '', bonus: 0 }]
  })),
  updateLeaveRule: (side, index, patch) => set(state => {
    const key = `player${side}LeaveRules`;
    const rules = state[key].slice();
    rules[index] = { ...rules[index], ...patch };
    return { [key]: rules };
  }),
  removeLeaveRule: (side, index) => set(state => {
    const key = `player${side}LeaveRules`;
    return { [key]: state[key].filter((_, i) => i !== index) };
  }),

  // Per-side bingo aversion (see simulate.go's BingoAversionRule) - two
  // independently-toggleable, composable mechanisms that exclude 7-tile
  // plays from this bot's own candidate pool before ranking:
  // probabilityEnabled (a per-turn coin flip, 1 = always) and
  // rankLimitEnabled (deterministically refuses any bingo whose word
  // ranks worse than maxProbabilityRank in its own length's NWL23
  // probability-order list). Both apply to rank-based and Tess selection
  // alike, since they filter the shared pool before either one runs.
  player1BingoAversion: { probabilityEnabled: false, probability: 1, rankLimitEnabled: false, maxProbabilityRank: 8000 },
  player2BingoAversion: { probabilityEnabled: false, probability: 1, rankLimitEnabled: false, maxProbabilityRank: 8000 },
  setBingoAversion: (side, patch) => set(state => {
    const key = `player${side}BingoAversion`;
    return { [key]: { ...state[key], ...patch } };
  }),

  // Series run state
  isRunning: false,
  currentGameIndex: 0,
  seriesResults: [],
  shouldStop: false,
  // Time-based approximate progress (0-100) while the single bulk
  // /simulate-series request is in flight - see SIMULATE_SERIES_BASE_MS.
  estimatedProgressPercent: 0,

  // Whether SandboxPlayerInfo.js's "Series Setup" section (both players'
  // full config) is expanded - lives here rather than as component-local
  // state because SandboxPlayerInfo actually unmounts/remounts once early
  // on (Sandbox.js renders it from two different JSX branches depending on
  // gameStarted, and switching branches shifts its position in the tree,
  // which React treats as a brand new instance). Component-local state
  // doesn't survive that remount, so the auto-collapse-on-completion logic
  // below (see startSeries's final set() calls) would silently lose track
  // of it on a series's very first run specifically - global store state
  // isn't affected by which components happen to be mounted, so it doesn't
  // have this problem. Starts expanded; startSeries collapses it exactly
  // once a series finishes (never at the start), so the first run stays
  // open throughout, a plain rerun (already collapsed) stays collapsed,
  // and reopening to change settings before rerunning stays open through
  // that run too.
  showSetup: true,
  setShowSetup: (value) => set({ showSetup: value }),

  // "View" mode: replays one already-finished seriesResults game on the
  // board via buildSandboxViewState (sandboxViewFunctions.js), reusing the
  // exact same display fields (boardCoords/racks/etc) the live game writes
  // - see viewGame's comment below for why. viewingGameIndex is a
  // seriesResults[].gameIndex, or null when not viewing anything.
  viewingGameIndex: null,
  viewingTurnIndex: -1,
  // Snapshot of the display fields from right before viewGame first ran,
  // restored verbatim by exitViewGame - only captured on the FIRST
  // viewGame call (see there), so switching between two already-viewed
  // games never overwrites this with viewing data instead of the true
  // pre-viewing state.
  preViewState: null,

  stopSeries: () => {
    clearEstimateInterval();
    set({ shouldStop: true, isRunning: false });
  },

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

  // Converts one already-simulated game (from the Go /simulate-series bulk
  // endpoint) into a result + display state, with no per-turn set()/delay -
  // the move-by-move animated replay this used to feed was removed
  // entirely (every series now jumps straight to final results, regardless
  // of game count), so this is the only path bulk games go through.
  // Returns the game's result plus the final display state (board/racks/
  // etc as of the LAST turn), which the caller applies only once, for the
  // final game in the series.
  finalizeBulkGame: ({ gameData, gameIndex, player1Name, player2Name }) => {
    let boardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    let blankTiles = [];
    let moveHistory = [];

    (gameData.turns || []).forEach((turn, turnIndex) => {
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

        // turnIndex tags which point in the game each blank was placed at -
        // needed so a later turn-by-turn "View" replay of this finished game
        // (sandboxViewFunctions.js) knows which blanks existed as of any
        // given turn, not just the final set.
        const newBlanks = newTiles.filter(t => t.isBlank).map(t => ({ row: t.row, col: t.col, turnIndex }));
        blankTiles = [...blankTiles, ...newBlanks];

        moveHistory.push({
          boardDiff, player: playerName, score: turn.score,
          rack: turn.rackBefore, total: turn.runningTotal, word: turn.word
        });
      }
    });

    const winner = gameData.winner === 1 ? player1Name : gameData.winner === 2 ? player2Name : null;
    const player1FinalRack = (gameData.player1FinalRack || '').split('');
    const player2FinalRack = (gameData.player2FinalRack || '').split('');
    const finalPool = (gameData.finalPool || '').split('');

    const gcgContent = generateGCGContent(
      moveHistory, player1Name, player2Name, blankTiles,
      player1FinalRack, player2FinalRack, finalPool
    );

    return {
      result: {
        gameIndex,
        player1Score: gameData.player1Score,
        player2Score: gameData.player2Score,
        winner, player1Name, player2Name, gcgContent,
        impactedTurns: extractImpactedTurns(gameData, player1Name, player2Name),
        // Full per-turn history, kept (not just used to build the GCG
        // string and discarded) so a "View" action can replay this exact
        // game turn-by-turn later - see sandboxViewFunctions.js.
        moveHistory, blankTiles, player1FinalRack, player2FinalRack, finalPool
      },
      finalDisplayState: {
        boardCoords, blankTiles, moveHistory,
        player1Rack: player1FinalRack,
        player2Rack: player2FinalRack,
        pool: finalPool,
        player1points: gameData.player1Score,
        player2points: gameData.player2Score,
        player1Name, player2Name
      }
    };
  },

  startSeries: async () => {
    const {
      player1BotName, player2BotName, player1StaticRank, player2StaticRank,
      player1LeaveRules, player2LeaveRules, player1BingoAversion, player2BingoAversion,
      player1SpecialSelection, player2SpecialSelection
    } = get();
    // Defensive re-clamp in case bot selection changed after totalGames was
    // set (setPlayer1BotName/setPlayer2BotName already re-clamp on change,
    // but this is the last checkpoint before anything actually runs).
    const totalGames = Math.min(get().totalGames, getMaxGamesForBots(player1BotName, player2BotName));
    // Clearing viewingGameIndex/viewingTurnIndex/preViewState here matters:
    // seriesResults is wiped on the same line, so a stale "Viewing Game N"
    // panel left pointing at an index that no longer exists would otherwise
    // stick around with dead back/forward buttons - nothing else in this
    // function ever touches those 3 fields, since the live loop's own
    // set() calls only ever overwrite the shared DISPLAY fields (which is
    // fine either way), never the viewing-mode flags themselves.
    set({
      isRunning: true, seriesResults: [], currentGameIndex: 0, shouldStop: false, totalGames, estimatedProgressPercent: 0,
      viewingGameIndex: null, viewingTurnIndex: -1, preViewState: null
    });

    // Single source of truth for both display names (with same-bot
    // disambiguation) and ranks - computed once here and threaded through
    // playOneGame/finalizeBulkGame rather than each re-deriving it.
    const player1BaseName = getBotDisplayName(player1BotName, player1StaticRank, player1SpecialSelection);
    const player2BaseName = getBotDisplayName(player2BotName, player2StaticRank, player2SpecialSelection);
    const sameBotName = player1BaseName === player2BaseName;
    const player1Name = sameBotName ? `${formatPlayerName(player1BaseName)}_1` : formatPlayerName(player1BaseName);
    const player2Name = sameBotName ? `${formatPlayerName(player2BaseName)}_2` : formatPlayerName(player2BaseName);
    const player1Rank = getBotRank(player1BotName, player1StaticRank);
    const player2Rank = getBotRank(player2BotName, player2StaticRank);

    // Every matchup, Tess included, can now be decided entirely server-side
    // in one call: Theo/Static picks are just "the Nth-ranked candidate,"
    // and Tess's opponent-simulation selection (simulate.go's
    // pickTessCandidate) now runs in-process there too, instead of 15
    // separate /bulk-move-gen round-trips per turn from the browser. The
    // old per-move client loop (playOneGame, below) is kept as a fallback
    // but is currently unreachable - remove it once this path is verified
    // to actually work end to end.
    const useBulkPath = true;

    if (useBulkPath) {
      // The whole series comes back as one JSON response, not a stream, so
      // there's nothing to report real progress on until it lands - fake it
      // with a timer against the empirically measured per-game cost. Capped
      // below 100 so it never claims to finish before the response actually
      // arrives; real per-game progress (below) takes over for the last
      // stretch once results start coming in.
      const tessSideCount = (player1BotName === 'Tess' ? 1 : 0) + (player2BotName === 'Tess' ? 1 : 0);
      const rulesBotSideCount = (player1BotName === 'RulesBot' ? 1 : 0) + (player2BotName === 'RulesBot' ? 1 : 0);
      // Tess's estimate takes priority whenever she's on either side - her
      // per-game cost dwarfs RulesBot's, so a mixed Tess/RulesBot matchup is
      // still dominated by Tess's number.
      const perGameMs = tessSideCount === 2 ? SIMULATE_SERIES_PER_GAME_MS_BOTH_TESS
        : tessSideCount === 1 ? SIMULATE_SERIES_PER_GAME_MS_ONE_TESS
        : rulesBotSideCount === 2 ? SIMULATE_SERIES_PER_GAME_MS_BOTH_RULESBOT
        : rulesBotSideCount === 1 ? SIMULATE_SERIES_PER_GAME_MS_ONE_RULESBOT
        : SIMULATE_SERIES_PER_GAME_MS;
      const estimatedDurationMs = SIMULATE_SERIES_BASE_MS + perGameMs * totalGames;
      const fetchStartTime = Date.now();
      clearEstimateInterval();
      estimateIntervalId = setInterval(() => {
        const elapsed = Date.now() - fetchStartTime;
        const percent = Math.min(ESTIMATED_PROGRESS_CAP, Math.round((elapsed / estimatedDurationMs) * 100));
        set({ estimatedProgressPercent: percent });
      }, 150);

      try {
        // leaveRules is sent even for a Tess bot (e.g. if rules were added
        // while a different bot was selected, then switched to Tess) -
        // harmless either way, since pickTessCandidate ignores LeaveRules
        // entirely server-side. The UI itself hides the rule editor once
        // Tess is selected so this shouldn't normally happen.
        const player1Bot = {
          rank: player1Rank || 1, leaveRules: sanitizeLeaveRules(player1LeaveRules), isTess: player1BotName === 'Tess',
          bingoAversion: buildBingoAversionPayload(player1BingoAversion),
          specialSelection: player1SpecialSelection || undefined,
          isRulesBot: player1BotName === 'RulesBot',
        };
        const player2Bot = {
          rank: player2Rank || 1, leaveRules: sanitizeLeaveRules(player2LeaveRules), isTess: player2BotName === 'Tess',
          bingoAversion: buildBingoAversionPayload(player2BingoAversion),
          specialSelection: player2SpecialSelection || undefined,
          isRulesBot: player2BotName === 'RulesBot',
        };
        const response = await fetch('https://scrabble-move-generator-production.up.railway.app/simulate-series', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ games: totalGames, player1Bot, player2Bot })
        });
        clearEstimateInterval();
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const games = data.games || [];

        // No move-by-move animation for any series, regardless of game
        // count - every game jumps straight to its final result/GCG. Only
        // the very last game's ending position gets shown on the board,
        // once everything's done.
        for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
          if (get().shouldStop) break;
          set({ currentGameIndex: gameIndex });

          const { result, finalDisplayState } = get().finalizeBulkGame({
            gameData: games[gameIndex], gameIndex, player1Name, player2Name
          });
          set(state => ({ seriesResults: [...state.seriesResults, result] }));
          if (gameIndex === games.length - 1) {
            set({ ...finalDisplayState, gameStarted: true });
          }
          if (get().shouldStop) break;
        }
      } catch (error) {
        clearEstimateInterval();
        console.error('Sandbox bulk series error:', error);
      }

      set({ isRunning: false, showSetup: false });
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

    set({ isRunning: false, showSetup: false });
  },

  // Loads a finished seriesResults game onto the board at its final turn.
  // Guarded against isRunning so it can never race the live per-turn set()
  // calls in playOneGame/startSeries's own loop - both would be writing
  // the exact same display fields (boardCoords, racks, etc) at the same
  // time otherwise. Populates those fields from
  // buildSandboxViewState (sandboxViewFunctions.js) instead of a live sim,
  // which is why Sandbox.js's <Board> and SandboxPlayerInfo.js's Live
  // section need no changes at all to support viewing - they only ever
  // read from the store, never care how those fields got there.
  viewGame: (gameIndex) => {
    const state = get();
    if (state.isRunning) return;
    const result = state.seriesResults.find(r => r.gameIndex === gameIndex);
    if (!result || !result.moveHistory) return;

    // Only snapshot on the very first viewGame call (preViewState still
    // null) - switching from viewing game A straight to game B must not
    // clobber the original pre-viewing snapshot with A's (already-viewing)
    // state, or exitViewGame would "restore" into the middle of game A
    // instead of back to whatever was showing before viewing started.
    const preViewState = state.viewingGameIndex === null ? {
      boardCoords: state.boardCoords, blankTiles: state.blankTiles, moveHistory: state.moveHistory,
      player1Rack: state.player1Rack, player2Rack: state.player2Rack,
      player1points: state.player1points, player2points: state.player2points,
      currentPlayer: state.currentPlayer, gameStarted: state.gameStarted,
      player1Name: state.player1Name, player2Name: state.player2Name, pool: state.pool,
    } : state.preViewState;

    const turnIndex = result.moveHistory.length - 1;
    set({
      viewingGameIndex: gameIndex, viewingTurnIndex: turnIndex, preViewState,
      gameStarted: true, player1Name: result.player1Name, player2Name: result.player2Name,
      ...buildSandboxViewState(result, turnIndex)
    });
  },

  viewStepBack: () => {
    const state = get();
    const result = state.seriesResults.find(r => r.gameIndex === state.viewingGameIndex);
    if (!result) return; // stale reference (e.g. a new series started) - nothing to step through
    const turnIndex = Math.max(-1, state.viewingTurnIndex - 1);
    set({ viewingTurnIndex: turnIndex, ...buildSandboxViewState(result, turnIndex) });
  },

  viewStepForward: () => {
    const state = get();
    const result = state.seriesResults.find(r => r.gameIndex === state.viewingGameIndex);
    if (!result) return;
    const turnIndex = Math.min(result.moveHistory.length - 1, state.viewingTurnIndex + 1);
    set({ viewingTurnIndex: turnIndex, ...buildSandboxViewState(result, turnIndex) });
  },

  exitViewGame: () => {
    const { preViewState } = get();
    set({ ...(preViewState || {}), viewingGameIndex: null, viewingTurnIndex: -1, preViewState: null });
  },

  downloadGameGCG: (result) => {
    downloadGCGFile(result.gcgContent, `sandbox_${result.player1Name}_vs_${result.player2Name}_game${result.gameIndex + 1}.gcg`);
  }
}));
