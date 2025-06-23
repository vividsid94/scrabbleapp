import { create } from 'zustand';
import { origPool, origBoard } from '../components/AppContent/References/staticData.js';
import { TEST_RACKS } from '../components/AppContent/References/testRacks.js';
import { getBoardDiff } from '../functions/play/boardUtils';
import { alphabetizeRack } from '../functions/play/rackFunctions';
import { ensureGoServiceWarmedUp } from '../functions/play/botFunctions';

export const usePuzzleStore = create((set, get) => {
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
    player1Name: 'SidBot 1',
    player2Name: 'SidBot 2',
    currentPlayer: 1,
    
    // Game state
    pool: origPool,
    gameStarted: false,
    gameEnded: false,
    isBotMode: true,
    consecutivePasses: 0,
    
    // Tile and selection state
    selectedTiles: [],
    selectedBoardPosition: null,
    arrowDirection: 'right',
    tilesToExchange: [],
    blankTiles: [],
    
    // Bot state
    isBotThinking: false,
    botGoesFirst: false,
    
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
    
    // UI state
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
    playerMoveSoundType: 'sword',
    botMoveSoundType: 'sword',
    // Puzzle-specific
    isPausedForBingo: false,
    bingoMove: null,
    puzzleMode: 'bingo', // 'bingo' for all bingos, 'only-bingo' for unique bingos only, 'significant-best' for 10+ point gaps, 'non-bingo-significant' for non-bingo 10+ point gaps
    storedTopMoves: [], // Store moves when bingo is found
    
    // Fast play mode
    isFastPlayMode: true,
    fastPlayMoves: [],
    isExecutingFastPlay: false,
    showAllBingos: false,
    
    // Leave values for move evaluation
    leaveValues: {},
  };

  return {
    ...initialState,
    // Board actions
    setBoardCoords: (coords) => set({ boardCoords: coords }),
    setTempBoardCoords: (coords) => set({ tempBoardCoords: coords }),
    setOrigBoardCoords: (coords) => set({ origBoardCoords: coords }),
    // Player actions
    setPlayer1points: (points) => set({ player1points: points }),
    setPlayer2points: (points) => set({ player2points: points }),
    setPlayer1Rack: (rack) => set({ player1Rack: alphabetizeRack(rack) }),
    setPlayer2Rack: (rack) => set({ player2Rack: alphabetizeRack(rack) }),
    setPlayer1Name: (name) => set({ player1Name: name }),
    setPlayer2Name: (name) => set({ player2Name: name }),
    setCurrentPlayer: (player) => set({ currentPlayer: player }),
    // Game state actions
    setPool: (newPool) => set({ pool: newPool }),
    setGameStarted: (started) => set({ gameStarted: started }),
    setGameEnded: (ended) => set({ gameEnded: ended }),
    setConsecutivePasses: (passes) => set({ consecutivePasses: passes }),
    setIsBotMode: (isBot) => set({ isBotMode: isBot }),
    // Tile and selection actions
    setSelectedTiles: (tiles) => set({ selectedTiles: tiles }),
    setSelectedBoardPosition: (position) => set({ selectedBoardPosition: position }),
    setArrowDirection: (direction) => set({ arrowDirection: direction }),
    setTilesToExchange: (tiles) => set({ tilesToExchange: tiles }),
    setBlankTiles: (tiles) => set({ blankTiles: tiles }),
    // Bot actions
    setIsBotThinking: (thinking) => set({ isBotThinking: thinking }),
    setBotGoesFirst: (goesFirst) => set({ botGoesFirst: goesFirst }),
    // Timer actions
    setPlayer1Time: (time) => set({ player1Time: time }),
    setPlayer2Time: (time) => set({ player2Time: time }),
    setTimerActive: (active) => set({ timerActive: active }),
    setGameTime: (time) => set({ gameTime: time }),
    // Move history actions
    setMoveHistory: (history) => set({ moveHistory: history }),
    setTopMoves: (moves) => set({ topMoves: moves }),
    setIsLoadingTopMoves: (loading) => set({ isLoadingTopMoves: loading }),
    // Dictionary actions
    setIsDictionaryLoading: (loading) => set({ isDictionaryLoading: loading }),
    // Auto-play actions
    setAutoPlayBest: (autoPlay) => set({ autoPlayBest: autoPlay }),
    setIsAutoPlaying: (autoPlaying) => set({ isAutoPlaying: autoPlaying }),
    // Victory actions
    setWinner: (winner) => set({ winner: winner }),
    setFinalPlayer1Score: (score) => set({ finalPlayer1Score: score }),
    setFinalPlayer2Score: (score) => set({ finalPlayer2Score: score }),
    // UI actions
    setTheme: (theme) => set({ theme: theme }),
    setOpen: (open) => set({ open: open }),
    setModalContent: (content) => set({ modalContent: content }),
    setSnackbarOpen: (open) => set({ snackbarOpen: open }),
    setSnackbarMessage: (message) => set({ snackbarMessage: message }),
    setSnackbarSeverity: (severity) => set({ snackbarSeverity: severity }),
    setShowTimeSlider: (show) => set({ showTimeSlider: show }),
    setShowConfetti: (show) => set({ showConfetti: show }),
    setShowVictoryOverlay: (show) => set({ showVictoryOverlay: show }),
    setPlayerMoveSoundType: (type) => set({ playerMoveSoundType: type }),
    setBotMoveSoundType: (type) => set({ botMoveSoundType: type }),
    // Puzzle-specific actions
    setIsPausedForBingo: (paused) => set({ isPausedForBingo: paused }),
    setBingoMove: (move) => set({ bingoMove: move }),
    setPuzzleMode: (mode) => set({ puzzleMode: mode }),
    setStoredTopMoves: (moves) => set({ storedTopMoves: moves }),
    // Leave values actions
    setLeaveValues: (values) => set({ leaveValues: values }),
    // Fast play mode actions
    setIsFastPlayMode: (mode) => set({ isFastPlayMode: mode }),
    setFastPlayMoves: (moves) => set({ fastPlayMoves: moves }),
    setIsExecutingFastPlay: (executing) => set({ isExecutingFastPlay: executing }),
    setShowAllBingos: (show) => set({ showAllBingos: show }),
    // Puzzle settings actions
    setPuzzleMode: (mode) => set({ puzzleMode: mode }),
    // Utility
    getBoardDiff: (beforeBoard, afterBoard) => getBoardDiff(beforeBoard, afterBoard),
    
    // Helper: check if a move is a bingo
    isBingo: (move) => move && move.tiles && move.tiles.length === 7,
    
    // Initialize puzzle to clean state
    initializePuzzle: () => {
      set({
        // Reset to initial state
        boardCoords: [],
        tempBoardCoords: [],
        origBoardCoords: [],
        player1points: 0,
        player2points: 0,
        player1Rack: [],
        player2Rack: [],
        player1Name: 'SidBot 1',
        player2Name: 'SidBot 2',
        currentPlayer: 1,
        pool: origPool,
        gameStarted: false,
        gameEnded: false,
        isBotMode: true,
        consecutivePasses: 0,
        selectedTiles: [],
        selectedBoardPosition: null,
        arrowDirection: 'right',
        tilesToExchange: [],
        blankTiles: [],
        isBotThinking: false,
        botGoesFirst: false,
        player1Time: 20 * 60,
        player2Time: 20 * 60,
        timerActive: false,
        gameTime: 20,
        moveHistory: [],
        topMoves: [],
        isLoadingTopMoves: false,
        isDictionaryLoading: false,
        autoPlayBest: false,
        isAutoPlaying: false,
        winner: null,
        finalPlayer1Score: 0,
        finalPlayer2Score: 0,
        theme: "STANDARD",
        open: false,
        modalContent: "settings",
        snackbarOpen: false,
        snackbarMessage: "",
        snackbarSeverity: "error",
        showTimeSlider: false,
        showConfetti: false,
        showVictoryOverlay: false,
        playerMoveSoundType: 'sword',
        botMoveSoundType: 'sword',
        isPausedForBingo: false,
        bingoMove: null,
        leaveValues: {},
        puzzleMode: 'bingo',
        storedTopMoves: [],
        // Clear fast play state
        fastPlayMoves: [],
        isExecutingFastPlay: false,
        showAllBingos: false,
      });
    },

    // Bot game functions
    handleBotModeToggle: (gameStartSound = null, botMoveSound = null) => {
      const { isDictionaryLoading, startBotGame } = get();
      if (isDictionaryLoading) return;
      
      // Import required constants and call startBotGame
      import('../components/AppContent/References/staticData').then(({ origBoard, origPool }) => {
        import('../components/AppContent/References/testRacks').then(({ TEST_RACKS }) => {
          startBotGame({ origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound });
        });
      });
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
        setPool,
        setCurrentPlayer,
        setConsecutivePasses,
        setPlayer1Name,
        setPlayer2Name,
        setMoveHistory,
        setTopMoves,
        setIsBotMode,
        setPlayer1points,
        setPlayer2points,
        setIsBotThinking,
        setIsLoadingTopMoves,
        setIsAutoPlaying,
        setFinalPlayer1Score,
        setFinalPlayer2Score,
        setIsPausedForBingo,
        setBingoMove,
        setStoredTopMoves,
        isDictionaryLoading,
        gameTime
      } = get();
      
      if (isDictionaryLoading) return;
      
      // Reset ALL game state for new game
      setGameEnded(false);
      setShowVictoryOverlay(false);
      setShowConfetti(false);
      setWinner(null);
      setFinalPlayer1Score(0);
      setFinalPlayer2Score(0);
      
      // Reset puzzle-specific state
      setIsPausedForBingo(false);
      setBingoMove(null);
      setStoredTopMoves([]);
      
      // Turn autoplay off
      setAutoPlayBest(false);
      setIsAutoPlaying(false);
      
      // Clear move history and top moves
      setMoveHistory([]);
      setTopMoves([]);
      setIsLoadingTopMoves(false);
      
      // Reset bot thinking state
      setIsBotThinking(false);
      
      // Reset game state
      const { origBoard, origPool, TEST_RACKS } = params;
      let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
      setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
      setPlayer1points(0);
      setPlayer2points(0);
      setPool(origPool);
      
      // Set current player based on who goes first
      const botGoesFirst = Math.random() < 0.5;
      setCurrentPlayer(botGoesFirst ? 2 : 1);
      setConsecutivePasses(0);
      
      // Initialize player racks
      const newPool = [...origPool];
      let rack1 = [];
      let rack2 = [];
      
      if (TEST_RACKS.enabled) {
        // Use test racks
        rack1 = [...TEST_RACKS.player1];
        rack2 = [...TEST_RACKS.player2];
        
        // Remove test tiles from pool
        [...rack1, ...rack2].forEach(tile => {
          const index = newPool.indexOf(tile);
          if (index !== -1) {
            newPool.splice(index, 1);
          }
        });
      } else {
        // Use random racks
        for (let i = 0; i < 7; i++) {
          const randomIndex1 = Math.floor(Math.random() * newPool.length);
          rack1.push(newPool[randomIndex1]);
          newPool.splice(randomIndex1, 1);
          
          const randomIndex2 = Math.floor(Math.random() * newPool.length);
          rack2.push(newPool[randomIndex2]);
          newPool.splice(randomIndex2, 1);
        }
      }
      
      setPlayer1Rack(rack1);
      setPlayer2Rack(rack2);
      setPool(newPool);
      
      // Set bot mode and names
      setIsBotMode(true);
      setPlayer1Name('SidBot 1');
      setPlayer2Name('SidBot 2');
      
      // Clear all temporary states
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      setArrowDirection('right');
      setBlankTiles([]);
      
      // Reset timer for new game
      setPlayer1Time(gameTime * 60);
      setPlayer2Time(gameTime * 60);
      
      // Set game started state
      setGameStarted(true);
      setTimerActive(true);
    },

    makeBotMove: (botMoveSound, gameStartSound) => {
      const {
        boardCoords,
        player2Rack,
        player1Rack,
        pool,
        player2points,
        player1points,
        player2Name,
        player1Name,
        blankTiles,
        isBotMode,
        currentPlayer,
        setIsBotThinking,
        setBoardCoords,
        setTempBoardCoords,
        setPlayer2Rack,
        setPlayer1Rack,
        setBlankTiles,
        setPool,
        setPlayer2points,
        setPlayer1points,
        setCurrentPlayer,
        setSelectedBoardPosition,
        setSelectedTiles,
        setArrowDirection,
        setSnackbarMessage,
        setSnackbarSeverity,
        setSnackbarOpen,
        setConsecutivePasses,
        setMoveHistory,
        setTopMoves,
        getBoardDiff
      } = get();

      if (!isBotMode || (currentPlayer !== 1 && currentPlayer !== 2)) {
        return;
      }

      setIsBotThinking(true);

      // Add 0.5 second delay to show thinking process
      setTimeout(() => {
        // Determine which bot is moving
        const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
        const currentPoints = currentPlayer === 1 ? player1points : player2points;
        const currentName = currentPlayer === 1 ? player1Name : player2Name;
        const setCurrentRack = currentPlayer === 1 ? setPlayer1Rack : setPlayer2Rack;
        const setCurrentPoints = currentPlayer === 1 ? setPlayer1points : setPlayer2points;

        // Create a deep copy of the board and rack
        const boardCopy = JSON.parse(JSON.stringify(boardCoords));
        const rackCopy = [...currentRack];
        
        // Convert any '?' in the rack to '*' for the API
        const apiRack = rackCopy.map(tile => tile === '?' ? '*' : tile);
        
        console.log('🤖 Bot Move Request:', {
          rack: apiRack.join(''),
          player: currentName
        });

        // Ensure Go service is warmed up before making the actual request
        console.log('🔥 Ensuring Go service is warmed up...');
        ensureGoServiceWarmedUp().then(isWarmedUp => {
          if (!isWarmedUp) {
            console.warn('⚠️ Go service warmup failed, proceeding with fallback...');
          }
        });

        // Call the bot API
        fetch('/.netlify/functions/botLogic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            board: boardCopy,
            letters: apiRack,
            pool: pool
          }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Filter out moves with empty words
          if (data.moves) {
            data.moves = data.moves.filter(move => move.word && move.word.trim() !== '');
          }

          console.log('Bot moves response:', {
            moves: data.moves,
            poolSize: pool.length,
            exchangesConsidered: pool.length >= 7
          });

          // Stop game if exchanges are no longer considered (pool < 7 tiles)
          if (pool.length < 7) {
            console.log('🎯 GAME END: Pool too small for exchanges, ending game');
            const { setGameEnded } = get();
            
            setGameEnded(true);
            
            setIsBotThinking(false);
            setTopMoves([]);
            setSelectedBoardPosition(null);
            setSelectedTiles([]);
            setArrowDirection('right');
            return;
          }

          if (!data.moves || data.moves.length === 0) {
            // No valid moves found, pass
            const moveHistoryEntry = {
              boardDiff: [],
              player: currentName,
              score: 0,
              rack: currentRack.join(''),
              total: currentPoints,
              word: 'Pass'
            };

            const currentHistory = get().moveHistory || [];
            setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);

            // Switch to the other player
            setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
            setConsecutivePasses(prev => prev + 1);
          } else {
            // Sort moves by totalValue (points + leave) from the backend
            const sortedMoves = data.moves.sort((a, b) => b.totalValue - a.totalValue);
            const bestMove = sortedMoves[0];

            // Check if the best move is a bingo (7 tiles) AND NONE of the other moves are bingos
            const isBestMoveBingo = bestMove.tiles && bestMove.tiles.length === 7 && !bestMove.isExchange;
            const otherMovesHaveBingos = sortedMoves.slice(1).some(move => 
              move.tiles && move.tiles.length === 7 && !move.isExchange
            );
            
            // Check for significant best play (10+ point gap)
            const hasSignificantGap = sortedMoves.length > 1 && 
              (bestMove.totalValue - sortedMoves[1].totalValue) >= 10;
            
            // Determine whether to pause based on puzzle mode
            let shouldPause = false;
            const puzzleMode = get().puzzleMode;
            
            if (puzzleMode === 'bingo') {
              shouldPause = isBestMoveBingo;
            } else if (puzzleMode === 'only-bingo') {
              shouldPause = isBestMoveBingo && !otherMovesHaveBingos;
            } else if (puzzleMode === 'significant-best') {
              shouldPause = hasSignificantGap;
            } else if (puzzleMode === 'non-bingo-significant') {
              shouldPause = hasSignificantGap && !isBestMoveBingo;
            }
            
            if (shouldPause) {
              // Auto-pause for challenge
              const { setIsPausedForBingo, setBingoMove, setStoredTopMoves } = get();
              setIsPausedForBingo(true);
              setBingoMove(bestMove);
              
              // Store the moves for display
              setStoredTopMoves(sortedMoves);
              
              // Play game start sound to indicate it's player's turn to guess
              if (gameStartSound && gameStartSound.play) {
                gameStartSound.play();
              }
              
              // Don't make the move yet - wait for user to find it
              // Don't add to move history yet - wait for user to continue
              setIsBotThinking(false);
              setTopMoves([]);
              setSelectedBoardPosition(null);
              setSelectedTiles([]);
              setArrowDirection('right');
              return;
            }

            // Create a copy of the board with the bot's move
            const newBoard = JSON.parse(JSON.stringify(boardCoords));
            let newRack = [...currentRack];
            let newPool = [...pool];
            const newBlankTiles = [...blankTiles];
            
            if (bestMove.isExchange) {
              // Handle exchange move
              const tilesToExchange = bestMove.tilesToExchange || bestMove.tiles.map(t => t.letter);
              const newTiles = bestMove.newTiles || [];
              
              // Remove exchanged tiles from rack
              tilesToExchange.forEach(tile => {
                const index = newRack.indexOf(tile);
                if (index !== -1) {
                  newRack.splice(index, 1);
                }
              });
              
              // Add new tiles to rack
              newRack.push(...newTiles);
              
              // Add exchanged tiles back to pool
              newPool.push(...tilesToExchange);
              
              // Update state
              setCurrentRack(newRack);
              setPool(newPool);
              
              // Add exchange to move history
              const moveHistoryEntry = {
                boardDiff: [],
                player: currentName,
                score: 0,
                rack: newRack.join(''),
                total: currentPoints,
                word: 'Exchange'
              };
              const currentHistory = get().moveHistory || [];
              setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);
              
            } else {
              // Handle word placement
              const boardDiff = [];
              const tilesToRemove = [];
              
              // Place tiles on board
              bestMove.tiles.forEach(tile => {
                const { row, col, letter } = tile;
                newBoard[row][col] = letter;
                boardDiff.push({ row, col, letter });
                
                // Track blank tiles for UI display
                if (tile.isBlank) {
                  newBlankTiles.push({ row: tile.row, col: tile.col });
                  tilesToRemove.push('?');
                } else {
                  // For non-blank tiles, add the letter to tiles to remove
                  tilesToRemove.push(letter);
                }
              });
              
              // Remove all tiles at once using count method
              if (tilesToRemove.length > 0) {
                tilesToRemove.forEach(tile => {
                  const index = newRack.indexOf(tile);
                  if (index !== -1) {
                    newRack.splice(index, 1);
                  }
                });
              }
              
              // Draw new tiles
              const tilesToDraw = Math.min(7 - newRack.length, newPool.length);
              for (let i = 0; i < tilesToDraw; i++) {
                const randomIndex = Math.floor(Math.random() * newPool.length);
                newRack.push(newPool[randomIndex]);
                newPool.splice(randomIndex, 1);
              }
              
              // Update state
              setBoardCoords(newBoard);
              setTempBoardCoords(newBoard);
              setCurrentRack(newRack);
              setPool(newPool);
              setCurrentPoints(currentPoints + bestMove.score);
              setBlankTiles(newBlankTiles);
              
              // Add move to history
              const moveHistoryEntry = {
                boardDiff: boardDiff,
                player: currentName,
                score: bestMove.score,
                rack: newRack.join(''),
                total: currentPoints + bestMove.score,
                word: bestMove.word
              };
              const currentHistory = get().moveHistory || [];
              setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);
              
              // Reset consecutive passes since bot made a move
              setConsecutivePasses(0);
            }
            
            // Switch to the other player
            setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
          }
        })
        .catch(error => {
          console.error('Error making bot move:', error);
          
          // Fallback to pass on error
          const moveHistoryEntry = {
            boardDiff: [],
            player: currentName,
            score: 0,
            rack: currentRack.join(''),
            total: currentPoints,
            word: 'Pass (Error)'
          };

          const currentHistory = get().moveHistory || [];
          setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);

          // Switch to the other player
          setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
          setConsecutivePasses(prev => prev + 1);
          
          setSnackbarMessage('Bot error: ' + error.message);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        })
        .finally(() => {
          setIsBotThinking(false);
          setTopMoves([]);
          setSelectedBoardPosition(null);
          setSelectedTiles([]);
          setArrowDirection('right');
        });
      }, 200); // 0.2 second delay
    },

    // Continue after bingo challenge
    continueBingoMove: () => {
      const {
        bingoMove,
        currentPlayer,
        player1Rack,
        player2Rack,
        player1points,
        player2points,
        player1Name,
        player2Name,
        boardCoords,
        pool,
        blankTiles,
        setBoardCoords,
        setTempBoardCoords,
        setPlayer1Rack,
        setPlayer2Rack,
        setPlayer1points,
        setPlayer2points,
        setPool,
        setCurrentPlayer,
        setMoveHistory,
        setConsecutivePasses,
        setIsPausedForBingo,
        setBingoMove,
        setBlankTiles,
        setStoredTopMoves,
        setFastPlayMoves,
        getBoardDiff
      } = get();

      console.log('🎯 continueBingoMove called', { bingoMove, currentPlayer });

      if (!bingoMove) {
        console.log('❌ No bingo move found');
        return;
      }

      // Determine which bot made the bingo
      const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
      const currentPoints = currentPlayer === 1 ? player1points : player2points;
      const currentName = currentPlayer === 1 ? player1Name : player2Name;
      const setCurrentRack = currentPlayer === 1 ? setPlayer1Rack : setPlayer2Rack;
      const setCurrentPoints = currentPlayer === 1 ? setPlayer1points : setPlayer2points;

      console.log('🎯 Executing bingo move', { 
        word: bingoMove.word, 
        score: bingoMove.score, 
        tiles: bingoMove.tiles.length 
      });

      // Create a copy of the board with the bingo move
      const newBoard = JSON.parse(JSON.stringify(boardCoords));
      let newRack = [...currentRack];
      let newPool = [...pool];
      const newBlankTiles = [...blankTiles];
      const boardDiff = [];
      
      // Place bingo tiles on board
      bingoMove.tiles.forEach(tile => {
        const { row, col, letter } = tile;
        newBoard[row][col] = letter;
        boardDiff.push({ row, col, letter });
        
        // Track blank tiles for UI display
        if (tile.isBlank) {
          newBlankTiles.push({ row: tile.row, col: tile.col });
          // Remove blank tile from rack
          const rackIndex = newRack.indexOf('?');
          if (rackIndex !== -1) {
            newRack.splice(rackIndex, 1);
          }
        } else {
          // Remove regular tile from rack
          const rackIndex = newRack.indexOf(letter);
          if (rackIndex !== -1) {
            newRack.splice(rackIndex, 1);
          }
        }
      });
      
      // Draw new tiles
      const tilesToDraw = Math.min(7 - newRack.length, newPool.length);
      for (let i = 0; i < tilesToDraw; i++) {
        const randomIndex = Math.floor(Math.random() * newPool.length);
        newRack.push(newPool[randomIndex]);
        newPool.splice(randomIndex, 1);
      }
      
      // Update state
      setBoardCoords(newBoard);
      setTempBoardCoords(newBoard);
      setCurrentRack(newRack);
      setPool(newPool);
      setCurrentPoints(currentPoints + bingoMove.score);
      setBlankTiles(newBlankTiles);
      
      // Add bingo move to history
      const moveHistoryEntry = {
        boardDiff: boardDiff,
        player: currentName,
        score: bingoMove.score,
        rack: newRack.join(''),
        total: currentPoints + bingoMove.score,
        word: bingoMove.word
      };
      const currentHistory = get().moveHistory || [];
      setMoveHistory([...currentHistory.slice(-49), moveHistoryEntry]);
      
      // Reset consecutive passes since bot made a move
      setConsecutivePasses(0);
      
      // Switch to the other player
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      
      // Clear bingo pause state
      setIsPausedForBingo(false);
      setBingoMove(null);
      setStoredTopMoves([]);
      // Clear fast play moves after puzzle challenge
      setFastPlayMoves([]);


      console.log('✅ Bingo move completed');
      
      // Reset bot move flag immediately to allow next bot to move
      setTimeout(() => {
        console.log('🔄 Resetting bot move flag after bingo completion');
        // This will be handled by the useEffect in Puzzle.js
      }, 0);
    },

    // Fetch leave values for top moves
    fetchLeaveValuesForTopMoves: () => {
      const { topMoves } = get();
      if (topMoves.length > 0) {
        console.log('Top moves updated, fetching leave values');
        // Dynamic import to avoid circular dependency
        import('../functions/play/leaveFunctions').then(({ fetchLeaveValues }) => {
          fetchLeaveValues(topMoves);
        });
      }
    },

    // Fast play mode - group moves together until pause conditions are met
    makeFastBotMove: async (botMoveSound, gameStartSound) => {
      const {
        isFastPlayMode,
        isExecutingFastPlay,
        setIsExecutingFastPlay,
        setFastPlayMoves,
        makeBotMove,
        isBingo,
        setBoardCoords,
        setTempBoardCoords,
        setPlayer1Rack,
        setPlayer2Rack,
        setPlayer1points,
        setPlayer2points,
        setPool,
        setCurrentPlayer,
        setMoveHistory,
        setConsecutivePasses,
        setBlankTiles,
        getBoardDiff
      } = get();

      if (!isFastPlayMode || isExecutingFastPlay) {
        return;
      }

      setIsExecutingFastPlay(true);
      const movesToExecute = [];
      let currentState = get();
      // Initialize blank tiles tracking for simulation
      currentState.blankTiles = [...currentState.blankTiles];
      let shouldPause = false;
      let pauseReason = null;

      console.log('🚀 Starting fast play mode');

      // Collect moves until we hit a pause condition
      while (!shouldPause && !currentState.gameEnded) {
        // Get current game state
        const {
          boardCoords,
          player1Rack,
          player2Rack,
          pool,
          currentPlayer,
          puzzleMode
        } = currentState;

        if (currentState.pool.length < 7) {
          console.log('🎯 GAME END: Pool too small for exchanges');
          const { setGameEnded } = get();
          setGameEnded(true);
          break;
        }

        // Determine which bot is moving
        const currentRack = currentPlayer === 1 ? currentState.player1Rack : currentState.player2Rack;
        const currentName = currentPlayer === 1 ? currentState.player1Name : currentState.player2Name;

        console.log(`🤖 Fast play iteration - Player: ${currentName}, Rack: ${currentRack.join('')} (${currentRack.length} tiles), Pool: ${currentState.pool.length} tiles`);

        // Create a deep copy of the board and rack
        const boardCopy = JSON.parse(JSON.stringify(currentState.boardCoords));
        const rackCopy = [...currentRack];
        const apiRack = rackCopy.map(tile => tile === '?' ? '*' : tile);

        try {
          // Call the bot API
          const response = await fetch('/.netlify/functions/botLogic', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              board: boardCopy,
              letters: apiRack,
              pool: currentState.pool
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Filter out moves with empty words
          if (data.moves) {
            data.moves = data.moves.filter(move => move.word && move.word.trim() !== '');
          }

          if (!data.moves || data.moves.length === 0) {
            // No valid moves found, add pass to moves list
            movesToExecute.push({
              type: 'pass',
              player: currentName,
              currentPlayer: currentPlayer
            });
            break;
          }

          // Sort moves by totalValue
          const sortedMoves = data.moves.sort((a, b) => b.totalValue - a.totalValue);
          const bestMove = sortedMoves[0];

          // Check pause conditions
          const isBestMoveBingo = isBingo(bestMove);
          const otherMovesHaveBingos = sortedMoves.slice(1).some(move => isBingo(move));
          const hasSignificantGap = sortedMoves.length > 1 && 
            (bestMove.totalValue - sortedMoves[1].totalValue) >= 10;

          if (puzzleMode === 'bingo' && isBestMoveBingo) {
            shouldPause = true;
            pauseReason = 'bingo';
          } else if (puzzleMode === 'only-bingo' && isBestMoveBingo && !otherMovesHaveBingos) {
            shouldPause = true;
            pauseReason = 'only-bingo';
          } else if (puzzleMode === 'significant-best' && hasSignificantGap) {
            shouldPause = true;
            pauseReason = 'significant-best';
          } else if (puzzleMode === 'non-bingo-significant' && hasSignificantGap && !isBestMoveBingo) {
            shouldPause = true;
            pauseReason = 'non-bingo-significant';
          }

          if (shouldPause) {
            // Store the moves for the puzzle challenge
            movesToExecute.push({
              type: 'puzzle',
              move: bestMove,
              allMoves: sortedMoves,
              player: currentName,
              currentPlayer: currentPlayer,
              reason: pauseReason
            });
            
            // Don't simulate the puzzle move - it will be executed when the user continues
            // This keeps the real state in sync with the simulation
          } else {
            // Add move to execution list
            movesToExecute.push({
              type: 'move',
              move: bestMove,
              player: currentName,
              currentPlayer: currentPlayer
            });

            // Simulate the move to update state for next iteration (don't update real state yet)
            if (bestMove.isExchange) {
              // Handle exchange simulation
              const tilesToExchange = bestMove.tilesToExchange || bestMove.tiles.map(t => t.letter);
              const newTiles = bestMove.newTiles || [];
              
              // Update rack
              const newRack = currentRack.filter(tile => !tilesToExchange.includes(tile));
              newRack.push(...newTiles);
              
              console.log(`🔄 Exchange simulation - Old rack: ${currentRack.join('')} (${currentRack.length}), New rack: ${newRack.join('')} (${newRack.length})`);
              
              // Update pool
              currentState.pool.push(...tilesToExchange);
              
              if (currentPlayer === 1) {
                currentState.player1Rack = newRack;
              } else {
                currentState.player2Rack = newRack;
              }
            } else {
              // Handle word placement simulation
              const tilesToRemove = [];
              
              bestMove.tiles.forEach(tile => {
                const { row, col, letter } = tile;
                currentState.boardCoords[row][col] = letter;
                
                if (tile.isBlank) {
                  tilesToRemove.push('?');
                  // Track blank tiles for simulation
                  currentState.blankTiles.push({ row: tile.row, col: tile.col });
                } else {
                  tilesToRemove.push(letter);
                }
              });

              // Update rack
              let newRack = [...currentRack];
              tilesToRemove.forEach(tile => {
                const index = newRack.indexOf(tile);
                if (index !== -1) {
                  newRack.splice(index, 1);
                }
              });

              // Draw new tiles
              const tilesToDraw = Math.min(7 - newRack.length, currentState.pool.length);
              for (let i = 0; i < tilesToDraw; i++) {
                const randomIndex = Math.floor(Math.random() * currentState.pool.length);
                newRack.push(currentState.pool[randomIndex]);
                currentState.pool.splice(randomIndex, 1);
              }

              console.log(`🔄 Move simulation - Old rack: ${currentRack.join('')} (${currentRack.length}), Tiles played: ${tilesToRemove.join('')}, New rack: ${newRack.join('')} (${newRack.length})`);

              if (currentPlayer === 1) {
                currentState.player1Rack = newRack;
                currentState.player1points += bestMove.score;
              } else {
                currentState.player2Rack = newRack;
                currentState.player2points += bestMove.score;
              }
            }

            // Switch to the other player
            currentState.currentPlayer = currentPlayer === 1 ? 2 : 1;
          }

        } catch (error) {
          console.error('Error in fast play mode:', error);
          movesToExecute.push({
            type: 'error',
            player: currentName,
            currentPlayer: currentPlayer,
            error: error.message
          });
          break;
        }
      }

      // Store the moves for execution
      setFastPlayMoves(movesToExecute);

      if (movesToExecute.length > 0) {
        const lastMove = movesToExecute[movesToExecute.length - 1];
        
        if (lastMove.type === 'puzzle') {
          // Execute all moves except the puzzle move, then pause for challenge
          const movesToExecuteNow = movesToExecute.slice(0, -1); // Exclude the puzzle move
          if (movesToExecuteNow.length > 0) {
            await get().executeFastPlayMoves(movesToExecuteNow, botMoveSound);
          }
          
          // Update the real game state to match the simulated state for the puzzle move
          const { 
            setBoardCoords, 
            setTempBoardCoords, 
            setPlayer1Rack, 
            setPlayer2Rack, 
            setPlayer1points, 
            setPlayer2points, 
            setPool, 
            setCurrentPlayer,
            setBlankTiles
          } = get();
          
          // Get the current state after simulation
          const finalState = currentState;
          
          // Update real state to match simulation
          setBoardCoords(JSON.parse(JSON.stringify(finalState.boardCoords)));
          setTempBoardCoords(JSON.parse(JSON.stringify(finalState.boardCoords)));
          setPlayer1Rack([...finalState.player1Rack]);
          setPlayer2Rack([...finalState.player2Rack]);
          setPlayer1points(finalState.player1points);
          setPlayer2points(finalState.player2points);
          setPool([...finalState.pool]);
          setCurrentPlayer(finalState.currentPlayer);
          setBlankTiles([...finalState.blankTiles]);
          
          console.log(`🎯 Updated real state for puzzle pause - Player 1 rack: ${finalState.player1Rack.join('')} (${finalState.player1Rack.length}), Player 2 rack: ${finalState.player2Rack.join('')} (${finalState.player2Rack.length})`);
          console.log(`🎯 Updated real state for puzzle pause - Blank tiles: ${finalState.blankTiles.length}, Pool: ${finalState.pool.length}`);
          
          // Pause for puzzle challenge
          const { setIsPausedForBingo, setBingoMove, setStoredTopMoves } = get();
          setIsPausedForBingo(true);
          setBingoMove(lastMove.move);
          setStoredTopMoves(lastMove.allMoves);
          
          if (gameStartSound && gameStartSound.play) {
            gameStartSound.play();
          }
        } else {
          // Execute all moves together
          await get().executeFastPlayMoves(movesToExecute, botMoveSound);
        }
      }

      setIsExecutingFastPlay(false);
    },

    // Execute the collected moves quickly
    executeFastPlayMoves: async (moves, botMoveSound) => {
      const {
        boardCoords,
        player1Rack,
        player2Rack,
        player1points,
        player2points,
        pool,
        blankTiles,
        setBoardCoords,
        setTempBoardCoords,
        setPlayer1Rack,
        setPlayer2Rack,
        setPlayer1points,
        setPlayer2points,
        setPool,
        setCurrentPlayer,
        setMoveHistory,
        setConsecutivePasses,
        setBlankTiles,
        getBoardDiff
      } = get();

      console.log('⚡ Executing', moves.length, 'moves in fast play mode');

      let currentBoard = JSON.parse(JSON.stringify(boardCoords));
      let currentPlayer1Rack = [...player1Rack];
      let currentPlayer2Rack = [...player2Rack];
      let currentPlayer1Points = player1points;
      let currentPlayer2Points = player2points;
      let currentPool = [...pool];
      let currentBlankTiles = [...blankTiles];
      let currentPlayer = get().currentPlayer;
      const moveHistoryEntries = [];

      for (const moveData of moves) {
        if (moveData.type === 'move') {
          const { move, player, currentPlayer: movePlayer } = moveData;
          const currentRack = movePlayer === 1 ? currentPlayer1Rack : currentPlayer2Rack;
          const currentPoints = movePlayer === 1 ? currentPlayer1Points : currentPlayer2Points;

          if (move.isExchange) {
            // Handle exchange
            const tilesToExchange = move.tilesToExchange || move.tiles.map(t => t.letter);
            const newTiles = move.newTiles || [];
            
            // Update rack
            const newRack = currentRack.filter(tile => !tilesToExchange.includes(tile));
            newRack.push(...newTiles);
            
            // Update pool
            currentPool.push(...tilesToExchange);
            
            if (movePlayer === 1) {
              currentPlayer1Rack = newRack;
            } else {
              currentPlayer2Rack = newRack;
            }

            moveHistoryEntries.push({
              boardDiff: [],
              player: player,
              score: 0,
              rack: newRack.join(''),
              total: currentPoints,
              word: 'Exchange'
            });
          } else {
            // Handle word placement
            const boardDiff = [];
            const tilesToRemove = [];
            
            move.tiles.forEach(tile => {
              const { row, col, letter } = tile;
              currentBoard[row][col] = letter;
              boardDiff.push({ row, col, letter });
              
              if (tile.isBlank) {
                currentBlankTiles.push({ row: tile.row, col: tile.col });
                tilesToRemove.push('?');
              } else {
                tilesToRemove.push(letter);
              }
            });

            // Update rack
            let newRack = [...currentRack];
            tilesToRemove.forEach(tile => {
              const index = newRack.indexOf(tile);
              if (index !== -1) {
                newRack.splice(index, 1);
              }
            });

            // Draw new tiles
            const tilesToDraw = Math.min(7 - newRack.length, currentPool.length);
            for (let i = 0; i < tilesToDraw; i++) {
              const randomIndex = Math.floor(Math.random() * currentPool.length);
              newRack.push(currentPool[randomIndex]);
              currentPool.splice(randomIndex, 1);
            }

            if (movePlayer === 1) {
              currentPlayer1Rack = newRack;
              currentPlayer1Points += move.score;
            } else {
              currentPlayer2Rack = newRack;
              currentPlayer2Points += move.score;
            }

            moveHistoryEntries.push({
              boardDiff: boardDiff,
              player: player,
              score: move.score,
              rack: newRack.join(''),
              total: currentPoints + move.score,
              word: move.word
            });
          }

          currentPlayer = movePlayer === 1 ? 2 : 1;
        } else if (moveData.type === 'pass') {
          // Handle pass
          moveHistoryEntries.push({
            boardDiff: [],
            player: moveData.player,
            score: 0,
            rack: (moveData.currentPlayer === 1 ? currentPlayer1Rack : currentPlayer2Rack).join(''),
            total: moveData.currentPlayer === 1 ? currentPlayer1Points : currentPlayer2Points,
            word: 'Pass'
          });
          currentPlayer = moveData.currentPlayer === 1 ? 2 : 1;
        }
      }

      // Update all state at once
      setBoardCoords(currentBoard);
      setTempBoardCoords(currentBoard);
      setPlayer1Rack(currentPlayer1Rack);
      setPlayer2Rack(currentPlayer2Rack);
      setPlayer1points(currentPlayer1Points);
      setPlayer2points(currentPlayer2Points);
      setPool(currentPool);
      setBlankTiles(currentBlankTiles);
      setCurrentPlayer(currentPlayer);
      
      // Add all moves to history
      const currentHistory = get().moveHistory || [];
      setMoveHistory([...currentHistory.slice(-49), ...moveHistoryEntries]);
      
      // Play sound for the last move
      if (botMoveSound && botMoveSound.play) {
        botMoveSound.play();
      }

      console.log('✅ Fast play execution completed');
      
      // Clear fast play moves after a short delay to show the summary
      setTimeout(() => {
        get().setFastPlayMoves([]);
      }, 3000); // Show summary for 3 seconds
    },
  };
});