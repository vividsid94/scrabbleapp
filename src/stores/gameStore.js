import { create } from 'zustand';
import { origPool, origBoard } from '../components/AppContent/References/staticData.js';
import { alphabetizeRack } from '../functions/play/rackFunctions';
import { getBoardDiff } from '../functions/play/boardUtils';
import { markBlanksLowercase } from '../functions/play/boardApiUtils';
import { saveActiveGameSnapshot, clearActiveGameSnapshot } from '../utils/activeGamePersistence';
import { DEFAULT_ANALYSIS_STATE, runMovePreviewEngine, runHeatMapEngine, runOpponentResponsesEngine, runLaneIsolationEngine } from '../functions/analysisEngine';
import { toggleLaneCell, computeLaneDragSpan } from '../functions/analysisBoardFunctions';

export const useGameStore = create((set, get) => {
  // Initial state
  const initialState = {
    // Board state
    boardCoords: [],
    tempBoardCoords: [],
    origBoardCoords: [],
    
    // Player state
    player1points: 0,
    player2points: 0,
    player1Rack: [],
    player2Rack: [],
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    currentPlayer: 1,
    
    // Game state
    pool: origPool,
    gameStarted: false,
    gameEnded: false,
    isBotMode: false,
    consecutivePasses: 0,

    // Multiplayer state
    isMultiplayerMode: false,
    multiplayerGameCode: null,
    localPlayerNumber: null, // 1 or 2
    opponentRackCount: 0,
    poolCount: 0,
    isWaitingForOpponent: false,
    multiplayerConnectionStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected'
    
    // Multiplayer handlers (set by MultiplayerGame wrapper)
    handleWordSubmitMultiplayer: null,
    handlePassMultiplayer: null,
    handleExchangeMultiplayer: null,
    
    // Tile and selection state
    selectedTiles: [],
    selectedBoardPosition: null,
    arrowDirection: 'right',
    tilesToExchange: [],
    blankTiles: [],
    invalidWordCoords: [], // Coordinates of invalid words for highlighting
    
    // Bot state
    isBotThinking: false,
    isPlayerThinking: false,
    botGoesFirst: false,
    
    // Move status
    moveStatus: null,
    
    // Timer state
    player1Time: 20 * 60, // 20 minutes in seconds
    player2Time: 20 * 60,
    timerActive: false,
    gameTime: 20, // in minutes
    
    // Move history
    moveHistory: [],
    topMoves: [],
    isLoadingTopMoves: false,
    
    // Dictionary loading
    isDictionaryLoading: false,
    
    // Auto-play
    autoPlayBest: false,
    isAutoPlaying: false,
    
    // Victory state
    winner: null,
    finalPlayer1Score: 0,
    finalPlayer2Score: 0,
    
    // Live single-tile score preview, shown on the real board while placing tiles
    leaveValues: {},
    previewScore: null,
    previewScorePosition: null,

    // Analysis Mode (board-based, replaces the old Metrics/Metrics2 modals)
    analysis: DEFAULT_ANALYSIS_STATE,

    // UI state (moved from Play.js)
    theme: "STANDARD",
    open: false,
    modalContent: "settings",
    snackbarOpen: false,
    snackbarMessage: "",
    snackbarSeverity: "error",
    showTimeSlider: false,
    showConfetti: false,
    showVictoryOverlay: false,
    
    // Settings state
    playerMoveSoundType: 'puzzle',
    botMoveSoundType: 'puzzle',
    theoYellEnabled: false, // Theo yell feature toggle
    theoYellCriteria: 'bingo', // 'score' or 'bingo'
    theoYellScoreThreshold: 20, // Score threshold for triggering yell
    // Bot selection
    selectedBot: { name: 'Theo', img: '/images/compressed/theomascot-compressed.png', mascotImg: '/images/compressed/theomascot-compressed.png' },
    // Tope's most recent decision: exact prompt sent to the LLM + its raw response,
    // shown in the UI so you can see exactly what it's "thinking"
    topeThinking: null,

    // Tess opponent simulation state
    tessOpponentSims: {},
    tessIsRunningSims: false,
    
    shouldTheoYell: false, // Signal to trigger Theo yell
    theoYellIsBingoMiss: false, // Whether the yell is for missing a bingo
    theoYellPhrase: '', // The phrase Theo said
    // Populated by TheoYellOverlay's own background check (not the shared
    // "Ask Theo" topMoves) so bingo-miss detection works without requiring
    // the player to have manually opened the top-moves panel first.
    theoYellBingoAvailable: false,

    // Premium squares for randomized bonus squares mode
    premiumSquares: null, // Array of {row, col, type} objects, null means use standard board
    
    // Game mode features (can be combined)
    randomizeBonusSquares: false, // Enable randomized bonus squares
    customBonusSquareDistribution: null, // Custom bonus square distribution {TWS: 8, DWS: 16, TLS: 12, DLS: 24}, null means use default
    twoTurnsPerPlayer: false, // Enable 2 turns per player mode
    variablePool: false, // Enable variable pool
    customPool: null, // Custom tile distribution (string like origPool), null means use standard
    
    // Turn tracking for "2 turns per player" mode
    playerTurnCount: 1, // Current turn number (1 or 2) for the current player
  };

  return {
    ...initialState,
    
    // Debug: Add a getter to see what selectedTiles actually is
    getSelectedTiles: () => {
      const state = get();
      return state.selectedTiles;
    },
    
    // Actions - Board
    setBoardCoords: (coords) => set({ boardCoords: coords }),
    setTempBoardCoords: (coords) => set({ tempBoardCoords: coords }),
    setOrigBoardCoords: (coords) => set({ origBoardCoords: coords }),
    setPremiumSquares: (squares) => set({ premiumSquares: squares }),
    setRandomizeBonusSquares: (enabled) => set({ randomizeBonusSquares: enabled }),
    setCustomBonusSquareDistribution: (distribution) => set({ customBonusSquareDistribution: distribution }),
    setTwoTurnsPerPlayer: (enabled) => set({ twoTurnsPerPlayer: enabled }),
    setVariablePool: (enabled) => set({ variablePool: enabled }),
    setCustomPool: (pool) => set({ customPool: pool }),
    setPlayerTurnCount: (count) => set({ playerTurnCount: count }),
    
    // Helper function to switch players (handles 2 turns mode)
    switchToNextPlayer: () => {
      const { currentPlayer, playerTurnCount, twoTurnsPerPlayer, setCurrentPlayer, setPlayerTurnCount } = get();
      
      if (twoTurnsPerPlayer) {
        // If it's turn 1, increment to turn 2 and keep same player
        if (playerTurnCount === 1) {
          setPlayerTurnCount(2);
          // Don't switch players, just increment turn count
        } else {
          // It's turn 2, switch to next player and reset to turn 1
          setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
          setPlayerTurnCount(1);
        }
      } else {
        // Normal mode - just switch players
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        setPlayerTurnCount(1);
      }
    },
    
    // Actions - Players
    setPlayer1points: (points) => set({ player1points: points }),
    setPlayer2points: (points) => set({ player2points: points }),
    setPlayer1Rack: (rack) => set({ player1Rack: alphabetizeRack(rack) }),
    setPlayer2Rack: (rack) => set({ player2Rack: alphabetizeRack(rack) }),
    setPlayer1Name: (name) => set({ player1Name: name }),
    setPlayer2Name: (name) => set({ player2Name: name }),
    setCurrentPlayer: (player) => set({ currentPlayer: player }),
    
    // Actions - Game state
    setPool: (newPool) => set({ pool: newPool }),
    setGameStarted: (started) => set({ gameStarted: started }),
    setGameEnded: (ended) => set({ gameEnded: ended }),
    setIsBotMode: (isBot) => set({ isBotMode: isBot }),
    setConsecutivePasses: (passes) => set({ consecutivePasses: passes }),

    // Actions - Multiplayer
    setMultiplayerMode: (isMultiplayer, gameCode = null, playerNumber = null) => set({
      isMultiplayerMode: isMultiplayer,
      multiplayerGameCode: gameCode,
      localPlayerNumber: playerNumber,
      isBotMode: false // Disable bot mode in multiplayer
    }),
    setOpponentRackCount: (count) => set({ opponentRackCount: count }),
    setPoolCount: (count) => set({ poolCount: count }),
    setIsWaitingForOpponent: (waiting) => set({ isWaitingForOpponent: waiting }),
    setMultiplayerConnectionStatus: (status) => set({ multiplayerConnectionStatus: status }),

    // Check if it's the local player's turn in multiplayer
    isMyTurn: () => {
      const { isMultiplayerMode, localPlayerNumber, currentPlayer } = get();
      if (!isMultiplayerMode) return true; // In single player, always your turn when it's your turn
      return localPlayerNumber === currentPlayer;
    },

    // Reset multiplayer state
    resetMultiplayerState: () => set({
      isMultiplayerMode: false,
      multiplayerGameCode: null,
      localPlayerNumber: null,
      opponentRackCount: 0,
      poolCount: 0,
      isWaitingForOpponent: false,
      multiplayerConnectionStatus: 'disconnected'
    }),
    
    // Actions - Tile and selection
    setSelectedTiles: (tiles) => set({ selectedTiles: tiles }),
    setSelectedBoardPosition: (position) => set({ selectedBoardPosition: position }),
    setArrowDirection: (direction) => set({ arrowDirection: direction }),
    setTilesToExchange: (tiles) => set({ tilesToExchange: tiles }),
    setBlankTiles: (tiles) => set({ blankTiles: tiles }),
    setInvalidWordCoords: (coords) => set({ invalidWordCoords: coords }),
    
    // Actions - Bot
    setIsBotThinking: (thinking) => set({ isBotThinking: thinking }),
    setIsPlayerThinking: (thinking) => set({ isPlayerThinking: thinking }),
    setBotGoesFirst: (goesFirst) => set({ botGoesFirst: goesFirst }),
    
    // Actions - Move status
    setMoveStatus: (status) => set({ moveStatus: status }),
    
    // Actions - Timer
    setPlayer1Time: (time) => set({ player1Time: time }),
    setPlayer2Time: (time) => set({ player2Time: time }),
    setTimerActive: (active) => set({ timerActive: active }),
    setGameTime: (time) => set({ gameTime: time }),
    
    // Actions - Move history
    setMoveHistory: (history) => set({ moveHistory: history }),
    setTopMoves: (moves) => set({ topMoves: moves }),
    setIsLoadingTopMoves: (loading) => set({ isLoadingTopMoves: loading }),
    
    // Actions - Dictionary
    setIsDictionaryLoading: (loading) => set({ isDictionaryLoading: loading }),
    
    // Actions - Auto-play
    setAutoPlayBest: (autoPlay) => set({ autoPlayBest: autoPlay }),
    setIsAutoPlaying: (autoPlaying) => set({ isAutoPlaying: autoPlaying }),
    
    // Actions - Victory
    setWinner: (winner) => set({ winner: winner }),
    setFinalPlayer1Score: (score) => set({ finalPlayer1Score: score }),
    setFinalPlayer2Score: (score) => set({ finalPlayer2Score: score }),
    
    // Actions - live single-tile score preview
    setLeaveValues: (values) => set({ leaveValues: values }),
    setPreviewScore: (score) => set({ previewScore: score }),
    setPreviewScorePosition: (position) => set({ previewScorePosition: position }),
    
    // Actions - UI
    setTheme: (theme) => set({ theme: theme }),
    setOpen: (open) => set({ open: open }),
    setModalContent: (content) => set({ modalContent: content }),
    setSnackbarOpen: (open) => set({ snackbarOpen: open }),
    setSnackbarMessage: (message) => set({ snackbarMessage: message }),
    setSnackbarSeverity: (severity) => set({ snackbarSeverity: severity }),
    setShowTimeSlider: (show) => set({ showTimeSlider: show }),
    setShowConfetti: (show) => set({ showConfetti: show }),
    setShowVictoryOverlay: (show) => set({ showVictoryOverlay: show }),
    
    // Actions - Settings
    setPlayerMoveSoundType: (type) => set({ playerMoveSoundType: type }),
    setBotMoveSoundType: (type) => set({ botMoveSoundType: type }),
    setTheoYellEnabled: (enabled) => set({ theoYellEnabled: enabled }),
    setTheoYellCriteria: (criteria) => set({ theoYellCriteria: criteria }),
    setTheoYellScoreThreshold: (threshold) => set({ theoYellScoreThreshold: threshold }),
    setSelectedBot: (bot) => set({ selectedBot: bot }),
    setTopeThinking: (data) => set({ topeThinking: data }),

    // Restores a single-player bot game from a saved "continue" snapshot
    // (see src/utils/activeGamePersistence.js). Anonymous, no accounts.
    restoreActiveGame: (snapshot) => set({
      boardCoords: snapshot.boardCoords,
      tempBoardCoords: JSON.parse(JSON.stringify(snapshot.boardCoords)),
      origBoardCoords: snapshot.origBoardCoords,
      player1Rack: snapshot.player1Rack,
      player2Rack: snapshot.player2Rack,
      player1points: snapshot.player1points,
      player2points: snapshot.player2points,
      player1Name: snapshot.player1Name,
      player2Name: snapshot.player2Name,
      pool: snapshot.pool,
      currentPlayer: snapshot.currentPlayer,
      moveHistory: snapshot.moveHistory,
      blankTiles: snapshot.blankTiles,
      consecutivePasses: snapshot.consecutivePasses,
      selectedBot: snapshot.selectedBot,
      playerTurnCount: snapshot.playerTurnCount,
      premiumSquares: snapshot.premiumSquares || [],
      player1Time: snapshot.player1Time,
      player2Time: snapshot.player2Time,
      isBotMode: true,
      gameStarted: true,
      gameEnded: false
    }),
    
    setShouldTheoYell: (should, isBingoMiss = false) => set({ 
      shouldTheoYell: should,
      theoYellIsBingoMiss: isBingoMiss 
    }),
    setTheoYellPhrase: (phrase) => set({ theoYellPhrase: phrase }),
    setTheoYellBingoAvailable: (available) => set({ theoYellBingoAvailable: available }),
    
    // Tess opponent simulation actions
    setTessOpponentSims: (sims) => set({ tessOpponentSims: sims }),
    setTessIsRunningSims: (running) => set({ tessIsRunningSims: running }),
    
    // Complex actions
    resetGame: () => {
      const { variablePool, customPool } = get();
      const poolToUse = (variablePool && customPool) ? (customPool.startsWith('ADVANCED:') ? customPool.substring(9) : customPool) : origPool;
      set({
        player1points: 0,
        player2points: 0,
        player1Rack: [],
        player2Rack: [],
        currentPlayer: 1,
        pool: poolToUse,
        gameStarted: false,
        gameEnded: false,
        consecutivePasses: 0,
        selectedTiles: [],
        selectedBoardPosition: null,
        arrowDirection: 'right',
        tilesToExchange: [],
        blankTiles: [],
        isBotThinking: false,
        isPlayerThinking: false,
        player1Time: 20 * 60,
        player2Time: 20 * 60,
        timerActive: false,
        moveHistory: [],
        topMoves: [],
        isLoadingTopMoves: false,
        isDictionaryLoading: false,
        autoPlayBest: false,
        isAutoPlaying: false,
        winner: null,
        finalPlayer1Score: 0,
        finalPlayer2Score: 0,
        leaveValues: {},
        previewScore: null,
        previewScorePosition: null,
        // Reset multiplayer state
        isMultiplayerMode: false,
        multiplayerGameCode: null,
        localPlayerNumber: null,
        opponentRackCount: 0,
        poolCount: 0,
        isWaitingForOpponent: false,
        multiplayerConnectionStatus: 'disconnected',
      });
    },
    
    // Computed values
    getCurrentRack: () => {
      const { currentPlayer, player1Rack, player2Rack } = get();
      return currentPlayer === 1 ? player1Rack : player2Rack;
    },
    
    getCurrentPlayerName: () => {
      const { currentPlayer, player1Name, player2Name } = get();
      return currentPlayer === 1 ? player1Name : player2Name;
    },
    
    getCurrentPlayerPoints: () => {
      const { currentPlayer, player1points, player2points } = get();
      return currentPlayer === 1 ? player1points : player2points;
    },
    
    setCurrentPlayerPoints: (points) => {
      const { currentPlayer } = get();
      if (currentPlayer === 1) {
        set({ player1points: points });
      } else {
        set({ player2points: points });
      }
    },
    
    setCurrentPlayerRack: (rack) => {
      const { currentPlayer } = get();
      if (currentPlayer === 1) {
        set({ player1Rack: rack });
      } else {
        set({ player2Rack: rack });
      }
    },
    
    // Utility functions
    getBoardDiff: (beforeBoard, afterBoard) => getBoardDiff(beforeBoard, afterBoard),
    
    // Game initialization actions
    initializeGame: (origBoard, origPool, gameStartSound, botMoveSound) => {
      const { setBoardCoords, setTempBoardCoords, setOrigBoardCoords, setIsDictionaryLoading, premiumSquares } = get();
      
      // Initialize board - if premiumSquares are set, use empty board (all zeros)
      // Otherwise use the standard board layout
      let parsedOrigBoardCoords;
      if (premiumSquares && premiumSquares.length > 0) {
        // Start with empty board (all zeros) when using randomized premium squares
        // The premiumSquares array will define where bonus squares are for rendering/scoring
        parsedOrigBoardCoords = Array(15).fill(null).map(() => Array(15).fill(0));
      } else {
        // Use standard board layout
        parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
      }
      setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      
      // Check dictionary loading state
      const checkDictionary = async () => {
        try {
          const response = await fetch('/.netlify/functions/gameLogic', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'validate',
              beforeBoard: parsedOrigBoardCoords,
              afterBoard: parsedOrigBoardCoords
            })
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          
          const data = await response.json();
          setIsDictionaryLoading(false);
        } catch (error) {
          console.error('Error checking dictionary:', error);
          setTimeout(checkDictionary, 1000);
        }
      };
      
      setIsDictionaryLoading(true);
      // Dictionary loads in background - no snackbar needed
      checkDictionary();
    },
    
    startBotGame: (params) => {
      const { 
        setGameStarted, 
        setTimerActive, 
        setBotGoesFirst, 
        setGameEnded, 
        setShowVictoryOverlay, 
        setShowConfetti, 
        setWinner,
        setPlayer1Time,
        setPlayer2Time,
        setGameTime,
        setBlankTiles,
        setSelectedTiles,
        setSelectedBoardPosition,
        setArrowDirection,
        setTempBoardCoords,
        setOrigBoardCoords,
        setBoardCoords,
        setPlayer1Rack,
        setPlayer2Rack,
        setAutoPlayBest,
        setPlayerTurnCount,
        currentPlayer,
        player1Rack,
        player2Rack,
        selectedTiles,
        boardCoords,
        origBoardCoords,
        isDictionaryLoading,
        gameTime,
        exitAnalysisMode
      } = get();

      if (isDictionaryLoading) return;

      // A fresh game invalidates any in-progress analysis of the old position.
      exitAnalysisMode();

      // Reset game ended state for new game
      setGameEnded(false);
      setShowVictoryOverlay(false);
      setShowConfetti(false);
      setWinner(null);
      
      // Turn autoplay off
      setAutoPlayBest(false);
      
      // If there are tiles on the board, return them to the rack first
      if (selectedTiles.length > 0) {
        const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
        const newRack = [...currentRack, ...selectedTiles];
        
        if (currentPlayer === 1) {
          setPlayer1Rack(newRack);
        } else {
          setPlayer2Rack(newRack);
        }
        
        // Reset the board state by rebuilding from origBoardCoords
        const newBoard = JSON.parse(JSON.stringify(origBoardCoords));
        
        // Copy over any committed tiles from boardCoords
        for (let row = 0; row < 15; row++) {
          for (let col = 0; col < 15; col++) {
            if (typeof boardCoords[row][col] === 'string') {
              newBoard[row][col] = boardCoords[row][col];
            }
          }
        }
        
        setTempBoardCoords(newBoard);
        setSelectedTiles([]);
        setSelectedBoardPosition(null);
        setArrowDirection('right');
      }
      
      // Clear blank tiles when starting new game
      setBlankTiles([]);
      
      // Reset timer for new game
      setPlayer1Time(gameTime * 60);
      setPlayer2Time(gameTime * 60);
      
      // Randomly determine who goes first
      const randomFirst = Math.random() < 0.5;
      setBotGoesFirst(randomFirst);
      
      // Reset turn count when starting new game
      setPlayerTurnCount(1);
      
      // Get pool to use - customPool if variablePool is enabled, otherwise origPool
      const { variablePool, customPool } = get();
      const poolToUse = (variablePool && customPool) ? (customPool.startsWith('ADVANCED:') ? customPool.substring(9) : customPool) : params.origPool;
      
      // Set game started state
      setGameStarted(true);
      setTimerActive(true);

      // Import and call the startBotGame function with updated pool
      import('../functions/play/botFunctions').then(({ startBotGame: startBotGameFunction }) => {
        startBotGameFunction({ ...params, origPool: poolToUse });
      });
    },

    handleNewGame: () => {
      const { 
        setShowVictoryOverlay, 
        setShowConfetti, 
        setGameEnded, 
        setWinner, 
        setFinalPlayer1Score, 
        setFinalPlayer2Score,
        setPlayer1Time,
        setPlayer2Time,
        setTimerActive,
        setAutoPlayBest,
        gameTime
      } = get();
      
      setShowVictoryOverlay(false);
      setShowConfetti(false);
      setGameEnded(false);
      setWinner(null);
      setFinalPlayer1Score(0);
      setFinalPlayer2Score(0);
      
      // Turn autoplay off
      setAutoPlayBest(false);
      
      // Reset timer
      setPlayer1Time(gameTime * 60);
      setPlayer2Time(gameTime * 60);
      setTimerActive(false);
      
      // Reset game state by calling startBotGame again with imported constants
      import('../components/AppContent/References/staticData').then(({ origBoard, origPool }) => {
        import('../components/AppContent/References/testRacks').then(({ TEST_RACKS }) => {
          // Get pool to use - customPool if variablePool is enabled, otherwise origPool
          const { variablePool, customPool } = get();
          const poolToUse = (variablePool && customPool) ? (customPool.startsWith('ADVANCED:') ? customPool.substring(9) : customPool) : origPool;
          get().startBotGame({ origBoard, origPool: poolToUse, TEST_RACKS, gameStartSound: null, botMoveSound: null });
        });
      });
    },
    
    // Timer management
    startTimer: (timerRef) => {
      const { timerActive, gameStarted, currentPlayer, setPlayer1Time, setPlayer2Time } = get();
      
      if (timerActive && gameStarted) {
        timerRef.current = setInterval(() => {
          if (currentPlayer === 1) {
            const currentTime = get().player1Time;
            if (currentTime <= 0 || isNaN(currentTime)) {
              clearInterval(timerRef.current);
              setPlayer1Time(0);
            } else {
              setPlayer1Time(currentTime - 1);
            }
          } else {
            const currentTime = get().player2Time;
            if (currentTime <= 0 || isNaN(currentTime)) {
              clearInterval(timerRef.current);
              setPlayer2Time(0);
            } else {
              setPlayer2Time(currentTime - 1);
            }
          }
        }, 1000);
      }
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    },
    
    // Game action handlers
    handlePass: () => {
      const { gameEnded } = get();
      if (gameEnded) return;
      
      import('../functions/play/passFunctions').then(({ handlePass }) => {
        handlePass();
      });
    },
    
    handleExchange: () => {
      const { gameEnded } = get();
      if (gameEnded) return;
      
      import('../functions/play/exchangeFunctions').then(({ handleExchange }) => {
        handleExchange();
      });
    },
    
    handleWordSubmit: (playerMoveSound) => {
      import('../functions/play/wordSubmitFunctions').then(({ handleWordSubmit }) => {
        handleWordSubmit(playerMoveSound);
      });
    },
    
    handlePlayTopMove: () => {
      const { gameEnded } = get();
      if (gameEnded) return Promise.resolve();
      
      return import('../functions/play/moveFunctions').then(({ handlePlayTopMove }) => {
        return handlePlayTopMove();
      });
    },
    
    // Get top moves for expandable section
    getTopMovesForExpandable: () => {
      const {
        gameEnded,
        currentPlayer,
        player1Rack,
        player2Rack,
        tempBoardCoords,
        boardCoords,
        selectedTiles,
        pool,
        blankTiles,
        setPlayer1Rack,
        setPlayer2Rack,
        setTempBoardCoords,
        setSelectedTiles,
        setSelectedBoardPosition,
        setIsLoadingTopMoves,
        setIsDictionaryLoading,
        setTopMoves,
        setSnackbarMessage,
        setSnackbarSeverity,
        setSnackbarOpen
      } = get();
      
      if (gameEnded) return; // Don't allow getting top moves after game has ended
      
      const fetchTopMovesWithoutModal = async () => {
        setIsLoadingTopMoves(true);
        try {
          // Get the current rack
          const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
          
          // Get any tiles that are placed on the board but not committed
          const uncommittedTiles = [];
          for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
              if (typeof tempBoardCoords[row][col] === 'string' && typeof boardCoords[row][col] !== 'string') {
                const tileIndex = selectedTiles.findIndex(t => t.tile === '*');
                if (tileIndex !== -1) {
                  uncommittedTiles.push('*');
                } else {
                  uncommittedTiles.push(tempBoardCoords[row][col]);
                }
              }
            }
          }
          
          // Return uncommitted tiles to the rack
          const newRack = [...currentRack, ...uncommittedTiles];
          if (currentPlayer === 1) {
            setPlayer1Rack(newRack);
          } else {
            setPlayer2Rack(newRack);
          }
          
          // Reset the board state
          setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
          setSelectedTiles([]);
          setSelectedBoardPosition(null);
          
          // Convert any '?' in the rack to '*' for the API
          const apiRack = newRack.map(tile => tile === '?' ? '*' : tile);
          
          // Get premiumSquares from store if available
          const { premiumSquares } = get();
          
          const requestBody = {
            board: markBlanksLowercase(boardCoords, blankTiles),
            letters: apiRack,
            pool: pool.length
          };

          // Add premiumSquares if available
          if (premiumSquares && premiumSquares.length > 0) {
            requestBody.premiumSquares = premiumSquares;
          }

          const response = await fetch('/.netlify/functions/getTopMoves', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          // Check if this is the first load (dictionary loading)
          if (data.message && data.message.includes('Loading dictionary')) {
            setIsDictionaryLoading(true);
            // Retry after a short delay
            setTimeout(() => {
              fetchTopMovesWithoutModal();
            }, 1000);
            return;
          }
          
          setIsDictionaryLoading(false);

          // Moves are already leave-scored and sorted server-side (word plays
          // + exchanges, exchanges only present when pool.length >= 7 was sent).
          const movesWithValues = data.moves
            .map(move => ({ ...move, currentRack: newRack }))
            .slice(0, 15); // Show top 15 moves (Go already sorted by totalValue)

          setTopMoves(movesWithValues);
        } catch (error) {
          console.error('Error getting top moves:', error);
          setSnackbarMessage('Error getting top moves: ' + error.message);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        } finally {
          setIsLoadingTopMoves(false);
        }
      };

      fetchTopMovesWithoutModal();
    },
    
    // Handle move selection for both simulation modal and normal game board
    handleMoveSelectClick: (move) => {
      const {
        boardCoords,
        tempBoardCoords,
        currentPlayer,
        player1Rack,
        player2Rack,
        blankTiles,
        selectedTiles,
        setTempBoardCoords,
        setSelectedTiles,
        setPlayer1Rack,
        setPlayer2Rack,
        setSelectedBoardPosition,
        setArrowDirection,
        setBlankTiles
      } = get();

      // Validate move structure
      if (!move || !move.tiles || !Array.isArray(move.tiles)) {
        console.error('Invalid move structure:', move);
        return;
      }

      // Place the move on the real game board
      import('../functions/play/moveFunctions').then(({ handleMoveSelect }) => {
        handleMoveSelect({
          move,
          boardCoords,
          tempBoardCoords,
          currentPlayer,
          player1Rack,
          player2Rack,
          blankTiles,
          selectedTiles,
          setTempBoardCoords,
          setSelectedTiles,
          setPlayer1Rack,
          setPlayer2Rack,
          setSelectedBoardPosition,
          setArrowDirection,
          setBlankTiles
        });
      });
    },
    
    // Calculate preview score for placed tiles
    calculatePreviewScore: () => {
      const {
        selectedTiles,
        boardCoords,
        tempBoardCoords,
        selectedBoardPosition,
        blankTiles,
        setPreviewScore,
        setPreviewScorePosition
      } = get();

      if (selectedTiles.length === 0) {
        setPreviewScore(null);
        setPreviewScorePosition(null);
        return;
      }

      // Import calculateScore function dynamically
      Promise.all([
        import('../functions/scoreFunctions'),
        import('../components/AppContent/References/staticData')
      ]).then(([{ calculateScore, premiumSquaresToBoardMultipliers }, { origBoard }]) => {
        const { premiumSquares } = get();
        let boardMultipliers;

        // Use premiumSquares if available, otherwise use standard board
        if (premiumSquares && premiumSquares.length > 0) {
          boardMultipliers = premiumSquaresToBoardMultipliers(premiumSquares);
        } else {
          boardMultipliers = JSON.parse(origBoard);
        }

        const score = calculateScore(boardCoords, tempBoardCoords, boardMultipliers, blankTiles);
        setPreviewScore(score);
        
        // Calculate position for score preview
        if (selectedBoardPosition) {
          const { row, col } = selectedBoardPosition;
          setPreviewScorePosition({ row, col });
        }
      });
    },
    
    // Handle confetti animation completion
    handleConfettiComplete: () => {
      const { setShowConfetti } = get();
      setShowConfetti(false);
      // Don't hide the victory card - let it stay open until user clicks rematch
    },



    handleClose: () => {
      const { setOpen } = get();
      setOpen(false);
    },

    handleWordSubmitClick: (playerMoveSound) => {
      const { gameEnded, isPlayerThinking, handleWordSubmit, setIsPlayerThinking } = get();
      if (gameEnded || isPlayerThinking) return Promise.resolve();
      // Word validation can hit the network (dictionary API fallback) and take a
      // variable amount of time. Without this guard, a player could click Pass/
      // Exchange/Submit again while validation was still pending — that second
      // action would switch turns and mutate racks/scores out from under the
      // still-in-flight submission, which was holding a stale snapshot of whose
      // turn it was. That race is what caused the winner to be misreported in
      // some games: the stale submission would resolve after the turn had
      // already moved on and finish writing its (now wrong) result.
      setIsPlayerThinking(true);
      return handleWordSubmit(playerMoveSound).finally(() => {
        setIsPlayerThinking(false);
      });
    },

    handlePassClick: () => {
      const { gameEnded, isPlayerThinking, handlePass } = get();
      if (gameEnded || isPlayerThinking) return; // Don't allow passes while a move is in flight or after game end
      handlePass();
    },

    handleExchangeClick: () => {
      const { gameEnded, isPlayerThinking, handleExchange } = get();
      if (gameEnded || isPlayerThinking) return; // Don't allow exchanges while a move is in flight or after game end
      handleExchange();
    },

    handlePlayTopMoveClick: () => {
      const { gameEnded, handlePlayTopMove, setIsPlayerThinking } = get();
      if (gameEnded) return Promise.resolve(); // Don't allow playing top move after game has ended
      setIsPlayerThinking(true);
      return handlePlayTopMove().finally(() => {
        setIsPlayerThinking(false);
      });
    },

    handleBotModeToggle: (gameStartSound = null, botMoveSound = null) => {
      const { isDictionaryLoading, startBotGame, variablePool, customPool } = get();
      if (isDictionaryLoading) return;
      
      // Import required constants and call startBotGame
      import('../components/AppContent/References/staticData').then(({ origBoard, origPool }) => {
        import('../components/AppContent/References/testRacks').then(({ TEST_RACKS }) => {
          // Get pool to use - customPool if variablePool is enabled, otherwise origPool
          const poolToUse = (variablePool && customPool) ? (customPool.startsWith('ADVANCED:') ? customPool.substring(9) : customPool) : origPool;
          startBotGame({ origBoard, origPool: poolToUse, TEST_RACKS, gameStartSound, botMoveSound });
        });
      });
    },

    // --- Analysis Mode (board-based) ---

    setAnalysisState: (partial) => set(state => ({ analysis: { ...state.analysis, ...partial } })),

    enterAnalysisMode: () => {
      const {
        isBotMode, isMultiplayerMode, gameStarted,
        selectedTiles, currentPlayer, player1Rack, player2Rack,
        setPlayer1Rack, setPlayer2Rack,
        boardCoords, setTempBoardCoords, setSelectedTiles, setSelectedBoardPosition
      } = get();
      if (!isBotMode || isMultiplayerMode || !gameStarted) return;

      // Give back any tiles placed on the board but not yet committed, so
      // Analysis Mode always starts from the real, committed position -
      // same "return tiles to rack" pattern used when a word submission
      // fails validation (see wordSubmitFunctions.js).
      if (selectedTiles.length > 0) {
        const rackToUpdate = currentPlayer === 1 ? player1Rack : player2Rack;
        const tilesToReturn = selectedTiles.map(tile => tile.tile);
        const updatedRack = [...rackToUpdate, ...tilesToReturn];
        if (currentPlayer === 1) {
          setPlayer1Rack(updatedRack);
        } else {
          setPlayer2Rack(updatedRack);
        }
        setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
        setSelectedTiles([]);
        setSelectedBoardPosition(null);
      }

      set({ analysis: { ...DEFAULT_ANALYSIS_STATE, active: true } });
    },

    exitAnalysisMode: () => set({ analysis: { ...DEFAULT_ANALYSIS_STATE } }),

    runAnalysisMovePreview: async (move) => {
      const { setAnalysisState, boardCoords, currentPlayer, player1Rack, player2Rack, pool } = get();
      const rack = currentPlayer === 1 ? player1Rack : player2Rack;
      await runMovePreviewEngine({ move, boardCoords, rack, pool }, setAnalysisState);
    },

    runAnalysisHeatMap: async (move, numSimulations = 200) => {
      const { setAnalysisState, boardCoords, pool } = get();
      await runHeatMapEngine({ move, boardCoords, pool, numSimulations }, setAnalysisState);
    },

    runAnalysisOpponentResponses: async (moves, iterations = 20) => {
      const { setAnalysisState, boardCoords, pool } = get();
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
      const { setAnalysisState, boardCoords, pool, analysis } = get();
      await runLaneIsolationEngine({ move: analysis.selectedMove, boardCoords, laneSelection: analysis.laneSelection, pool, numSimulations }, setAnalysisState);
    },

    handleGetTopMovesForExpandable: () => {
      const { gameEnded, getTopMovesForExpandable } = get();
      if (gameEnded) return; // Don't allow getting top moves after game has ended
      getTopMovesForExpandable();
    },

    // Utility functions for effects
    limitMoveHistory: () => {
      const { moveHistory, setMoveHistory } = get();
      if (moveHistory.length > 50) { // Reduce to last 50 moves instead of 100
        setMoveHistory(moveHistory.slice(-50));
      }
    },

    updatePreviewScore: () => {
      const { selectedTiles, tempBoardCoords, setPreviewScore, setPreviewScorePosition } = get();
      
      if (selectedTiles.length > 0) {
        // Import calculateScore function dynamically
        Promise.all([
          import('../functions/scoreFunctions'),
          import('../components/AppContent/References/staticData')
        ]).then(([{ calculateScore, premiumSquaresToBoardMultipliers }, { origBoard }]) => {
          const { premiumSquares } = get();
          let boardMultipliers;
          
          // Use premiumSquares if available, otherwise use standard board
          if (premiumSquares && premiumSquares.length > 0) {
            boardMultipliers = premiumSquaresToBoardMultipliers(premiumSquares);
          } else {
            boardMultipliers = JSON.parse(origBoard);
          }
          
          const score = calculateScore(get().boardCoords, tempBoardCoords, boardMultipliers, get().blankTiles);
          setPreviewScore(score);
          
          // Calculate position for score preview
          if (get().selectedBoardPosition) {
            const { row, col } = get().selectedBoardPosition;
            setPreviewScorePosition({ row, col });
          }
        });
      } else {
        setPreviewScore(null);
        setPreviewScorePosition(null);
      }
    },

    checkDictionary: async () => {
      const { setIsDictionaryLoading } = get();
      
      // Set initial loading state (no snackbar - loads in background)
      setIsDictionaryLoading(true);
      
      try {
        const response = await fetch('/.netlify/functions/gameLogic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'validate',
            beforeBoard: get().origBoardCoords,
            afterBoard: get().origBoardCoords
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        // Set loading to false if we get any response
        setIsDictionaryLoading(false);
      } catch (error) {
        console.error('Error checking dictionary:', error);
        // Retry after a short delay
        setTimeout(() => {
          get().checkDictionary();
        }, 1000);
      }
    },

    // Keyboard event handlers
    handleKeyDownWrapper: (e, playerMoveSound, origBoard) => {
      
      const {
        selectedBoardPosition,
        boardCoords,
        tempBoardCoords,
        currentPlayer,
        player1Rack,
        player2Rack,
        selectedTiles,
        blankTiles,
        setSelectedBoardPosition,
        setArrowDirection,
        setTempBoardCoords,
        setSelectedTiles,
        setPlayer1Rack,
        setPlayer2Rack,
        setBlankTiles,
        setPreviewScore,
        setPreviewScorePosition,
        handleWordSubmit,
        arrowDirection,
        getSelectedTiles,
        // Additional parameters for keyboard shortcuts
        gameStarted,
        gameEnded,
        handlePassClick,
        handleExchangeClick,
        handlePlayTopMoveClick,
        autoPlayBest,
        isPlayerThinking,
        isBotThinking,
        setAutoPlayBest,
        // Multiplayer state
        isMultiplayerMode,
        handleWordSubmitMultiplayer
      } = get();
      
      // Use multiplayer handler if in multiplayer mode and handler is available
      const wordSubmitHandler = (isMultiplayerMode && handleWordSubmitMultiplayer) 
        ? handleWordSubmitMultiplayer 
        : handleWordSubmit;

      // Get selectedTiles directly from the store to ensure we get the correct value
      const store = get();
      const selectedTilesFromStore = store.selectedTiles;
      const selectedTilesFromGetter = getSelectedTiles();
      
      // Fallback: ensure we always have an array, even if the store returns a function
      const safeSelectedTiles = Array.isArray(selectedTilesFromGetter) ? selectedTilesFromGetter : 
                               Array.isArray(selectedTilesFromStore) ? selectedTilesFromStore : 
                               Array.isArray(selectedTiles) ? selectedTiles : [];
      
      // Dynamic import to avoid circular dependency
      import('../functions/play/keyboardFunctions').then(({ handleKeyDown }) => {
        handleKeyDown({
          e,
          selectedBoardPosition,
          boardCoords,
          tempBoardCoords,
          currentPlayer,
          player1Rack,
          player2Rack,
          selectedTiles: safeSelectedTiles, // Use the safe fallback
          blankTiles,
          setSelectedBoardPosition,
          setArrowDirection,
          setTempBoardCoords,
          setSelectedTiles,
          setPlayer1Rack,
          setPlayer2Rack,
          setBlankTiles,
          setPreviewScore,
          setPreviewScorePosition,
          handleWordSubmit: wordSubmitHandler,
          playerMoveSound,
          arrowDirection,
          origBoard,
          // Additional parameters for keyboard shortcuts
          gameStarted,
          gameEnded,
          handlePass: handlePassClick,
          handleExchangeClick,
          handlePlayTopMove: handlePlayTopMoveClick,
          isPlayerThinking,
          isBotThinking
        });
      });
    },

    handleKeyPressWrapper: (event, playerMoveSound, origBoard) => {
      const {
        gameStarted,
        gameEnded,
        handlePassClick,
        handleExchangeClick,
        handlePlayTopMoveClick,
        autoPlayBest,
        isPlayerThinking,
        isBotThinking,
        setAutoPlayBest
      } = get();

      // Dynamic import to avoid circular dependency
      import('../functions/play/keyboardFunctions').then(({ handleKeyPress }) => {
        handleKeyPress({
          event,
          gameStarted,
          gameEnded,
          handlePass: handlePassClick,
          handleExchangeClick,
          handlePlayTopMove: handlePlayTopMoveClick,
          isPlayerThinking,
          isBotThinking
        });
      });
    },

    // Time slider handler
    handleTimeSliderMouseDown: (e, setGameTime) => {
      const slider = e.currentTarget.parentElement;
      const rect = slider.getBoundingClientRect();
      
      const handleMouseMove = (e) => {
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const value = Math.round(5 + percentage * 25);
        setGameTime(value);
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },

    // Bot move handler. Use require() (not dynamic import()) so webpack HMR
    // actually picks up botFunctions edits — dynamic import was caching a stale module.
    makeBotMove: (botMoveSound) => {
      // eslint-disable-next-line global-require
      const { makeBotMove: makeBotMoveFunction } = require('../functions/play/botFunctions');
      return makeBotMoveFunction(botMoveSound);
    },

    // Tess opponent simulation function
    runCustomDefenseSims: async (moves, boardCoords, pool, defenseWeight) => {
    const { setTessIsRunningSims, setTessOpponentSims } = get();
    
    setTessIsRunningSims(true);
    setTessOpponentSims({});
    
    try {
      const top15Moves = moves.slice(0, 15);
      console.log(`🤖 Custom Defense Bot - Running opponent simulations for top 15 moves with ${defenseWeight}x defense weight:`, top15Moves.map(m => m.word));
      
      // Run simulations for each move with 200 iterations
      const promises = top15Moves.map(async (move, index) => {
        try {
          console.log(`🤖 Custom Defense Bot - Analyzing move ${index + 1}/15: ${move.word}`);
          console.log(`🤖 Custom Defense Bot - Move structure:`, move);
          
          // Create a clean board for this move
          const cleanBoard = Array(15).fill().map(() => Array(15).fill(''));
          
          // Copy existing board tiles
          boardCoords.forEach(({ row, col, letter }) => {
            if (row >= 0 && row < 15 && col >= 0 && col < 15) {
              cleanBoard[row][col] = letter;
            }
          });
          
          // Apply the current move
          if (move.coords && Array.isArray(move.coords)) {
            move.coords.forEach(({ row, col, letter }) => {
              if (row >= 0 && row < 15 && col >= 0 && col < 15) {
                cleanBoard[row][col] = letter;
              }
            });
          } else if (move.tiles && Array.isArray(move.tiles)) {
            move.tiles.forEach(tile => {
              if (tile.isNew && tile.row >= 0 && tile.row < 15 && tile.col >= 0 && tile.col < 15) {
                cleanBoard[tile.row][tile.col] = tile.letter;
              }
            });
          }
          
          const tilePoolString = pool.join('');
          
          console.log(`🤖 Custom Defense Bot - API Request for ${move.word}:`, {
            board: cleanBoard,
            tilePool: tilePoolString,
            iterations: 200
          });
          
          const response = await fetch('https://scrabble-move-generator-production.up.railway.app/bulk-move-gen', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              board: cleanBoard,
              tilePool: tilePoolString,
              iterations: 200
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`🤖 Custom Defense Bot - API Response for ${move.word}:`, data);
          console.log(`🤖 Custom Defense Bot - API Response structure for ${move.word}:`, {
            hasAverageScore: 'averageScore' in data,
            averageScore: data.averageScore,
            keys: Object.keys(data),
            dataType: typeof data
          });
          
          return { move, data };
        } catch (error) {
          console.error(`🤖 Custom Defense Bot - Error analyzing move ${move.word}:`, error);
          return { move, error: error.message };
        }
      });
      
      const allResults = await Promise.all(promises);
      console.log('🤖 Custom Defense Bot - All opponent simulations completed:', allResults);
      
      // Convert to object with move word as key
      const resultsObj = {};
      allResults.forEach(({ move, data, error }) => {
        resultsObj[move.word] = { data, error, move };
      });
      
      setTessOpponentSims(resultsObj);
      console.log('🤖 Custom Defense Bot - Opponent simulation results stored:', resultsObj);
      
      // Return the results so they can be used immediately
      return resultsObj;
      
    } catch (error) {
      console.error('🤖 Custom Defense Bot - Error in opponent simulations:', error);
      return {};
    } finally {
      setTessIsRunningSims(false);
    }
  },

  runTessOpponentSims: async (moves, boardCoords, pool) => {
      const { setTessIsRunningSims, setTessOpponentSims } = get();
      
      console.log('🤖 Tess - Starting opponent simulations for', moves.length, 'moves');
      setTessIsRunningSims(true);
      setTessOpponentSims({});
      
      try {
        // Take top 15 moves and run 100 sims each
        const top15Moves = moves.slice(0, 15);
        const results = {};
        
        // Run simulations for each move in parallel
        const promises = top15Moves.map(async (move, index) => {
          try {
            console.log(`🤖 Tess - Analyzing move ${index + 1}/15: ${move.word}`);
            
            // Create clean board with this move applied
            const cleanBoard = Array(15).fill().map(() => Array(15).fill(''));
            
            // Copy existing board
            boardCoords.forEach((row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                if (typeof cell === 'string' && cell !== '') {
                  cleanBoard[rowIndex][colIndex] = cell;
                }
              });
            });
            
            // Apply the move
            move.tiles.forEach(tile => {
              if (tile.isNew) {
                cleanBoard[tile.row][tile.col] = tile.letter;
              }
            });
            
            const tilePoolString = pool.join('');
            
            console.log(`🤖 Tess - API Request for ${move.word}:`, {
              board: cleanBoard,
              tilePool: tilePoolString,
              iterations: 100
            });
            
            const response = await fetch('https://scrabble-move-generator-production.up.railway.app/bulk-move-gen', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                board: cleanBoard,
                tilePool: tilePoolString,
                iterations: 100
              })
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`🤖 Tess - API Response for ${move.word}:`, data);
            console.log(`🤖 Tess - API Response structure for ${move.word}:`, {
              hasAverageScore: 'averageScore' in data,
              averageScore: data.averageScore,
              keys: Object.keys(data),
              dataType: typeof data
            });
            
            return { move, data };
          } catch (error) {
            console.error(`🤖 Tess - Error analyzing move ${move.word}:`, error);
            return { move, error: error.message };
          }
        });
        
        const allResults = await Promise.all(promises);
        console.log('🤖 Tess - All opponent simulations completed:', allResults);
        
        // Convert to object with move word as key
        const resultsObj = {};
        allResults.forEach(({ move, data, error }) => {
          resultsObj[move.word] = { data, error, move };
        });
        
        setTessOpponentSims(resultsObj);
        console.log('🤖 Tess - Opponent simulation results stored:', resultsObj);
        
        // Return the results so they can be used immediately
        return resultsObj;
        
      } catch (error) {
        console.error('🤖 Tess - Error in opponent simulations:', error);
        return {};
      } finally {
        setTessIsRunningSims(false);
      }
    },
    
    // Generate random bonus squares
    generateRandomPremiumSquares: () => {
      const { customBonusSquareDistribution } = get();
      
      // Default distribution if custom is not set
      const defaultDistribution = { TWS: 8, DWS: 16, TLS: 12, DLS: 24 };
      const distribution = customBonusSquareDistribution || defaultDistribution;
      
      const premiumSquares = [];
      
      // Create a map to track which positions have premium squares
      const premiumMap = new Map();
      
      // All possible positions (including center)
      const allPositions = [];
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          allPositions.push({ row, col });
        }
      }
      
      // Shuffle positions
      const shuffled = [...allPositions].sort(() => Math.random() - 0.5);
      
      let currentIndex = 0;
      
      // Assign TWS
      for (let i = 0; i < Math.min(distribution.TWS || 0, 225); i++) {
        if (currentIndex >= shuffled.length) break;
        const pos = shuffled[currentIndex++];
        premiumMap.set(`${pos.row},${pos.col}`, 'TWS');
        premiumSquares.push({
          row: pos.row,
          col: pos.col,
          type: 'TWS'
        });
      }
      
      // Assign DWS
      for (let i = 0; i < Math.min(distribution.DWS || 0, 225); i++) {
        if (currentIndex >= shuffled.length) break;
        const pos = shuffled[currentIndex++];
        premiumMap.set(`${pos.row},${pos.col}`, 'DWS');
        premiumSquares.push({
          row: pos.row,
          col: pos.col,
          type: 'DWS'
        });
      }
      
      // Assign TLS
      for (let i = 0; i < Math.min(distribution.TLS || 0, 225); i++) {
        if (currentIndex >= shuffled.length) break;
        const pos = shuffled[currentIndex++];
        premiumMap.set(`${pos.row},${pos.col}`, 'TLS');
        premiumSquares.push({
          row: pos.row,
          col: pos.col,
          type: 'TLS'
        });
      }
      
      // Assign DLS
      for (let i = 0; i < Math.min(distribution.DLS || 0, 225); i++) {
        if (currentIndex >= shuffled.length) break;
        const pos = shuffled[currentIndex++];
        premiumMap.set(`${pos.row},${pos.col}`, 'DLS');
        premiumSquares.push({
          row: pos.row,
          col: pos.col,
          type: 'DLS'
        });
      }
      
      // Add all remaining squares as REGULAR
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          const key = `${row},${col}`;
          if (!premiumMap.has(key)) {
            premiumSquares.push({
              row: row,
              col: col,
              type: 'REGULAR'
            });
          }
        }
      }
      
      return premiumSquares;
    },
  };
});

// Anonymous "continue last game" autosave: single-player bot games only
// (not multiplayer, not local pass-and-play). No accounts, just localStorage -
// one slot, so starting a new game naturally overwrites whatever was there.
useGameStore.subscribe((state, prevState) => {
  if (!state.isBotMode) return;

  if (state.gameEnded) {
    if (!prevState.gameEnded) clearActiveGameSnapshot();
    return;
  }
  if (!state.gameStarted) return;

  const relevantFieldsChanged = (
    state.boardCoords !== prevState.boardCoords ||
    state.player1Rack !== prevState.player1Rack ||
    state.player2Rack !== prevState.player2Rack ||
    state.pool !== prevState.pool ||
    state.player1points !== prevState.player1points ||
    state.player2points !== prevState.player2points ||
    state.currentPlayer !== prevState.currentPlayer ||
    state.moveHistory !== prevState.moveHistory
  );
  if (!relevantFieldsChanged) return;

  saveActiveGameSnapshot({
    boardCoords: state.boardCoords,
    origBoardCoords: state.origBoardCoords,
    player1Rack: state.player1Rack,
    player2Rack: state.player2Rack,
    player1points: state.player1points,
    player2points: state.player2points,
    player1Name: state.player1Name,
    player2Name: state.player2Name,
    pool: state.pool,
    currentPlayer: state.currentPlayer,
    moveHistory: state.moveHistory,
    blankTiles: state.blankTiles,
    consecutivePasses: state.consecutivePasses,
    selectedBot: state.selectedBot,
    playerTurnCount: state.playerTurnCount,
    premiumSquares: state.premiumSquares,
    player1Time: state.player1Time,
    player2Time: state.player2Time
  });
});
