/**
 * MultiplayerGame Component
 * Wrapper around Play.js that enables multiplayer mode with Supabase Realtime sync
 */

import React, { useEffect, useContext, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeContext } from '../../App';
import { useGameStore } from '../../stores/gameStore';
import { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import { getPlayerId } from '../../utils/multiplayerApi';
import Play from '../Play/Play';
import { validateMoveClient } from '../../functions/play/validateMoveClient';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    minHeight: 'calc(100vh - 150px)'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    gap: '20px'
  },
  card: {
    borderRadius: '16px',
    padding: '32px 48px',
    textAlign: 'center',
    maxWidth: '450px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.7,
    marginBottom: '24px'
  },
  gameCode: {
    fontSize: '36px',
    fontWeight: '700',
    letterSpacing: '8px',
    padding: '16px 24px',
    borderRadius: '12px',
    fontFamily: 'monospace',
    marginBottom: '16px'
  },
  shareLink: {
    fontSize: '12px',
    opacity: 0.6,
    marginBottom: '24px',
    wordBreak: 'break-all'
  },
  copyButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  turnIndicator: {
    position: 'fixed',
    top: '50px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 100,
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '16px',
    marginBottom: '16px'
  },
  backButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'transparent'
  },
  connectionStatus: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 100
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  }
};

const MultiplayerGame = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const { lightMode } = useContext(ThemeContext);
  const [copied, setCopied] = useState(false);

  // Get store state
  const {
    isWaitingForOpponent,
    multiplayerConnectionStatus,
    currentPlayer,
    localPlayerNumber,
    player1Name,
    player2Name,
    isMultiplayerMode,
    gameStarted,
    gameEnded
  } = useGameStore();

  // Initialize multiplayer hook
  const {
    isLoading,
    error,
    submitMove,
    passTurn,
    exchangeTiles,
    refreshGame,
    isMyTurn
  } = useMultiplayerGame(gameCode);

  const isDark = lightMode === 'dark';

  // Theme colors
  const colors = {
    bg: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    cardBg: isDark ? '#374151' : '#ffffff',
    text: isDark ? '#ffffff' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#4b5563' : '#e5e7eb',
    codeBg: isDark ? '#1f2937' : '#f3f4f6',
    primaryButton: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    myTurn: isDark ? '#10b981' : '#059669',
    opponentTurn: isDark ? '#f59e0b' : '#d97706',
    connected: '#10b981',
    connecting: '#f59e0b',
    disconnected: '#ef4444'
  };

  // Copy game code to clipboard
  const copyGameCode = useCallback(() => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [gameCode]);

  // Override store methods for multiplayer
  useEffect(() => {
    if (!isMultiplayerMode) {
      console.log('⚠️ Multiplayer mode not enabled, skipping handler setup');
      // Clear handlers when not in multiplayer
      useGameStore.setState({
        handleWordSubmitMultiplayer: null,
        handlePassMultiplayer: null,
        handleExchangeMultiplayer: null
      });
      return;
    }

    console.log('🔧 Setting up multiplayer handlers');

    // Set handlers in the store using setState
    // These handlers need to be closures that capture submitMove, passTurn, exchangeTiles
    const handleWordSubmitMultiplayerFn = async (playerMoveSound) => {
      console.log('🎮 handleWordSubmitMultiplayer called in store');
      const state = useGameStore.getState();

      // Check if it's my turn
      if (state.localPlayerNumber !== state.currentPlayer) {
        state.setSnackbarMessage("It's not your turn!");
        state.setSnackbarSeverity('error');
        state.setSnackbarOpen(true);
        return;
      }

      // Get placed tiles from the board difference
      const { boardCoords, tempBoardCoords, selectedTiles, blankTiles } = state;
      const placedTiles = [];

      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          const before = boardCoords[row][col];
          const after = tempBoardCoords[row][col];

          // Check if a new tile was placed
          if (typeof after === 'string' && after.match(/[A-Z]/) &&
            (typeof before !== 'string' || !before.match(/[A-Z]/))) {

            // Check if this is a blank tile
            const isBlank = blankTiles.some(bt => bt.row === row && bt.col === col);

            placedTiles.push({
              row,
              col,
              letter: after,
              isBlank
            });
          }
        }
      }

      if (placedTiles.length === 0) {
        state.setSnackbarMessage('No tiles placed');
        state.setSnackbarSeverity('error');
        state.setSnackbarOpen(true);
        return;
      }

      // Validate move client-side first (like single-player mode)
      const { setMoveStatus, setInvalidWordCoords } = state;
      setMoveStatus('Validating...');
      
      try {
        const validationResult = await validateMoveClient(boardCoords, tempBoardCoords, setMoveStatus);
        
        if (!validationResult.isValid) {
          setMoveStatus(null);
          
          // Set invalid word coordinates for visual highlighting (red glow)
          if (validationResult.invalidWordCoords && validationResult.invalidWordCoords.length > 0) {
            setInvalidWordCoords(validationResult.invalidWordCoords);
            // Clear invalid coords after 3 seconds (visual feedback duration)
            setTimeout(() => {
              setInvalidWordCoords([]);
            }, 3000);
          }
          
          // Don't show snackbar - visual feedback only (like single-player)
          // Don't return tiles to rack - let user see the error and decide what to do
          return;
        }
        
        // Clear invalid word coords if validation passed
        setInvalidWordCoords([]);
        setMoveStatus(null);
      } catch (error) {
        console.error('Client-side validation error:', error);
        setMoveStatus(null);
        // On validation error, still allow server to validate (fallback)
      }

      console.log('🎮 Submitting move with placed tiles:', placedTiles);
      console.log('🎮 About to call submitMove from hook');
      console.log('🎮 submitMove function type:', typeof submitMove);
      console.log('🎮 submitMove function:', submitMove);

      // Submit move through multiplayer API
      console.log('🎮 Calling submitMove now...');
      const result = await submitMove(placedTiles);
      console.log('🎮 submitMove call completed');

      console.log('🎮 Move submission result:', {
        success: result.success,
        error: result.error,
        hasGame: !!result.game,
        boardStateHasTiles: result.game?.boardState?.some(row => row?.some(cell => typeof cell === 'string')),
        resultKeys: Object.keys(result)
      });

      if (!result.success) {
        console.error('❌ Move submission failed:', result.error);
        // Reset board on failure
        state.setTempBoardCoords(JSON.parse(JSON.stringify(boardCoords)));
        // Return tiles to rack
        const tilesOnBoard = selectedTiles.map(t => t.tile);
        const currentRack = state.localPlayerNumber === 1 ? state.player1Rack : state.player2Rack;
        const newRack = [...currentRack, ...tilesOnBoard];
        if (state.localPlayerNumber === 1) {
          state.setPlayer1Rack(newRack);
        } else {
          state.setPlayer2Rack(newRack);
        }
        state.setSelectedTiles([]);
      } else {
        console.log('✅ Move submission succeeded');
        // Play sound on success
        if (playerMoveSound && playerMoveSound.play) {
          playerMoveSound.play();
        }
      }
    };

    const handlePassMultiplayerFn = async () => {
          const state = useGameStore.getState();

          if (state.localPlayerNumber !== state.currentPlayer) {
            state.setSnackbarMessage("It's not your turn!");
            state.setSnackbarSeverity('error');
            state.setSnackbarOpen(true);
            return;
          }

      await passTurn();
    };

    const handleExchangeMultiplayerFn = async () => {
          const state = useGameStore.getState();

          if (state.localPlayerNumber !== state.currentPlayer) {
            state.setSnackbarMessage("It's not your turn!");
            state.setSnackbarSeverity('error');
            state.setSnackbarOpen(true);
            return;
          }

          const { tilesToExchange, poolCount } = state;

          if (tilesToExchange.length === 0) {
            state.setSnackbarMessage('Select tiles to exchange');
            state.setSnackbarSeverity('error');
            state.setSnackbarOpen(true);
            return;
          }

          if (poolCount < 7) {
            state.setSnackbarMessage('Not enough tiles in pool to exchange');
            state.setSnackbarSeverity('error');
            state.setSnackbarOpen(true);
            return;
          }

      await exchangeTiles(tilesToExchange);
      state.setTilesToExchange([]);
    };

    // Set all handlers in the store
    useGameStore.setState({
      handleWordSubmitMultiplayer: handleWordSubmitMultiplayerFn,
      handlePassMultiplayer: handlePassMultiplayerFn,
      handleExchangeMultiplayer: handleExchangeMultiplayerFn
    });

    // Verify handlers were set
    const verifyState = useGameStore.getState();
    console.log('✅ Multiplayer handlers set in store:', {
      hasWordSubmitHandler: !!verifyState.handleWordSubmitMultiplayer,
      hasPassHandler: !!verifyState.handlePassMultiplayer,
      hasExchangeHandler: !!verifyState.handleExchangeMultiplayer,
      isMultiplayerMode: verifyState.isMultiplayerMode
    });

  }, [isMultiplayerMode, submitMove, passTurn, exchangeTiles]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ ...styles.overlay, backgroundColor: colors.bg }}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{
          ...styles.loadingSpinner,
          borderTopColor: isDark ? '#6366f1' : '#6366f1',
          borderRightColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.3)',
          borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.3)',
          borderLeftColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.3)'
        }}></div>
        <p style={{ color: colors.text, fontSize: '16px' }}>Loading game...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ ...styles.overlay, backgroundColor: colors.bg }}>
        <div style={{ ...styles.card, backgroundColor: colors.cardBg }}>
          <p style={styles.errorText}>{error}</p>
          <button
            onClick={() => navigate('/multiplayer')}
            style={{
              ...styles.copyButton,
              background: colors.primaryButton,
              color: '#fff'
            }}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Waiting for opponent overlay
  if (isWaitingForOpponent) {
    return (
      <>
        <Sidenav />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 150px)',
            padding: { xs: '20px', sm: '40px 20px' },
            gap: '24px'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: '8px', sm: '10px' },
              padding: { xs: '16px 14px', sm: '20px 18px' },
              maxWidth: '650px',
              width: '100%',
              backgroundColor: isDark ? '#2A3A4A' : '#FDF9F3',
              backgroundImage: isDark
                ? `repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(120, 120, 120, 0.15) 22px, rgba(120, 120, 120, 0.15) 23px),
                   repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(80, 80, 80, 0.08) 1px, rgba(80, 80, 80, 0.08) 2px)`
                : `repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(220, 210, 195, 0.4) 22px, rgba(220, 210, 195, 0.4) 23px),
                   repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(200, 190, 175, 0.15) 1px, rgba(200, 190, 175, 0.15) 2px)`,
              backgroundSize: '100% 23px, 2px 100%',
              border: isDark 
                ? '1px solid rgba(139, 115, 85, 0.2)' 
                : '1px solid rgba(200, 185, 165, 0.4)',
              borderRadius: '2px',
              boxShadow: isDark
                ? `0 2px 4px rgba(0, 0, 0, 0.3),
                   0 8px 16px rgba(0, 0, 0, 0.4),
                   inset 0 0 200px rgba(0, 0, 0, 0.2)`
                : `0 1px 3px rgba(0, 0, 0, 0.12),
                   0 4px 8px rgba(0, 0, 0, 0.15),
                   inset 0 0 200px rgba(250, 245, 235, 0.4)`,
              transition: 'box-shadow 0.3s ease'
            }}
          >
            <Box
              sx={{
                fontSize: { xs: '16px', sm: '18px' },
                fontWeight: 600,
                color: isDark ? 'rgba(217, 119, 6, 0.9)' : '#8B7355',
                letterSpacing: '0.02em',
                marginBottom: '2px',
                fontFamily: 'serif',
                textAlign: 'center',
                borderBottom: isDark
                  ? '2px solid rgba(217, 119, 6, 0.3)'
                  : '2px solid rgba(139, 115, 85, 0.3)',
                paddingBottom: { xs: '4px', sm: '6px' },
                width: '100%'
              }}
            >
              Waiting for Opponent
            </Box>
            <Box
              sx={{
                fontSize: { xs: '11px', sm: '12px' },
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                marginBottom: '8px',
                textAlign: 'center'
              }}
            >
              Share this code with a friend to start playing
            </Box>

            <Box
              sx={{
                fontSize: { xs: '24px', sm: '28px' },
                fontWeight: '700',
                letterSpacing: '4px',
                padding: { xs: '10px 16px', sm: '12px 20px' },
                borderRadius: '4px',
                fontFamily: 'monospace',
                marginBottom: '8px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                color: isDark ? '#fff' : '#1f2937',
                border: isDark 
                  ? '1px solid rgba(139, 115, 85, 0.2)' 
                  : '1px solid rgba(200, 185, 165, 0.4)',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {gameCode}
            </Box>

            <button
              onClick={copyGameCode}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: copied ? colors.myTurn : colors.primaryButton,
                color: '#fff'
              }}
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>

            <button
              onClick={() => navigate('/multiplayer')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: `1px solid ${colors.border}`,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '6px',
                background: 'transparent',
                color: colors.textSecondary
              }}
            >
              Cancel Game
            </button>
          </Box>
        </Box>
      </>
    );
  }

  // Determine whose turn it is
  const isMyTurnNow = localPlayerNumber === currentPlayer;
  const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;

  return (
    <>
      <Sidenav />
      <div style={styles.container}>
        {/* Main game - Play component */}
        <Play isMultiplayer={true} />
      </div>
    </>
  );
};

export default MultiplayerGame;
