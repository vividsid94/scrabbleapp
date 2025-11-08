import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import styles from './PlayerProfile.module.css';
import { getPlayer, getResults, searchTournaments, getPlayers } from '../../axios/crossTablesApi';
import { Trophy, Calendar, ChartLineUp, GameController, Users, User, ArrowLeft } from '@phosphor-icons/react';

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
      
      // Fetch both detailed player data and list data (for consistent field names)
      const [playerData, listData] = await Promise.all([
        getPlayer({
          player: parseInt(playerId),
          partialresults: true,
          upcoming: true,
          allowwgpo: true
        }),
        getPlayers({ playerlist: playerId.toString() })
      ]);
      
      // Merge list data (which has the same structure as panel) with detailed data
      const listPlayer = listData && listData.length > 0 ? listData[0] : null;
      const mergedPlayer = {
        ...playerData,
        // Override with list data fields if they exist (for consistent field names)
        ...(listPlayer && {
          twlrating: listPlayer.twlrating || playerData.twlrating,
          cswrating: listPlayer.cswrating || playerData.cswrating,
          twlrank: listPlayer.twlrank || playerData.twlrank,
          cswrank: listPlayer.cswrank || playerData.cswrank,
          w: listPlayer.w || playerData.w,
          l: listPlayer.l || playerData.l,
          t: listPlayer.t || playerData.t,
          wins: listPlayer.wins || playerData.wins,
          losses: listPlayer.losses || playerData.losses,
          ties: listPlayer.ties || playerData.ties,
          rating: listPlayer.rating || playerData.rating,
          rank: listPlayer.rank || playerData.rank
        })
      };
      
      setPlayer(mergedPlayer);
      
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
    if (rating === undefined || rating === null || rating === '') return 'N/A';
    return Math.round(rating);
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
  
  // Handle different possible field names from API
  const twlRating = player.twlrating || player.rating || player.rating_nwl || player.twl_rating;
  const cswRating = player.cswrating || player.csw_rating;
  const twlRank = player.twlrank || player.rank || player.twl_rank;
  const cswRank = player.cswrank || player.csw_rank;
  const wins = player.w || player.wins || 0;
  const losses = player.l || player.losses || 0;
  const ties = player.t || player.ties || 0;

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page}>
        {/* Header */}
        <Box className={styles.header} style={{
          backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
          borderBottom: `1px solid ${lightMode === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <Box className={styles.profileHeader}>
            <IconButton
              onClick={() => navigate('/')}
              sx={{
                color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                '&:hover': {
                  backgroundColor: lightMode === 'dark' ? '#374151' : '#f3f4f6'
                },
                marginRight: 1
              }}
            >
              <ArrowLeft size={18} />
            </IconButton>
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
            backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
            borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
          }}>
            <Trophy size={20} weight="fill" style={{ color: '#f59e0b' }} />
            <Box className={styles.statContent}>
              <div className={styles.statLabel} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>TWL Rating</div>
              <div className={styles.statValue} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {formatRating(twlRating)}
              </div>
              {twlRank && (
                <div className={styles.statRank} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  #{twlRank} rank
                </div>
              )}
            </Box>
          </Box>

          <Box className={styles.statCard} style={{
            backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
            borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
          }}>
            <Trophy size={20} weight="fill" style={{ color: '#10b981' }} />
            <Box className={styles.statContent}>
              <div className={styles.statLabel} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>CSW Rating</div>
              <div className={styles.statValue} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {formatRating(cswRating)}
              </div>
              {cswRank && (
                <div className={styles.statRank} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  #{cswRank} rank
                </div>
              )}
            </Box>
          </Box>

          <Box className={styles.statCard} style={{
            backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
            borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
          }}>
            <GameController size={20} weight="fill" style={{ color: '#3b82f6' }} />
            <Box className={styles.statContent}>
              <div className={styles.statLabel} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>Record</div>
              <div className={styles.statValue} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {wins}W - {losses}L
              </div>
              {ties > 0 && (
                <div className={styles.statRank} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {ties} ties
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
              <Calendar size={18} weight="fill" style={{ marginRight: 8 }} />
              Recent Tournaments
            </h2>
            <Box className={styles.resultsList}>
              {player.results.slice(0, showFullResults ? player.results.length : 5).map((result, index) => (
                <Box 
                  key={index} 
                  className={styles.resultItem}
                  style={{
                    backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                    borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb',
                    cursor: result.tourneyid ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (result.tourneyid) {
                      navigate(`/tournament/${result.tourneyid}`);
                    }
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
                      <span style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280', marginLeft: 8, fontSize: 12 }}>
                        {result.wins}W - {result.losses}L
                      </span>
                    )}
                    {result.tourneyid && (
                      <Box style={{ 
                        color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6', 
                        fontSize: 13,
                        fontWeight: 500,
                        marginLeft: 8
                      }}>
                        →
                      </Box>
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
                  padding: '8px 12px',
                  marginTop: 12,
                  fontSize: 12,
                  fontWeight: 500
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
              <Calendar size={18} weight="fill" style={{ marginRight: 8 }} />
              Upcoming Tournaments
            </h2>
            <Box className={styles.resultsList}>
              {player.upcoming.map((tourney, index) => (
                <Box 
                  key={index} 
                  className={styles.resultItem}
                  style={{
                    backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                    borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb',
                    cursor: tourney.tourneyid ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (tourney.tourneyid) {
                      navigate(`/tournament/${tourney.tourneyid}`);
                    }
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
                  {tourney.tourneyid && (
                    <Box style={{ 
                      color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6', 
                      fontSize: 13,
                      fontWeight: 500
                    }}>
                      →
                    </Box>
                  )}
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
              <ChartLineUp size={18} weight="fill" style={{ marginRight: 8 }} />
              All Tournament Results
            </h2>
            {loadingResults ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={20} />
              </Box>
            ) : (
              <Box className={styles.resultsList}>
                {playerResults.map((result, index) => (
                  <Box 
                    key={index} 
                    className={styles.resultItem}
                    style={{
                      backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                      borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb',
                      cursor: result.tourneyid ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (result.tourneyid) {
                        navigate(`/tournament/${result.tourneyid}`);
                      }
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
                        <Box style={{ 
                          color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6', 
                          fontSize: 13,
                          fontWeight: 500,
                          marginLeft: 8
                        }}>
                          →
                        </Box>
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
                  padding: '8px 12px',
                  marginTop: 12,
                  fontSize: 12,
                  fontWeight: 500
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

