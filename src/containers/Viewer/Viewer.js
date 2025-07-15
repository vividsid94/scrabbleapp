import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Viewer.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import Modal from '@mui/material/Modal';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";  
import { getMove, createBoard, highlightPreviousMove } from "../../functions/boardFunctions.js";
import { createRack } from "../../functions/rackFunctions.js";
import { handleMove } from '../../functions/moveHandlers';
import { removeFromPool } from '../../functions/poolFunctions';
import { useViewerStore } from '../../stores/viewerStore';
import { revealPlayers, revealElo } from '../../functions/playerFunctions';
import { handleDictionaryTilesOpen, handleColorSchemeOpen, handleRecentGamesOpen, handleGamesHistoryOpen } from '../../utils/modalFunctions';
import ColorScheme from '../../components/common/ColorScheme';
import { createIconList, createGroupedIcons } from './config/iconConfigs';
import { ThemeContext } from '../../App';

// Import components
import PlayerInfo from './components/PlayerInfo';
import LatestMove from './components/LatestMove';
import TopMoves from './components/TopMoves';
import SettingsModal from './components/SettingsModal';
import RecentGamesList from './components/RecentGamesList';
import ViewedGamesList from './components/ViewedGamesList';
import Typography from '@mui/material/Typography';
import { getAllPlayers, getCustomPlayerGameInfo } from '../../axios/api';
// Remove Dialog imports and use custom modal
// import Dialog from '@mui/material/Dialog';
// import DialogTitle from '@mui/material/DialogTitle';
// import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

export default function Viewer({ onChange }){ 
  const { lightMode, setLightMode } = React.useContext(ThemeContext);
  const [showOptions, setShowOptions] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
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

  // Use Zustand Viewer Store
  const {
    // Game state
    gameNum, setGameNum,
    moveSet, setMoveSet,
    currentMoveCoords, setCurrentMoveCoords,
    boardCoords, setBoardCoords,
    player1points, setPlayer1points,
    player2points, setPlayer2points,
    pointsScored, setPointsScored,
    pool, setPool,
    mode, setMode,
    moveDirection, setMoveDirection,
    boardMode, setBoardMode,
    tiles, setTiles,
    dictionary, setDictionary,
    ELOCommentary, setELOCommentary,
    open, setOpen,
    gameDictionary, setGameDictionary,
    currentMoveRef,
    blankTiles, setBlankTiles,
    name1, setName1,
    name2, setName2,
    revealedName1, setRevealedName1,
    revealedName2, setRevealedName2,
    revealedElo, setRevealedElo,
    revealedElo2, setRevealedElo2,
    tourneyNum, setTourneyNum,
    unlockEloMode, setUnlockEloMode,
    color,
    boardColor,
    customPlayerMode,
    showUnlockText, setShowUnlockText,
    origPlayerRaw, setOrigPlayerRaw,
    notes, setNotes,
    gamesViewed, setGamesViewed,
    recentNames, setRecentNames,
    recentDictionaries, setRecentDictionaries,
    recentGameNums, setRecentGameNums,
    loadingMsg, setLoadingMsg,
    modalContent, setModalContent,
    
    // Functions
    handleClose,
    switchValue,
    handleCustomPlayerMode,
    handleDictionaryChange,
    handleELOCommentaryChange,
    handleTileChange,
    switchMode: switchModeStore,
    randomizeGame,
    loadGameData,
    beginningOfGame: beginningOfGameStore,
    chooseGame: chooseGameStore
  } = useViewerStore();

  const handleMoveWrapper = (superLastMove, lastMove, thisMove, nextMove, type) => {
    const state = {
      setBoardCoords,
      setPool,
      setCurrentMoveCoords,
      setPlayer1points,
      setPlayer2points,
      setPointsScored,
      boardCoords,
      pool,
      moveSet, 
      origBoard
    };
    handleMove(superLastMove, lastMove, thisMove, nextMove, type, state);
  };

  const handleOpenPlayersModal = async () => {
    setShowPlayersModal(true);
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
    setShowPlayersModal(false);
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
    setShowPlayersModal(false);
    setPlayerGames([]);
    setSelectedPlayer(null);
    setGameNum(gameNum);
    await loadGameData();
  };

  // Load initial game data
  useEffect(() => {
    loadGameData();
  }, []); // Only run once on mount

  // Create board with useMemo like Play.js
  const board = useMemo(() => {
    // Calculate ALL blankTiles from the entire game up to current move
    let calculatedBlankTiles = [];
    
    // Go through all moves up to the current move to find all blank tiles
    for (let moveIndex = 0; moveIndex <= currentMoveRef.current; moveIndex++) {
      const move = moveSet[moveIndex];
      if (move) {
        const parts = move.split(" ");
        const play = parts[3];
        
        if (play && play !== "--" && parts[2]) {
          // Get the coordinates for this move
          console.log('Calling highlightPreviousMove with:', { location: parts[2], play, parts });
          const moveCoords = highlightPreviousMove(parts[2], play, boardCoords);
          
          // Check if any of the moveCoords contain lowercase letters
          moveCoords.forEach((coord, index) => {
            if (Array.isArray(coord) && coord.length === 2) {
              // Check if this position corresponds to a blank tile
              const [row, col] = coord;
              
              // Look for dots (.) OR lowercase letters in the play string which represent blank tiles
              let letterIndex = 0;
              for (let i = 0; i < play.length; i++) {
                const char = play[i];
                if (char === '.' || (char >= 'a' && char <= 'z')) {
                  // This is a blank tile
                  if (letterIndex === index) {
                    // Check if this blank tile is already in our list
                    const alreadyExists = calculatedBlankTiles.some(bt => bt.row === row && bt.col === col);
                    if (!alreadyExists) {
                      calculatedBlankTiles.push({ row, col });
                    }
                    break;
                  }
                  letterIndex++;
                } else if (char !== '.' && !(char >= 'a' && char <= 'z')) {
                  letterIndex++;
                }
              }
            }
          });
        }
      }
    }
    
    const result = createBoard(
      boardCoords, 
      currentMoveCoords, 
      tiles, 
      lightMode, 
      color.current, 
      null, // complementaryColor
      calculatedBlankTiles
    );
    return result;
  }, [boardCoords, currentMoveCoords, tiles, lightMode, color.current, currentMoveRef.current, moveSet]);



  // Handle keyboard events for backspace (move back)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't handle backspace if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      if (event.key === 'Backspace') {
        event.preventDefault();
        // Move back one move if possible
        if (currentMoveRef.current > -1) {
          currentMoveRef.current -= 1;
          setMoveDirection("backward");
          handleMoveWrapper(
            moveSet[currentMoveRef.current - 2], 
            moveSet[currentMoveRef.current - 1], 
            moveSet[currentMoveRef.current], 
            moveSet[currentMoveRef.current + 1], 
            "previous"
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMoveRef, moveSet, setMoveDirection, handleMoveWrapper]);

  const iconList = createIconList(
    beginningOfGameStore,
    currentMoveRef,
    setMoveDirection,
    handleMoveWrapper,
    moveSet,
    randomizeGame,
    unlockEloMode,
    showUnlockText,
    switchModeStore,
    mode,
    onChange,
    setBoardCoords,
    setPool,
    origBoard,
    origPool,
    setShowUnlockText,
    setMode
  );

  const groupedIcons = createGroupedIcons(
    handleGamesHistoryOpen,
    handleRecentGamesOpen,
    handleDictionaryTilesOpen,
    handleColorSchemeOpen,
    setModalContent,
    setOpen,
    name1,
    name2,
    setRevealedName1,
    setRevealedName2,
    tourneyNum,
    setRevealedElo,
    setRevealedElo2,
    mode,
    gameNum,
    revealPlayers,
    revealElo
  );

  const actionButtonStyle = {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
                  <Box className={styles.modalContainer}>
          {modalContent === "dictionaryTiles" && (
            <SettingsModal
              dictionary={dictionary}
              tiles={tiles}
              ELOCommentary={ELOCommentary}
              handleDictionaryChange={handleDictionaryChange}
              handleTileChange={handleTileChange}
              handleELOCommentaryChange={handleELOCommentaryChange}
              customPlayerMode={customPlayerMode}
              handleCustomPlayerMode={handleCustomPlayerMode}
              switchValue={switchValue}
              boardMode={boardMode}
              handleBoardModeChange={(e) => setBoardMode(e.target.value)}
            />
          )}
          {modalContent === "colorScheme" && (
            <ColorScheme
              color={color}
              boardColor={boardColor}
            />
          )}
          {modalContent === "recentGames" && (
            <RecentGamesList
              recentNames={recentNames}
              recentDictionaries={recentDictionaries}
              recentGameNums={recentGameNums}
              chooseGame={(gameNum) => chooseGameStore(gameNum)}
              mode={mode}
              handleClose={handleClose}
            />
          )}
          {modalContent === "gamesHistory" && (
            <ViewedGamesList
              gamesViewed={gamesViewed}
              chooseGame={(gameNum) => chooseGameStore(gameNum)}
              handleClose={handleClose}
            />
          )}
          {modalContent === "loading" && (
            <div>{loadingMsg}</div>
          )}
        </Box>
      </Modal>  
      <Box className={styles.page}>
        <Box className={styles.mainPanel}>
          
          <Box className={styles.leftContainer}>
            <Box className={`${styles.mainBox} ${styles.mainBoxContent}`} component="main">
            <Board 
              board={board} 
              points={pointsScored} 
              boardMode={boardMode}
              rack={createRack(moveSet, currentMoveRef.current - 1).map(char => char === ' ' ? '?' : char).join('')} 
              move={getMove(moveSet[currentMoveRef.current], currentMoveCoords)}
              moveDirection={moveDirection} 
              dictionary={gameDictionary} 
              onBoardChildClick={() => {}}
              showDictionary={false}
              commentary={notes.find(([note, moveNumber]) => currentMoveRef.current + 1 === moveNumber && (mode === "VIEWER" || ELOCommentary === "YES"))?.[0]?.trim()}
            />
   
            </Box>
          </Box>
          <Box className={styles.rightPanel}>
            <Box className={styles.playerPanel} style={{color: '#fff'}}>
              <Box style={{color: '#fff', fontSize: '12px', marginBottom: '5px', marginTop: '5px', opacity: 0.8}}>
                Dictionary: {gameDictionary}
                <Box
                  className={styles.bestMoveButton}
                  onClick={handleOpenPlayersModal}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '8px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontFamily: 'Syne',
                    fontWeight: 500,
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: 'fit-content',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: 'rgba(255,255,255,0.5)'
                    }
                  }}
                >
                  Browse Players
                </Box>
              </Box>
              <Box className={styles.playerToggle}>
                {/* Main navigation icons */}
                {iconList.map((icon, index) => (
                  <Tooltip key={`icon-${index}`} title={icon.toolTip}>
                    <icon.icon
                      className={styles.Arrows} 
                      onClick={icon.onClick}
                      sx={{color: '#fff'}}
                    />
                  </Tooltip>
                ))}
                
                {/* Collapsible options button */}
                <Tooltip title={showOptions ? "Hide Options" : "Show Options"}>
                  <Box
                    className={styles.keyBtn} 
                    onClick={() => setShowOptions(!showOptions)}
                    sx={{ 
                      ...actionButtonStyle,
                      transform: showOptions ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <MoreHorizIcon sx={{ fontSize: 20 }} />
                  </Box>
                </Tooltip>
              </Box>

              {/* Collapsible options section */}
              <Collapse in={showOptions}>
                <Box className={styles.bestMoveSection} sx={{ display: 'flex', gap: '50px', padding: '8px 0' }}>
                  {/* First group of icons */}
                  <Box sx={{ display: 'flex', gap: '4px' }}>
                    {groupedIcons[0] && (
                      <>
                        {groupedIcons[0].icon1 && (
                          <Tooltip title={groupedIcons[0].icon1.toolTip}>
                            <Box
                              className={styles.bestMoveButton}
                              onClick={groupedIcons[0].icon1.onClick}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {React.createElement(groupedIcons[0].icon1.icon, { sx: { fontSize: 20, color: '#fff' } })}
                            </Box>
                          </Tooltip>
                        )}
                        {groupedIcons[0].icon2 && (
                          <Tooltip title={groupedIcons[0].icon2.toolTip}>
                            <Box
                              className={styles.bestMoveButton}
                              onClick={groupedIcons[0].icon2.onClick}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {React.createElement(groupedIcons[0].icon2.icon, { sx: { fontSize: 20, color: '#fff' } })}
                            </Box>
                          </Tooltip>
                        )}
                        {groupedIcons[0].icon3 && (
                          <Tooltip title={groupedIcons[0].icon3.toolTip}>
                            <Box
                              className={styles.bestMoveButton}
                              onClick={groupedIcons[0].icon3.onClick}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {React.createElement(groupedIcons[0].icon3.icon, { sx: { fontSize: 20, color: '#fff' } })}
                            </Box>
                          </Tooltip>
                        )}
                        {groupedIcons[0].icon4 && (
                          <Tooltip title={groupedIcons[0].icon4.toolTip}>
                            <Box
                              className={styles.bestMoveButton}
                              onClick={groupedIcons[0].icon4.onClick}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {React.createElement(groupedIcons[0].icon4.icon, { sx: { fontSize: 20, color: '#fff' } })}
                            </Box>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>
                  
                  {/* Second group of icons */}
                  <Box sx={{ display: 'flex', gap: '16px' }}>
                    {groupedIcons[1] && (
                      <>
                        {groupedIcons[1].icon1 && (
                          <Tooltip title={groupedIcons[1].icon1.toolTip}>
                            <Box
                              className={styles.bestMoveButton}
                              onClick={groupedIcons[1].icon1.onClick}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ...(groupedIcons[1].icon1.condition || {})
                              }}
                            >
                              {React.createElement(groupedIcons[1].icon1.icon, { sx: { fontSize: 20, color: '#fff' } })}
                            </Box>
                          </Tooltip>
                        )}
                        {groupedIcons[1].icon2 && (
                          <Tooltip title={groupedIcons[1].icon2.toolTip}>
                            <Box
                              className={styles.bestMoveButton}
                              onClick={groupedIcons[1].icon2.onClick}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ...(groupedIcons[1].icon2.condition || {})
                              }}
                            >
                              {groupedIcons[1].icon2.icon === Typography
                                ? React.createElement(Typography, { 
                                    sx: { 
                                      fontSize: 20,
                                      fontFamily: 'Dancing Script !important',
                                      fontWeight: 'normal',
                                      color: '#fff'
                                    } 
                                  }, groupedIcons[1].icon2.text)
                                : React.createElement(groupedIcons[1].icon2.icon, { sx: { fontSize: 20, color: '#fff' } })}
                            </Box>
                          </Tooltip>
                        )}
                        {groupedIcons[1].icon3 && (
                          <Tooltip title={groupedIcons[1].icon3.toolTip}>
                            <Box
                              className={styles.bestMoveButton}
                              onClick={groupedIcons[1].icon3.onClick}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {React.createElement(groupedIcons[1].icon3.icon, { sx: { fontSize: 20, color: '#fff' } })}
                            </Box>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              </Collapse>
              <PlayerInfo
              mode={mode}
              name1={name1}
              name2={name2}
              revealedName1={revealedName1}
              revealedName2={revealedName2}
              revealedElo={revealedElo}
              revealedElo2={revealedElo2}
              player1points={player1points}
              player2points={player2points}
              moveSet={moveSet}
              currentMoveRef={currentMoveRef}
              origPlayerRaw={origPlayerRaw}
              tiles={tiles}
              color={color}
              onTurnClick={(turn) => {
                if (turn >= 0 && turn < moveSet.length) {
                  // Reset board to initial state
                  setBoardCoords(JSON.parse(origBoard));
                  setPlayer1points(0);
                  setPlayer2points(0);
                  setPointsScored(0);
                  
                  // Calculate pool state by applying all moves up to the selected turn
                  let currentPool = origPool;
                  for (let i = 0; i <= turn; i++) {
                    const move = moveSet[i];
                    if (move) {
                      const parts = move.split(" ");
                      const play = parts[3];
                      if (play && play !== "--") {
                        currentPool = removeFromPool(play, currentPool);
                      }
                    }
                  }                
                  // First remove all moves after the selected turn
                  for (let i = moveSet.length - 1; i > turn; i--) {
                    handleMoveWrapper(
                      moveSet[i - 3],
                      moveSet[i - 2],
                      moveSet[i - 1],
                      moveSet[i],
                      "previous"
                    );
                  }
                  
                  // Then apply all moves up to the selected turn
                  for (let i = 0; i <= turn; i++) {
                    handleMoveWrapper(
                      moveSet[i - 2],
                      moveSet[i - 1],
                      moveSet[i],
                      moveSet[i + 1],
                      "next"
                    );
                  }
                  
                  // Set the pool state after all moves are processed
                  setPool(currentPool);
                  
                  currentMoveRef.current = turn;
                }
              }}
            />
            <LatestMove
              moveSet={moveSet}
              currentMoveRef={currentMoveRef}
              name1={name1}
              name2={name2}
              boardCoords={boardCoords}
              pool={pool}
              currentMoveCoords={currentMoveCoords}
              onTurnClick={(turn) => {
                if (turn >= 0 && turn < moveSet.length) {
                  // Reset board to initial state
                  setBoardCoords(JSON.parse(origBoard));
                  setPlayer1points(0);
                  setPlayer2points(0);
                  setPointsScored(0);
                  
                  // Calculate pool state by applying all moves up to the selected turn
                  let currentPool = origPool;
                  for (let i = 0; i <= turn; i++) {
                    const move = moveSet[i];
                    if (move) {
                      const parts = move.split(" ");
                      const play = parts[3];
                      if (play && play !== "--") {
                        currentPool = removeFromPool(play, currentPool);
                      }
                    }
                  }                
                  // First remove all moves after the selected turn
                  for (let i = moveSet.length - 1; i > turn; i--) {
                    handleMoveWrapper(
                      moveSet[i - 3],
                      moveSet[i - 2],
                      moveSet[i - 1],
                      moveSet[i],
                      "previous"
                    );
                  }
                  
                  // Then apply all moves up to the selected turn
                  for (let i = 0; i <= turn; i++) {
                    handleMoveWrapper(
                      moveSet[i - 2],
                      moveSet[i - 1],
                      moveSet[i],
                      moveSet[i + 1],
                      "next"
                    );
                  }
                  
                  // Set the pool state after all moves are processed
                  setPool(currentPool);
                  
                  currentMoveRef.current = turn;
                }
              }}
            />
            <TopMoves
              boardCoords={boardCoords}
              moveSet={moveSet}
              currentMoveRef={currentMoveRef}
              pool={pool}
              gameDictionary={gameDictionary}
              onMoveSelect={(move) => {
                console.log('Selected move:', move);
                // You could add visualization or highlighting here
              }}
              onSimulateMove={(move) => {
                console.log('Simulate move:', move);
                // You could add simulation functionality here
              }}
              onGetTopMoves={() => {
                console.log('Get top moves clicked');
                // The component handles this internally
              }}
              simulatingMove={null}
            />
            <Box className={styles.poolBox} style={{color: '#fff'}}>
              {moveSet && moveSet.length > 0 ? (
                <Pool board={pool} rack={createRack(moveSet, currentMoveRef.current)}/>  
              ) : (
                <div>Loading pool...</div>
              )}
            </Box>
          </Box>
        </Box>
        </Box>
        

      </Box>   
      {showPlayersModal && (
        <Modal
          open={showPlayersModal}
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
      )}
    </Box>
  );
}
