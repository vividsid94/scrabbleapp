import React, { useState, useContext, useEffect, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import styles from './Home.module.css';
import { Rocket, MagnifyingGlass, User, Trophy, X } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../App';
import AnimatedMascot from '../../components/AppContent/AnimatedMascot';
import { searchPlayers, getUpcomingTournaments, getRecentTournaments, getTopPlayers } from '../../axios/crossTablesApi';

export default function Home(){
  const { lightMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [playerRankings, setPlayerRankings] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [tournamentTab, setTournamentTab] = useState('upcoming'); // 'upcoming' or 'recent'
  const [panelTab, setPanelTab] = useState('rankings'); // 'rankings' or 'tournaments'
  const [rankingSearchTerm, setRankingSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [loading, setLoading] = useState(false);

  const touchStartY = useRef(null);
  const touchCurrentY = useRef(null);
  const bodyOverflowRef = useRef('');

  const closePanel = () => setSearchPanelOpen(false);

  useEffect(() => {
    if (searchPanelOpen) {
      if (playerRankings.length === 0) {
        loadPlayerRankings();
      }
      loadTournaments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchPanelOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (searchPanelOpen) {
      bodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = bodyOverflowRef.current || '';
    }

    return () => {
      document.body.style.overflow = bodyOverflowRef.current || '';
    };
  }, [searchPanelOpen]);

  useEffect(() => {
    if (!searchPanelOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchPanelOpen]);

  const loadTournaments = async () => {
    try {
      setLoadingTournaments(true);
      const [upcoming, recent] = await Promise.all([
        getUpcomingTournaments(),
        getRecentTournaments()
      ]);
      setUpcomingTournaments(upcoming);
      setRecentTournaments(recent);
    } catch (err) {
      console.error('Error loading tournaments:', err);
    } finally {
      setLoadingTournaments(false);
    }
  };

  const loadPlayerRankings = async () => {
    try {
      setLoadingRankings(true);
      const players = await getTopPlayers({ lexicon: 'twl', limit: 50 });
      setPlayerRankings(players);
    } catch (err) {
      console.error('Error loading player rankings:', err);
      setPlayerRankings([]);
    } finally {
      setLoadingRankings(false);
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

  const filteredRankings = React.useMemo(() => {
    const term = rankingSearchTerm.trim().toLowerCase();
    if (!term) {
      return playerRankings.slice(0, 50);
    }

    const searchMatches = (player) => {
      const name = (player.name || '').toLowerCase();
      const state = (player.state || '').toLowerCase();
      const country = (player.country || '').toLowerCase();
      const id = (player.playerid || player.id || '').toString();
      return (
        name.includes(term) ||
        state.includes(term) ||
        country.includes(term) ||
        id.includes(term)
      );
    };

    const inTopList = playerRankings.filter(searchMatches);
    const additionalMatches = (searchResults || []).filter((player) => {
      if (!player) return false;
      if (!searchMatches(player)) return false;
      const playerId = player.playerid || player.id;
      return !playerRankings.some((p) => (p.playerid || p.id) === playerId);
    });

    return [...inTopList, ...additionalMatches].slice(0, 50);
  }, [playerRankings, searchResults, rankingSearchTerm]);

  const handleTouchStart = (event) => {
    if (!isMobile) return;
    touchStartY.current = event.touches[0]?.clientY ?? null;
    touchCurrentY.current = touchStartY.current;
  };

  const handleTouchMove = (event) => {
    if (!isMobile || touchStartY.current === null) return;
    touchCurrentY.current = event.touches[0]?.clientY ?? touchCurrentY.current;
  };

  const handleTouchEnd = () => {
    if (!isMobile || touchStartY.current === null || touchCurrentY.current === null) {
      touchStartY.current = null;
      touchCurrentY.current = null;
      return;
    }

    const delta = touchCurrentY.current - touchStartY.current;
    if (delta > 80) {
      closePanel();
    }

    touchStartY.current = null;
    touchCurrentY.current = null;
  };
 
  return (
    <>
      <Box sx={{ display: 'flex'}}>
        <Sidenav/>
        <Box className={styles.page}>
          <Box className={styles.heroContainer}>
            <Box className={styles.mascotWrapper}>
              <AnimatedMascot />
            </Box>
            <Box className={styles.title}
              style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}
            >
              Tile Turnover™
            </Box>
          </Box>
          <Box 
            className={styles.developmentMessage}
            style={{ 
              backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
              color: lightMode === 'dark' ? '#fff' : '#1F2937',
              border: lightMode === 'dark' ? 'none' : '1px solid #e5e7eb',
              boxShadow: lightMode === 'dark' ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            Welcome! Meet Theo, your word game fox! We're a front-end focused project that's getting a huge upgrade! Check the{" "}
            <Link to="/changelog" style={{
              color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', 
              textDecoration: 'none', 
              fontWeight: 'bold'
            }}>changelog</Link>
            {" "}for all the latest updates!
            <br /><br />
            <span style={{ fontSize: '0.75em', opacity: lightMode === 'dark' ? 0.6 : 0.7, color: lightMode === 'dark' ? undefined : '#4B5563' }}>
              Our official release will be after 2025 Nationals, but more beta features are being added to the homepage! Try our new Puzzle and Play modes!
            </span>
            <Rocket 
              style={{ 
                color: '#F59E0B', 
                fontSize: '20px', 
                marginLeft: '8px',
                verticalAlign: 'middle'
              }} 
              weight="fill" 
            />
          </Box>
          
          <Box className={styles.homeButtonContainer}>
            <Link to="/play">
              <button 
                className={styles.homeButtonPrimary}
                style={{
                  boxShadow: lightMode === 'light' ? '6px 0px 0px #B45309, 0 2px 8px rgba(217, 119, 6, 0.2)' : '6px 0px 0px #B45309'
                }}
              >
                Play
              </button>
            </Link>
            <Link to="/puzzle">
              <button 
                className={styles.homeButtonPrimary}
                style={{
                  boxShadow: lightMode === 'light' ? '6px 0px 0px #B45309, 0 2px 8px rgba(217, 119, 6, 0.2)' : '6px 0px 0px #B45309'
                }}
              >
                Puzzle
              </button>
            </Link>
            <Link to="/viewer">
              <button 
                className={styles.homeButton}
                style={{
                  borderColor: lightMode === 'dark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(217, 119, 6, 0.5)',
                  color: lightMode === 'dark' ? '#D97706' : '#D97706',
                  boxShadow: lightMode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Game Viewer
              </button>
            </Link>
            <Link to="/3dviewer">
              <button 
                className={styles.threeDButton}
                style={{
                  borderColor: lightMode === 'dark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(217, 119, 6, 0.5)',
                  color: lightMode === 'dark' ? '#D97706' : '#D97706',
                  boxShadow: lightMode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                3D Viewer
              </button>
            </Link>
            <Link to="/submit-game">
              <button 
                className={styles.submitGameButton}
                style={{
                  borderColor: lightMode === 'dark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(217, 119, 6, 0.5)',
                  color: lightMode === 'dark' ? '#D97706' : '#D97706',
                  boxShadow: lightMode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Submit Game
              </button>
            </Link>
            <button 
              className={styles.homeButton} 
              onClick={() => setSearchPanelOpen(true)}
              type="button"
              aria-expanded={searchPanelOpen}
              aria-controls="resultsPanel"
              style={{
                borderColor: lightMode === 'dark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(217, 119, 6, 0.5)',
                color: lightMode === 'dark' ? '#D97706' : '#D97706',
                boxShadow: lightMode === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Results
            </button>
            {/* <Link to="/snakes">
              <button className={styles.homeButton} style={{ 
                background: 'linear-gradient(45deg, transparent 5%, #7C3AED 5%)',
                boxShadow: '6px 0px 0px #5B21B6'
              }}>Snakes 🐍</button>
            </Link> */}
            {/* <Link to="/play">
              <button className={styles.homeButton}>Play Scrabble</button>
            </Link> */}
          </Box>
        </Box>
      </Box>
      
      {/* Right Side Search Panel */}
      <Box 
        className={`${styles.searchPanel} ${searchPanelOpen ? styles.searchPanelOpen : ''}`}
        style={{
          backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
          borderLeft: `1px solid ${lightMode === 'dark' ? '#374151' : '#e5e7eb'}`
        }}
        id="resultsPanel"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
          <Box className={styles.searchPanelHeader}>
            <h2 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              margin: 0,
              color: lightMode === 'dark' ? '#fff' : '#1F2937'
            }}>
              Results
            </h2>
            <IconButton
              onClick={closePanel}
              sx={{
                color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                '&:hover': {
                  backgroundColor: lightMode === 'dark' ? '#374151' : '#f3f4f6'
                }
              }}
            >
              <X size={20} />
            </IconButton>
          </Box>
          
          <Box className={styles.searchPanelContent}>
            <Box className={styles.panelTabs}>
              <button
                className={`${styles.panelTab} ${panelTab === 'rankings' ? styles.panelTabActive : ''}`}
                onClick={() => setPanelTab('rankings')}
                type="button"
              >
                Rankings
              </button>
              <button
                className={`${styles.panelTab} ${panelTab === 'tournaments' ? styles.panelTabActive : ''}`}
                onClick={() => setPanelTab('tournaments')}
                type="button"
              >
                Tournaments
              </button>
            </Box>

            {panelTab === 'rankings' ? (
              <>
                <Box style={{ marginBottom: 12 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <User size={16} />
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          margin: 0,
                          color: lightMode === 'dark' ? '#fff' : '#1F2937'
                        }}
                      >
                        Search Players
                      </h3>
                    </Box>

                    <TextField
                      value={rankingSearchTerm}
                      onChange={async (event) => {
                        const value = event.target.value;
                        setRankingSearchTerm(value);

                        if (value.trim().length >= 2) {
                          try {
                            setLoading(true);
                            const players = await searchPlayers(value.trim());
                            setSearchResults(players);
                          } catch (err) {
                            console.error('Search error:', err);
                            setSearchResults([]);
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          setSearchResults([]);
                        }
                      }}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MagnifyingGlass size={15} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          loading ? <CircularProgress size={16} /> : null
                        )
                      }}
                      sx={{
                        width: '100%',
                        maxWidth: { xs: '100%', sm: 240 },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: lightMode === 'dark' ? '#1F2937' : '#fff',
                          color: lightMode === 'dark' ? '#fff' : '#1F2937',
                          borderRadius: '10px',
                          minHeight: '32px',
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
                        '& .MuiOutlinedInput-input': {
                          padding: '5px 8px',
                          fontSize: '12.5px'
                        }
                      }}
                    />
                  </Box>
                </Box>

                {loadingRankings ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : filteredRankings.length === 0 ? (
                  <Box
                    sx={{
                      padding: '12px',
                      textAlign: 'center',
                      color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                      fontSize: 13
                    }}
                  >
                    Rankings unavailable right now.
                  </Box>
                ) : (
                  <Box className={styles.rankingsList}>
                    {filteredRankings.slice(0, 50).map((player, index) => {
                      const playerId = player.playerid || player.id || index;
                      const rank = player.twlrank || player.rank || index + 1;
                      const rating = player.twlrating || player.rating || player.rating_nwl || 0;
                      const wins = player.w || player.wins || 0;
                      const losses = player.l || player.losses || 0;
                      const locale = player.state || player.country || '';

                      return (
                        <Box
                          key={`${playerId}-${rank}`}
                          className={styles.rankingItem}
                          onClick={() => {
                            if (player.playerid) {
                              navigate(`/player/${player.playerid}`);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(evt) => {
                            if (evt.key === 'Enter' && player.playerid) {
                              navigate(`/player/${player.playerid}`);
                            }
                          }}
                        >
                          <div className={styles.rankingPosition}>#{rank}</div>
                          <div className={styles.rankingMain}>
                            <div className={styles.rankingName}>{player.name}</div>
                            <div className={styles.rankingMeta}>
                              <span>{Math.round(rating)}</span>
                              <span>•</span>
                              <span>{wins}-{losses}</span>
                              {locale ? (
                                <>
                                  <span>•</span>
                                  <span>{locale}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div className={styles.rankingAction}>View →</div>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </>
            ) : (
              <Box>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    margin: '0 0 10px 0',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Trophy size={18} />
                  Tournaments
                </h3>

                <Box className={styles.searchTabs} style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => setTournamentTab('upcoming')}
                    className={styles.searchTab}
                    style={{
                      backgroundColor: tournamentTab === 'upcoming'
                        ? (lightMode === 'dark' ? '#3b82f6' : '#60a5fa')
                        : 'transparent',
                      color: tournamentTab === 'upcoming'
                        ? '#fff'
                        : (lightMode === 'dark' ? '#9ca3af' : '#6b7280'),
                      borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
                    }}
                    type="button"
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setTournamentTab('recent')}
                    className={styles.searchTab}
                    style={{
                      backgroundColor: tournamentTab === 'recent'
                        ? (lightMode === 'dark' ? '#3b82f6' : '#60a5fa')
                        : 'transparent',
                      color: tournamentTab === 'recent'
                        ? '#fff'
                        : (lightMode === 'dark' ? '#9ca3af' : '#6b7280'),
                      borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
                    }}
                    type="button"
                  >
                    Recent
                  </button>
                </Box>

                {loadingTournaments ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <>
                    {(
                      tournamentTab === 'upcoming'
                        ? upcomingTournaments
                        : recentTournaments
                    ).length === 0 ? (
                      <Box
                        sx={{
                          padding: '12px',
                          textAlign: 'center',
                          color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                          fontSize: 13
                        }}
                      >
                        No tournaments found.
                      </Box>
                    ) : (
                      <Box className={styles.tournamentsList}>
                        {(tournamentTab === 'upcoming' ? upcomingTournaments : recentTournaments)
                          .slice(0, 10)
                          .map((tournament, index) => (
                            <Box
                              key={index}
                              className={styles.tournamentItem}
                              style={{
                                backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                                borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb',
                                cursor: tournament.tourneyid ? 'pointer' : 'default'
                              }}
                              onClick={() => {
                                if (tournament.tourneyid) {
                                  navigate(`/tournament/${tournament.tourneyid}`);
                                }
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: lightMode === 'dark' ? '#fff' : '#1F2937',
                                    marginBottom: 2
                                  }}
                                >
                                  {tournament.name || tournament.tourneyname || tournament.mastername}
                                </div>
                                {tournament.date && (
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: lightMode === 'dark' ? '#9ca3af' : '#6b7280'
                                    }}
                                  >
                                    {formatDate(tournament.date)}
                                  </div>
                                )}
                                {tournament.location && (
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: lightMode === 'dark' ? '#9ca3af' : '#6b7280'
                                    }}
                                  >
                                    {tournament.location}
                                  </div>
                                )}
                              </Box>
                              {tournament.tourneyid && (
                                <Box
                                  style={{
                                    color: lightMode === 'dark' ? '#60a5fa' : '#3b82f6',
                                    fontSize: 13,
                                    fontWeight: 500
                                  }}
                                >
                                  →
                                </Box>
                              )}
                            </Box>
                          ))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
      </Box>
      
      {/* Backdrop overlay when panel is open */}
      {searchPanelOpen && (
        <Box 
          className={styles.searchPanelBackdrop}
          onClick={closePanel}
        />
      )}
    </>
  )
}
