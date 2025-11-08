import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import { ThemeContext } from '../../App';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import styles from './PlayerProfile.module.css';
import { getPlayer, getResults, searchTournaments, getPlayers, getAnnotatedGames } from '../../axios/crossTablesApi';
import { Trophy, Calendar, ChartLineUp, GameController, Users, User, ArrowLeft } from '@phosphor-icons/react';
import { useViewerStore } from '../../stores/viewerStore';

export default function PlayerProfile() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { lightMode } = useContext(ThemeContext);
  const { setGameNum } = useViewerStore();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [annotatedGames, setAnnotatedGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const [gamesTab, setGamesTab] = useState('games'); // 'games' or 'results'
  const [gameFilter, setGameFilter] = useState('');

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
      
      // Debug: log all available fields
      console.log('Player data from getPlayer:', playerData);
      console.log('List player data from getPlayers:', listPlayer);
      console.log('All keys in playerData:', Object.keys(playerData || {}));
      console.log('All keys in listPlayer:', Object.keys(listPlayer || {}));
      
      const mergedPlayer = {
        ...playerData,
        // Override with list data fields if they exist (for consistent field names)
        ...(listPlayer && {
          name: listPlayer.name || playerData.name || playerData.playername,
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
          rank: listPlayer.rank || playerData.rank,
          // Try to get photo from list player if not in detailed data
          photourl: listPlayer.photourl || playerData.photourl || listPlayer.photo || playerData.photo,
          photo: listPlayer.photo || playerData.photo || listPlayer.photourl || playerData.photourl
        })
      };
      
      // Ensure name is set from either source
      if (!mergedPlayer.name) {
        mergedPlayer.name = playerData.name || playerData.playername || listPlayer?.name || '';
      }
      
      // Check for photo in any possible field
      if (!mergedPlayer.photourl && !mergedPlayer.photo) {
        // Try all possible photo field names
        const photoFields = [
          'photourl', 'photo', 'photourl_full', 'photo_full', 
          'photourl_small', 'photo_small', 'photourl_large', 'photo_large',
          'image', 'imageurl', 'image_url', 'avatar', 'avatarurl', 'avatar_url',
          'picture', 'pictureurl', 'picture_url', 'img', 'imgurl', 'img_url'
        ];
        
        for (const field of photoFields) {
          if (playerData[field]) {
            mergedPlayer.photourl = playerData[field];
            break;
          }
          if (listPlayer && listPlayer[field]) {
            mergedPlayer.photourl = listPlayer[field];
            break;
          }
        }
      }
      
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
      
      // Load annotated games
      try {
        setLoadingGames(true);
        const gamesData = await getAnnotatedGames(parseInt(playerId));
        setAnnotatedGames(gamesData);
      } catch (err) {
        console.error('Error loading annotated games:', err);
      } finally {
        setLoadingGames(false);
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
  const playerPhoto = player.photourl || player.photo || player.photourl_full || player.photo_full;
  
  // Debug: log photo URL
  console.log('Player photo URL:', playerPhoto, 'from player object:', {
    photourl: player.photourl,
    photo: player.photo,
    photourl_full: player.photourl_full,
    photo_full: player.photo_full
  });
  
  // Get player name - check multiple possible field names
  const playerName = player.name || player.playername || player.Name || player.PlayerName || '';
  
  // Get full name for protiles (first and last name)
  const nameParts = playerName ? playerName.split(' ').filter(part => part.trim().length > 0) : [];
  const firstName = nameParts.length > 0 ? nameParts[0].toUpperCase() : '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ').toUpperCase() : '';
  
  // Debug: log names
  console.log('First name for protiles:', firstName, 'Last name:', lastName, 'from player name:', playerName);
  
  // Handle different possible field names from API
  const twlRating = player.twlrating || player.rating || player.rating_nwl || player.twl_rating;
  const cswRating = player.cswrating || player.csw_rating;
  const twlRank = player.twlrank || player.rank || player.twl_rank;
  const cswRank = player.cswrank || player.csw_rank;
  const wins = player.w || player.wins || 0;
  const losses = player.l || player.losses || 0;
  const ties = player.t || player.ties || 0;

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Sidenav />
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Box className={styles.page}>
        {/* Header */}
        <Box className={styles.header} style={{
          backgroundColor: 'transparent',
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
            {(firstName || lastName) && (
              <Box 
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginRight: '8px',
                  flexShrink: 0,
                  height: '28px'
                }}
              >
                {firstName && (
                  <Box 
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '2px',
                      backgroundColor: '#fff',
                      borderRadius: '4px'
                    }}
                  >
                    {firstName.split('').map((letter, index) => {
                      // Use underscore for lowercase letters or non-letters
                      const protileLetter = /[A-Z]/.test(letter) ? letter : '_';
                      return (
                        <img
                          key={`first-${letter}-${index}`}
                          src={`/images/compressed-clean-protiles/${protileLetter}.png`}
                          alt={letter}
                          style={{
                            width: '24px',
                            height: '24px',
                            display: 'block',
                            imageRendering: 'pixelated',
                            imageRendering: '-moz-crisp-edges',
                            imageRendering: 'crisp-edges',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            console.error('Failed to load protile:', protileLetter, 'for letter:', letter);
                            e.target.style.display = 'none';
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
                {lastName && (
                  <Box 
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '2px',
                      backgroundColor: '#fff',
                      borderRadius: '4px'
                    }}
                  >
                    {lastName.split('').map((letter, index) => {
                      // Use underscore for lowercase letters or non-letters
                      const protileLetter = /[A-Z]/.test(letter) ? letter : '_';
                      return (
                        <img
                          key={`last-${letter}-${index}`}
                          src={`/images/compressed-clean-protiles/${protileLetter}.png`}
                          alt={letter}
                          style={{
                            width: '24px',
                            height: '24px',
                            display: 'block',
                            imageRendering: 'pixelated',
                            imageRendering: '-moz-crisp-edges',
                            imageRendering: 'crisp-edges',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            console.error('Failed to load protile:', protileLetter, 'for letter:', letter);
                            e.target.style.display = 'none';
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}
            <Box className={styles.profileInfo}>
              {player.location && (
                <p className={styles.location} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {player.location}
                </p>
              )}
            </Box>
            {playerPhoto ? (
              <img 
                src={playerPhoto} 
                alt={playerName}
                className={styles.profilePhoto}
                onError={(e) => { 
                  console.error('Failed to load profile photo:', playerPhoto);
                  e.target.style.display = 'none'; 
                }}
                onLoad={() => {
                  console.log('Profile photo loaded successfully:', playerPhoto);
                }}
              />
            ) : (
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px',
                backgroundColor: lightMode === 'dark' ? '#374151' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '20px' }}>👤</span>
              </div>
            )}
          </Box>
        </Box>

        {/* Games and Results Tabbed Interface with Stats */}
        {(annotatedGames.length > 0 || (player.results && player.results.length > 0) || (player.upcoming && player.upcoming.length > 0) || results.length > 0 || twlRating || cswRating || wins || losses) && (
          <Box className={styles.section} style={{
            backgroundColor: 'transparent',
            borderLeftColor: lightMode === 'dark' ? '#374151' : '#e5e7eb',
            borderRightColor: lightMode === 'dark' ? '#374151' : '#e5e7eb',
            borderTop: 'none',
            borderBottom: 'none'
          }}>
            {/* Stats Grid */}
            <Box className={styles.statsGrid} style={{ marginBottom: 12 }}>
              <Box className={styles.statCard} style={{
                backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
              }}>
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

            <Box className={styles.panelTabs} style={{ marginBottom: 12 }}>
              <button
                onClick={() => setGamesTab('games')}
                className={`${styles.panelTab} ${gamesTab === 'games' ? styles.panelTabActive : ''}`}
                style={{
                  backgroundColor: gamesTab === 'games' 
                    ? (lightMode === 'dark' ? '#3b82f6' : '#60a5fa')
                    : 'transparent',
                  color: gamesTab === 'games' 
                    ? '#fff'
                    : (lightMode === 'dark' ? '#9ca3af' : '#6b7280'),
                  borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
                }}
                type="button"
              >
                <GameController size={14} style={{ marginRight: 5 }} />
                Annotated Games
              </button>
              <button
                onClick={() => setGamesTab('results')}
                className={`${styles.panelTab} ${gamesTab === 'results' ? styles.panelTabActive : ''}`}
                style={{
                  backgroundColor: gamesTab === 'results' 
                    ? (lightMode === 'dark' ? '#3b82f6' : '#60a5fa')
                    : 'transparent',
                  color: gamesTab === 'results' 
                    ? '#fff'
                    : (lightMode === 'dark' ? '#9ca3af' : '#6b7280'),
                  borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb'
                }}
                type="button"
              >
                <Trophy size={14} style={{ marginRight: 5 }} />
                Tournament Results
              </button>
            </Box>

            {gamesTab === 'games' ? (
              <>
                {loadingGames ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : annotatedGames.length === 0 ? (
                  <Box sx={{
                    padding: '16px',
                    textAlign: 'center',
                    color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                    fontSize: 12
                  }}>
                    No annotated games found.
                  </Box>
                ) : (
                  <>
                    {annotatedGames.length > 0 && (
                      <input
                        type="text"
                        placeholder="Filter by opponent..."
                        value={gameFilter}
                        onChange={(e) => setGameFilter(e.target.value)}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          boxSizing: 'border-box',
                          padding: '6px 10px',
                          fontSize: 11,
                          borderRadius: '4px',
                          border: `1px solid ${lightMode === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                          backgroundColor: lightMode === 'dark' ? '#374151' : '#fff',
                          color: lightMode === 'dark' ? '#fff' : '#1F2937',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          marginBottom: '10px'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#60a5fa';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = lightMode === 'dark' ? '#4b5563' : '#e5e7eb';
                        }}
                      />
                    )}
                    <Box className={styles.gamesGrid}>
                      {(() => {
                        const filteredGames = annotatedGames.filter(game => {
                          if (!gameFilter.trim()) return true;
                          return game.opponentName.toLowerCase().includes(gameFilter.toLowerCase());
                        });
                        const gamesToShow = showAllGames ? filteredGames : filteredGames.slice(0, 20);
                        return gamesToShow.map((game, index) => (
                        <Box
                          key={game.gameNum || index}
                          className={styles.gameCard}
                          style={{
                            backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
                            borderColor: lightMode === 'dark' ? '#4b5563' : '#e5e7eb',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setGameNum(parseInt(game.gameNum));
                            navigate('/viewer');
                          }}
                        >
                          <div className={styles.gameOpponent} style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}>
                            vs {game.opponentName}
                          </div>
                          <div className={styles.gameTournament} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {game.tournament}
                          </div>
                          <div className={styles.gameDate} style={{ color: lightMode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                            {game.date}
                          </div>
                        </Box>
                        ));
                      })()}
                    </Box>
                    {(() => {
                      const filteredGames = annotatedGames.filter(game => {
                        if (!gameFilter.trim()) return true;
                        return game.opponentName.toLowerCase().includes(gameFilter.toLowerCase());
                      });
                      return filteredGames.length > 20 && !showAllGames && (
                        <button
                          onClick={() => setShowAllGames(true)}
                          className={styles.showMoreButton}
                          style={{
                            color: lightMode === 'dark' ? '#fff' : '#1F2937',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            marginTop: 12,
                            fontSize: 12,
                            fontWeight: 500
                          }}
                        >
                          Show all {filteredGames.length} games
                        </button>
                      );
                    })()}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Recent Tournaments */}
                {player.results && player.results.length > 0 && (
                  <Box sx={{ marginBottom: 12 }}>
                    <h3 className={styles.sectionTitle} style={{ 
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      fontSize: 13,
                      marginBottom: 10
                    }}>
                      <Calendar size={14} weight="fill" style={{ marginRight: 5 }} />
                      Recent Tournaments
                    </h3>
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
                  <Box sx={{ marginBottom: 12 }}>
                    <h3 className={styles.sectionTitle} style={{ 
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      fontSize: 13,
                      marginBottom: 10
                    }}>
                      <Calendar size={14} weight="fill" style={{ marginRight: 5 }} />
                      Upcoming Tournaments
                    </h3>
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

                {/* All Tournament Results */}
                {results.length > 0 && (
                  <Box>
                    <h3 className={styles.sectionTitle} style={{ 
                      color: lightMode === 'dark' ? '#fff' : '#1F2937',
                      fontSize: 13,
                      marginBottom: 10
                    }}>
                      <ChartLineUp size={14} weight="fill" style={{ marginRight: 5 }} />
                      All Tournament Results
                    </h3>
                    {loadingResults ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={20} />
                      </Box>
                    ) : (
                      <>
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
                      </>
                    )}
                  </Box>
                )}

                {(!player.results || player.results.length === 0) && (!player.upcoming || player.upcoming.length === 0) && results.length === 0 && (
                  <Box sx={{
                    padding: '16px',
                    textAlign: 'center',
                    color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
                    fontSize: 12
                  }}>
                    No tournament results found.
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
        </Box>
      </Box>
    </Box>
  );
}

