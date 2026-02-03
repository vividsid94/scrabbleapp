import { create } from 'zustand';

const ROOM_TIME_LIMIT = 180; // 3 minutes per room (reduced from 5)

const initialRooms = [
  {
    id: 'chamber-of-values',
    name: 'Chamber of Values',
    theme: 'gold',
    status: 'locked',
    puzzles: [
      { id: 'rack-appraisal', name: 'Rack Appraisal', status: 'locked' },
      { id: 'tile-economist', name: 'Tile Economist', status: 'locked' },
    ],
  },
  {
    id: 'hall-of-words',
    name: 'Hall of Words',
    theme: 'emerald',
    status: 'locked',
    puzzles: [
      { id: 'word-judgment', name: 'Word Judgment', status: 'locked' },
      { id: 'anagram-forge', name: 'Anagram Forge', status: 'locked' },
    ],
  },
  {
    id: 'board-sanctuary',
    name: 'Board Sanctuary',
    theme: 'azure',
    status: 'locked',
    puzzles: [
      { id: 'board-map-challenge', name: 'Board Map Challenge', status: 'locked' },
      { id: 'score-calculator', name: 'Score Calculator', status: 'locked' },
    ],
  },
  {
    id: 'strategy-vault',
    name: 'Strategy Vault',
    theme: 'ruby',
    status: 'locked',
    puzzles: [
      { id: 'bingo-hunt', name: 'Bingo Hunt', status: 'locked' },
      { id: 'strategy-choice', name: 'Strategy Choice', status: 'locked' },
    ],
  },
  {
    id: 'inner-sanctum',
    name: 'Inner Sanctum',
    theme: 'purple',
    status: 'locked',
    puzzles: [
      { id: 'lexicon-trial', name: 'Lexicon Trial', status: 'locked' },
    ],
  },
];

export const useEscapeRoomStore = create((set, get) => ({
  gamePhase: 'intro', // 'intro' | 'playing' | 'transition' | 'victory' | 'defeat'
  currentRoomIndex: 0,
  currentPuzzleIndex: 0,
  rooms: JSON.parse(JSON.stringify(initialRooms)),
  score: 0,
  totalTimeElapsed: 0,
  roomTimeRemaining: ROOM_TIME_LIMIT,
  hintsRemaining: 2, // Reduced from 5
  puzzleState: {},
  transitionText: '',

  startGame: () => {
    const rooms = JSON.parse(JSON.stringify(initialRooms));
    rooms[0].status = 'active';
    rooms[0].puzzles[0].status = 'active';
    set({
      gamePhase: 'playing',
      currentRoomIndex: 0,
      currentPuzzleIndex: 0,
      rooms,
      score: 0,
      totalTimeElapsed: 0,
      roomTimeRemaining: ROOM_TIME_LIMIT,
      hintsRemaining: 2,
      puzzleState: {},
    });
  },

  solvePuzzle: (bonusPoints = 100) => {
    const state = get();
    const rooms = JSON.parse(JSON.stringify(state.rooms));
    const room = rooms[state.currentRoomIndex];
    const puzzle = room.puzzles[state.currentPuzzleIndex];
    puzzle.status = 'solved';

    // Time bonus: more time remaining = more bonus
    const timeBonus = Math.floor(state.roomTimeRemaining / 3);
    const totalPoints = bonusPoints + timeBonus;

    set({ rooms, score: state.score + totalPoints });
  },

  advancePuzzle: () => {
    const state = get();
    const room = state.rooms[state.currentRoomIndex];
    const nextPuzzleIndex = state.currentPuzzleIndex + 1;

    if (nextPuzzleIndex < room.puzzles.length) {
      const rooms = JSON.parse(JSON.stringify(state.rooms));
      rooms[state.currentRoomIndex].puzzles[nextPuzzleIndex].status = 'active';
      set({ currentPuzzleIndex: nextPuzzleIndex, rooms, puzzleState: {} });
    } else {
      // All puzzles in room solved, advance room
      get().advanceRoom();
    }
  },

  advanceRoom: () => {
    const state = get();
    const rooms = JSON.parse(JSON.stringify(state.rooms));
    rooms[state.currentRoomIndex].status = 'solved';
    const nextRoomIndex = state.currentRoomIndex + 1;

    if (nextRoomIndex < rooms.length) {
      rooms[nextRoomIndex].status = 'active';
      rooms[nextRoomIndex].puzzles[0].status = 'active';
      set({
        gamePhase: 'transition',
        transitionText: rooms[nextRoomIndex].name,
      });
      setTimeout(() => {
        set({
          gamePhase: 'playing',
          currentRoomIndex: nextRoomIndex,
          currentPuzzleIndex: 0,
          rooms,
          roomTimeRemaining: ROOM_TIME_LIMIT,
          puzzleState: {},
        });
      }, 2000);
    } else {
      set({ gamePhase: 'victory' });
    }
  },

  useHint: () => {
    const state = get();
    if (state.hintsRemaining > 0) {
      set({ hintsRemaining: state.hintsRemaining - 1 });
      return true;
    }
    return false;
  },

  tickTimer: () => {
    const state = get();
    if (state.gamePhase !== 'playing') return;

    const newRoomTime = state.roomTimeRemaining - 1;
    const newTotal = state.totalTimeElapsed + 1;

    if (newRoomTime <= 0) {
      set({ gamePhase: 'defeat', totalTimeElapsed: newTotal, roomTimeRemaining: 0 });
    } else {
      set({ roomTimeRemaining: newRoomTime, totalTimeElapsed: newTotal });
    }
  },

  setPuzzleState: (update) => {
    const state = get();
    set({ puzzleState: { ...state.puzzleState, ...update } });
  },

  resetGame: () => {
    set({
      gamePhase: 'intro',
      currentRoomIndex: 0,
      currentPuzzleIndex: 0,
      rooms: JSON.parse(JSON.stringify(initialRooms)),
      score: 0,
      totalTimeElapsed: 0,
      roomTimeRemaining: ROOM_TIME_LIMIT,
      hintsRemaining: 2,
      puzzleState: {},
      transitionText: '',
    });
  },
}));
