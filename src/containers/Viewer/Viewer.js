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

export default function Viewer({ onChange }){ 
  const { lightMode, setLightMode } = React.useContext(ThemeContext);
  const [showOptions, setShowOptions] = useState(false);
  
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
    </Box>
  );
}
