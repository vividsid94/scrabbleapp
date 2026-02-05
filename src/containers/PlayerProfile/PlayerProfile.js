import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import styles from './PlayerProfile.module.css';
import { getPlayer, getResults, getPlayers, getAnnotatedGames } from '../../axios/crossTablesApi';
import { getThemeColors } from '../../utils/themeColors';
import { Trophy, GameController, UsersFour, Calendar } from '@phosphor-icons/react';
import ProfileHeader from './ProfileHeader';
import StatsPanel from './StatsPanel';
import RatingChart from './RatingChart';
import TournamentHistory from './TournamentHistory';
import AnnotatedGamesPanel from './AnnotatedGamesPanel';
import HeadToHeadPanel from './HeadToHeadPanel';
import UpcomingTournaments from './UpcomingTournaments';

/**
 * Normalize the chaotic field names from the Cross-Tables API.
 */
function normalizePlayerData(playerData, listPlayer) {
  const p = playerData || {};
  const l = listPlayer || {};

  return {
    name: l.name || p.name || p.playername || '',
    location: p.location || l.location || '',
    photourl: l.photourl || p.photourl || l.photo || p.photo || null,
    twlrating: l.twlrating || p.twlrating || p.rating || p.rating_nwl || null,
    cswrating: l.cswrating || p.cswrating || p.csw_rating || null,
    twlrank: l.twlrank || p.twlrank || p.rank || null,
    cswrank: l.cswrank || p.cswrank || null,
    wins: Number(l.w || p.w || l.wins || p.wins || 0),
    losses: Number(l.l || p.l || l.losses || p.losses || 0),
    ties: Number(l.t || p.t || l.ties || p.ties || 0),
    results: p.results || [],
    upcoming: p.upcoming || [],
  };
}

export default function PlayerProfile() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { lightMode } = useContext(ThemeContext);
  const colors = getThemeColors(lightMode);

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [annotatedGames, setAnnotatedGames] = useState([]);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [playerData, listData, resultsData, gamesData] = await Promise.all([
        getPlayer({
          player: parseInt(playerId),
          results: true,
          upcoming: true,
          allowwgpo: true,
        }),
        getPlayers({ playerlist: playerId.toString() }).catch(() => []),
        getResults({ player: parseInt(playerId) }).catch(() => []),
        getAnnotatedGames(parseInt(playerId)).catch(() => []),
      ]);

      const listPlayer = listData && listData.length > 0 ? listData[0] : null;
      const normalized = normalizePlayerData(playerData, listPlayer);

      setPlayer(normalized);
      setResults(resultsData);
      setAnnotatedGames(gamesData);
    } catch (err) {
      setError('Failed to load player data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box className={styles.page} style={{
          backgroundColor: colors.pageBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !player) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box className={styles.page} style={{ backgroundColor: colors.pageBg, padding: 24 }}>
          <div style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: colors.errorBg,
            color: colors.errorText,
            marginBottom: 16,
          }}>
            {error || 'Player not found'}
          </div>
          <button
            onClick={() => navigate('/tournaments')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: colors.cardBg,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              fontFamily: 'inherit',
            }}
          >
            Back to Tournaments
          </button>
        </Box>
      </Box>
    );
  }

  const totalEvents = results.length || (player.results ? player.results.length : 0);

  const tabs = [
    { key: 'results', label: 'Results', icon: Trophy },
    { key: 'games', label: 'Annotated Games', icon: GameController },
    { key: 'h2h', label: 'Head-to-Head', icon: UsersFour },
    { key: 'upcoming', label: 'Upcoming', icon: Calendar },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Box className={styles.page} style={{ backgroundColor: colors.pageBg }}>
          {/* Header */}
          <div className={styles.header} style={{ borderBottom: `1px solid ${colors.border}` }}>
            <ProfileHeader
              player={player}
              playerName={player.name}
              playerPhoto={player.photourl}
              onBack={() => navigate(-1)}
              colors={colors}
            />
          </div>

          {/* Content */}
          <div className={styles.content}>
            {/* Stats */}
            <StatsPanel
              twlRating={player.twlrating}
              twlRank={player.twlrank}
              cswRating={player.cswrating}
              cswRank={player.cswrank}
              wins={player.wins}
              losses={player.losses}
              ties={player.ties}
              totalEvents={totalEvents}
              colors={colors}
            />

            {/* Rating Chart */}
            <div style={{ marginBottom: 16 }}>
              <RatingChart results={results} colors={colors} />
            </div>

            {/* Tab navigation */}
            <div className={styles.tabBar}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                  style={{
                    backgroundColor: activeTab === t.key ? colors.tabActive : 'transparent',
                    color: activeTab === t.key ? colors.tabActiveText : colors.tabText,
                    borderColor: activeTab === t.key ? 'transparent' : colors.border,
                  }}
                >
                  <t.icon size={15} style={{ marginRight: 5 }} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className={styles.tabContent}>
              {activeTab === 'results' && (
                <TournamentHistory results={results} colors={colors} pageSize={15} />
              )}
              {activeTab === 'games' && (
                <AnnotatedGamesPanel games={annotatedGames} colors={colors} />
              )}
              {activeTab === 'h2h' && (
                <HeadToHeadPanel playerId={playerId} colors={colors} />
              )}
              {activeTab === 'upcoming' && (
                <UpcomingTournaments tournaments={player.upcoming || []} colors={colors} />
              )}
            </div>
          </div>
        </Box>
      </Box>
    </Box>
  );
}
