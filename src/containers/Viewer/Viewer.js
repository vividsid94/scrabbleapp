import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Viewer.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import Modal from '@mui/material/Modal';
import Tooltip from '@mui/material/Tooltip';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";  
import { getMove, createBoard } from "../../functions/boardFunctions.js";
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
import SettingsModal from './components/SettingsModal';
import RecentGamesList from './components/RecentGamesList';
import ViewedGamesList from './components/ViewedGamesList';

export default function Viewer({ onChange }){ 
  const { lightMode, setLightMode } = React.useContext(ThemeContext);
  
  // Use Zustand Viewer Store
  const {
    // Game state
    gameNum, setGameNum,
    boardClickCount, setBoardClickCount,
    moveSet, setMoveSet,
    currentMoveCoords, setCurrentMoveCoords,
    boardCoords, setBoardCoords,
    player1points, setPlayer1points,
    player2points, setPlayer2points,
    pointsScored, setPointsScored,
    pool, setPool,
    mode, setMode,
    resetCount, setResetCount,
    moveDirection, setMoveDirection,
    boardMode, setBoardMode,
    tiles, setTiles,
    dictionary, setDictionary,
    ELOCommentary, setELOCommentary,
    open, setOpen,
    gameDictionary, setGameDictionary,
    currentMoveRef,
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

  const toggleLightMode = () => {
    setLightMode(lightMode === 'dark' ? 'light' : 'dark');
  };

  // Load initial game data
  useEffect(() => {
    loadGameData();
  }, []); // Only run once on mount

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
        <Box className={styles.title}>
          {mode === "VIEWER" ? "Annotated Game Viewer" : "Guess the Elo!"}
          <button 
            onClick={toggleLightMode}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: lightMode === 'dark' ? '#fff' : '#000'
            }}
          >
            {lightMode === 'dark' ? '☀️' : '🌙'}
          </button>
        </Box>
        <Box className={styles.mainPanel}>
          <Box className={styles.mainBox} component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Board 
              board={createBoard(boardCoords, currentMoveCoords, tiles, lightMode, color.current)} 
              points={pointsScored} 
              boardMode={boardMode}
              rack={createRack(moveSet, currentMoveRef.current - 1).map(char => char === ' ' ? '?' : char).join('')} 
              move={getMove(moveSet[currentMoveRef.current], currentMoveCoords)}
              moveDirection={moveDirection} 
              dictionary={gameDictionary} 
              onBoardChildClick={() => {}}
            />   
          </Box>
          <Box className={styles.rightPanel}>
            <Box className={styles.topPlayerPanel}>
              <Box sx={{flexDirection: 'column', lineHeight: '0px'}} className={`${styles.playerPanel}`} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
                <Box className={styles.playerToggle}>
                  {iconList.map((icon, index) => (
                    <Tooltip key={`icon-${index}`} title={icon.toolTip}>
                      <icon.icon
                        className={styles.Arrows} 
                        onClick={icon.onClick}
                        sx={{color: lightMode === 'dark' ? '#fff' : '#000'}}
                      />
                    </Tooltip>
                  ))}
                  {groupedIcons.map((group, index) => (
                    <Box key={`group-${index}`} className={styles.groupedBox}>
                      {group.icon1 && (
                        <Tooltip key={`tooltip-1-${index}`} title={group.icon1.toolTip}>
                          <group.icon1.icon 
                            className={styles.keyBtn} 
                            onClick={group.icon1.onClick}
                            sx={{
                              color: lightMode === 'dark' ? '#fff' : '#000',
                              ...(group.icon1.condition || {})
                            }}
                          />
                        </Tooltip>
                      )}
                      {group.icon2 && (
                        <Tooltip key={`tooltip-2-${index}`} title={group.icon2.toolTip}>
                          <group.icon2.icon 
                            className={styles.keyBtn} 
                            onClick={group.icon2.onClick}
                            sx={{
                              color: lightMode === 'dark' ? '#fff' : '#000',
                              ...(group.icon2.condition || {})
                            }}
                          >
                            {group.icon2.text}
                          </group.icon2.icon>
                        </Tooltip>
                      )}
                      {group.icon3 && (
                        <Tooltip key={`tooltip-3-${index}`} title={group.icon3.toolTip}>
                          <group.icon3.icon 
                            className={styles.keyBtn} 
                            onClick={group.icon3.onClick}
                            sx={{color: lightMode === 'dark' ? '#fff' : '#000'}}
                          />
                        </Tooltip>
                      )}
                      {group.icon4 && (
                        <Tooltip key={`tooltip-4-${index}`} title={group.icon4.toolTip}>
                          <group.icon4.icon 
                            className={styles.keyBtn} 
                            onClick={group.icon4.onClick}
                            sx={{color: lightMode === 'dark' ? '#fff' : '#000'}}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box className={styles.playerPanel} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
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
                <Box className={styles.poolBox} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
                  {moveSet && moveSet.length > 0 ? (
                    <Pool board={pool} rack={createRack(moveSet, currentMoveRef.current)}/>  
                  ) : (
                    <div>Loading pool...</div>
                  )}
                </Box>
                <Box className={styles.commentaryContainer} style={{color: lightMode === 'dark' ? '#fff' : '#000'}}>
                  {notes.map(([note, moveNumber], index) => (
                    <Box className={styles.commentaryBox} key={index} style={{ display: currentMoveRef.current + 1 === moveNumber && (mode === "VIEWER" || ELOCommentary === "YES") ? 'block' : 'none' }}>
                      "{note.trim()}"
                    </Box>
                  ))}
                </Box>
              </Box> 
            </Box>
          </Box>
        </Box>  
      </Box>   
    </Box>
  );
}
