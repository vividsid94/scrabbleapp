/**
 * useMultiplayerGame Hook
 * Handles Supabase Realtime subscription and game state synchronization
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useGameStore } from '../stores/gameStore';
import {
  getGame,
  submitMove as apiSubmitMove,
  passTurn as apiPassTurn,
  exchangeTiles as apiExchangeTiles
} from '../utils/multiplayerApi';
import { origBoard } from '../components/AppContent/References/staticData';

/**
 * Hook for managing multiplayer game state
 * @param {string} gameCode - The game code to connect to
 * @returns {object} Multiplayer game controls and state
 */
export const useMultiplayerGame = (gameCode) => {
  const channelRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get store actions
  const {
    setBoardCoords,
    setTempBoardCoords,
    setOrigBoardCoords,
    setPlayer1points,
    setPlayer2points,
    setPlayer1Rack,
    setPlayer2Rack,
    setPlayer1Name,
    setPlayer2Name,
    setCurrentPlayer,
    setConsecutivePasses,
    setMoveHistory,
    setGameStarted,
    setGameEnded,
    setWinner,
    setMultiplayerMode,
    setOpponentRackCount,
    setPoolCount,
    setIsWaitingForOpponent,
    setMultiplayerConnectionStatus,
    setPool,
    setSnackbarMessage,
    setSnackbarSeverity,
    setSnackbarOpen,
    isMyTurn,
    localPlayerNumber,
    isMultiplayerMode
  } = useGameStore();
  
  // Get additional actions for clearing state
  const setSelectedTiles = useGameStore(state => state.setSelectedTiles);
  const setSelectedBoardPosition = useGameStore(state => state.setSelectedBoardPosition);
  const setBlankTiles = useGameStore(state => state.setBlankTiles);

  /**
   * Sync server game state to local store
   */
  const syncGameState = useCallback(async (serverGame, playerNumber) => {
    const pNum = playerNumber || useGameStore.getState().localPlayerNumber;

    console.log('🔄 Syncing game state:', {
      playerNumber: pNum,
      hasBoardState: !!serverGame.boardState || !!serverGame.board_state,
      boardStateType: typeof (serverGame.boardState || serverGame.board_state),
      boardStateLength: (serverGame.boardState || serverGame.board_state)?.length,
      myRackLength: (serverGame.myRack || serverGame.my_rack)?.length,
      currentPlayer: serverGame.currentPlayer || serverGame.current_player
    });

    // Initialize board if needed
    const parsedOrigBoard = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(parsedOrigBoard);

    // Set board state - ensure it's a valid 15x15 array
    let boardState = serverGame.boardState || serverGame.board_state;
    
    // Log raw board state for debugging - check the actual structure
    const hasTiles = boardState?.some(row => row?.some(cell => typeof cell === 'string'));
    const allCells = boardState?.flat() || [];
    const stringCells = allCells.filter(cell => typeof cell === 'string');
    
    // Check a few specific cells to see what's actually there
    const sampleCells = [];
    for (let r = 0; r < Math.min(5, boardState?.length || 0); r++) {
      for (let c = 0; c < Math.min(5, boardState?.[r]?.length || 0); c++) {
        const cell = boardState?.[r]?.[c];
        if (cell !== 0 && cell !== null && cell !== undefined) {
          sampleCells.push({ row: r, col: c, value: cell, type: typeof cell });
        }
      }
    }
    
    console.log('📋 Raw board state from server:', {
      type: typeof boardState,
      isArray: Array.isArray(boardState),
      length: boardState?.length,
      firstRow: boardState?.[0],
      firstRowType: typeof boardState?.[0],
      firstCell: boardState?.[0]?.[0],
      firstCellType: typeof boardState?.[0]?.[0],
      hasTiles,
      totalCells: allCells.length,
      stringCellsCount: stringCells.length,
      stringCells: stringCells.slice(0, 10),
      sampleCells,
      fullBoardState: JSON.stringify(boardState).substring(0, 1000)
    });
    
    // Validate board state
    if (!boardState || !Array.isArray(boardState) || boardState.length !== 15) {
      console.warn('⚠️ Invalid board state from server, using empty board', {
        boardState,
        isArray: Array.isArray(boardState),
        length: boardState?.length,
        playerNumber: pNum
      });
      boardState = Array(15).fill(null).map(() => Array(15).fill(0));
    } else {
      // Ensure each row is valid
      boardState = boardState.map((row, rowIdx) => {
        if (!Array.isArray(row) || row.length !== 15) {
          console.warn(`⚠️ Invalid row ${rowIdx}, fixing it`);
          return Array(15).fill(0);
        }
        return row.map(cell => {
          // Convert null/undefined to 0, keep strings and numbers as-is
          if (cell === null || cell === undefined) {
            return 0;
          }
          return cell;
        });
      });
    }
    
    console.log('✅ Setting board state:', {
      boardStateLength: boardState.length,
      firstRowLength: boardState[0]?.length,
      firstCell: boardState[0]?.[0],
      playerNumber: pNum,
      hasTiles: boardState.some(row => row.some(cell => typeof cell === 'string'))
    });
    
    // Always set both board states to ensure they're in sync
    setBoardCoords(boardState);
    setTempBoardCoords(JSON.parse(JSON.stringify(boardState)));

    // Set scores
    setPlayer1points(serverGame.player1Points ?? serverGame.player1_points ?? 0);
    setPlayer2points(serverGame.player2Points ?? serverGame.player2_points ?? 0);

    // Set names
    setPlayer1Name(serverGame.player1Name || serverGame.player1_name || 'Player 1');
    setPlayer2Name(serverGame.player2Name || serverGame.player2_name || 'Player 2');

    // Set current player
    const newCurrentPlayer = serverGame.currentPlayer ?? serverGame.current_player ?? 1;
    console.log('✅ Setting current player:', {
      newCurrentPlayer,
      myPlayerNumber: pNum,
      isMyTurn: newCurrentPlayer === pNum
    });
    setCurrentPlayer(newCurrentPlayer);

    // Set consecutive passes
    setConsecutivePasses(serverGame.consecutivePasses ?? serverGame.consecutive_passes ?? 0);

    // Set move history
    setMoveHistory(serverGame.moveHistory || serverGame.move_history || []);

    // Set my rack only - ensure it's an array
    const myRack = serverGame.myRack || serverGame.my_rack || [];
    const rackArray = Array.isArray(myRack) ? myRack : (typeof myRack === 'string' ? myRack.split('') : []);
    
    console.log('✅ Setting rack:', {
      playerNumber: pNum,
      rackLength: rackArray.length,
      rack: rackArray
    });
    
    if (pNum === 1) {
      setPlayer1Rack(rackArray);
      setPlayer2Rack([]); // We don't know opponent's rack
    } else if (pNum === 2) {
      setPlayer2Rack(rackArray);
      setPlayer1Rack([]); // We don't know opponent's rack
    }

    // Set opponent rack count and pool count
    const poolCount = serverGame.poolCount ?? serverGame.pool_count ?? 0;
    setOpponentRackCount(serverGame.opponentRackCount ?? serverGame.opponent_rack_count ?? 0);
    setPoolCount(poolCount);

    // Create a fake pool string for UI (we don't know actual tiles)
    // The pool is stored as a string in the game store
    const poolString = Array(poolCount).fill('?').join('');
    setPool(poolString);

    // Set game status
    const status = serverGame.status;
    if (status === 'waiting') {
      setIsWaitingForOpponent(true);
      setGameStarted(false);
    } else if (status === 'active') {
      setIsWaitingForOpponent(false);
      setGameStarted(true);
      setGameEnded(false);
    } else if (status === 'completed') {
      setIsWaitingForOpponent(false);
      setGameStarted(true);
      setGameEnded(true);
      if (serverGame.winner) {
        setWinner(serverGame.winner === pNum ? 'player' : 'opponent');
      }
    }
  }, [
    setBoardCoords, setTempBoardCoords, setOrigBoardCoords,
    setPlayer1points, setPlayer2points, setPlayer1Rack, setPlayer2Rack,
    setPlayer1Name, setPlayer2Name, setCurrentPlayer, setConsecutivePasses,
    setMoveHistory, setGameStarted, setGameEnded, setWinner,
    setOpponentRackCount, setPoolCount, setIsWaitingForOpponent, setPool
  ]);

  /**
   * Fetch initial game state
   */
  const fetchGameState = useCallback(async () => {
    if (!gameCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getGame(gameCode);

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Set multiplayer mode
      setMultiplayerMode(true, gameCode, result.playerNumber);

      // Sync game state
      await syncGameState(result.game, result.playerNumber);

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching game state:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [gameCode, setMultiplayerMode, syncGameState]);

  /**
   * Subscribe to realtime updates
   */
  const subscribeToGame = useCallback(() => {
    if (!gameCode) return;

    setMultiplayerConnectionStatus('connecting');

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`game:${gameCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'multiplayer_games',
          filter: `game_code=eq.${gameCode}`
        },
        async (payload) => {
          console.log('🔄 Received Realtime game update:', {
            event: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table
          });

          // Small delay to ensure database update is complete
          await new Promise(resolve => setTimeout(resolve, 200));

          // Re-fetch game to get proper filtered response
          try {
            const result = await getGame(gameCode);
            if (result.success) {
              console.log('✅ Syncing game state after Realtime update:', {
                boardStateLength: result.game.boardState?.length,
                boardStateType: typeof result.game.boardState,
                boardStateFirstRow: result.game.boardState?.[0],
                myRackLength: result.game.myRack?.length,
                currentPlayer: result.game.currentPlayer,
                playerNumber: result.playerNumber,
                status: result.game.status
              });
              await syncGameState(result.game, result.playerNumber);
            } else {
              console.error('❌ Failed to get game after Realtime update:', result.error);
            }
          } catch (err) {
            console.error('❌ Error syncing after update:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setMultiplayerConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setMultiplayerConnectionStatus('disconnected');
        }
      });

    channelRef.current = channel;
  }, [gameCode, setMultiplayerConnectionStatus, syncGameState]);

  /**
   * Polling fallback - only used if Realtime connection fails
   * Removed: Realtime is enabled and working, so polling is unnecessary
   * If Realtime fails, the connection status will show 'disconnected' and
   * we can add polling back conditionally if needed
   */

  /**
   * Initialize game
   */
  useEffect(() => {
    if (gameCode) {
      fetchGameState();
      subscribeToGame();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameCode, fetchGameState, subscribeToGame]);

  /**
   * Submit a move
   */
  const submitMove = useCallback(async (placedTiles) => {
    console.log('🎯 submitMove called in hook:', { gameCode, placedTilesCount: placedTiles?.length });
    
    if (!useGameStore.getState().isMyTurn()) {
      console.warn('⚠️ Not my turn, blocking move');
      setSnackbarMessage("It's not your turn!");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return { success: false, error: "It's not your turn" };
    }

    console.log('✅ It is my turn, calling apiSubmitMove');
    const result = await apiSubmitMove(gameCode, {
      type: 'play',
      tiles: placedTiles
    });
    
    console.log('📥 apiSubmitMove returned:', { success: result.success, error: result.error });

    if (!result.success) {
      setSnackbarMessage(result.error || 'Invalid move');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } else {
      // Move was successful - wait for Realtime update to sync everything
      // But also manually sync after a short delay as a fallback
      console.log('✅ Move submitted successfully, waiting for Realtime update');
      console.log('📊 Move result:', {
        hasGame: !!result.game,
        boardStateLength: result.game?.boardState?.length,
        myRackLength: result.game?.myRack?.length,
        currentPlayer: result.game?.currentPlayer
      });
      
      // Clear selected tiles immediately to prevent UI issues
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      setBlankTiles([]);
      
      // Fallback: manually sync after delay if Realtime doesn't fire
      setTimeout(async () => {
        try {
          const refreshResult = await getGame(gameCode);
          if (refreshResult.success) {
            console.log('🔄 Fallback sync after move:', {
              boardStateLength: refreshResult.game.boardState?.length,
              currentPlayer: refreshResult.game.currentPlayer
            });
            await syncGameState(refreshResult.game, refreshResult.playerNumber);
          }
        } catch (err) {
          console.error('❌ Fallback sync failed:', err);
        }
      }, 500);
    }

    return result;
  }, [gameCode, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen, setBoardCoords, setTempBoardCoords, setPlayer1Rack, setPlayer2Rack, setPlayer1points, setPlayer2points, setCurrentPlayer]);

  /**
   * Pass turn
   */
  const passTurn = useCallback(async () => {
    if (!useGameStore.getState().isMyTurn()) {
      setSnackbarMessage("It's not your turn!");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return { success: false, error: "It's not your turn" };
    }

    const result = await apiPassTurn(gameCode);

    if (!result.success) {
      setSnackbarMessage(result.error || 'Failed to pass');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }

    return result;
  }, [gameCode, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen]);

  /**
   * Exchange tiles
   */
  const exchangeTiles = useCallback(async (tiles) => {
    if (!useGameStore.getState().isMyTurn()) {
      setSnackbarMessage("It's not your turn!");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return { success: false, error: "It's not your turn" };
    }

    const result = await apiExchangeTiles(gameCode, tiles);

    if (!result.success) {
      setSnackbarMessage(result.error || 'Failed to exchange');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }

    return result;
  }, [gameCode, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen]);

  /**
   * Refresh game state
   */
  const refreshGame = useCallback(() => {
    fetchGameState();
  }, [fetchGameState]);

  return {
    isLoading,
    error,
    submitMove,
    passTurn,
    exchangeTiles,
    refreshGame,
    isMyTurn: useGameStore.getState().isMyTurn
  };
};

export default useMultiplayerGame;
