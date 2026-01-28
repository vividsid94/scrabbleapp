/**
 * MultiplayerLobby Component
 * UI for creating a new game or joining an existing game by code
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeContext } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import {
  createGame,
  joinGame,
  getPlayerId,
  setGuestName
} from '../../utils/multiplayerApi';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 150px)',
    padding: { xs: '20px', sm: '40px 20px' },
    gap: '24px'
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: { xs: '12px', sm: '16px' },
    padding: { xs: '20px 16px', sm: '28px 24px' },
    maxWidth: '650px',
    width: '100%'
  },
  title: {
    fontSize: { xs: '18px', sm: '20px' },
    fontWeight: 600,
    marginBottom: '4px',
    textAlign: 'center',
    fontFamily: 'serif',
    letterSpacing: '0.02em'
  },
  subtitle: {
    fontSize: { xs: '12px', sm: '13px' },
    opacity: 0.7,
    marginBottom: '16px',
    textAlign: 'center'
  },
  section: {
    marginBottom: '16px',
    width: '100%'
  },
  sectionTitle: {
    fontSize: { xs: '13px', sm: '14px' },
    fontWeight: '600',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: { xs: '10px 12px', sm: '12px 14px' },
    borderRadius: '4px',
    border: '1px solid',
    fontSize: { xs: '14px', sm: '15px' },
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  gameCodeInput: {
    width: '100%',
    padding: { xs: '12px', sm: '14px' },
    borderRadius: '4px',
    border: '1px solid',
    fontSize: { xs: '20px', sm: '22px' },
    fontWeight: '700',
    letterSpacing: '4px',
    textAlign: 'center',
    textTransform: 'uppercase',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: { xs: '12px', sm: '14px' },
    borderRadius: '4px',
    border: 'none',
    fontSize: { xs: '14px', sm: '15px' },
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff'
  },
  secondaryButton: {
    background: 'transparent',
    border: '1px solid'
  },
  error: {
    color: '#ef4444',
    fontSize: { xs: '12px', sm: '13px' },
    marginTop: '8px',
    textAlign: 'center'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '16px 0',
    width: '100%'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    opacity: 0.2
  },
  dividerText: {
    fontSize: { xs: '11px', sm: '12px' },
    opacity: 0.5,
    textTransform: 'uppercase',
    fontWeight: '500'
  },
  loadingSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
    marginRight: '8px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: { xs: '10px 12px', sm: '12px 14px' },
    borderRadius: '4px',
    marginBottom: '12px',
    width: '100%'
  },
  avatar: {
    width: { xs: '32px', sm: '36px' },
    height: { xs: '32px', sm: '36px' },
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: { xs: '14px', sm: '16px' },
    flexShrink: 0
  }
};

const MultiplayerLobby = () => {
  const navigate = useNavigate();
  const { lightMode } = useContext(ThemeContext);
  const { user } = useAuth();

  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  const isDark = lightMode === 'dark';

  // Theme colors
  const colors = {
    bg: isDark ? '#1f2937' : '#ffffff',
    cardBg: isDark ? '#374151' : '#f9fafb',
    text: isDark ? '#ffffff' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#4b5563' : '#e5e7eb',
    borderFocus: isDark ? '#6366f1' : '#6366f1',
    inputBg: isDark ? '#1f2937' : '#ffffff',
    dividerLine: isDark ? '#ffffff' : '#000000',
    avatarBg: isDark ? '#6366f1' : '#6366f1'
  };

  // Load player name on mount
  useEffect(() => {
    const loadPlayerInfo = async () => {
      try {
        const player = await getPlayerId();
        setPlayerName(player.name);
      } catch (err) {
        console.error('Error loading player info:', err);
      }
    };
    loadPlayerInfo();
  }, []);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setPlayerName(name);
    // Save guest name if not logged in
    if (!user) {
      setGuestName(name);
    }
  };

  const handleGameCodeChange = (e) => {
    const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setGameCode(code);
    setError(null);
  };

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createGame(playerName.trim());

      if (!result.success) {
        setError(result.error);
        setIsCreating(false);
        return;
      }

      // Navigate to game
      navigate(`/multiplayer/${result.gameCode}`);
    } catch (err) {
      setError(err.message);
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (gameCode.length !== 6) {
      setError('Please enter a valid 6-character game code');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const result = await joinGame(gameCode, playerName.trim());

      if (!result.success) {
        setError(result.error);
        setIsJoining(false);
        return;
      }

      // Navigate to game
      navigate(`/multiplayer/${gameCode}`);
    } catch (err) {
      setError(err.message);
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && gameCode.length === 6) {
      handleJoinGame();
    }
  };

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
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .multiplayer-input:focus {
            border-color: ${colors.borderFocus} !important;
          }
          .multiplayer-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
          .multiplayer-button:active {
            transform: translateY(0);
          }
          .multiplayer-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
          }
        `}
      </style>

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: '12px', sm: '16px' },
          padding: { xs: '20px 16px', sm: '28px 24px' },
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
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: isDark
              ? `0 2px 4px rgba(0, 0, 0, 0.3),
                 0 8px 16px rgba(0, 0, 0, 0.4),
                 0 20px 40px rgba(0, 0, 0, 0.6)`
              : `0 1px 3px rgba(0, 0, 0, 0.12),
                 0 4px 8px rgba(0, 0, 0, 0.15),
                 0 16px 32px rgba(0, 0, 0, 0.25)`
          }
        }}
      >
        <Box
          sx={{
            fontSize: { xs: '18px', sm: '20px' },
            fontWeight: 600,
            color: isDark ? 'rgba(217, 119, 6, 0.9)' : '#8B7355',
            letterSpacing: '0.02em',
            marginBottom: '4px',
            fontFamily: 'serif',
            textAlign: 'center',
            borderBottom: isDark
              ? '2px solid rgba(217, 119, 6, 0.3)'
              : '2px solid rgba(139, 115, 85, 0.3)',
            paddingBottom: { xs: '6px', sm: '8px' },
            width: '100%'
          }}
        >
          Multiplayer
        </Box>
        <Box
          sx={{
            fontSize: { xs: '12px', sm: '13px' },
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
            marginBottom: '12px',
            textAlign: 'center'
          }}
        >
          Play Scrabble with friends in real-time
        </Box>

        {/* User Info */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: { xs: '10px 12px', sm: '12px 14px' },
            borderRadius: '4px',
            marginBottom: '12px',
            width: '100%',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
          }}
        >
          <Box
            sx={{
              width: { xs: '32px', sm: '36px' },
              height: { xs: '32px', sm: '36px' },
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: { xs: '14px', sm: '16px' },
              flexShrink: 0,
              backgroundColor: colors.avatarBg,
              color: '#fff'
            }}
          >
            {playerName ? playerName[0].toUpperCase() : '?'}
          </Box>
          <input
            type="text"
            value={playerName}
            onChange={handleNameChange}
            placeholder="Enter your name"
            className="multiplayer-input"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '4px',
              border: `1px solid ${colors.border}`,
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
              backgroundColor: colors.inputBg,
              color: colors.text,
              flex: 1
            }}
          />
        </Box>

        {/* Create Game Section */}
        <Box sx={{ marginBottom: '16px', width: '100%' }}>
          <Box
            sx={{
              fontSize: { xs: '13px', sm: '14px' },
              fontWeight: '600',
              marginBottom: '8px',
              color: colors.text
            }}
          >
            Create a New Game
          </Box>
          <button
            onClick={handleCreateGame}
            disabled={isCreating || isJoining}
            className="multiplayer-button"
            style={{
              width: '100%',
              padding: { xs: '12px', sm: '14px' },
              borderRadius: '4px',
              border: 'none',
              fontSize: { xs: '14px', sm: '15px' },
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginTop: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff'
            }}
          >
            {isCreating ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Creating Game...
              </>
            ) : (
              'Create Game'
            )}
          </button>
        </Box>

        {/* Divider */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '16px 0',
            width: '100%'
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: '1px',
              backgroundColor: colors.dividerLine,
              opacity: 0.2
            }}
          />
          <Box
            sx={{
              fontSize: { xs: '11px', sm: '12px' },
              opacity: 0.5,
              textTransform: 'uppercase',
              fontWeight: '500',
              color: colors.textSecondary
            }}
          >
            or
          </Box>
          <Box
            sx={{
              flex: 1,
              height: '1px',
              backgroundColor: colors.dividerLine,
              opacity: 0.2
            }}
          />
        </Box>

        {/* Join Game Section */}
        <Box sx={{ marginBottom: '16px', width: '100%' }}>
          <Box
            sx={{
              fontSize: { xs: '13px', sm: '14px' },
              fontWeight: '600',
              marginBottom: '8px',
              color: colors.text
            }}
          >
            Join Existing Game
          </Box>
          <input
            type="text"
            value={gameCode}
            onChange={handleGameCodeChange}
            onKeyPress={handleKeyPress}
            placeholder="ENTER CODE"
            className="multiplayer-input"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '4px',
              border: `1px solid ${colors.border}`,
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '4px',
              textAlign: 'center',
              textTransform: 'uppercase',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
              backgroundColor: colors.inputBg,
              color: colors.text
            }}
          />
          <button
            onClick={handleJoinGame}
            disabled={isJoining || isCreating || gameCode.length !== 6}
            className="multiplayer-button"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '4px',
              border: `1px solid ${colors.border}`,
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginTop: '8px',
              background: 'transparent',
              color: colors.text
            }}
          >
            {isJoining ? (
              <>
                <span style={{ ...styles.loadingSpinner, borderTopColor: colors.text }}></span>
                Joining...
              </>
            ) : (
              'Join Game'
            )}
          </button>
        </Box>

        {/* Error Message */}
        {error && (
          <Box
            sx={{
              color: '#ef4444',
              fontSize: { xs: '12px', sm: '13px' },
              marginTop: '8px',
              textAlign: 'center',
              width: '100%'
            }}
          >
            {error}
          </Box>
        )}
      </Box>
      </Box>
    </>
  );
};

export default MultiplayerLobby;
