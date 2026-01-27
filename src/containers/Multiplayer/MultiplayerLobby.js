/**
 * MultiplayerLobby Component
 * UI for creating a new game or joining an existing game by code
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
    padding: '20px',
    gap: '30px'
  },
  card: {
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.7,
    marginBottom: '24px',
    textAlign: 'center'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '2px solid',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  gameCodeInput: {
    width: '100%',
    padding: '16px',
    borderRadius: '10px',
    border: '2px solid',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '6px',
    textAlign: 'center',
    textTransform: 'uppercase',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '16px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '12px'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff'
  },
  secondaryButton: {
    background: 'transparent',
    border: '2px solid'
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '8px',
    textAlign: 'center'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '24px 0'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    opacity: 0.2
  },
  dividerText: {
    fontSize: '14px',
    opacity: 0.5,
    textTransform: 'uppercase',
    fontWeight: '500'
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
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
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px'
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
      <div style={styles.container}>
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

      <div style={{ ...styles.card, backgroundColor: colors.cardBg }}>
        <h1 style={{ ...styles.title, color: colors.text }}>Multiplayer</h1>
        <p style={{ ...styles.subtitle, color: colors.textSecondary }}>
          Play Scrabble with friends in real-time
        </p>

        {/* User Info */}
        <div style={{ ...styles.userInfo, backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }}>
          <div style={{ ...styles.avatar, backgroundColor: colors.avatarBg, color: '#fff' }}>
            {playerName ? playerName[0].toUpperCase() : '?'}
          </div>
          <input
            type="text"
            value={playerName}
            onChange={handleNameChange}
            placeholder="Enter your name"
            className="multiplayer-input"
            style={{
              ...styles.input,
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderColor: colors.border,
              flex: 1
            }}
          />
        </div>

        {/* Create Game Section */}
        <div style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, color: colors.text }}>Create a New Game</h3>
          <button
            onClick={handleCreateGame}
            disabled={isCreating || isJoining}
            className="multiplayer-button"
            style={{
              ...styles.button,
              ...styles.primaryButton
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
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={{ ...styles.dividerLine, backgroundColor: colors.dividerLine }}></div>
          <span style={{ ...styles.dividerText, color: colors.textSecondary }}>or</span>
          <div style={{ ...styles.dividerLine, backgroundColor: colors.dividerLine }}></div>
        </div>

        {/* Join Game Section */}
        <div style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, color: colors.text }}>Join Existing Game</h3>
          <input
            type="text"
            value={gameCode}
            onChange={handleGameCodeChange}
            onKeyPress={handleKeyPress}
            placeholder="ENTER CODE"
            className="multiplayer-input"
            style={{
              ...styles.gameCodeInput,
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderColor: colors.border
            }}
          />
          <button
            onClick={handleJoinGame}
            disabled={isJoining || isCreating || gameCode.length !== 6}
            className="multiplayer-button"
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              borderColor: colors.border,
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
        </div>

        {/* Error Message */}
        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* Back Link */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: colors.textSecondary,
          fontSize: '14px',
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        Back to Home
      </button>
    </div>
    </>
  );
};

export default MultiplayerLobby;
