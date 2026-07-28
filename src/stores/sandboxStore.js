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
  totalGames: 5,
  setPlayer1BotName: (name) => set({ player1BotName: name }),
  setPlayer2BotName: (name) => set({ player2BotName: name }),
  setTotalGames: (n) => set({ totalGames: n }),

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
  playOneGame: async ({ gameIndex, player1BotName, player2BotName }) => {
    const sameBotName = player1BotName === player2BotName;
    const player1Name = sameBotName ? `${formatPlayerName(player1BotName)}_1` : formatPlayerName(player1BotName);
    const player2Name = sameBotName ? `${formatPlayerName(player2BotName)}_2` : formatPlayerName(player2BotName);

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
      const playerName = currentPlayer === 1 ? player1Name : player2Name;
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      const currentPoints = currentPlayer === 1 ? player1points : player2points;

      let chosenMove = null;
      try {
        const sortedMoves = await fetchSandboxMoves({ boardCoords, rack: currentRack, pool });
        chosenMove = await pickBotMove({ sortedMoves, botName, boardCoords, pool });
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
        const tilesToExchange = chosenMove.tilesExchanged;
        const rackAfterRemoval = removeTilesByCount(currentRack, tilesToExchange);
        const { rack: newRack, pool: poolAfterDraw } = drawUpTo7(rackAfterRemoval, pool);
        pool = [...poolAfterDraw, ...tilesToExchange];

        moveHistory = [...moveHistory, {
          boardDiff: [], player: playerName, score: 0,
          rack: currentRack.join(''), tilesExchanged: tilesToExchange.join(''),
          total: currentPoints, word: 'Exchange'
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

  startSeries: async () => {
    const { totalGames, player1BotName, player2BotName } = get();
    set({ isRunning: true, seriesResults: [], currentGameIndex: 0, shouldStop: false });

    for (let gameIndex = 0; gameIndex < totalGames; gameIndex++) {
      if (get().shouldStop) break;
      set({ currentGameIndex: gameIndex });

      const result = await get().playOneGame({ gameIndex, player1BotName, player2BotName });
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
