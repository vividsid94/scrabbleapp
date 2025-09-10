import { create } from 'zustand';

export const useEscapeRoom3DStore = create((set, get) => {
  // Initial state
  const initialState = {
    // Room state
    currentRoom: 'library',
    rooms: {
      library: {
        id: 'library',
        name: 'The Ancient Library',
        description: 'You wake up in a mysterious library. Dusty books line the walls, and strange symbols glow in the darkness. You must solve word puzzles to unlock the secrets and escape!',
        theme: 'dark',
        timeLimit: 20, // minutes
        difficulty: 'medium',
        unlocked: true,
        completed: false,
        exits: {
          north: 'study',
          east: 'laboratory',
          south: null,
          west: null
        },
        objects: [
          { id: 'door1', type: 'door', position: { x: 200, y: 300 }, locked: true, puzzle: 'word_lock' },
          { id: 'bookshelf1', type: 'bookshelf', position: { x: 400, y: 200 }, locked: true, puzzle: 'anagram' },
          { id: 'crystal1', type: 'crystal', position: { x: 600, y: 400 }, locked: true, puzzle: 'word_chain' },
          { id: 'desk', type: 'desk', position: { x: 100, y: 100 }, locked: false, puzzle: null },
          { id: 'chair', type: 'chair', position: { x: 150, y: 150 }, locked: false, puzzle: null }
        ],
        inventory: [],
        clues: []
      },
      study: {
        id: 'study',
        name: 'The Secret Study',
        description: 'A hidden study room filled with ancient scrolls and mysterious artifacts. The air is thick with magic and knowledge.',
        theme: 'mystical',
        timeLimit: 15,
        difficulty: 'hard',
        unlocked: false,
        completed: false,
        exits: {
          north: 'tower',
          east: null,
          south: 'library',
          west: null
        },
        objects: [
          { id: 'scroll1', type: 'scroll', position: { x: 300, y: 200 }, locked: true, puzzle: 'riddle' },
          { id: 'crystal2', type: 'crystal', position: { x: 500, y: 300 }, locked: true, puzzle: 'word_chain' },
          { id: 'door2', type: 'door', position: { x: 200, y: 100 }, locked: true, puzzle: 'word_lock' }
        ],
        inventory: [],
        clues: []
      },
      laboratory: {
        id: 'laboratory',
        name: 'The Alchemical Laboratory',
        description: 'A strange laboratory filled with bubbling potions and glowing crystals. The air crackles with magical energy.',
        theme: 'neon',
        timeLimit: 18,
        difficulty: 'hard',
        unlocked: false,
        completed: false,
        exits: {
          north: null,
          east: 'garden',
          south: null,
          west: 'library'
        },
        objects: [
          { id: 'cauldron', type: 'cauldron', position: { x: 400, y: 300 }, locked: true, puzzle: 'word_chain' },
          { id: 'crystal3', type: 'crystal', position: { x: 200, y: 200 }, locked: true, puzzle: 'anagram' },
          { id: 'door3', type: 'door', position: { x: 600, y: 100 }, locked: true, puzzle: 'word_lock' }
        ],
        inventory: [],
        clues: []
      },
      tower: {
        id: 'tower',
        name: 'The Escape Tower',
        description: 'The final room! A tall tower with a window overlooking the outside world. Solve the final puzzle to escape!',
        theme: 'victory',
        timeLimit: 10,
        difficulty: 'expert',
        unlocked: false,
        completed: false,
        exits: {
          north: null,
          east: null,
          south: 'study',
          west: null
        },
        objects: [
          { id: 'finalDoor', type: 'door', position: { x: 300, y: 200 }, locked: true, puzzle: 'final_puzzle' },
          { id: 'window', type: 'window', position: { x: 500, y: 100 }, locked: false, puzzle: null }
        ],
        inventory: [],
        clues: []
      },
      garden: {
        id: 'garden',
        name: 'The Enchanted Garden',
        description: 'A beautiful garden filled with magical plants and glowing flowers. The path to freedom lies through here.',
        theme: 'nature',
        timeLimit: 12,
        difficulty: 'medium',
        unlocked: false,
        completed: false,
        exits: {
          north: null,
          east: null,
          south: null,
          west: 'laboratory'
        },
        objects: [
          { id: 'fountain', type: 'fountain', position: { x: 400, y: 300 }, locked: true, puzzle: 'word_chain' },
          { id: 'tree', type: 'tree', position: { x: 200, y: 200 }, locked: true, puzzle: 'anagram' }
        ],
        inventory: [],
        clues: []
      }
    },
    
    // Game state
    gameStarted: false,
    gameEnded: false,
    timeRemaining: 0,
    score: 0,
    hintsUsed: 0,
    maxHints: 3,
    
    // Current puzzle state
    currentPuzzle: null,
    puzzles: {
      mystery: [
        {
          id: 'door1',
          type: 'word_lock',
          title: 'The Ancient Door',
          description: 'The ancient door is sealed with a word lock. Form a 7-letter word using the tiles to unlock it.',
          tiles: ['M', 'Y', 'S', 'T', 'E', 'R', 'Y'],
          solution: 'MYSTERY',
          hint: 'The word describes something unknown or puzzling',
          position: { x: 200, y: 300 },
          unlocked: false
        },
        {
          id: 'bookshelf',
          type: 'anagram',
          title: 'The Hidden Clue',
          description: 'Among the dusty tomes, you find a scroll with scrambled letters. Rearrange them to find the secret word:',
          tiles: ['L', 'I', 'B', 'R', 'A', 'R', 'Y'],
          solution: 'LIBRARY',
          hint: 'Where books are kept',
          position: { x: 400, y: 200 },
          unlocked: false
        },
        {
          id: 'crystal',
          type: 'word_chain',
          title: 'The Crystal Orb',
          description: 'The crystal orb pulses with energy. Create a word chain starting with the given letter:',
          startLetter: 'S',
          minLength: 4,
          words: ['STAR', 'TAR', 'ART', 'RAT', 'AT'],
          position: { x: 600, y: 400 },
          unlocked: false
        }
      ]
    },
    
    // Player state
    selectedTiles: [],
    selectedTileIndices: [], // Track which tile positions are selected
    availableTiles: [],
    usedTiles: [],
    currentWord: '',
    
    // UI state
    showHint: false,
    showInventory: false,
    showTimer: true,
    showScore: true,
    atmosphericEffects: true,
    
    // Sound state
    soundEnabled: true,
    musicVolume: 0.7,
    sfxVolume: 0.8
  };

  return {
    ...initialState,
    
    // Actions
    startGame: (roomId) => set((state) => {
      const room = state.rooms[roomId];
      return {
        gameStarted: true,
        currentRoom: roomId,
        timeRemaining: room.timeLimit * 60,
        currentPuzzle: null,
        availableTiles: [],
        gameEnded: false,
        inventory: [],
        clues: []
      };
    }),
    
    // Room navigation
    moveToRoom: (direction) => set((state) => {
      const currentRoom = state.rooms[state.currentRoom];
      const targetRoomId = currentRoom.exits[direction];
      
      if (targetRoomId && state.rooms[targetRoomId].unlocked) {
        const targetRoom = state.rooms[targetRoomId];
        return {
          currentRoom: targetRoomId,
          timeRemaining: targetRoom.timeLimit * 60,
          currentPuzzle: null,
          availableTiles: []
        };
      }
      return state;
    }),
    
    // Object interaction
    interactWithObject: (objectId) => set((state) => {
      const currentRoom = state.rooms[state.currentRoom];
      const object = currentRoom.objects.find(obj => obj.id === objectId);
      
      console.log('Interacting with object:', object);
      
      if (object && object.locked && object.puzzle) {
        // Object is locked, start puzzle
        console.log('Starting puzzle for locked object:', object.puzzle);
        return {
          currentPuzzle: {
            id: objectId,
            type: object.puzzle,
            tiles: object.puzzle === 'word_lock' ? ['M', 'Y', 'S', 'T', 'E', 'R', 'Y'] : 
                   object.puzzle === 'anagram' ? ['L', 'I', 'B', 'R', 'A', 'R', 'Y'] :
                   object.puzzle === 'word_chain' ? ['S', 'T', 'A', 'R'] : [],
            solution: object.puzzle === 'word_lock' ? 'MYSTERY' :
                     object.puzzle === 'anagram' ? 'LIBRARY' :
                     object.puzzle === 'word_chain' ? 'STAR' : '',
            hint: 'Solve the puzzle to unlock this object'
          },
          availableTiles: object.puzzle === 'word_lock' ? ['M', 'Y', 'S', 'T', 'E', 'R', 'Y'] : 
                         object.puzzle === 'anagram' ? ['L', 'I', 'B', 'R', 'A', 'R', 'Y'] :
                         object.puzzle === 'word_chain' ? ['S', 'T', 'A', 'R'] : []
        };
      }
      return state;
    }),
    
    // Unlock object
    unlockObject: (objectId) => set((state) => {
      const currentRoom = state.rooms[state.currentRoom];
      const updatedObjects = currentRoom.objects.map(obj => 
        obj.id === objectId ? { ...obj, locked: false } : obj
      );
      
      return {
        rooms: {
          ...state.rooms,
          [state.currentRoom]: {
            ...currentRoom,
            objects: updatedObjects
          }
        }
      };
    }),
    
    // Add item to inventory
    addToInventory: (item) => set((state) => {
      const currentRoom = state.rooms[state.currentRoom];
      return {
        rooms: {
          ...state.rooms,
          [state.currentRoom]: {
            ...currentRoom,
            inventory: [...currentRoom.inventory, item]
          }
        }
      };
    }),
    
    // Add clue
    addClue: (clue) => set((state) => {
      const currentRoom = state.rooms[state.currentRoom];
      return {
        rooms: {
          ...state.rooms,
          [state.currentRoom]: {
            ...currentRoom,
            clues: [...currentRoom.clues, clue]
          }
        }
      };
    }),
    
    // Unlock room
    unlockRoom: (roomId) => set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: {
          ...state.rooms[roomId],
          unlocked: true
        }
      }
    })),
    
    endGame: (success) => set((state) => ({
      gameEnded: true,
      gameStarted: false,
      rooms: {
        ...state.rooms,
        [state.currentRoom]: {
          ...state.rooms[state.currentRoom],
          completed: success
        }
      }
    })),
    
    selectTile: (tile, tileIndex) => set((state) => {
      // Check if this specific tile position is already selected
      if (state.selectedTileIndices.includes(tileIndex)) {
        // Remove this tile from selection
        const newSelectedIndices = state.selectedTileIndices.filter(i => i !== tileIndex);
        const newSelectedTiles = newSelectedIndices.map(i => state.availableTiles[i]);
        return {
          selectedTiles: newSelectedTiles,
          selectedTileIndices: newSelectedIndices,
          currentWord: newSelectedTiles.join('')
        };
      } else {
        // Add this tile to selection
        const newSelectedIndices = [...state.selectedTileIndices, tileIndex];
        const newSelectedTiles = newSelectedIndices.map(i => state.availableTiles[i]);
        return {
          selectedTiles: newSelectedTiles,
          selectedTileIndices: newSelectedIndices,
          currentWord: newSelectedTiles.join('')
        };
      }
    }),
    
    submitWord: () => set((state) => {
      const puzzle = state.currentPuzzle;
      if (!puzzle) return state;
      
      const isCorrect = puzzle.solution === state.currentWord.toUpperCase();
      
      if (isCorrect) {
        // Puzzle solved! Unlock the object
        const currentRoom = state.rooms[state.currentRoom];
        const updatedObjects = currentRoom.objects.map(obj => 
          obj.id === puzzle.id ? { ...obj, locked: false } : obj
        );
        
        // Check if this unlocks a new room
        let newUnlockedRooms = {};
        if (puzzle.id === 'door1') {
          newUnlockedRooms = { study: true, laboratory: true };
        } else if (puzzle.id === 'door2') {
          newUnlockedRooms = { tower: true };
        } else if (puzzle.id === 'door3') {
          newUnlockedRooms = { garden: true };
        }
        
        // Update rooms with unlocked exits
        const updatedRooms = Object.keys(newUnlockedRooms).reduce((acc, roomId) => {
          acc[roomId] = { ...state.rooms[roomId], unlocked: true };
          return acc;
        }, {});
        
        // Check if this is the final puzzle
        if (puzzle.id === 'finalDoor') {
          return {
            rooms: {
              ...state.rooms,
              [state.currentRoom]: {
                ...currentRoom,
                objects: updatedObjects
              },
              ...updatedRooms
            },
            score: state.score + 1000,
            gameEnded: true,
            gameStarted: false,
            currentPuzzle: null,
            selectedTiles: [],
            selectedTileIndices: [],
            currentWord: ''
          };
        }
        
        return {
          rooms: {
            ...state.rooms,
            [state.currentRoom]: {
              ...currentRoom,
              objects: updatedObjects
            },
            ...updatedRooms
          },
          currentPuzzle: null,
          availableTiles: [],
          selectedTiles: [],
          selectedTileIndices: [],
          currentWord: '',
          score: state.score + 100
        };
      } else {
        // Wrong answer
        return {
          selectedTiles: [],
          selectedTileIndices: [],
          currentWord: '',
          score: Math.max(0, state.score - 50)
        };
      }
    }),
    
    useHint: () => set((state) => {
      if (state.hintsUsed < state.maxHints) {
        return {
          hintsUsed: state.hintsUsed + 1,
          showHint: true,
          score: Math.max(0, state.score - 25)
        };
      }
      return state;
    }),
    
    tickTimer: () => set((state) => {
      if (state.timeRemaining > 0) {
        const newTime = state.timeRemaining - 1;
        if (newTime === 0) {
          // Time's up!
          return {
            timeRemaining: 0,
            gameEnded: true,
            gameStarted: false
          };
        }
        return { timeRemaining: newTime };
      }
      return state;
    }),
    
    resetGame: () => set(initialState),
    
    unlockRoom: (roomId) => set((state) => ({
      rooms: {
        ...state.rooms,
        [roomId]: {
          ...state.rooms[roomId],
          unlocked: true
        }
      }
    })),
    
    toggleSound: () => set((state) => ({
      soundEnabled: !state.soundEnabled
    })),
    
    setMusicVolume: (volume) => set({ musicVolume: volume }),
    setSfxVolume: (volume) => set({ sfxVolume: volume })
  };
});
