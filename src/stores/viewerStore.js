import { create } from 'zustand';
import { getRandomNumber } from '../utils/gameUtils';
import { origPool, origBoard } from '../components/AppContent/References/staticData';
import { getMoveSet, getRecentGameInfo, getGameInfo, getCustomPlayerGameInfo } from '../axios/api';
import { parseGCG } from '../utils/gcgParser';
import { getRandomWooglesGame } from '../components/AppContent/References/wooglesGames';

export const useViewerStore = create((set, get) => {
  // Initial state
  const initialState = {
    // Game state
    gameNum: 37033,
    boardClickCount: 0,
    moveSet: [],
    currentMoveCoords: [],
    boardCoords: [],
    player1points: 0,
    player2points: 0,
    pointsScored: 0,
    mode: "VIEWER",
    resetCount: 0,
    moveDirection: "neutral",
    boardMode: "STANDARD",
    tiles: "PROTILES",
    dictionary: "ANY",
    ELOCommentary: "NO",
    open: false,
    gameDictionary: "Loading...",
    currentMoveRef: { current: -1 },
    blankTiles: [],
    
    // Player state
    name1: '',
    name2: '',
    revealedName1: 'Player 1',
    revealedName2: 'Player 2',
    revealedElo: "",
    revealedElo2: "",
    tourneyNum: 0,
    unlockEloMode: true,
    customPlayerMode: { current: "" },
    showUnlockText: false,
    origPlayerRaw: "",
    
    // Game data
    notes: [],
    gamesViewed: [],
    recentNames: [],
    recentDictionaries: [],
    recentGameNums: [],
    loadingMsg: "Loading...",
    modalContent: "dictionaryTiles",
    
    // Woogles mode
    wooglesMode: false,
    currentWooglesGame: null,
    parsedMoves: [],
  };

  return {
    ...initialState,
    
    // Actions - Game state
    setGameNum: (num) => set({ gameNum: num }),
    setBoardClickCount: (count) => set({ boardClickCount: count }),
    setMoveSet: (moves) => set({ moveSet: moves }),
    setCurrentMoveCoords: (coords) => set({ currentMoveCoords: coords }),
    setBoardCoords: (coords) => set({ boardCoords: coords }),
    setPlayer1points: (points) => set({ player1points: points }),
    setPlayer2points: (points) => set({ player2points: points }),
    setPointsScored: (points) => set({ pointsScored: points }),
    setMode: (newMode) => set({ mode: newMode }),
    setResetCount: (count) => set({ resetCount: count }),
    setMoveDirection: (direction) => set({ moveDirection: direction }),
    setBoardMode: (mode) => set({ boardMode: mode }),
    setTiles: (tiles) => set({ tiles: tiles }),
    setDictionary: (dict) => set({ dictionary: dict }),
    setELOCommentary: (commentary) => set({ ELOCommentary: commentary }),
    setOpen: (isOpen) => set({ open: isOpen }),
    setGameDictionary: (dict) => set({ gameDictionary: dict }),
    setCurrentMoveRef: (ref) => set({ currentMoveRef: ref }),
    setBlankTiles: (tiles) => set({ blankTiles: tiles }),
    
    // Actions - Player state
    setName1: (name) => set({ name1: name }),
    setName2: (name) => set({ name2: name }),
    setRevealedName1: (name) => set({ revealedName1: name }),
    setRevealedName2: (name) => set({ revealedName2: name }),
    setRevealedElo: (elo) => set({ revealedElo: elo }),
    setRevealedElo2: (elo) => set({ revealedElo2: elo }),
    setTourneyNum: (num) => set({ tourneyNum: num }),
    setUnlockEloMode: (unlock) => set({ unlockEloMode: unlock }),
    setCustomPlayerMode: (modeRef) => set({ customPlayerMode: modeRef }),
    setShowUnlockText: (show) => set({ showUnlockText: show }),
    setOrigPlayerRaw: (raw) => set({ origPlayerRaw: raw }),
    
    // Actions - Game data
    setNotes: (notes) => set({ notes: notes }),
    setGamesViewed: (games) => set({ gamesViewed: games }),
    setRecentNames: (names) => set({ recentNames: names }),
    setRecentDictionaries: (dicts) => set({ recentDictionaries: dicts }),
    setRecentGameNums: (nums) => set({ recentGameNums: nums }),
    setLoadingMsg: (msg) => set({ loadingMsg: msg }),
    setModalContent: (content) => set({ modalContent: content }),
    
    // Actions - Woogles mode
    setWooglesMode: (isWoogles) => set({ wooglesMode: isWoogles }),
    setCurrentWooglesGame: (game) => set({ currentWooglesGame: game }),
    setParsedMoves: (parsed) => set({ parsedMoves: parsed }),
    
    // Utility functions
    handleClose: () => set({ open: false }),
    
    switchValue: () => set({ dictionary: "ANY" }),
    
    handleCustomPlayerMode: (event) => {
      const state = get();
      state.customPlayerMode.current = event.target.value;
    },
    
    handleDictionaryChange: (event) => {
      set({ dictionary: event.target.value });
      const state = get();
      state.customPlayerMode.current = "";
    },
    
    handleELOCommentaryChange: (event) => {
      set({ ELOCommentary: event.target.value });
    },
    
    handleTileChange: (event) => {
      set({ tiles: event.target.value });
    },
    
    switchMode: (onChange) => {
      const state = get();
      let newMode = state.mode === "GUESSELO" ? "VIEWER" : "GUESSELO";
      if (state.mode !== newMode) {
        // Use the appropriate randomize function based on current platform
        if (state.wooglesMode) {
          get().randomizeWooglesGame();
        } else {
          get().randomizeGame();
        }
        set({ mode: newMode });
        onChange(newMode);
      }
    },
    
    toggleWooglesMode: () => {
      const state = get();
      const newWooglesMode = !state.wooglesMode;
      set({ wooglesMode: newWooglesMode });
      
      if (newWooglesMode) {
        // Switch to Woogles mode - load a random Woogles game
        get().randomizeWooglesGame();
      } else {
        // Switch back to cross-tables mode - load a random cross-tables game
        get().randomizeGame();
      }
    },
    
    randomizeWooglesGame: () => {
      set({ 
        open: true, 
        loadingMsg: "Finding a Woogles game...", 
        modalContent: "loading", 
        moveDirection: "neutral" 
      });
      
      const gameId = getRandomWooglesGame();
      set({ 
        currentMoveRef: { current: -1 },
        currentWooglesGame: { gameId },
        gameNum: `woogles-${gameId}`
      });
      
      // Load the Woogles game data
      get().loadWooglesGameData();
    },
    
    randomizeGame: () => {
      set({ 
        open: true, 
        loadingMsg: "Finding a game...", 
        modalContent: "loading", 
        moveDirection: "neutral" 
      });
      
      const loadCustomPlayerGameInfo = async () => {
        const state = get();
        const info = state.customPlayerMode.current ? 
          await getCustomPlayerGameInfo(
            'https://cross-tables.com/rest/players.php?search=', 
            'https://www.cross-tables.com/anno.php?p=', 
            state.customPlayerMode.current
          ) : null;
        
        let randomNumber;
        if (info) {
          let randomIndex = Math.floor(Math.random() * info.length);
          randomNumber = info[randomIndex];
        } else {
          randomNumber = getRandomNumber(10000, 40000).toString();
        }
        
        set({ 
          currentMoveRef: { current: -1 },
          gameNum: randomNumber 
        });
        
        // Load the new game data after setting the game number
        get().loadGameData();
      };
      
      loadCustomPlayerGameInfo();
    },
    
    loadGameData: async () => {
      try {
        const state = get();
        let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
        document.title = 'Game Viewer';
        
        set({
          boardCoords: parsedOrigBoardCoords,
          player1points: 0,
          player2points: 0,
          pointsScored: 0,
          revealedName1: "Player 1",
          revealedName2: "Player 2",
          revealedElo: "",
          revealedElo2: "",
          recentNames: [],
          recentDictionaries: []
        });

        // 1. Fetch raw GCG from Cross-Tables API
        const rawGCG = await getMoveSet('https://www.cross-tables.com/annotated/selfgcg/', state.gameNum);
        if (!rawGCG) {
          console.error('Failed to load move set');
          get().randomizeGame();
          return;
        }
        
        // 2. Use NEW content-based parser for game logic
        const parsedMoves = parseGCG(rawGCG);
        
        // 3. Extract display data from raw GCG (for UI purposes)
        const lines = rawGCG.split('\n');
        const moveSet = lines.filter(str => str.startsWith(">")); // Raw move strings for display
        const origPlayerRaw = moveSet[0]?.split(':')[0] || ''; // Player name for display
        const notes = [];
        
        // Extract notes for display
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("#note")) {
            const count = lines.slice(0, i).filter(line => line.startsWith(">")).length;
            notes.push([lines[i].replace("#note ", ""), count]);
          }
        }
        
        // 4. Set state with both parsed moves (for logic) and display data
        set({
          moveSet: moveSet,        // Raw strings for UI display
          parsedMoves: parsedMoves, // Structured data for game logic
          origPlayerRaw: origPlayerRaw, // Player name for display
          notes: notes             // Notes for display
        });

        const infoRes = await getRecentGameInfo('https://www.cross-tables.com/annolistself.php');
        if (!infoRes) {
          console.error('Failed to load recent game info');
          return;
        }
        
        set({
          recentNames: infoRes[0],
          recentDictionaries: infoRes[1],
          recentGameNums: infoRes[2]
        });

        let text = await getGameInfo('https://www.cross-tables.com/annotated.php?u=', state.gameNum);
        if (!text) {
          console.error('Failed to load game info');
          get().randomizeGame();
          return;
        }
        
        const startIndex = text.indexOf('<p>Dictionary: <b>');
        if (startIndex !== -1) {
          const endIndex = text.indexOf('</b>', startIndex);
          if (endIndex !== -1) {
            const extractedText = text.substring(startIndex + 18, endIndex);
            const currentState = get();
            
            if (currentState.dictionary === "TWL" && !(extractedText.startsWith("TWL") || extractedText.startsWith("NWL"))) {
              get().randomizeGame();
              return;
            } else if (currentState.dictionary === "CSW" && !extractedText.startsWith("CSW")) {
              get().randomizeGame();
              return;
            } else if (extractedText === null) {
              get().randomizeGame();
              return;
            } else {
              set(state => ({
                gamesViewed: [...state.gamesViewed, state.gameNum],
                loadingMsg: "Loading the game...",
                gameDictionary: extractedText
              }));
              
              console.log("Game generated.");
              setTimeout(() => {
                set({ open: false });
              }, 1000);
            }
          }
        } else {
          get().randomizeGame();
          return;
        }

        const regex = /<tr><td>([^<]+)<\/td>/g;
        const matches = text.matchAll(regex);
        let i = 0;
        let name1 = '';
        let name2 = '';
        
        for (const match of matches) {
          if (i === 0) {
            name1 = match[1];
          } else if (i === 1) {
            name2 = match[1];
          }
          i++;
        }
        
        set({ name1, name2 });

        let matchTourney = text.match(/<a href='tourney\.php\?t=(\d+)'>/);
        let tourneyNumber = 0;
        if (matchTourney) {
          tourneyNumber = matchTourney[1];
        }
        set({ tourneyNum: tourneyNumber });
        
      } catch (error) {
        console.error('Error loading game data:', error);
        get().randomizeGame();
      }
    },
    
    loadSubmittedGameData: async (gameUrl) => {
      try {
        const state = get();
        let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
        document.title = 'Submitted Game Viewer';
        
        set({
          boardCoords: parsedOrigBoardCoords,
          player1points: 0,
          player2points: 0,
          pointsScored: 0,
          revealedName1: "Player 1",
          revealedName2: "Player 2",
          revealedElo: "",
          revealedElo2: "",
          recentNames: [],
          recentDictionaries: [],
          open: true,
          loadingMsg: "Loading submitted game...",
          modalContent: "loading"
        });

        // Only Woogles games are supported for submissions
        if (!gameUrl.includes('woogles.io')) {
          throw new Error('Only Woogles game URLs are supported for submissions');
        }

        // Extract game ID from Woogles URL
        const gameIdMatch = gameUrl.match(/game\/([^\/\?]+)/);
        if (!gameIdMatch) {
          throw new Error('Invalid Woogles URL');
        }
        const gameId = gameIdMatch[1];
        
        // Import the Woogles API functions
        const { getWooglesGameGCG, getWooglesGameMetadata } = await import('../axios/api');
        
        // Get both GCG and metadata
        const [gcg, metadata] = await Promise.all([
          getWooglesGameGCG(gameId),
          getWooglesGameMetadata(gameId)
        ]);
        
        if (!gcg) {
          throw new Error('Failed to load Woogles GCG');
        }
        
        if (!metadata) {
          throw new Error('Failed to load Woogles metadata');
        }
        
        // Parse moves and origPlayerRaw from GCG
        const moveSet = gcg.split('\n').filter(str => str.startsWith('>'));
        const origPlayerRaw = gcg.split('\n').filter(str => str.startsWith('>'))[0]?.split(':')[0];
        const lines = gcg.split('\n');
        let notes = [];
        let lexicon = '';
        let name1 = '';
        let name2 = '';
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('#note')) {
            const count = lines.slice(0, i).filter(line => line.startsWith('>')).length;
            notes.push([lines[i].replace('#note ', ''), count]);
          }
          if (lines[i].startsWith('#lexicon')) {
            lexicon = lines[i].split(' ')[1];
          }
          if (lines[i].startsWith('#player1')) {
            name1 = lines[i].split(' ').slice(2).join(' ');
          }
          if (lines[i].startsWith('#player2')) {
            name2 = lines[i].split(' ').slice(2).join(' ');
          }
        }
        
        const moveRes = [moveSet, origPlayerRaw, notes];
        const dictionary = metadata.lexicon || lexicon || 'Unknown';
        
        set({
          wooglesMode: true,
          currentWooglesGame: { gameId },
          gameNum: `woogles-${gameId}`,
          moveSet: moveRes[0],
          origPlayerRaw: moveRes[1],
          notes: moveRes[2],
          name1: name1,
          name2: name2,
          tourneyNum: 0,
          gamesViewed: [...state.gamesViewed, gameUrl],
          gameDictionary: dictionary,
          loadingMsg: "Loading the game...",
          currentMoveRef: { current: -1 }
        });
        
        console.log("Submitted Woogles game loaded.");
        setTimeout(() => {
          set({ open: false });
        }, 1000);
        
      } catch (error) {
        console.error('Error loading submitted game data:', error);
        set({ 
          open: true, 
          loadingMsg: `Error loading game: ${error.message}`, 
          modalContent: "loading" 
        });
        setTimeout(() => {
          set({ open: false });
        }, 3000);
      }
    },
    
    loadWooglesGameData: async () => {
      try {
        const state = get();
        let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
        document.title = 'Woogles Game Viewer';
        
        if (!state.currentWooglesGame) {
          console.error('No Woogles game selected');
          get().randomizeWooglesGame();
          return;
        }
        
        set({
          boardCoords: parsedOrigBoardCoords,
          player1points: 0,
          player2points: 0,
          pointsScored: 0,
          revealedName1: "Player 1",
          revealedName2: "Player 2",
          revealedElo: "",
          revealedElo2: "",
          recentNames: [],
          recentDictionaries: []
        });

        // Import the Woogles API functions
        const { getWooglesGameGCG, getWooglesGameMetadata } = await import('../axios/api');
        
        // Get both GCG and metadata
        const [gcg, metadata] = await Promise.all([
          getWooglesGameGCG(state.currentWooglesGame.gameId),
          getWooglesGameMetadata(state.currentWooglesGame.gameId)
        ]);
        
        if (!gcg) {
          console.error('Failed to load Woogles GCG');
          get().randomizeWooglesGame();
          return;
        }
        
        if (!metadata) {
          console.error('Failed to load Woogles metadata');
          get().randomizeWooglesGame();
          return;
        }
        
        // Parse moves and origPlayerRaw from GCG
        const moveSet = gcg.split('\n').filter(str => str.startsWith('>'));
        const origPlayerRaw = gcg.split('\n').filter(str => str.startsWith('>'))[0]?.split(':')[0];
        const lines = gcg.split('\n');
        let notes = [];
        let lexicon = '';
        let player1 = '';
        let player2 = '';
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('#note')) {
            const count = lines.slice(0, i).filter(line => line.startsWith('>')).length;
            notes.push([lines[i].replace('#note ', ''), count]);
          }
          if (lines[i].startsWith('#lexicon')) {
            lexicon = lines[i].split(' ')[1];
          }
          if (lines[i].startsWith('#player1')) {
            player1 = lines[i].split(' ').slice(2).join(' ');
          }
          if (lines[i].startsWith('#player2')) {
            player2 = lines[i].split(' ').slice(2).join(' ');
          }
        }
        
        // Parse the entire GCG once and store the parsed moves
        const parsedMoves = parseGCG(gcg);
        
        // Get dictionary from metadata
        const dictionary = metadata.lexicon || lexicon || 'Unknown';
        
        set({
          moveSet: moveSet,
          parsedMoves: parsedMoves,
          origPlayerRaw: origPlayerRaw,
          notes: notes,
          name1: player1,
          name2: player2,
          gameDictionary: dictionary,
          gamesViewed: [...state.gamesViewed, state.gameNum],
          loadingMsg: "Loading the Woogles game...",
        });
        
        console.log("Woogles game loaded.");
        setTimeout(() => {
          set({ open: false });
        }, 1000);
        
      } catch (error) {
        console.error('Error loading Woogles game data:', error);
        get().randomizeWooglesGame();
      }
    },
    
    // Additional utility functions that might be needed
    resetGame: () => {
      set({
        boardCoords: JSON.parse(origBoard).map(row => row.map(Number)),
        player1points: 0,
        player2points: 0,
        pointsScored: 0,
        currentMoveRef: { current: -1 }
      });
    },
    
    updateCurrentMove: (moveIndex) => {
      const state = get();
      if (moveIndex >= 0 && moveIndex < state.moveSet.length) {
        set({ currentMoveRef: { current: moveIndex } });
      }
    },
    
    // Game control functions
    beginningOfGame: () => {
      let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
      set({ 
        boardCoords: parsedOrigBoardCoords,
        currentMoveRef: { current: -1 },
      });
    },
    
    chooseGame: (gameNum) => {
      const state = get();
      set({
        currentMoveRef: { current: -1 },
        resetCount: state.resetCount + 1,
        gameNum: gameNum
      });
      
      // Load the new game data after setting the game number
      get().loadGameData();
    }
  };
}); 