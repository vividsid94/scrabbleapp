import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Viewer.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import Modal from '@mui/material/Modal';
import Tooltip from '@mui/material/Tooltip';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";  
import { getMoveSet, getRecentGameInfo, getGameInfo, getCustomPlayerGameInfo } from "../../axios/api.js";
import { getMove, createBoard } from "../../functions/boardFunctions.js";
import { createRack } from "../../functions/rackFunctions.js";
import { handleMove } from '../../functions/moveHandlers';
import { useGameState } from './hooks/useGameState';
import { handleBoardClick, switchMode, beginningOfGame, chooseGame } from '../../functions/gameControls';
import { revealPlayers, revealElo } from '../../functions/playerFunctions';
import { handleDictionaryTilesOpen, handleColorSchemeOpen, handleRecentGamesOpen, handleGamesHistoryOpen } from '../../utils/modalFunctions';

// Import icons
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import ColorizeIcon from '@mui/icons-material/Colorize';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import GroupIcon from '@mui/icons-material/Group';
import LaunchIcon from '@mui/icons-material/Launch';
import HistoryIcon from '@mui/icons-material/History';
import YoutubeSearchedForIcon from '@mui/icons-material/YoutubeSearchedFor';
import Typography from '@mui/material/Typography';

// Import components
import PlayerInfo from './components/PlayerInfo';
import SettingsModal from './components/SettingsModal';
import RecentGamesList from './components/RecentGamesList';
import ColorScheme from './components/ColorScheme';
import ViewedGamesList from './components/ViewedGamesList';

export default function Viewer({ onChange }){ 
  const {
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
    theme,
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
    complementaryColor,
    customPlayerMode,
    showUnlockText, setShowUnlockText,
    origPlayerRaw, setOrigPlayerRaw,
    notes, setNote,
    gamesViewed, setGamesViewed,
    recentNames, setRecentNames,
    recentDictionaries, setRecentDictionaries,
    recentGameNums, setRecentGameNums,
    loadingMsg, setLoadingMsg,
    modalContent, setModalContent,
    randomizeGame,
    loadGameData
  } = useGameState(onChange);

  const handleClose = () => setOpen(false);

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

  const handleCustomPlayerMode = (event) => {
    customPlayerMode.current = event.target.value;
  };

  const handleDictionaryChange = event => {
    setDictionary(event.target.value);
    customPlayerMode.current = "";
  };

  const handleELOCommentaryChange = event => {
    setELOCommentary(event.target.value);
  };

  const handleTileChange = event => {
    setTiles(event.target.value);
  };

  const switchValue = () => {
    setDictionary("ANY");
  };

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  const iconList = [  
    {icon: KeyboardDoubleArrowLeftIcon, toolTip: "Beginning of game", onClick: () => beginningOfGame(setBoardCoords, currentMoveRef, setPool, origBoard, origPool)},  
    {icon: KeyboardArrowLeftIcon, toolTip: "Move back", onClick: () => {
      if (currentMoveRef.current > -1) {
        currentMoveRef.current -= 1;
        setMoveDirection("backward");
        handleMoveWrapper(moveSet[currentMoveRef.current - 2], moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "previous");
      }
    }},
    {icon: KeyboardArrowRightIcon, toolTip: "Move forward", onClick: () => {
      if (currentMoveRef.current + 1 < moveSet.length) {
        currentMoveRef.current += 1;
        setMoveDirection("forward");
        handleMoveWrapper(moveSet[currentMoveRef.current - 2], moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "next");
      }
    }},
    {icon: FiberNewIcon, toolTip: "New game", onClick: randomizeGame},
    {icon: SwapHorizIcon, onClick: () => (!unlockEloMode ? setShowUnlockText(true) : switchMode(mode, setMode, onChange, randomizeGame)), condition: {color: !unlockEloMode ? 'transparent' : 'white', background: !unlockEloMode ? 'repeating-linear-gradient(45deg, #3D3B35, #3D3B35 5px, #767266 5px, #767266 10px)' : 'none'}}
  ];

  const groupedIcons = [
    {
      icon1: {icon: YoutubeSearchedForIcon, onClick: () => handleGamesHistoryOpen(setModalContent, setOpen)},
      icon2: {icon: HistoryIcon, onClick: () => handleRecentGamesOpen(setModalContent, setOpen)},
      icon3: {icon: SettingsOutlinedIcon, onClick: () => handleDictionaryTilesOpen(setModalContent, setOpen)},
      icon4: {icon: ColorizeIcon, onClick: () => handleColorSchemeOpen(setModalContent, setOpen)}
    }
  ];

  const groupedIcons2 = [
    {
      icon1: {icon: GroupIcon, onClick: () => revealPlayers(name1, name2, setRevealedName1, setRevealedName2), condition: {display: mode === "GUESSELO" ? 'flex' : 'none'}},
      icon2: {icon: Typography, onClick: () => revealElo(tourneyNum, name1, name2, setRevealedElo, setRevealedElo2), text: 'Elo', condition: {display: mode === "GUESSELO" ? 'flex' : 'none'}},
      icon3: {icon: LaunchIcon, onClick: () => window.open('https://www.cross-tables.com/annotated.php?u=' + gameNum, '_blank')}
    }
  ];

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
            />
          )}
          {modalContent === "colorScheme" && (
            <ColorScheme
              color={color}
              complementaryColor={complementaryColor}
            />
          )}
          {modalContent === "recentGames" && (
            <RecentGamesList
              recentNames={recentNames}
              recentDictionaries={recentDictionaries}
              recentGameNums={recentGameNums}
              chooseGame={(gameNum) => chooseGame(gameNum, currentMoveRef, setResetCount, setGameNum, resetCount)}
              mode={mode}
              handleClose={handleClose}
            />
          )}
          {modalContent === "gamesHistory" && (
            <ViewedGamesList
              gamesViewed={gamesViewed}
              chooseGame={(gameNum) => chooseGame(gameNum, currentMoveRef, setResetCount, setGameNum, resetCount)}
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
        </Box>
        <Box className={styles.mainPanel}>
          <Box className={styles.mainBox} component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Board 
              onBoardChildClick={() => handleBoardClick(boardClickCount, setBoardClickCount, setUnlockEloMode)} 
              moveDirection={moveDirection} 
              dictionary={gameDictionary} 
              board={createBoard(boardCoords, currentMoveCoords, tiles, theme, color.current, complementaryColor.current)} 
              points={pointsScored} 
              theme={theme} 
              rack={createRack(moveSet, currentMoveRef.current - 1).map(char => char === ' ' ? '?' : char).join('')} 
              move={getMove(moveSet[currentMoveRef.current], currentMoveCoords)}
            />   
          </Box>

          <Box className={styles.rightPanel}>
            <Box className={styles.topPlayerPanel}>
              <Box sx={{flexDirection: 'column', lineHeight: '0px'}} className={`${styles.playerPanel}`}>
                <Box className={styles.playerToggle}>
                  {iconList.map((icon, index) => (
                    <Tooltip key={`icon-${index}`} title={icon.toolTip}>
                      <icon.icon
                        className={styles.Arrows} 
                        onClick={icon.onClick}
                        sx={icon.condition}
                      />
                    </Tooltip>
                  ))}
                </Box>
                <Box sx={{display: showUnlockText && !unlockEloMode ? 'flex' : 'none'}} className={styles.unlockText}>
                  Hit the board {6 - boardClickCount} {(6 - boardClickCount) === 1 ? 'more time' : 'more times'} to unlock me!
                </Box>
                <Box sx={{padding: '8px 0px'}} className={`${styles.playerPanel} ${styles.playerToggle}`}>
                  {groupedIcons.map((group, index) => (
                    <Box key={`group-${index}`} className={styles.groupedBox}>
                      <Tooltip key={`tooltip-1-${index}`} title="Games you viewed">
                        <group.icon1.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon1.onClick}
                        />
                      </Tooltip>
                      <Tooltip key={`tooltip-2-${index}`} title="Recents on XT">
                        <group.icon2.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon2.onClick}
                        />
                      </Tooltip>
                      <Tooltip key={`tooltip-3-${index}`} title="Settings">
                        <group.icon3.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon3.onClick}
                        />
                      </Tooltip>
                      <Tooltip key={`tooltip-4-${index}`} title="Colors">
                        <group.icon4.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon4.onClick}
                        />
                      </Tooltip>
                    </Box>
                  ))}
                  {groupedIcons2.map((group, index) => (
                    <Box key={`group2-${index}`} className={styles.groupedBox}>
                      <Tooltip key={`tooltip2-1-${index}`} title="Reveal players">
                        <group.icon1.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon1.onClick}
                          sx={group.icon1.condition}
                        />
                      </Tooltip>
                      <Tooltip key={`tooltip2-2-${index}`} title="Reveal ELO">
                        <group.icon2.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon2.onClick}
                          sx={group.icon2.condition}
                        >{group.icon2.text}
                        </group.icon2.icon>
                      </Tooltip>
                      <Tooltip key={`tooltip2-3-${index}`} title="View on XT">
                        <group.icon3.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon3.onClick}
                        />
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </Box> 
              <Box className={styles.playerPanel}>
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
                />
              </Box> 
            </Box>
            <Box className={styles.playerPanel}>
              <Box className={styles.commentaryContainer}>
                {notes.map(([note, moveNumber], index) => (
                  <Box className={styles.commentaryBox} key={index} style={{ display: currentMoveRef.current + 1 === moveNumber && (mode === "VIEWER" || ELOCommentary === "YES") ? 'block' : 'none' }}>
                    "{note.trim()}"
                  </Box>
                ))}
              </Box>  
              <Box className={styles.poolBox}>
                <Pool board={pool} rack={createRack(moveSet, currentMoveRef.current)}/>  
              </Box>
            </Box>  
          </Box>
        </Box>  
      </Box>   
    </Box>
  );
}
