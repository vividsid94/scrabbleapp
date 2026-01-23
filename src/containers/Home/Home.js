import React, { useState, useContext, useEffect, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import styles from './Home.module.css';
import { Rocket, MagnifyingGlass, User, Trophy, X, CaretDown, GameController, PuzzlePiece, Eye, Sparkle, Cube, PaperPlaneTilt, MagnifyingGlass as SearchIcon } from '@phosphor-icons/react';
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
  const [toolsMenuAnchor, setToolsMenuAnchor] = useState(null);
  const toolsMenuOpen = Boolean(toolsMenuAnchor);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const touchStartY = useRef(null);
  const touchCurrentY = useRef(null);
  const bodyOverflowRef = useRef('');

  const handleToolsMenuClick = (event) => {
    setToolsMenuAnchor(event.currentTarget);
  };

  const handleToolsMenuClose = () => {
    setToolsMenuAnchor(null);
  };

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
            className={styles.welcomeBox}
            style={{ 
              backgroundColor: lightMode === 'dark' ? 'rgba(55, 65, 81, 0.6)' : 'rgba(249, 250, 251, 0.9)',
              border: lightMode === 'dark' ? '1px solid rgba(217, 119, 6, 0.15)' : '1px solid rgba(217, 119, 6, 0.1)',
            }}
            sx={{
              padding: { xs: '14px 16px', sm: '16px 20px' },
              margin: { xs: '16px auto 8px', sm: '20px auto 12px' },
              width: { xs: '90%', sm: '450px' },
              maxWidth: '90%'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: '12px', sm: '16px' },
              width: '100%'
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                width: '100%'
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: '36px', sm: '40px' },
                  height: { xs: '36px', sm: '40px' },
                  borderRadius: '10px',
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.18)' : 'rgba(217, 119, 6, 0.1)',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  <img 
                    src="/images/fox-icon.svg" 
                    alt="Fox icon" 
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      color: '#000000'
                    }}
                  />
                </Box>
                <Box sx={{
                  fontSize: { xs: '14px', sm: '15px' },
                  color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937',
                  lineHeight: 1.5,
                  textAlign: { xs: 'center', sm: 'left' },
                  flex: 1
                }}>
                  Welcome! Meet Theo, your word game fox. We're in beta!
                </Box>
              </Box>
              <button
                onClick={() => setHowItWorksOpen(true)}
                style={{
                  background: 'transparent',
                  color: '#D97706',
                  border: '1px solid #D97706',
                  borderRadius: 6,
                  padding: '6px 16px',
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  fontSize: 13,
                  boxShadow: 'none',
                  outline: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.08)';
                  e.target.style.borderColor = '#B45309';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = '#D97706';
                }}
              >
                How It Works
              </button>
            </Box>
          </Box>
          
          <Box 
            className={styles.secondaryButtonsContainer}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: '8px', sm: '12px' },
              width: { xs: '90%', sm: 'auto' },
              margin: '24px auto 0',
              padding: { xs: '0 12px', sm: '0' },
              alignItems: 'center'
            }}
          >
            <Box sx={{
              display: 'flex',
              gap: { xs: '8px', sm: '12px' },
              justifyContent: 'center',
              flexWrap: 'wrap',
              width: '100%'
            }}>
              <Link to="/play" style={{ textDecoration: 'none' }}>
                <button className={styles.secondaryButton}>
                  Play
                </button>
              </Link>
              <Link to="/puzzle" style={{ textDecoration: 'none' }}>
                <button className={styles.secondaryButton}>
                  Puzzles
                </button>
              </Link>
              <Link to="/viewer" style={{ textDecoration: 'none' }}>
                <button className={styles.secondaryButton}>
                  Viewer
                </button>
              </Link>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Box sx={{ position: 'relative' }}>
                <button
                  onClick={handleToolsMenuClick}
                  className={styles.secondaryButton}
                  style={{
                    background: 'transparent',
                    border: '2px solid #D97706',
                    padding: '8px 23px'
                  }}
                >
                  More <CaretDown size={14} weight="bold" style={{ transform: toolsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </button>
                <Menu
                  anchorEl={toolsMenuAnchor}
                  open={toolsMenuOpen}
                  onClose={handleToolsMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  disableScrollLock={true}
                  slotProps={{
                    root: {
                      style: {
                        position: 'fixed'
                      }
                    }
                  }}
                  PaperProps={{
                    sx: {
                      backgroundColor: lightMode === 'dark' ? '#374151' : '#ffffff',
                      border: '1px solid',
                      borderColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
                      minWidth: '160px',
                      mt: '4px'
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => { handleToolsMenuClose(); navigate('/3dviewer'); }}
                    sx={{
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      fontSize: '14px',
                      padding: '10px 16px',
                      '&:hover': {
                        backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    3D Viewer
                  </MenuItem>
                  <MenuItem 
                    onClick={() => { handleToolsMenuClose(); navigate('/submit-game'); }}
                    sx={{
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      fontSize: '14px',
                      padding: '10px 16px',
                      '&:hover': {
                        backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    Submit Game
                  </MenuItem>
                  <MenuItem 
                    onClick={() => { handleToolsMenuClose(); setSearchPanelOpen(true); }}
                    sx={{
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      fontSize: '14px',
                      padding: '10px 16px',
                      '&:hover': {
                        backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    Results
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
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

      {/* How It Works Modal */}
      <Modal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
        aria-labelledby="how-it-works-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: '16px', sm: '0' }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            backgroundColor: lightMode === 'dark' ? '#374151' : '#ffffff',
            borderRadius: '12px',
            padding: { xs: '20px', sm: '24px' },
            maxWidth: '480px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            outline: 'none',
            boxShadow: lightMode === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.2)',
            border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <IconButton
            onClick={() => setHowItWorksOpen(false)}
            sx={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
              '&:hover': {
                backgroundColor: lightMode === 'dark' ? '#4b5563' : '#f3f4f6'
              }
            }}
          >
            <X size={20} />
          </IconButton>
          
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 'bold',
              marginBottom: '16px',
              color: lightMode === 'dark' ? '#fff' : '#1F2937',
              fontSize: { xs: '18px', sm: '20px' }
            }}
          >
            How It Works
          </Typography>

          {/* Main Features */}
          <Typography
            sx={{
              fontWeight: '600',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#9CA3AF',
              marginBottom: '12px',
              marginTop: '4px'
            }}
          >
            Main Features
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {/* Play */}
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.1)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <GameController size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Play
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Play a live game against people or bots.
                </Typography>
              </Box>
            </Box>

            {/* Puzzles */}
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.1)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <PuzzlePiece size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Puzzles
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Solve curated positions to improve.
                </Typography>
              </Box>
            </Box>

            {/* Viewer */}
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.1)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Eye size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Viewer
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Analyze games, explore boards, study words.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Extra Features */}
          <Typography
            sx={{
              fontWeight: '600',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#9CA3AF',
              marginBottom: '12px',
              marginTop: '4px'
            }}
          >
            Extra Features
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {/* Ask Theo */}
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.08)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Sparkle size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Ask Theo
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Get move suggestions when you're stuck.
                </Typography>
              </Box>
            </Box>

            {/* 3D Viewer */}
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.08)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Cube size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  3D Viewer
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Explore boards in immersive 3D.
                </Typography>
              </Box>
            </Box>

            {/* Submit Game */}
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.08)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <PaperPlaneTilt size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Submit Game
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Share your games for analysis.
                </Typography>
              </Box>
            </Box>

            {/* Results */}
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.08)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <SearchIcon size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Results
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Search players, rankings, and tournaments.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setHowItWorksOpen(false)}
              style={{
                background: 'linear-gradient(45deg, transparent 5%, #D97706 5%)',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                padding: '8px 24px',
                fontWeight: 'bold',
                letterSpacing: 0.5,
                fontSize: 13,
                boxShadow: '6px 0px 0px #B45309',
                outline: 'transparent',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                opacity: 0.95
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '8px 2px 0px #B45309';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '0.95';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '6px 0px 0px #B45309';
              }}
            >
              Got it — Let me play
            </button>
          </Box>
        </Box>
      </Modal>
    </>
  )
}
