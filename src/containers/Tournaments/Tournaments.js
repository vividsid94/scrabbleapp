import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import styles from './Tournaments.module.css';
import { getUpcomingTournaments, getRecentTournaments, searchTournaments } from '../../axios/crossTablesApi';
import { MagnifyingGlass, Calendar, Trophy, MapPin } from '@phosphor-icons/react';

export default function Tournaments() {
  const { lightMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    } else {
      loadTournaments();
    }
  }, [searchTerm, activeTab]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 0) {
        const upcomingData = await getUpcomingTournaments();
        setUpcoming(upcomingData);
      } else {
        const recentData = await getRecentTournaments();
        setRecent(recentData);
      }
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('Failed to load tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await searchTournaments(searchTerm);
      setUpcoming(results.upcoming);
      setRecent(results.recent);
    } catch (err) {
      console.error('Error searching tournaments:', err);
      setError('Failed to search tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const tournaments = activeTab === 0 ? upcoming : recent;

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page}>
        <Box className={styles.header} style={{
          backgroundColor: lightMode === 'dark' ? '#1F2937' : '#f9fafb',
          borderBottom: `1px solid ${lightMode === 'dark' ? '#374151' : '#e5e7eb'}`
        }}>
          <Box className={styles.headerContent}>
            <h1 className={styles.pageTitle} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
              Tournaments
            </h1>
            
            {/* Search */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                maxWidth: 500,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: lightMode === 'dark' ? '#374151' : '#fff',
                  '& fieldset': {
                    borderColor: lightMode === 'dark' ? '#4b5563' : '#d1d5db'
                  },
                  '&:hover fieldset': {
                    borderColor: lightMode === 'dark' ? '#6b7280' : '#9ca3af'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6'
                  }
                },
                '& .MuiInputBase-input': {
                  color: lightMode === 'dark' ? '#fff' : '#1F2937'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlass size={20} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }} />
                  </InputAdornment>
                )
              }}
            />

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6',
                    fontWeight: 600
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: lightMode === 'dark' ? '#60a5fa' : '#3b82f6'
                }
              }}
            >
              <Tab label="Upcoming" icon={<Calendar size={18} />} iconPosition="start" />
              <Tab label="Recent" icon={<Trophy size={18} />} iconPosition="start" />
            </Tabs>
          </Box>
        </Box>

        {/* Content */}
        <Box className={styles.content}>
          {error && (
            <Box className={styles.error} style={{
              backgroundColor: lightMode === 'dark' ? '#7f1d1d' : '#fee2e2',
              color: lightMode === 'dark' ? '#fca5a5' : '#991b1b',
              padding: 16,
              borderRadius: 8,
              marginBottom: 24
            }}>
              {error}
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <CircularProgress />
            </Box>
          ) : tournaments.length === 0 ? (
            <Box className={styles.emptyState} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
              <Trophy size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>No tournaments found</p>
            </Box>
          ) : (
            <Box className={styles.tournamentsGrid}>
              {tournaments.map((tournament, index) => (
                <Box
                  key={index}
                  className={styles.tournamentCard}
                  style={{
                    backgroundColor: lightMode === 'dark' ? '#374151' : '#fff',
                    borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    if (tournament.tourneyid) {
                      navigate(`/tournament/${tournament.tourneyid}`);
                    } else if (tournament.upcomingid) {
                      // Handle upcoming tournament detail
                      // Could navigate to a detail page or show modal
                    }
                  }}
                >
                  <Box className={styles.tournamentCardHeader}>
                    <h3 className={styles.tournamentCardTitle} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                      {tournament.name || tournament.tourneyname || tournament.mastername}
                    </h3>
                    {tournament.tourneytype && (
                      <span className={styles.tournamentType} style={{
                        backgroundColor: lightMode === 'dark' ? '#1F2937' : '#f3f4f6',
                        color: lightMode === 'dark' ? '#9ca3af' : '#6b7280'
                      }}>
                        {tournament.tourneytype}
                      </span>
                    )}
                  </Box>
                  
                  <Box className={styles.tournamentCardMeta}>
                    {tournament.date && (
                      <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        <Calendar size={16} style={{ marginRight: 8 }} />
                        {formatDate(tournament.date)}
                      </Box>
                    )}
                    {tournament.location && (
                      <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        <MapPin size={16} style={{ marginRight: 8 }} />
                        {tournament.location}
                      </Box>
                    )}
                    {tournament.entrants !== undefined && (
                      <Box className={styles.metaItem} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        <Trophy size={16} style={{ marginRight: 8 }} />
                        {tournament.entrants} players
                      </Box>
                    )}
                  </Box>

                  {tournament.tourneyid && (
                    <Box className={styles.tournamentCardAction} style={{ color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6' }}>
                      View Details →
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

