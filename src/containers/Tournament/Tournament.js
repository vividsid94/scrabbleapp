import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import styles from './Tournament.module.css';
import { getTournament, getResults } from '../../axios/crossTablesApi';
import { Trophy, Calendar, MapPin, Users, ArrowLeft } from '@phosphor-icons/react';

export default function Tournament() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { lightMode } = useContext(ThemeContext);
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load tournament with results
      const tournamentData = await getTournament(parseInt(tournamentId), true);
      setTournament(tournamentData);
      
      // Load detailed results if available
      if (tournamentData.results) {
        setResults(tournamentData.results);
      } else {
        try {
          setLoadingResults(true);
          const resultsData = await getResults({ tourney: parseInt(tournamentId) });
          setResults(resultsData);
        } catch (err) {
          console.error('Error loading results:', err);
        } finally {
          setLoadingResults(false);
        }
      }
    } catch (err) {
      console.error('Error loading tournament:', err);
      setError('Failed to load tournament data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

  if (error || !tournament) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box className={styles.page} sx={{ p: 3 }}>
          <Alert severity="error">{error || 'Tournament not found'}</Alert>
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

  // Sort results by rank
  const sortedResults = [...results].sort((a, b) => {
    if (a.rank && b.rank) {
      return parseInt(a.rank) - parseInt(b.rank);
    }
    if (a.rank) return -1;
    if (b.rank) return 1;
    return 0;
  });

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page}>
        {/* Header */}
        <Box className={styles.header} style={{
          backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
          borderBottom: `1px solid ${lightMode === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <Box className={styles.tournamentHeader}>
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
            <Box className={styles.tournamentInfo}>
              <h1 className={styles.tournamentName} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {tournament.name || tournament.tourneyname}
              </h1>
              <Box className={styles.tournamentMeta}>
                {tournament.date && (
                  <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    <Calendar size={16} style={{ marginRight: 6 }} />
                    {formatDate(tournament.date)}
                  </Box>
                )}
                {tournament.location && (
                  <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    <MapPin size={16} style={{ marginRight: 6 }} />
                    {tournament.location}
                  </Box>
                )}
                {tournament.entrants !== undefined && (
                  <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    <Users size={16} style={{ marginRight: 6 }} />
                    {tournament.entrants} players
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tournament Details */}
        {(tournament.description || tournament.format) && (
          <Box className={styles.section} style={{
            backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
            borderColor: lightMode === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className={styles.sectionTitle} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
              Tournament Information
            </h2>
            {tournament.description && (
              <p style={{ 
                color: lightMode === 'dark' ? '#d1d5db' : '#4b5563', 
                marginBottom: 12,
                fontSize: 13,
                lineHeight: 1.5
              }}>
                {tournament.description}
              </p>
            )}
            {tournament.format && (
              <p style={{ 
                color: lightMode === 'dark' ? '#d1d5db' : '#4b5563',
                fontSize: 13
              }}>
                <strong>Format:</strong> {tournament.format}
              </p>
            )}
          </Box>
        )}

        {/* Results List */}
        {sortedResults.length > 0 && (
          <Box className={styles.section} style={{
            backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
            borderColor: lightMode === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className={styles.sectionTitle} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
              <Trophy size={18} weight="fill" style={{ marginRight: 8 }} />
              Final Results
            </h2>
            {loadingResults ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={20} />
              </Box>
            ) : (
              <Box className={styles.resultsList}>
                {sortedResults.map((result, index) => (
                  <Box
                    key={index}
                    className={styles.resultItem}
                    style={{
                      backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                      borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb',
                      cursor: result.playerid ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (result.playerid) {
                        navigate(`/player/${result.playerid}`);
                      }
                    }}
                  >
                    <Box className={styles.resultRankBox}>
                      <span className={styles.resultRank} style={{ 
                        color: result.rank === 1 
                          ? (lightMode === 'dark' ? '#f59e0b' : '#d97706')
                          : (lightMode === 'dark' ? '#9ca3af' : '#6b7280'),
                        fontWeight: result.rank === 1 ? 700 : 600
                      }}>
                        #{result.rank || '-'}
                      </span>
                    </Box>
                    <Box className={styles.resultInfo}>
                      <div className={styles.resultPlayer} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                        {result.playername || result.name || 'Unknown'}
                      </div>
                      <Box className={styles.resultStats}>
                        {result.wins !== undefined && (
                          <span style={{ 
                            color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                            fontSize: 11,
                            marginRight: 8
                          }}>
                            W: {result.wins}
                          </span>
                        )}
                        {result.losses !== undefined && (
                          <span style={{ 
                            color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                            fontSize: 11,
                            marginRight: 8
                          }}>
                            L: {result.losses}
                          </span>
                        )}
                        {result.spread !== undefined && (
                          <span style={{ 
                            color: result.spread >= 0 
                              ? (lightMode === 'dark' ? '#10b981' : '#059669')
                              : (lightMode === 'dark' ? '#ef4444' : '#dc2626'),
                            fontSize: 11,
                            fontWeight: 600,
                            marginRight: 8
                          }}>
                            Spread: {result.spread >= 0 ? '+' : ''}{result.spread}
                          </span>
                        )}
                        {result.ratingchange !== undefined && (
                          <span style={{ 
                            color: result.ratingchange >= 0 
                              ? (lightMode === 'dark' ? '#10b981' : '#059669')
                              : (lightMode === 'dark' ? '#ef4444' : '#dc2626'),
                            fontSize: 11,
                            fontWeight: 600
                          }}>
                            Rating: {result.ratingchange >= 0 ? '+' : ''}{result.ratingchange}
                          </span>
                        )}
                      </Box>
                    </Box>
                    {result.playerid && (
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
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

