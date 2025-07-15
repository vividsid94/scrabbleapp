import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { getAllPlayers, getCustomPlayerGameInfo } from '../../../axios/api';
import styles from '../Viewer.module.css';

const BrowsePlayersModal = ({ open, onClose, onLoadGame }) => {
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [playersError, setPlayersError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerGames, setPlayerGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState(null);
  const [playersPage, setPlayersPage] = useState(0);
  const [gamesPage, setGamesPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const PLAYERS_PER_PAGE = 20;
  const GAMES_PER_PAGE = 50;

  const handleOpenPlayersModal = async () => {
    setLoadingPlayers(true);
    setPlayersError(null);
    setPlayersPage(0);
    try {
      const playersList = await getAllPlayers();
      setPlayers(playersList);
    } catch (err) {
      setPlayersError('Failed to load players');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleClosePlayersModal = () => {
    onClose();
    setPlayers([]);
    setPlayersError(null);
    setSearchQuery('');
    setSelectedPlayer(null);
    setPlayerGames([]);
  };

  const handleViewGames = async (player) => {
    setSelectedPlayer(player);
    setLoadingGames(true);
    setGamesError(null);
    setPlayerGames([]);
    setGamesPage(0);
    try {
      const games = await getCustomPlayerGameInfo(
        'https://cross-tables.com/rest/players.php?search=',
        'https://www.cross-tables.com/anno.php?p=',
        player.name
      );
      setPlayerGames(games);
    } catch (err) {
      setGamesError('Failed to load games');
    } finally {
      setLoadingGames(false);
    }
  };

  const handleLoadGame = async (gameNum) => {
    handleClosePlayersModal();
    onLoadGame(gameNum);
  };

  // Load players when modal opens
  React.useEffect(() => {
    if (open) {
      handleOpenPlayersModal();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={handleClosePlayersModal}
      aria-labelledby="players-modal-title"
      aria-describedby="players-modal-description"
    >
      <Box className={styles.modalContainer} sx={{ borderRadius: '0 !important', maxWidth: '400px', width: '90vw', padding: '8px 8px 0 8px', minWidth: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          marginBottom: '6px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          paddingBottom: '2px',
          minHeight: 0
        }}>
          <Button 
            onClick={handleClosePlayersModal}
            sx={{ 
              minWidth: 'auto',
              padding: '2px 8px',
              color: '#666',
              fontSize: '16px',
              lineHeight: 1,
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
            }}
          >
            ✕
          </Button>
        </Box>
        <Box sx={{ maxHeight: '65vh', overflowY: 'auto', padding: 0 }}>
          {/* Search Input */}
          <Box sx={{ padding: '0 8px 8px 8px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPlayersPage(0); // Reset to first page when searching
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: '#666' }} />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '12px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(0,0,0,0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0,0,0,0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                    },
                  },
                }
              }}
            />
          </Box>
          
          {loadingPlayers && (
            <Box sx={{ textAlign: 'center', padding: '10px', color: '#666', fontSize: '13px' }}>
              Loading players...
            </Box>
          )}
          {playersError && (
            <Box sx={{ textAlign: 'center', padding: '10px', color: 'red', fontSize: '13px' }}>
              {playersError}
            </Box>
          )}
          
          {/* Filter players based on search query */}
          {(() => {
            // Remove duplicates based on playerid or name
            const uniquePlayers = players.filter((player, index, self) => 
              index === self.findIndex(p => 
                (player.playerid && p.playerid === player.playerid) || 
                (!player.playerid && p.name === player.name)
              )
            );
            
            const filteredPlayers = uniquePlayers.filter(player => 
              player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (player.twlrating && player.twlrating.toString().includes(searchQuery)) ||
              (player.cswrating && player.cswrating.toString().includes(searchQuery))
            );
            
            // Reset to first page if current page is beyond the filtered results
            const maxPage = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE) - 1;
            const currentPage = Math.min(playersPage, maxPage);
            const paginatedPlayers = filteredPlayers.slice(currentPage * PLAYERS_PER_PAGE, (currentPage + 1) * PLAYERS_PER_PAGE);
            
            return (
              <>
                {searchQuery && filteredPlayers.length === 0 && (
                  <Box sx={{ textAlign: 'center', padding: '10px', color: '#666', fontSize: '13px' }}>
                    No players found matching "{searchQuery}"
                  </Box>
                )}
                {!searchQuery && filteredPlayers.length === 0 && !loadingPlayers && (
                  <Box sx={{ textAlign: 'center', padding: '10px', color: '#666', fontSize: '13px' }}>
                    No players available
                  </Box>
                )}
                <List sx={{ padding: 0 }}>
                  {paginatedPlayers.map((player, idx) => (
                    <React.Fragment key={player.playerid || idx}>
                      <ListItem 
                        sx={{ 
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                          padding: '4px 8px',
                          minHeight: '32px',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.01)' }
                        }}
                        secondaryAction={
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleViewGames(player)}
                            sx={{ 
                              fontSize: '11px',
                              padding: '2px 8px',
                              minWidth: '48px',
                              height: '24px',
                              borderColor: '#4CAF50',
                              color: '#4CAF50',
                              lineHeight: 1.1,
                              '&:hover': { 
                                backgroundColor: '#4CAF50',
                                color: 'white'
                              }
                            }}
                          >
                            Games
                          </Button>
                        }
                      >
                        <ListItemText 
                          primary={player.name} 
                          secondary={`Rating: ${player.twlrating || player.cswrating || 'N/A'}`}
                          primaryTypographyProps={{ 
                            sx: { 
                              fontFamily: 'Syne', 
                              fontWeight: 600,
                              fontSize: '12px',
                              lineHeight: 1.1
                            } 
                          }}
                          secondaryTypographyProps={{ 
                            sx: { 
                              fontFamily: 'Syne',
                              fontSize: '10px',
                              color: '#666',
                              lineHeight: 1.1
                            } 
                          }}
                        />
                      </ListItem>
                      {selectedPlayer && selectedPlayer.playerid === player.playerid && (
                        <ListItem sx={{ 
                          backgroundColor: 'rgba(76, 175, 80, 0.03)',
                          borderLeft: '2px solid #4CAF50',
                          padding: '8px 8px 4px 8px',
                          margin: '4px 0',
                          minHeight: '32px'
                        }}>
                          <Box sx={{ width: '100%' }}>
                            <Typography sx={{ 
                              fontFamily: 'Syne', 
                              fontWeight: 600,
                              fontSize: '12px',
                              marginBottom: '4px',
                              color: '#4CAF50',
                              lineHeight: 1.1
                            }}>
                              Games for {selectedPlayer.name}:
                            </Typography>
                            <Typography sx={{ 
                              fontFamily: 'Syne',
                              fontSize: '10px',
                              color: '#666',
                              marginBottom: '6px',
                              lineHeight: 1.1
                            }}>
                              Rating: {selectedPlayer.twlrating || selectedPlayer.cswrating || 'N/A'} • {playerGames.length} games found
                            </Typography>
                            {loadingGames && (
                              <Box sx={{ textAlign: 'center', padding: '6px', color: '#666', fontSize: '12px' }}>
                                Loading games...
                              </Box>
                            )}
                            {gamesError && (
                              <Box sx={{ textAlign: 'center', padding: '6px', color: 'red', fontSize: '12px' }}>
                                {gamesError}
                              </Box>
                            )}
                            {!loadingGames && !gamesError && playerGames.length === 0 && (
                              <Box sx={{ textAlign: 'center', padding: '6px', color: '#666', fontSize: '12px' }}>
                                No games found.
                              </Box>
                            )}
                            <List sx={{ padding: 0 }}>
                              {playerGames.slice(gamesPage * GAMES_PER_PAGE, (gamesPage + 1) * GAMES_PER_PAGE).map((game, idx) => (
                                <ListItem 
                                  button 
                                  key={game.gameNum || idx} 
                                  onClick={() => handleLoadGame(game.gameNum)}
                                  sx={{ 
                                    padding: '4px 8px',
                                    margin: '1px 0',
                                    borderRadius: '3px',
                                    minHeight: '28px',
                                    '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' }
                                  }}
                                >
                                  <ListItemText 
                                    primary={`${game.opponentName}, ${game.date}, ${game.tournament}`}
                                    primaryTypographyProps={{ 
                                      sx: { 
                                        fontFamily: 'Syne',
                                        fontSize: '11px',
                                        color: '#333',
                                        lineHeight: 1.1
                                      } 
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                            {playerGames.length > GAMES_PER_PAGE && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                <Button 
                                  size="small" 
                                  onClick={() => setGamesPage(g => Math.max(0, g - 1))} 
                                  disabled={gamesPage === 0}
                                  sx={{ 
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    minWidth: '40px',
                                    color: gamesPage === 0 ? '#ccc' : '#4CAF50',
                                    '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                                  }}
                                >
                                  Prev
                                </Button>
                                <Button 
                                  size="small" 
                                  onClick={() => setGamesPage(g => (g + 1) * GAMES_PER_PAGE < playerGames.length ? g + 1 : g)} 
                                  disabled={(gamesPage + 1) * GAMES_PER_PAGE >= playerGames.length}
                                  sx={{ 
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    minWidth: '40px',
                                    color: (gamesPage + 1) * GAMES_PER_PAGE >= playerGames.length ? '#ccc' : '#4CAF50',
                                    '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                                  }}
                                >
                                  Next
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </ListItem>
                      )}
                    </React.Fragment>
                  ))}
                </List>
                {filteredPlayers.length > PLAYERS_PER_PAGE && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                    <Button 
                      size="small" 
                      onClick={() => setPlayersPage(p => Math.max(0, p - 1))} 
                      disabled={currentPage === 0}
                      sx={{ 
                        fontSize: '11px',
                        padding: '4px 10px',
                        minWidth: '48px',
                        color: currentPage === 0 ? '#ccc' : '#4CAF50',
                        borderColor: currentPage === 0 ? '#ccc' : '#4CAF50',
                        '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                      }}
                      variant="outlined"
                    >
                      Prev
                    </Button>
                    <Typography sx={{ 
                      fontFamily: 'Syne',
                      fontSize: '11px',
                      color: '#666',
                      alignSelf: 'center',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
                      Page {currentPage + 1} / {Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE)}
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={() => setPlayersPage(p => (p + 1) * PLAYERS_PER_PAGE < filteredPlayers.length ? p + 1 : p)} 
                      disabled={(currentPage + 1) * PLAYERS_PER_PAGE >= filteredPlayers.length}
                      sx={{ 
                        fontSize: '11px',
                        padding: '4px 10px',
                        minWidth: '48px',
                        color: (currentPage + 1) * PLAYERS_PER_PAGE >= filteredPlayers.length ? '#ccc' : '#4CAF50',
                        borderColor: (currentPage + 1) * PLAYERS_PER_PAGE >= filteredPlayers.length ? '#ccc' : '#4CAF50',
                        '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                      }}
                      variant="outlined"
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </>
            )})()}
        </Box>
      </Box>
    </Modal>
  );
};

export default BrowsePlayersModal; 