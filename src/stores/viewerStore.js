import { create } from 'zustand';
import { getRandomNumber } from '../utils/gameUtils';
import { origPool, origBoard } from '../components/AppContent/References/staticData';
import { getMoveSet, getRecentGameInfo, getGameInfo, getCustomPlayerGameInfo } from '../axios/api';
import { parseGCG } from '../utils/gcgParser';
import { getRandomWooglesGame } from '../components/AppContent/References/wooglesGames';
import { createRack } from '../functions/rackFunctions';
import { calculatePoolFromBoard } from '../functions/poolFunctions';
import { markBlanksLowercase } from '../functions/play/boardApiUtils';
import { DEFAULT_ANALYSIS_STATE, runMovePreviewEngine, runHeatMapEngine, runOpponentResponsesEngine, runLaneIsolationEngine } from '../functions/analysisEngine';
import { toggleLaneCell, computeLaneDragSpan } from '../functions/analysisBoardFunctions';

// --- Analysis Mode's own move-list fetch (deliberately a separate copy from
// Viewer/components/TopMoves.js's internal fetch, which owns its own local
// state and must not be touched/refactored) ---

const generateExchangeCombinations = (rack) => {
  const combinations = [];
  for (let i = 1; i <= Math.min(rack.length, 7); i++) {
    const generateCombos = (current, start, remaining) => {
      if (current.length === i) {
        combinations.push([...current]);
        return;
      }
      for (let j = start; j < remaining.length; j++) {
        current.push(remaining[j]);
        generateCombos(current, j + 1, remaining);
        current.pop();
      }
    };
    generateCombos([], 0, rack);
  }
  // No slice here - combos are generated size-ascending (all 1-tile combos,
  // then all 2-tile, etc.), so an early cap would make larger exchanges
  // (e.g. exchanging 5-6 tiles to keep just 1-2 good ones) unreachable no
  // matter how good they'd score. A 7-tile rack has at most 127 combos total
  // (2^7 - 1), which is cheap enough to keep in full - matches Play's own
  // generateExchangeCombinations (src/functions/play/moveFunctions.js),
  // which never had this cap.
  return combinations;
};

const calculateExchangeLeave = (rack, tilesToExchange) => {
  const tilesToRemove = tilesToExchange.map(tile => tile === '*' ? '?' : tile);
  const remainingTiles = rack.filter(tile => {
    const index = tilesToRemove.indexOf(tile);
    if (index !== -1) {
      tilesToRemove.splice(index, 1);
      return false;
    }
    return true;
  });
  return remainingTiles.sort().join('');
};

const calculateLeave = (move, currentRack) => {
  if (move.isExchange) {
    return move.leave;
  }
  const rackCopy = [...currentRack];
  for (const tile of move.tiles) {
    if (tile.isNew) {
      if (tile.isBlank) {
        const blankIndex = rackCopy.indexOf('?') !== -1 ? rackCopy.indexOf('?') : rackCopy.indexOf('*');
        if (blankIndex !== -1) {
          rackCopy.splice(blankIndex, 1);
        }
      } else {
        const tileIndex = rackCopy.indexOf(tile.letter);
        if (tileIndex !== -1) {
          rackCopy.splice(tileIndex, 1);
        }
      }
    }
  }
  return rackCopy.map(tile => tile === '*' ? '?' : tile).sort().join('');
};

const fetchLeaveValuesForAnalysis = async (moves) => {
  try {
    const leavesToFetch = new Map();
    const leavesArray = [];
    for (const move of moves) {
      const leaveStr = move.isExchange ? move.leave : calculateLeave(move, move.currentRack);
      move.leave = leaveStr;
      if (!leavesToFetch.has(leaveStr)) {
        leavesToFetch.set(leaveStr, true);
        leavesArray.push(leaveStr);
      }
    }
    if (leavesToFetch.size > 0) {
      const response = await fetch('/.netlify/functions/getLeaveValues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaves: leavesArray })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch leave values');
      }
      const data = await response.json();
      return data.leaveValues || {};
    }
    return {};
  } catch (error) {
    console.error('Error fetching leave values for analysis:', error);
    return {};
  }
};

export const useViewerStore = create((set, get) => {
  // Initial state
  const initialState = {
    // Game state
    gameNum: 28179,
    boardClickCount: 0,
  
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

    // Analysis Mode (board-based, shared engine with gameStore.js)
    analysis: DEFAULT_ANALYSIS_STATE,
    analysisTopMoves: [],
    isLoadingAnalysisTopMoves: false,
  };

  return {
    ...initialState,
    
    // Actions - Game state
    setGameNum: (num) => set({ gameNum: num }),
    setBoardClickCount: (count) => set({ boardClickCount: count }),

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
        console.log('parsedMoves:', parsedMoves);
        
        // 3. Extract notes for display
        const lines = rawGCG.split('\n');
        const origPlayerRaw = parsedMoves && parsedMoves.length > 0 ? parsedMoves[0].player : ''; // Player name from NEW parsing
        const notes = [];
        
        // Extract notes for display
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("#note")) {
            const count = lines.slice(0, i).filter(line => line.startsWith(">")).length;
            notes.push([lines[i].replace("#note ", ""), count]);
          }
        }
        
        // 4. Set state with parsed moves (for logic) and display data
        set({
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
        
        // Parse header info and notes from GCG
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
        
        // Parse the entire GCG once and store the parsed moves
        const parsedMoves = parseGCG(gcg);
        
        // Get origPlayerRaw from NEW content-based parsing
        const origPlayerRaw = parsedMoves && parsedMoves.length > 0 ? parsedMoves[0].player : '';
        
        const dictionary = metadata.lexicon || lexicon || 'Unknown';
        
        set({
          wooglesMode: true,
          currentWooglesGame: { gameId },
          gameNum: `woogles-${gameId}`,
          parsedMoves: parsedMoves,
          origPlayerRaw: origPlayerRaw,
          notes: notes,
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
        
        // Parse header info and notes from GCG
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
        
        // Get origPlayerRaw from NEW content-based parsing
        const origPlayerRaw = parsedMoves && parsedMoves.length > 0 ? parsedMoves[0].player : '';
        
        // Get dictionary from metadata
        const dictionary = metadata.lexicon || lexicon || 'Unknown';
        
        set({
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
      if (moveIndex >= 0 && moveIndex < state.parsedMoves.length) {
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
    },
    
    loadSavedGame: async (gameId) => {
      try {
        const { getSavedGame } = await import('../utils/games');
        const { data: game, error } = await getSavedGame(gameId);
        
        if (error || !game) {
          console.error('Error loading saved game:', error);
          get().randomizeGame();
          return;
        }
        
        // Reset board to initial state
        let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
        document.title = 'Saved Game Viewer';
        
        set({
          boardCoords: parsedOrigBoardCoords,
          player1points: 0,
          player2points: 0,
          pointsScored: 0,
          revealedName1: game.opponent_name || "Player 1",
          revealedName2: "You",
          revealedElo: "",
          revealedElo2: "",
          name1: game.opponent_name || "Opponent",
          name2: "You",
          gameDictionary: "TWL", // Default, could be stored in game data later
          gameNum: `saved-${gameId}`,
          wooglesMode: false,
          open: true,
          loadingMsg: "Loading saved game...",
          modalContent: "loading"
        });
        
        // Convert moveHistory to parsedMoves format
        // The moveHistory has: boardDiff, player, score, rack, total, word
        // parsedMoves format: { player, rack, location, word, score, total }
        const parsedMoves = [];
        
        // Determine which player is player 1 (the user)
        const userIsPlayer1 = true; // In bot mode, user is always player 1
        const player1Name = userIsPlayer1 ? "You" : game.opponent_name;
        const player2Name = userIsPlayer1 ? game.opponent_name : "You";
        
        for (let i = 0; i < game.move_history.length; i++) {
          const move = game.move_history[i];
          
          // Determine location from boardDiff
          let location = "--"; // Default to pass/exchange
          if (move.boardDiff && move.boardDiff.length > 0 && move.word && move.word !== "Pass" && move.word !== "Exchange") {
            // Get the first tile position (starting position)
            const firstTile = move.boardDiff[0];
            if (firstTile.row !== undefined && firstTile.col !== undefined) {
              // Convert row/col to location format (e.g., H7, A1)
              // Row is 0-14, Col is 0-14
              // Location format: row letter (A-O) + col number (1-15)
              const rowLetter = String.fromCharCode(65 + firstTile.row); // A=65, so row 0=A, row 7=H, row 14=O
              const colNumber = firstTile.col + 1; // col 0 -> 1, col 14 -> 15
              location = `${rowLetter}${colNumber}`;
            }
          }
          
          // Determine which player made this move
          // In saved games, player name might be "You", player1Name, or player2Name
          let movePlayer = move.player;
          if (!movePlayer || movePlayer === "Player 1") {
            movePlayer = player1Name;
          } else if (movePlayer === "Player 2") {
            movePlayer = player2Name;
          }
          
          // Create parsed move format matching parseGCG output
          // Store boardDiff for saved games so we can use it directly
          const parsedMove = {
            player: movePlayer,
            rack: move.rack || "",
            location: location,
            word: move.word || (location === "--" ? undefined : ""),
            score: move.score || 0,
            total: move.total || 0,
            boardDiff: move.boardDiff || null, // Store boardDiff for saved games
            isSavedGame: true // Flag to indicate this is from a saved game
          };
          
          parsedMoves.push(parsedMove);
        }
        
        // Build board state by applying all moves sequentially
        // This ensures the board state matches what it should be after all moves
        let currentBoard = parsedOrigBoardCoords.map(row => row.map(cell => cell));
        let currentPlayer1Points = 0;
        let currentPlayer2Points = 0;
        
        // Apply each move sequentially to build up the board
        for (let i = 0; i < parsedMoves.length; i++) {
          const move = parsedMoves[i];
          
          // Update board using boardDiff
          if (move.boardDiff && move.boardDiff.length > 0) {
            move.boardDiff.forEach(({ row, col, value }) => {
              if (row !== undefined && col !== undefined && row >= 0 && row < 15 && col >= 0 && col < 15) {
                currentBoard[row][col] = value;
              }
            });
          }
          
          // Update scores based on which player made the move
          if (move.player === player1Name) {
            currentPlayer1Points = move.total || currentPlayer1Points;
          } else if (move.player === player2Name) {
            currentPlayer2Points = move.total || currentPlayer2Points;
          }
        }
        
        // Set final state - start at the last move with the correct board state
        set({
          parsedMoves: parsedMoves,
          origPlayerRaw: parsedMoves.length > 0 ? parsedMoves[0].player : player1Name,
          boardCoords: currentBoard, // Board with all moves applied
          player1points: userIsPlayer1 ? currentPlayer1Points : currentPlayer2Points,
          player2points: userIsPlayer1 ? currentPlayer2Points : currentPlayer1Points,
          notes: [],
          currentMoveRef: { current: parsedMoves.length - 1 }, // At final move
          gamesViewed: [...get().gamesViewed, `saved-${gameId}`]
        });
        
        console.log("Saved game loaded.");
        setTimeout(() => {
          set({ open: false });
        }, 1000);
        
      } catch (error) {
        console.error('Error loading saved game:', error);
        get().randomizeGame();
      }
    },

    // --- Analysis Mode (board-based, shared engine with gameStore.js) ---

    setAnalysisState: (partial) => set(state => ({ analysis: { ...state.analysis, ...partial } })),

    enterAnalysisMode: () => {
      const { parsedMoves } = get();
      if (!parsedMoves || parsedMoves.length === 0) return;
      set({ analysis: { ...DEFAULT_ANALYSIS_STATE, active: true } });
    },

    exitAnalysisMode: () => set({ analysis: { ...DEFAULT_ANALYSIS_STATE }, analysisTopMoves: [], isLoadingAnalysisTopMoves: false }),

    // Clears the candidate list without fetching a new one - used when the
    // viewed position changes, so a stale list isn't shown for the new
    // position, but the user still has to explicitly ask Theo again (matching
    // Play, where entering Analysis Mode never auto-fetches either).
    resetAnalysisTopMoves: () => set({ analysisTopMoves: [], isLoadingAnalysisTopMoves: false }),

    runAnalysisMovePreview: async (move) => {
      const { boardCoords, currentMoveRef, parsedMoves, setAnalysisState } = get();
      const rack = createRack(currentMoveRef.current + 1, parsedMoves);
      const pool = calculatePoolFromBoard(boardCoords, origPool);
      await runMovePreviewEngine({ move, boardCoords, rack, pool }, setAnalysisState);
    },

    runAnalysisHeatMap: async (move, numSimulations = 200) => {
      const { boardCoords, setAnalysisState } = get();
      const pool = calculatePoolFromBoard(boardCoords, origPool);
      await runHeatMapEngine({ move, boardCoords, pool, numSimulations }, setAnalysisState);
    },

    runAnalysisOpponentResponses: async (moves, iterations = 20) => {
      const { boardCoords, setAnalysisState } = get();
      const pool = calculatePoolFromBoard(boardCoords, origPool);
      await runOpponentResponsesEngine({ moves, boardCoords, pool, iterations }, setAnalysisState);
    },

    toggleAnalysisLaneCell: (cell) => {
      const { analysis, boardCoords } = get();
      const newSelection = toggleLaneCell(analysis.laneSelection, analysis.selectedMove, boardCoords, cell);
      if (newSelection === analysis.laneSelection) return;
      set(state => ({ analysis: { ...state.analysis, laneSelection: newSelection, laneResult: null } }));
    },

    setAnalysisLaneDragSelection: (anchor, current) => {
      const { analysis, boardCoords } = get();
      const cells = computeLaneDragSpan(anchor, current, analysis.selectedMove, boardCoords);
      set(state => ({ analysis: { ...state.analysis, laneSelection: cells, laneResult: null } }));
    },

    clearAnalysisLaneSelection: () => set(state => ({ analysis: { ...state.analysis, laneSelection: [], laneResult: null } })),

    runAnalysisLaneIsolation: async (numSimulations = 200) => {
      const { boardCoords, analysis, setAnalysisState } = get();
      const pool = calculatePoolFromBoard(boardCoords, origPool);
      await runLaneIsolationEngine({ move: analysis.selectedMove, boardCoords, laneSelection: analysis.laneSelection, pool, numSimulations }, setAnalysisState);
    },

    // A scoped port of Viewer/components/TopMoves.js's own getTopMoves fetch -
    // deliberately independent of it so Analysis Mode never touches that
    // component's internal state.
    fetchAnalysisTopMoves: async () => {
      const { boardCoords, blankTiles, currentMoveRef, parsedMoves, isLoadingAnalysisTopMoves } = get();
      if (isLoadingAnalysisTopMoves) return;

      set({ isLoadingAnalysisTopMoves: true });
      try {
        const pool = calculatePoolFromBoard(boardCoords, origPool);
        const currentRack = createRack(currentMoveRef.current + 1, parsedMoves);
        const apiRack = currentRack.map(tile => tile === '?' ? '*' : tile);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        let response;
        try {
          response = await fetch('/.netlify/functions/getTopMoves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              board: markBlanksLowercase(boardCoords, blankTiles),
              letters: apiRack
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Move calculation timed out. Please try again.');
          }
          throw fetchError;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.message && data.message.includes('Loading dictionary')) {
          setTimeout(() => get().fetchAnalysisTopMoves(), 1000);
          return;
        }

        if (data.moves) {
          data.moves = data.moves.filter(move => move.word && move.word.trim() !== '');
        }

        const exchangeMoves = (pool && pool.length >= 7) ? generateExchangeCombinations(currentRack).map(tiles => {
          const leave = calculateExchangeLeave(currentRack, tiles);
          return {
            word: `Exchange ${tiles.join('')}`,
            score: 0,
            tiles: tiles.map(tile => ({ letter: tile, isNew: false })),
            direction: 'exchange',
            startPosition: 'Exchange',
            leave,
            isExchange: true,
            currentRack
          };
        }) : [];

        const allMoves = [...data.moves.map(move => ({ ...move, currentRack })), ...exchangeMoves];
        const leaveValues = await fetchLeaveValuesForAnalysis(allMoves);

        const movesWithValues = allMoves
          .map(move => {
            const leaveValue = leaveValues[move.leave] || 0;
            const totalValue = move.isExchange ? leaveValue : (move.score + leaveValue);
            return { ...move, totalValue, leaveValue };
          })
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 15);

        set({ analysisTopMoves: movesWithValues });
      } catch (error) {
        console.error('Error fetching analysis top moves:', error);
      } finally {
        set({ isLoadingAnalysisTopMoves: false });
      }
    }
  };
}); 