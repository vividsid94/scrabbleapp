import React, { useEffect, useState, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserStats } from '../../utils/stats';
import { getUserGames } from '../../utils/games';
import { ThemeContext } from '../../App';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChartLineUp, Target, ArrowUp, CheckCircle, XCircle, User, Clock, CircleNotch } from '@phosphor-icons/react';
import Button from '@mui/material/Button';
import UsernameSetupModal from '../../components/Auth/UsernameSetupModal';
import styles from './Profile.module.css';

export default function Profile() {
  const { lightMode } = useContext(ThemeContext);
  const { user, profile, loading: authLoading, refreshProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [displayName, setDisplayName] = useState('Player');

  // Stabilize display name so it doesn't flicker back to a placeholder
  useEffect(() => {
    if (!user) {
      setDisplayName('Sign in to view your stats');
      return;
    }

    if (profile && (profile.display_name || profile.username)) {
      setDisplayName(profile.display_name || profile.username);
      return;
    }

    // Only set to Player if we don't already have a better name
    setDisplayName((current) => current && current !== 'Sign in to view your stats' ? current : 'Player');
  }, [user, profile]);

  useEffect(() => {
    console.log('Profile useEffect:', { authLoading, user: !!user, loading });

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // If we've already loaded once in this session, don't refetch on every auth change
    if (loadedOnce) {
      return;
    }

    // No user, stop loading and show sign-in-friendly stats
    if (!user) {
      console.log('No user, stopping loading');
      setLoading(false);
      setLoadingGames(false);
      setStats(null);
      setGames([]);
      setLoadedOnce(true);
      return;
    }
    
    // User exists, refresh profile and load stats and games
    console.log('User exists, refreshing profile and loading stats for:', user.id);
    if (refreshProfile) {
      refreshProfile();
    }

    const run = async () => {
      await Promise.all([loadStats(), loadGames()]);
      setLoadedOnce(true);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, loadedOnce]);

  const loadStats = async () => {
    console.log('loadStats called, user:', user?.id);
    if (!user) {
      console.log('loadStats: No user, stopping');
      setLoading(false);
      setStats(null);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching stats for user:', user.id);
      const { data, error } = await getUserStats(user.id);
      console.log('Stats response:', { data, error });
      
      if (error) {
        console.error('Error loading stats:', error);
        // If stats don't exist yet, that's okay - user just hasn't played any games
        // Return default stats instead of null
        const defaultStats = {
          user_id: user.id,
          games_played: 0,
          games_won: 0,
          games_lost: 0,
          total_points: 0,
          average_score: 0,
          best_score: 0,
        };
        console.log('Setting default stats:', defaultStats);
        setStats(defaultStats);
      } else {
        console.log('Setting stats:', data);
        setStats(data);
      }
    } catch (err) {
      console.error('Exception loading stats:', err);
      // Set default stats on error
      const defaultStats = {
        user_id: user.id,
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        total_points: 0,
        average_score: 0,
        best_score: 0,
      };
      setStats(defaultStats);
    } finally {
      console.log('loadStats finally - setting loading to false');
      setLoading(false);
    }
  };

  const loadGames = async () => {
    console.log('loadGames called, user:', user?.id);
    if (!user) {
      console.log('loadGames: No user, stopping');
      setLoadingGames(false);
      setGames([]);
      return;
    }
    
    setLoadingGames(true);
    try {
      console.log('Fetching games for user:', user.id);
      const { data, error } = await getUserGames(user.id, 20);
      console.log('Games response:', { data, error });
      
      if (error) {
        console.error('Error loading games:', error);
        setGames([]);
      } else {
        console.log('Setting games:', data);
        setGames(data || []);
      }
    } catch (err) {
      console.error('Exception loading games:', err);
      setGames([]);
    } finally {
      console.log('loadGames finally - setting loadingGames to false');
      setLoadingGames(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: '100vh' }}>
          <CircleNotch size={32} color={lightMode === 'dark' ? '#fff' : '#1F2937'} weight="bold" className="spin" />
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, minHeight: '100vh', gap: 2 }}>
          <CircleNotch size={24} color={lightMode === 'dark' ? '#fff' : '#1F2937'} weight="bold" className="spin" />
          <Typography sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
            Loading stats...
          </Typography>
        </Box>
      </Box>
    );
  }

  const winRate = stats?.games_played > 0 
    ? ((stats.games_won / stats.games_played) * 100).toFixed(1)
    : 0;

  const avatarOptions = [
    '/images/tessmascot2.png',
    '/images/tessmascot3.png',
    '/images/theomascot2.png',
    '/images/theomascot3.png',
    '/images/theomascot4.png',
    '/images/t2icon.png',
    '/images/t2icon2.png',
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.container}>
        {/* Header */}
        <Box
          className={styles.profileHeader}
          data-light-mode={lightMode}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              width: '100%',
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box className={styles.profileAvatar}>
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Player avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                  />
                ) : (
                  <User size={20} color={lightMode === 'dark' ? '#1F2937' : '#111827'} weight="fill" />
                )}
              </Box>
              <Typography 
                variant="h5" 
                className={styles.profileName}
                sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}
              >
            {displayName}
              </Typography>
            </Box>

            {user && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowUsernameModal(true)}
                sx={{
                  ml: { xs: 0, sm: 'auto' },
                  borderColor: '#D97706',
                  color: lightMode === 'dark' ? '#FBBF24' : '#92400E',
                  textTransform: 'none',
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  '&:hover': {
                    borderColor: '#B45309',
                    backgroundColor: lightMode === 'dark'
                      ? 'rgba(248, 250, 252, 0.04)'
                      : 'rgba(248, 250, 252, 0.9)',
                  },
                }}
              >
                Set username
              </Button>
            )}
          </Box>
        </Box>

        {/* Avatar selection */}
        {user && (
          <Box
            sx={{
              mt: 2,
              borderRadius: 2,
              paddingX: 2,
              paddingY: 1.5,
              backgroundColor: lightMode === 'dark' ? 'rgba(31,41,55,0.9)' : '#F9FAFB',
              border: lightMode === 'dark'
                ? '1px solid rgba(75,85,99,0.9)'
                : '1px solid rgba(209,213,219,0.9)',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                fontSize: 11,
                fontWeight: 600,
                color: lightMode === 'dark' ? 'rgba(249,250,251,0.8)' : '#6B7280',
                mb: 1,
                display: 'block',
              }}
            >
              Avatar
            </Typography>
            <Box className={styles.avatarGrid}>
              {avatarOptions.map((src) => {
                const selected = profile?.avatar_url === src;
                return (
                  <button
                    key={src}
                    type="button"
                    className={`${styles.avatarOption} ${selected ? styles.avatarOptionSelected : ''}`}
                    onClick={async () => {
                      if (avatarSaving || selected || !user) return;
                      setAvatarSaving(true);
                      const { error } = await updateProfile({ avatar_url: src });
                      if (!error && refreshProfile) {
                        await refreshProfile();
                      }
                      setAvatarSaving(false);
                    }}
                  >
                    <img src={src} alt="Avatar option" />
                  </button>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Stats overview card */}
        <Box
          sx={{
            mt: 2,
            borderRadius: 2,
            padding: 2,
            backgroundColor: lightMode === 'dark' ? 'rgba(15,23,42,0.9)' : '#F9FAFB',
            border: lightMode === 'dark'
              ? '1px solid rgba(148,163,184,0.35)'
              : '1px solid rgba(209,213,219,0.9)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: 1.4,
                fontSize: 11,
                fontWeight: 600,
                color: lightMode === 'dark' ? 'rgba(249,250,251,0.8)' : '#6B7280',
              }}
            >
              Game overview
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: 11,
                color: lightMode === 'dark' ? 'rgba(156,163,175,0.9)' : '#9CA3AF',
              }}
            >
              Bot games in Play mode only
            </Typography>
          </Box>

          <Box className={styles.statsGrid}>
            <Box 
              className={styles.statCard}
              sx={{
                backgroundColor: lightMode === 'dark' ? 'rgba(31,41,55,0.9)' : '#FFFFFF',
                border: lightMode === 'dark'
                  ? '1px solid rgba(55,65,81,0.9)'
                  : '1px solid rgba(209,213,219,0.9)',
              }}
            >
              <ChartLineUp size={20} color="#93C5FD" weight="fill" />
              <Typography 
                variant="h5" 
                sx={{ color: lightMode === 'dark' ? '#E5E7EB' : '#1F2937', fontWeight: 700, fontSize: '18px' }}
              >
                {user ? (stats?.games_played || 0) : '—'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ color: lightMode === 'dark' ? 'rgba(209,213,219,0.9)' : '#6B7280', fontSize: '11px' }}
              >
                Games Played
              </Typography>
            </Box>

            <Box 
              className={styles.statCard}
              sx={{
                backgroundColor: lightMode === 'dark' ? 'rgba(31,41,55,0.9)' : '#FFFFFF',
                border: lightMode === 'dark'
                  ? '1px solid rgba(55,65,81,0.9)'
                  : '1px solid rgba(209,213,219,0.9)',
              }}
            >
              <Target size={20} color="#6EE7B7" weight="fill" />
              <Typography 
                variant="h5" 
                sx={{ color: lightMode === 'dark' ? '#ECFEFF' : '#047857', fontWeight: 700, fontSize: '18px' }}
              >
                {user ? `${winRate}%` : '—'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ color: lightMode === 'dark' ? 'rgba(209,213,219,0.9)' : '#6B7280', fontSize: '11px' }}
              >
                Win Rate
              </Typography>
            </Box>

            <Box 
              className={styles.statCard}
              sx={{
                backgroundColor: lightMode === 'dark' ? 'rgba(31,41,55,0.9)' : '#FFFFFF',
                border: lightMode === 'dark'
                  ? '1px solid rgba(55,65,81,0.9)'
                  : '1px solid rgba(209,213,219,0.9)',
              }}
            >
              <ArrowUp size={20} color="#A855F7" weight="fill" />
              <Typography 
                variant="h5" 
                sx={{ color: lightMode === 'dark' ? '#EDE9FE' : '#6D28D9', fontWeight: 700, fontSize: '18px' }}
              >
                {user ? (stats?.best_score || 0) : '—'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ color: lightMode === 'dark' ? 'rgba(209,213,219,0.9)' : '#6B7280', fontSize: '11px' }}
              >
                Best Score
              </Typography>
            </Box>

            <Box 
              className={styles.statCard}
              sx={{
                backgroundColor: lightMode === 'dark' ? 'rgba(31,41,55,0.9)' : '#FFFFFF',
                border: lightMode === 'dark'
                  ? '1px solid rgba(55,65,81,0.9)'
                  : '1px solid rgba(209,213,219,0.9)',
              }}
            >
              <ChartLineUp size={20} color="#F59E0B" weight="fill" />
              <Typography 
                variant="h5" 
                sx={{ color: lightMode === 'dark' ? '#FED7AA' : '#92400E', fontWeight: 700, fontSize: '18px' }}
              >
                {user ? (stats?.average_score ? Math.round(stats.average_score) : 0) : '—'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ color: lightMode === 'dark' ? 'rgba(209,213,219,0.9)' : '#6B7280', fontSize: '11px' }}
              >
                Average Score
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Game History Table */}
        <Box sx={{ marginTop: '24px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: '12px' }}>
            <Clock size={18} color={lightMode === 'dark' ? '#fff' : '#1F2937'} weight="bold" />
            <Typography 
              variant="h6" 
              sx={{ 
                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                fontWeight: 600,
                fontSize: '16px'
              }}
            >
              Recent Games
            </Typography>
          </Box>
          
          {loadingGames ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: '16px', gap: 2 }}>
              <CircleNotch size={20} color={lightMode === 'dark' ? '#fff' : '#1F2937'} weight="bold" className="spin" />
              <Typography variant="body2" sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280' }}>
                Loading games...
              </Typography>
            </Box>
          ) : games.length === 0 ? (
            <Box 
              sx={{ 
                padding: '24px',
                textAlign: 'center',
                color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#6B7280'
              }}
            >
              <Typography variant="body2">No games played yet. Start playing to see your game history!</Typography>
            </Box>
          ) : (
            <TableContainer 
              component={Paper}
              sx={{
                bgcolor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <Table sx={{ minWidth: 600 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', fontWeight: 600 }}>Opponent</TableCell>
                    <TableCell align="right" sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', fontWeight: 600 }}>Your Score</TableCell>
                    <TableCell align="right" sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', fontWeight: 600 }}>Opponent Score</TableCell>
                    <TableCell align="center" sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', fontWeight: 600 }}>Result</TableCell>
                    <TableCell align="right" sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', fontWeight: 600 }}>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {games.map((game) => {
                    const date = new Date(game.completed_at);
                    const formattedDate = date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    });
                    const formattedTime = date.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    });
                    
                    const durationMinutes = game.game_duration_seconds 
                      ? Math.floor(game.game_duration_seconds / 60) 
                      : null;
                    const durationSeconds = game.game_duration_seconds 
                      ? game.game_duration_seconds % 60 
                      : null;
                    const durationText = durationMinutes !== null 
                      ? `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`
                      : '—';

                    return (
                      <TableRow
                        key={game.id}
                        onClick={() => navigate(`/viewer?saved=${game.id}`)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                          }
                        }}
                      >
                        <TableCell sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937' }}>
                          <Box>
                            <Typography variant="body2">{formattedDate}</Typography>
                            <Typography variant="caption" sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#6B7280' }}>
                              {formattedTime}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937' }}>
                          {game.opponent_name || 'Unknown'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#D97706', fontWeight: 600 }}>
                          {game.player_score}
                        </TableCell>
                        <TableCell align="right" sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280' }}>
                          {game.opponent_score}
                        </TableCell>
                        <TableCell align="center">
                          {game.won ? (
                            <CheckCircle size={20} color="#10B981" weight="fill" />
                          ) : (
                            <XCircle size={20} color="#EF4444" weight="fill" />
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Clock size={14} color={lightMode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#9CA3AF'} />
                            {durationText}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
      <UsernameSetupModal
        open={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
      />
    </Box>
  );
}

