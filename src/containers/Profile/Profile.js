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
import styles from './Profile.module.css';

export default function Profile() {
  const { lightMode } = useContext(ThemeContext);
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    console.log('Profile useEffect:', { authLoading, user: !!user, loading });

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // No user, stop loading and show sign-in message
    if (!user) {
      console.log('No user, stopping loading');
      setLoading(false);
      return;
    }
    
    // User exists, refresh profile and load stats and games
    console.log('User exists, refreshing profile and loading stats for:', user.id);
    if (refreshProfile) {
      refreshProfile();
    }
    loadStats();
    loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

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

  if (!user) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        color: lightMode === 'dark' ? '#fff' : '#1F2937'
      }}>
        <Typography variant="h5">Please sign in to view your profile</Typography>
      </Box>
    );
  }

  const winRate = stats?.games_played > 0 
    ? ((stats.games_won / stats.games_played) * 100).toFixed(1)
    : 0;

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.container}>
        <Box className={styles.profileHeader}>
          <Box className={styles.profileAvatar}>
            <User size={20} color={lightMode === 'dark' ? '#fff' : '#1F2937'} weight="fill" />
          </Box>
          <Typography 
            variant="h5" 
            className={styles.profileName}
            sx={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}
          >
            {profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'Player'}
          </Typography>
          <Typography 
            variant="body2" 
            className={styles.profileUsername}
            sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280' }}
          >
            @{profile?.username || user?.email?.split('@')[0] || 'user'}
          </Typography>
        </Box>

      <Box className={styles.statsGrid}>
        <Box 
          className={styles.statCard}
          sx={{
            bgcolor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Trophy size={20} color="#D97706" weight="fill" />
          <Typography 
            variant="h5" 
            sx={{ color: '#D97706', fontWeight: 700, fontSize: '18px' }}
          >
            {stats?.games_won || 0}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280', fontSize: '11px' }}
          >
            Games Won
          </Typography>
        </Box>

        <Box 
          className={styles.statCard}
          sx={{
            bgcolor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <ChartLineUp size={20} color="#3B82F6" weight="fill" />
          <Typography 
            variant="h5" 
            sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '18px' }}
          >
            {stats?.games_played || 0}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280', fontSize: '11px' }}
          >
            Games Played
          </Typography>
        </Box>

        <Box 
          className={styles.statCard}
          sx={{
            bgcolor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Target size={20} color="#10B981" weight="fill" />
          <Typography 
            variant="h5" 
            sx={{ color: '#10B981', fontWeight: 700, fontSize: '18px' }}
          >
            {winRate}%
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280', fontSize: '11px' }}
          >
            Win Rate
          </Typography>
        </Box>

        <Box 
          className={styles.statCard}
          sx={{
            bgcolor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <ArrowUp size={20} color="#8B5CF6" weight="fill" />
          <Typography 
            variant="h5" 
            sx={{ color: '#8B5CF6', fontWeight: 700, fontSize: '18px' }}
          >
            {stats?.best_score || 0}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280', fontSize: '11px' }}
          >
            Best Score
          </Typography>
        </Box>

        <Box 
          className={styles.statCard}
          sx={{
            bgcolor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <ChartLineUp size={20} color="#F59E0B" weight="fill" />
          <Typography 
            variant="h5" 
            sx={{ color: '#F59E0B', fontWeight: 700, fontSize: '18px' }}
          >
            {stats?.average_score ? Math.round(stats.average_score) : 0}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280', fontSize: '11px' }}
          >
            Average Score
          </Typography>
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
    </Box>
  );
}

