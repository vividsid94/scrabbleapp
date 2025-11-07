import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import styles from './PlayerProfile.module.css';
import { getPlayer, getResults, searchTournaments } from '../../axios/crossTablesApi';
import { Trophy, Calendar, ChartLineUp, GameController, Users } from '@phosphor-icons/react';

export default function PlayerProfile() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { lightMode } = useContext(ThemeContext);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const playerData = await getPlayer({
        player: parseInt(playerId),
        partialresults: true,
        upcoming: true,
        allowwgpo: true
      });
      
      setPlayer(playerData);
      
      // Load tournament results
      try {
        setLoadingResults(true);
        const resultsData = await getResults({ player: parseInt(playerId) });
        setResults(resultsData);
      } catch (err) {
        console.error('Error loading results:', err);
      } finally {
        setLoadingResults(false);
      }
    } catch (err) {
      console.error('Error loading player:', err);
      setError('Failed to load player data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatRating = (rating) => {
    return rating ? Math.round(rating) : 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box className={styles.page} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !player) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box className={styles.page} sx={{ p: 3 }}>
          <Alert severity="error">{error || 'Player not found'}</Alert>
          <button 
            onClick={() => navigate('/')} 
            style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}
          >
            Back to Home
          </button>
        </Box>
      </Box>
    );
  }

  const playerResults = showFullResults ? results : results.slice(0, 10);
  const playerPhoto = player.photourl || player.photo;

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page}>
        {/* Header */}
        <Box className={styles.header} style={{
          backgroundColor: lightMode === 'dark' ? '#1F2937' : '#f9fafb',
          borderBottom: `1px solid ${lightMode === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <Box className={styles.profileHeader}>
            {playerPhoto && (
              <img 
                src={playerPhoto} 
                alt={player.name}
                className={styles.profilePhoto}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <Box className={styles.profileInfo}>
              <h1 className={styles.playerName} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {player.name}
              </h1>
              {player.location && (
                <p className={styles.location} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {player.location}
                </p>
              )}
            </Box>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Box className={styles.statsGrid}>
          <Box className={styles.statCard} style={{
            backgroundColor: lightMode === 'dark' ? '#374151' : '#fff',
            borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
          }}>
            <Trophy size={24} weight="fill" style={{ color: '#f59e0b' }} />
            <Box className={styles.statContent}>
              <div className={styles.statLabel}>TWL Rating</div>
              <div className={styles.statValue} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {formatRating(player.twlrating)}
              </div>
              {player.twlrank && (
                <div className={styles.statRank} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  #{player.twlrank} rank
                </div>
              )}
            </Box>
          </Box>

          <Box className={styles.statCard} style={{
            backgroundColor: lightMode === 'dark' ? '#374151' : '#fff',
            borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
          }}>
            <Trophy size={24} weight="fill" style={{ color: '#10b981' }} />
            <Box className={styles.statContent}>
              <div className={styles.statLabel}>CSW Rating</div>
              <div className={styles.statValue} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {formatRating(player.cswrating)}
              </div>
              {player.cswrank && (
                <div className={styles.statRank} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  #{player.cswrank} rank
                </div>
              )}
            </Box>
          </Box>

          <Box className={styles.statCard} style={{
            backgroundColor: lightMode === 'dark' ? '#374151' : '#fff',
            borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
          }}>
            <GameController size={24} weight="fill" style={{ color: '#3b82f6' }} />
            <Box className={styles.statContent}>
              <div className={styles.statLabel}>Record</div>
              <div className={styles.statValue} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {player.w || 0}W - {player.l || 0}L
              </div>
              {player.t && player.t > 0 && (
                <div className={styles.statRank} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {player.t} ties
                </div>
              )}
            </Box>
          </Box>
        </Box>

        {/* Tournament Results */}
        {player.results && player.results.length > 0 && (
          <Box className={styles.section} style={{
            backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
            borderColor: lightMode === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className={styles.sectionTitle} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
              <Calendar size={20} weight="fill" style={{ marginRight: 8 }} />
              Recent Tournaments
            </h2>
            <Box className={styles.resultsList}>
              {player.results.slice(0, showFullResults ? player.results.length : 5).map((result, index) => (
                <Box 
                  key={index} 
                  className={styles.resultItem}
                  style={{
                    backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                    borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
                  }}
                >
                  <Box className={styles.resultInfo}>
                    <div className={styles.resultTournament} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                      {result.tourneyname || result.name}
                    </div>
                    <div className={styles.resultMeta} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                      {result.date && formatDate(result.date)}
                    </div>
                  </Box>
                  <Box className={styles.resultStats}>
                    {result.rank && (
                      <span className={styles.resultRank} style={{ color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6' }}>
                        #{result.rank}
                      </span>
                    )}
                    {result.wins !== undefined && result.losses !== undefined && (
                      <span style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280', marginLeft: 12 }}>
                        {result.wins}W - {result.losses}L
                      </span>
                    )}
                    {result.tourneyid && (
                      <Link 
                        to={`/tournament/${result.tourneyid}`}
                        style={{ marginLeft: 12, color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6', textDecoration: 'none' }}
                      >
                        View →
                      </Link>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
            {player.results.length > 5 && !showFullResults && (
              <button
                onClick={() => setShowFullResults(true)}
                className={styles.showMoreButton}
                style={{
                  color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  marginTop: 16
                }}
              >
                Show all {player.results.length} tournaments
              </button>
            )}
          </Box>
        )}

        {/* Upcoming Tournaments */}
        {player.upcoming && player.upcoming.length > 0 && (
          <Box className={styles.section} style={{
            backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
            borderColor: lightMode === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className={styles.sectionTitle} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
              <Calendar size={20} weight="fill" style={{ marginRight: 8 }} />
              Upcoming Tournaments
            </h2>
            <Box className={styles.resultsList}>
              {player.upcoming.map((tourney, index) => (
                <Box 
                  key={index} 
                  className={styles.resultItem}
                  style={{
                    backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                    borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
                  }}
                >
                  <Box className={styles.resultInfo}>
                    <div className={styles.resultTournament} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                      {tourney.name || tourney.tourneyname}
                    </div>
                    <div className={styles.resultMeta} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                      {tourney.date && formatDate(tourney.date)}
                    </div>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Full Results List */}
        {results.length > 0 && (
          <Box className={styles.section} style={{
            backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
            borderColor: lightMode === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className={styles.sectionTitle} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
              <ChartLineUp size={20} weight="fill" style={{ marginRight: 8 }} />
              All Tournament Results
            </h2>
            {loadingResults ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box className={styles.resultsList}>
                {playerResults.map((result, index) => (
                  <Box 
                    key={index} 
                    className={styles.resultItem}
                    style={{
                      backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                      borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
                    }}
                  >
                    <Box className={styles.resultInfo}>
                      <div className={styles.resultTournament} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                        {result.tourneyname || result.name}
                      </div>
                      <div className={styles.resultMeta} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        {result.date && formatDate(result.date)}
                      </div>
                    </Box>
                    <Box className={styles.resultStats}>
                      {result.rank && (
                        <span className={styles.resultRank} style={{ color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6' }}>
                          #{result.rank}
                        </span>
                      )}
                      {result.tourneyid && (
                        <Link 
                          to={`/tournament/${result.tourneyid}`}
                          style={{ marginLeft: 12, color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6', textDecoration: 'none' }}
                        >
                          View →
                        </Link>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            {results.length > 10 && !showFullResults && (
              <button
                onClick={() => setShowFullResults(true)}
                className={styles.showMoreButton}
                style={{
                  color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  marginTop: 16
                }}
              >
                Show all {results.length} results
              </button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

