import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import styles from './Tournament.module.css';
import { getTournament, getResults } from '../../axios/crossTablesApi';
import { Trophy, Calendar, MapPin, Users, Trophy as TrophyIcon } from '@phosphor-icons/react';

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
          backgroundColor: lightMode === 'dark' ? '#1F2937' : '#f9fafb',
          borderBottom: `1px solid ${lightMode === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <Box className={styles.tournamentHeader}>
            <Box className={styles.tournamentInfo}>
              <h1 className={styles.tournamentName} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                {tournament.name || tournament.tourneyname}
              </h1>
              <Box className={styles.tournamentMeta}>
                {tournament.date && (
                  <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    <Calendar size={18} style={{ marginRight: 8 }} />
                    {formatDate(tournament.date)}
                  </Box>
                )}
                {tournament.location && (
                  <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    <MapPin size={18} style={{ marginRight: 8 }} />
                    {tournament.location}
                  </Box>
                )}
                {tournament.entrants !== undefined && (
                  <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    <Users size={18} style={{ marginRight: 8 }} />
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
              <p style={{ color: lightMode === 'dark' ? '#d1d5db' : '#4b5563', marginBottom: 16 }}>
                {tournament.description}
              </p>
            )}
            {tournament.format && (
              <p style={{ color: lightMode === 'dark' ? '#d1d5db' : '#4b5563' }}>
                <strong>Format:</strong> {tournament.format}
              </p>
            )}
          </Box>
        )}

        {/* Results Table */}
        {sortedResults.length > 0 && (
          <Box className={styles.section} style={{
            backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
            borderColor: lightMode === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className={styles.sectionTitle} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
              <TrophyIcon size={20} weight="fill" style={{ marginRight: 8 }} />
              Final Results
            </h2>
            {loadingResults ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <TableContainer 
                component={Paper} 
                sx={{ 
                  backgroundColor: lightMode === 'dark' ? '#374151' : '#fff',
                  boxShadow: 'none',
                  border: `1px solid ${lightMode === 'dark' ? '#4b5563' : '#e5e7eb'}`
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: lightMode === 'dark' ? '#1F2937' : '#f9fafb' }}>
                      <TableCell sx={{ fontWeight: 700, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>Rank</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>Player</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>Wins</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>Losses</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>Spread</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>Rating Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedResults.map((result, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: lightMode === 'dark' ? '#4b5563' : '#f9fafb' 
                          },
                          '&:nth-of-type(odd)': {
                            backgroundColor: lightMode === 'dark' ? '#374151' : 'transparent'
                          }
                        }}
                      >
                        <TableCell sx={{ 
                          fontWeight: result.rank === 1 ? 700 : 500,
                          color: lightMode === 'dark' ? '#fff' : '#1F2937',
                          fontSize: result.rank === 1 ? '18px' : '14px'
                        }}>
                          {result.rank || '-'}
                        </TableCell>
                        <TableCell>
                          {result.playerid ? (
                            <Link 
                              to={`/player/${result.playerid}`}
                              style={{ 
                                color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6',
                                textDecoration: 'none',
                                fontWeight: 500
                              }}
                            >
                              {result.playername || result.name || 'Unknown'}
                            </Link>
                          ) : (
                            <span style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                              {result.playername || result.name || 'Unknown'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ color: lightMode === 'dark' ? '#d1d5db' : '#4b5563' }}>
                          {result.wins !== undefined ? result.wins : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: lightMode === 'dark' ? '#d1d5db' : '#4b5563' }}>
                          {result.losses !== undefined ? result.losses : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          color: result.spread >= 0 ? (lightMode === 'dark' ? '#10b981' : '#059669') : (lightMode === 'dark' ? '#ef4444' : '#dc2626'),
                          fontWeight: 600
                        }}>
                          {result.spread !== undefined ? (result.spread >= 0 ? '+' : '') + result.spread : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          color: result.ratingchange >= 0 ? (lightMode === 'dark' ? '#10b981' : '#059669') : (lightMode === 'dark' ? '#ef4444' : '#dc2626'),
                          fontWeight: 600
                        }}>
                          {result.ratingchange !== undefined ? (result.ratingchange >= 0 ? '+' : '') + result.ratingchange : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

