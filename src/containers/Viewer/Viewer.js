import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Viewer.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import Modal from '@mui/material/Modal';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import { 
  DotsThree,
  Book,
  Eye,
  Brain,
  Info,
  Plus,
  ArrowsLeftRight,
  CaretDown,
  CaretUp,
  Cube,
  ScribbleLoop
} from '@phosphor-icons/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";  
import { getMove, createBoard, highlightPreviousMove } from "../../functions/boardFunctions.js";
import { createRack } from "../../functions/rackFunctions.js";
import { handleMove } from '../../functions/moveHandlers';
import { calculatePoolFromBoard } from '../../functions/poolFunctions';
import { useViewerStore } from '../../stores/viewerStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { revealPlayers, revealElo, revealWooglesElo } from '../../functions/playerFunctions';
import { handleDictionaryTilesOpen, handleRecentGamesOpen, handleGamesHistoryOpen } from '../../utils/modalFunctions';
import { createIconList, createGroupedIcons } from './config/iconConfigs';
import { ThemeContext } from '../../App';
import ModeToggleIcon from '../../components/common/ModeToggleIcon';



// Import components
import PlayerInfo from './components/PlayerInfo';
import LatestMove from './components/LatestMove';
import TopMoves from './components/TopMoves';
import SettingsModal from './components/SettingsModal';
import RecentGamesList from './components/RecentGamesList';
import ViewedGamesList from './components/ViewedGamesList';
import SubmittedGamesModal from './components/SubmittedGamesModal';
import Typography from '@mui/material/Typography';
import BrowsePlayersModal from './components/BrowsePlayersModal';
import AnalysisPanel from '../../components/Analysis/AnalysisPanel';
import { buildGhostOverlayGrid, buildSelectedMoveFrame } from '../../functions/analysisBoardFunctions';

export default function Viewer({ onChange }){ 
  const { lightMode, setLightMode } = React.useContext(ThemeContext);
  const [showOptions, setShowOptions] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showSubmittedGamesModal, setShowSubmittedGamesModal] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [poolExpanded, setPoolExpanded] = useState(false);
  const [telestratorEnabled, setTelestratorEnabled] = useState(false);

  // Helper function to render icons with hover state
  const renderIcon = (iconConfig, hoverId) => {
    const IconComponent = iconConfig.icon;
    return (
      <IconComponent 
        size={iconConfig.size} 
        color={iconConfig.color}
        weight={hoveredIcon === hoverId ? 'fill' : 'regular'}
      />
    );
  };

  // Use Zustand Viewer Store
  const {
    // Game state
    gameNum, setGameNum,
  
    currentMoveCoords, setCurrentMoveCoords,
    boardCoords, setBoardCoords,
    player1points, setPlayer1points,
    player2points, setPlayer2points,
    pointsScored, setPointsScored,
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
    
    // Woogles mode
    wooglesMode, setWooglesMode,
    currentWooglesGame, setCurrentWooglesGame,
    parsedMoves,

    // Analysis Mode
    analysis,
    analysisTopMoves,
    isLoadingAnalysisTopMoves,
    setAnalysisState,
    enterAnalysisMode,
    exitAnalysisMode,
    runAnalysisMovePreview,
    runAnalysisHeatMap,
    runAnalysisOpponentResponses,
    toggleAnalysisLaneCell,
    setAnalysisLaneDragSelection,
    clearAnalysisLaneSelection,
    runAnalysisLaneIsolation,
    fetchAnalysisTopMoves,
    resetAnalysisTopMoves,

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
    chooseGame: chooseGameStore,
    toggleWooglesMode,
    randomizeWooglesGame,
    loadWooglesGameData,
    loadSavedGame
  } = useViewerStore();



  // Get global color scheme - subscribe to the current value
  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);

  const handleMoveWrapper = (superLastMove, lastMove, thisMove, nextMove, type) => {
    const state = {
      setBoardCoords,
      setCurrentMoveCoords,
      setPlayer1points,
      setPlayer2points,
      setPointsScored,
      boardCoords,
      origBoard
    };
    
    // Calculate move indices - these are now just the move indices directly
    const superLastMoveIndex = superLastMove !== null && superLastMove !== undefined ? superLastMove : -1;
    const lastMoveIndex = lastMove !== null && lastMove !== undefined ? lastMove : -1;
    const thisMoveIndex = thisMove !== null && thisMove !== undefined ? thisMove : -1;
    const nextMoveIndex = nextMove !== null && nextMove !== undefined ? nextMove : -1;
    
    handleMove(superLastMoveIndex, lastMoveIndex, thisMoveIndex, nextMoveIndex, type, state, parsedMoves);
  };

  const handleOpenPlayersModal = () => {
    setShowPlayersModal(true);
  };

  const handleClosePlayersModal = () => {
    setShowPlayersModal(false);
  };

  const handleOpenSubmittedGamesModal = () => {
    setShowSubmittedGamesModal(true);
  };

  const handleCloseSubmittedGamesModal = () => {
    setShowSubmittedGamesModal(false);
  };

  const handleLoadGame = async (gameNum) => {
    setShowPlayersModal(false);
    setGameNum(gameNum);
    await loadGameData();
  };

  const handleRevealElo = () => {
    if (wooglesMode && currentWooglesGame) {
      // Use Woogles reveal ELO for Woogles games
      revealWooglesElo(currentWooglesGame.gameId, setRevealedElo, setRevealedElo2);
    } else {
      // Use Cross-Tables reveal ELO for Cross-Tables games
      revealElo(tourneyNum, name1, name2, setRevealedElo, setRevealedElo2);
    }
  };

  // Calculate current pool from board
  const getCurrentPool = () => {
    return calculatePoolFromBoard(boardCoords, origPool);
  };


  // Load initial game data
  useEffect(() => {
    // Check if we're loading a saved game from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const savedGameId = urlParams.get('saved');
    
    if (savedGameId) {
      // Load saved game
      loadSavedGame(savedGameId);
    } else {
      // Load default game
      loadGameData();
    }
  }, []); // Only run once on mount

  // Create board with useMemo like Play.js
  const board = useMemo(() => {
    // Calculate ALL blankTiles from the entire game up to current move
    let calculatedBlankTiles = [];
    
    // Go through all moves up to the current move to find all blank tiles
    for (let moveIndex = 0; moveIndex <= currentMoveRef.current; moveIndex++) {
      const move = parsedMoves[moveIndex];
      if (move) {
        const play = move.word;
        
        if (play && play !== "--" && move.location) {
          // Get the coordinates for this move
          const moveCoords = highlightPreviousMove(move.location, play, boardCoords);
          
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
      "STANDARD", 
      color.current, 
      null, // complementaryColor
      calculatedBlankTiles,
      [],
      lightMode
    );
    return result;
  }, [boardCoords, currentMoveCoords, tiles, lightMode, color.current, currentMoveRef.current, parsedMoves]);



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
            currentMoveRef.current - 2, 
            currentMoveRef.current - 1, 
            currentMoveRef.current, 
            currentMoveRef.current + 1, 
            "previous"
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMoveRef, setMoveDirection, handleMoveWrapper]);

  const iconList = useMemo(() => createIconList(
    beginningOfGameStore,
    currentMoveRef,
    setMoveDirection,
    handleMoveWrapper,
    parsedMoves,
    randomizeGame,
    unlockEloMode,
    showUnlockText,
    switchModeStore,
    mode,
    onChange,
    setBoardCoords,
    origBoard,
    origPool,
    setShowUnlockText,
    setMode,
    wooglesMode,
    randomizeWooglesGame,
    lightMode
  // handleMoveWrapper is a fresh closure every render that captures the
  // current boardCoords directly (Viewer.js's handleMoveWrapper body, above).
  // It has to be a dependency here: without it, this memo only recomputes
  // when lightMode/parsedMoves/mode/wooglesMode change - so the toolbar's
  // CaretLeft/CaretRight buttons could keep calling a handleMoveWrapper
  // closure captured from whatever boardCoords existed the last time this
  // recomputed, silently building the next move on top of a stale board
  // (e.g. right after beginningOfGame resets boardCoords but before anything
  // else forces a recompute).
  ), [lightMode, parsedMoves, mode, wooglesMode, currentMoveRef, handleMoveWrapper]);

  const groupedIcons = useMemo(() => createGroupedIcons(
    handleGamesHistoryOpen,
    handleRecentGamesOpen,
    handleDictionaryTilesOpen,
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
    revealElo,
    toggleWooglesMode,
    wooglesMode,
    currentWooglesGame,
    handleOpenPlayersModal,
    handleRevealElo,
    handleOpenSubmittedGamesModal,
    lightMode
  ), [
    handleGamesHistoryOpen,
    handleRecentGamesOpen,
    handleDictionaryTilesOpen,
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
    revealElo,
    toggleWooglesMode,
    wooglesMode,
    currentWooglesGame,
    handleOpenPlayersModal,
    handleRevealElo,
    handleOpenSubmittedGamesModal,
    lightMode
  ]);

  const actionButtonStyle = {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // State for Cube icon hover
  const [is3DHovered, setIs3DHovered] = useState(false);

  // Analysis Mode - toggle, and reset whenever the viewed position changes so
  // nothing from a previous position lingers. Matches Play: entering Analysis
  // Mode never auto-fetches candidates - the user has to explicitly ask Theo.
  const analysisModeActive = analysis.active;

  const handleToggleAnalysisMode = () => {
    if (analysisModeActive) {
      exitAnalysisMode();
    } else {
      enterAnalysisMode();
    }
  };

  useEffect(() => {
    if (analysis.active) {
      setAnalysisState({ frames: [], stepIndex: 0, heatMap: null, opponentResponses: null, selectedMove: null });
      resetAnalysisTopMoves();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMoveRef.current]);

  const analysisGhostGrid = useMemo(() => {
    if (!analysis.active) return null;
    if (analysis.layer === 'visualize') {
      if (!analysis.frames?.length) return null;
      return buildGhostOverlayGrid(analysis.frames[analysis.stepIndex], boardCoords);
    }
    if (analysis.layer === 'laneIsolation') {
      const frame = analysis.laneResult?.sampleFrame || analysis.frames?.[0] || null;
      return buildGhostOverlayGrid(frame, boardCoords);
    }
    return null;
  }, [analysis.active, analysis.layer, analysis.frames, analysis.stepIndex, analysis.laneResult, boardCoords]);

  const analysisHeatGrid = useMemo(() => {
    if (!analysis.active || analysis.layer !== 'visualize' || !analysis.heatMap || (analysis.frames && analysis.frames.length > 1)) return null;
    return analysis.heatMap.grid;
  }, [analysis.active, analysis.layer, analysis.heatMap, analysis.frames]);

  return (
    <Box className={styles.container}>
      <Sidenav/>
      {/* No header panel, move 3D link to player panel below */}
      {/* Modal and main content */}
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
          {modalContent === "submittedGames" && (
            <SubmittedGamesModal
              open={showSubmittedGamesModal}
              onClose={handleCloseSubmittedGamesModal}
              onLoadGame={handleLoadGame}
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
            <Box className={styles.mainBox}>
              <Board 
                board={board} 
                points={pointsScored} 
                boardMode={boardMode}
                rack={createRack(currentMoveRef.current - 1, parsedMoves).map(char => char === ' ' ? '?' : char).join('')} 
                move={currentMoveRef.current >= 0 ? getMove(parsedMoves[currentMoveRef.current], currentMoveCoords, parsedMoves, currentMoveRef.current) : "N/A"}
                moveDirection={moveDirection} 
                dictionary={gameDictionary} 
                onBoardChildClick={(row, col) => {
                  if (analysis.active && analysis.layer === 'laneIsolation') {
                    toggleAnalysisLaneCell({ row, col });
                  }
                }}
                showDictionary={false}
                commentary={notes.find(([note, moveNumber]) => currentMoveRef.current + 1 === moveNumber && (mode === "VIEWER" || ELOCommentary === "YES"))?.[0]?.trim()}
                lightMode={lightMode}
                animate={false}
                enableTelestrator={telestratorEnabled}
                analysisGhostGrid={analysisGhostGrid}
                analysisGhostDashedBorder={analysis.frames && analysis.frames.length > 1}
                analysisHeatGrid={analysisHeatGrid}
                analysisHeatMaxCount={analysis.heatMap?.maxCount}
                analysisLaneSelection={analysis.layer === 'laneIsolation' ? analysis.laneSelection : null}
                analysisLaneSelectable={analysis.active && analysis.layer === 'laneIsolation' && !!analysis.selectedMove}
                onAnalysisLaneDrag={(ar, ac, cr, cc) => setAnalysisLaneDragSelection({ row: ar, col: ac }, { row: cr, col: cc })}
              />
            </Box>
          </Box>
          <Box className={styles.rightPanel}>

            <Box className={styles.playerPanel} sx={{
              color: lightMode === 'dark' ? '#fff' : '#1F2937',
              paddingTop: '0px',
              background: lightMode === 'dark' 
                ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
                : 'linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.9) 100%)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: 'none',
              backgroundImage: 'none'
            }}>
              {/* Dictionary and Platform Info */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 0',
                fontSize: '14px',
                fontWeight: 500,
                color: lightMode === 'dark' ? '#fff' : '#1F2937'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Book 
                    size={16} 
                    color={lightMode === 'dark' ? "#fff" : "#1F2937"} 
                    style={{ opacity: 0.8 }} 
                    weight="regular"
                  />
                  <span>{gameDictionary}</span>
                </Box>
                <span style={{opacity: lightMode === 'dark' ? 0.4 : 0.5}}>•</span>
                <span>
                  {wooglesMode ? 'Woogles' : 'Cross-Tables'}
                </span>
              </Box>
              
              <Box className={styles.playerToggle}>
                {/* Main navigation icons - Row 1 */}
                {iconList.map((icon, index) => {
                  // Insert Cube icon after the forward icon (CaretRight, index 2)
                  const isAfterForward = index === 2;
                  // Indices 0-2 are the three move-navigation icons (beginning
                  // of game, back, forward) - freeze them while analyzing so
                  // the position being analyzed can't shift out from under you.
                  const isNavDisabledForAnalysis = analysisModeActive;
                  return (
                    <React.Fragment key={`icon-${index}`}>
                      <Tooltip title={isNavDisabledForAnalysis ? "Exit Analysis Mode to navigate" : icon.toolTip}>
                        <Box
                          className={styles.Arrows}
                          onClick={() => {
                            if (isNavDisabledForAnalysis) return;
                            icon.onClick();
                          }}
                          onMouseEnter={() => setHoveredIcon(`nav-${index}`)}
                          onMouseLeave={() => setHoveredIcon(null)}
                          sx={{
                            opacity: isNavDisabledForAnalysis ? 0.3 : 1,
                            cursor: isNavDisabledForAnalysis ? 'not-allowed' : 'pointer',
                            pointerEvents: isNavDisabledForAnalysis ? 'none' : 'auto'
                          }}
                        >
                          <icon.icon
                            size={icon.size}
                            color={lightMode === 'dark' ? '#fff' : '#1F2937'}
                            weight={hoveredIcon === `nav-${index}` ? 'fill' : 'regular'}
                          />
                        </Box>
                      </Tooltip>
                      {isAfterForward && gameNum && (
                        <Tooltip title="View in 3D">
                          <Box
                            className={styles.Arrows}
                            onClick={() => window.open(`/3dviewer?gameId=${gameNum}`, '_blank')}
                            onMouseEnter={() => setIs3DHovered(true)}
                            onMouseLeave={() => setIs3DHovered(false)}
                            style={{ marginLeft: 2, marginRight: 2 }}
                          >
                            <Cube size={20} color={lightMode === 'dark' ? "#60A5FA" : "#3B82F6"} weight={is3DHovered ? 'fill' : 'regular'} />
                          </Box>
                        </Tooltip>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Collapsible options button */}
                <Tooltip title={showOptions ? "Hide Options" : "Show Options"}>
                  <Box
                    className={styles.keyBtn}
                    onClick={() => setShowOptions(!showOptions)}
                    sx={{
                      ...actionButtonStyle,
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      minHeight: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: showOptions ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <DotsThree
                      size={20}
                      color={lightMode === 'dark' ? '#fff' : '#1F2937'}
                      weight={hoveredIcon === 'dots' ? 'fill' : 'regular'}
                      onMouseEnter={() => setHoveredIcon('dots')}
                      onMouseLeave={() => setHoveredIcon(null)}
                    />
                  </Box>
                </Tooltip>
              </Box>

              {/* Collapsible options section */}
              <Collapse in={showOptions}>
                <Box className={styles.bestMoveSection} sx={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                  
                  {/* Tier 1 - Crucial Controls */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <Box sx={{ fontSize: '12px', color: lightMode === 'dark' ? '#fff' : '#1F2937', opacity: 0.7, fontWeight: 500 }}>Main</Box>
                    <Box sx={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <Tooltip title={wooglesMode ? 
                        (mode === "VIEWER" ? "Switch to Guess ELO (Woogles)" : "Switch to Viewer (Woogles)") :
                        (mode === "VIEWER" ? "Switch to Guess ELO (XT)" : "Switch to Viewer (XT)")
                      }>
                        <Box
                          className={styles.bestMoveButton}
                          onClick={() => (!unlockEloMode ? setShowUnlockText(true) : switchModeStore(onChange))}
                          onMouseEnter={() => setHoveredIcon('mode')}
                          onMouseLeave={() => setHoveredIcon(null)}
                        >
                          <ArrowsLeftRight 
                            size={20} 
                            color={lightMode === 'dark' ? "#fff" : "#1F2937"} 
                            weight={hoveredIcon === 'mode' ? 'fill' : 'regular'}
                          />
                        </Box>
                      </Tooltip>
                      
                      <Tooltip title={wooglesMode ? "New Woogles game" : "New XT game"}>
                        <Box
                          className={styles.bestMoveButton}
                          onClick={wooglesMode ? randomizeWooglesGame : randomizeGame}
                          onMouseEnter={() => setHoveredIcon('new')}
                          onMouseLeave={() => setHoveredIcon(null)}
                        >
                          <Plus 
                            size={20} 
                            color={lightMode === 'dark' ? "#fff" : "#1F2937"} 
                            weight={hoveredIcon === 'new' ? 'fill' : 'regular'}
                          />
                        </Box>
                      </Tooltip>
                      
                      <Tooltip title={wooglesMode ? "Switch to XT" : "Switch to Woogles"}>
                        <Box
                          className={styles.bestMoveButton}
                          onClick={toggleWooglesMode}
                          onMouseEnter={() => setHoveredIcon('platform')}
                          onMouseLeave={() => setHoveredIcon(null)}
                        >
                          <ModeToggleIcon wooglesMode={wooglesMode} />
                        </Box>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  {/* Tier 2 - Additional Controls */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <Box sx={{ fontSize: '12px', color: lightMode === 'dark' ? '#fff' : '#1F2937', opacity: 0.7, fontWeight: 500 }}>Additional</Box>
                    <Box sx={{ display: 'flex', gap: '50px', justifyContent: 'center' }}>
                      {/* First group of icons */}
                      <Box sx={{ display: 'flex', gap: '4px' }}>
                        {groupedIcons[0] && (
                          <>
                            {groupedIcons[0].icon1 && (
                              <Tooltip title={groupedIcons[0].icon1.toolTip}>
                                <Box
                                  className={styles.bestMoveButton}
                                  onClick={groupedIcons[0].icon1.onClick}
                                  onMouseEnter={() => setHoveredIcon('group1-icon1')}
                                  onMouseLeave={() => setHoveredIcon(null)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {renderIcon(groupedIcons[0].icon1, 'group1-icon1')}
                                </Box>
                              </Tooltip>
                            )}
                            {groupedIcons[0].icon2 && (
                              <Tooltip title={groupedIcons[0].icon2.toolTip}>
                                <Box
                                  className={styles.bestMoveButton}
                                  onClick={groupedIcons[0].icon2.onClick}
                                  onMouseEnter={() => setHoveredIcon('group1-icon2')}
                                  onMouseLeave={() => setHoveredIcon(null)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {renderIcon(groupedIcons[0].icon2, 'group1-icon2')}
                                </Box>
                              </Tooltip>
                            )}
                            {groupedIcons[0].icon3 && (
                              <Tooltip title={groupedIcons[0].icon3.toolTip}>
                                <Box
                                  className={styles.bestMoveButton}
                                  onClick={groupedIcons[0].icon3.onClick}
                                  onMouseEnter={() => setHoveredIcon('group1-icon3')}
                                  onMouseLeave={() => setHoveredIcon(null)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {renderIcon(groupedIcons[0].icon3, 'group1-icon3')}
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
                                  {React.createElement(groupedIcons[0].icon4.icon, { sx: { fontSize: 20, color: lightMode === 'dark' ? '#fff' : '#1F2937' } })}
                                </Box>
                              </Tooltip>
                            )}
                            {groupedIcons[0].icon5 && (
                              <Tooltip title={groupedIcons[0].icon5.toolTip}>
                                <Box
                                  className={styles.bestMoveButton}
                                  onClick={groupedIcons[0].icon5.onClick}
                                  onMouseEnter={() => setHoveredIcon('group1-icon5')}
                                  onMouseLeave={() => setHoveredIcon(null)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {renderIcon(groupedIcons[0].icon5, 'group1-icon5')}
                                </Box>
                              </Tooltip>
                            )}
                            {groupedIcons[0].icon6 && (
                              <Tooltip title={groupedIcons[0].icon6.toolTip}>
                                <Box
                                  className={styles.bestMoveButton}
                                  onClick={groupedIcons[0].icon6.onClick}
                                  onMouseEnter={() => setHoveredIcon('group1-icon6')}
                                  onMouseLeave={() => setHoveredIcon(null)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    ...(groupedIcons[0].icon6.condition || {})
                                  }}
                                >
                                  {renderIcon(groupedIcons[0].icon6, 'group1-icon6')}
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
                                  onMouseEnter={() => setHoveredIcon('group2-icon1')}
                                  onMouseLeave={() => setHoveredIcon(null)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    ...(groupedIcons[1].icon1.condition || {})
                                  }}
                                >
                                  {renderIcon(groupedIcons[1].icon1, 'group2-icon1')}
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
                                    ? <Typography sx={{ fontSize: 20, fontFamily: '"Dancing Script", cursive !important', fontWeight: 500, color: lightMode === 'dark' ? '#fff' : '#1F2937', opacity: 0.8 }}>Elo</Typography>
                                    : React.createElement(groupedIcons[1].icon2.icon, { sx: { fontSize: 20, color: lightMode === 'dark' ? '#fff' : '#1F2937' } })}
                                </Box>
                              </Tooltip>
                            )}
                            {groupedIcons[1].icon3 && (
                              <Tooltip title={groupedIcons[1].icon3.toolTip}>
                                <Box
                                  className={styles.bestMoveButton}
                                  onClick={groupedIcons[1].icon3.onClick}
                                  onMouseEnter={() => setHoveredIcon('group2-icon3')}
                                  onMouseLeave={() => setHoveredIcon(null)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {renderIcon(groupedIcons[1].icon3, 'group2-icon3')}
                                </Box>
                              </Tooltip>
                            )}
                            {groupedIcons[1].icon4 && (
                              <Tooltip title={groupedIcons[1].icon4.toolTip}>
                                <Box
                                  className={styles.bestMoveButton}
                                  onClick={groupedIcons[1].icon4.onClick}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    ...(groupedIcons[1].icon4.condition || {})
                                  }}
                                >
                                  {React.createElement(groupedIcons[1].icon4.icon, { sx: { fontSize: 20, color: lightMode === 'dark' ? '#fff' : '#1F2937' } })}
                                </Box>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Tier 3 - Drawing & Analysis Tools */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <Box sx={{ fontSize: '12px', color: lightMode === 'dark' ? '#fff' : '#1F2937', opacity: 0.7, fontWeight: 500 }}>Tools</Box>
                    <Box sx={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                      <Tooltip title={telestratorEnabled ? "Disable drawing" : "Enable drawing"}>
                        <Box
                          className={styles.bestMoveButton}
                          onClick={() => setTelestratorEnabled(!telestratorEnabled)}
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <ScribbleLoop
                            size={20}
                            color={telestratorEnabled
                              ? (lightMode === 'dark' ? '#10B981' : '#059669')
                              : (lightMode === 'dark' ? '#ffffff' : '#1F2937')
                            }
                            weight={telestratorEnabled ? 'fill' : 'regular'}
                          />
                        </Box>
                      </Tooltip>

                      {parsedMoves && parsedMoves.length > 0 && (
                        <Tooltip title={analysisModeActive ? "Exit Analysis Mode" : "Analysis Mode"}>
                          <Box
                            className={styles.bestMoveButton}
                            onClick={handleToggleAnalysisMode}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Brain
                              size={20}
                              weight={analysisModeActive ? 'fill' : 'regular'}
                              color={analysisModeActive ? '#10B981' : (lightMode === 'dark' ? '#fff' : '#1F2937')}
                            />
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Collapse>
              {analysisModeActive ? (
                <AnalysisPanel
                  analysisState={analysis}
                  onSelectMove={runAnalysisMovePreview}
                  onSetSelectedMove={(move) => setAnalysisState({ selectedMove: move, frames: [buildSelectedMoveFrame(move, boardCoords)], stepIndex: 0, heatMap: null, error: null, laneSelection: [], laneResult: null })}
                  onSetLayer={(layer) => setAnalysisState({ layer, frames: [], stepIndex: 0, heatMap: null, opponentResponses: null })}
                  onStep={(stepIndex) => setAnalysisState({ stepIndex })}
                  onRunHeatMap={runAnalysisHeatMap}
                  onRunOpponentResponses={runAnalysisOpponentResponses}
                  onClearLaneSelection={clearAnalysisLaneSelection}
                  onRunLaneIsolation={runAnalysisLaneIsolation}
                  onGetTopMoves={fetchAnalysisTopMoves}
                  topMoves={analysisTopMoves}
                  isLoadingTopMoves={isLoadingAnalysisTopMoves}
                  lightMode={lightMode}
                  boardCoords={boardCoords}
                />
              ) : (
              <>
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
              currentMoveRef={currentMoveRef}
              origPlayerRaw={origPlayerRaw}
              tiles={tiles}
              color={color}
              parsedMoves={parsedMoves}
              onTurnClick={(turn) => {
                if (turn >= 0 && turn < parsedMoves.length) {
                  // Reset board to initial state
                  setBoardCoords(JSON.parse(origBoard));
                  setPlayer1points(0);
                  setPlayer2points(0);
                  setPointsScored(0);
                  
                  // Apply all moves up to the selected turn
                  for (let i = 0; i <= turn; i++) {
                    handleMoveWrapper(
                      i - 2,
                      i - 1,
                      i,
                      i + 1,
                      "next"
                    );
                  }
                  
                  currentMoveRef.current = turn;
                }
              }}
            />
            <LatestMove
              currentMoveRef={currentMoveRef}
              name1={name1}
              name2={name2}
              boardCoords={boardCoords}
              currentMoveCoords={currentMoveCoords}
              parsedMoves={parsedMoves}
              gameNum={gameNum}
              lightMode={lightMode}
              onTurnClick={(turn) => {
                if (turn >= 0 && turn < parsedMoves.length) {
                  // Reset board to initial state
                  setBoardCoords(JSON.parse(origBoard));
                  setPlayer1points(0);
                  setPlayer2points(0);
                  setPointsScored(0);
                  
                  // Apply all moves up to the selected turn
                  for (let i = 0; i <= turn; i++) {
                    handleMoveWrapper(
                      i - 2,
                      i - 1,
                      i,
                      i + 1,
                      "next"
                    );
                  }
                  
                  currentMoveRef.current = turn;
                }
              }}
            />
            <TopMoves
              boardCoords={boardCoords}
              blankTiles={blankTiles}
              currentMoveRef={currentMoveRef}
              parsedMoves={parsedMoves}
              pool={getCurrentPool()}
              gameDictionary={gameDictionary}
              lightMode={lightMode}
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
              </>
              )}
            {/* Collapsible Pool Section */}
            <Box 
              className={styles.poolBox} 
              sx={{
                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                background: lightMode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%)',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderRadius: '8px',
                boxShadow: lightMode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
                },
                marginTop: '8px',
                marginBottom: poolExpanded ? '8px' : '0'
              }}
              onClick={() => setPoolExpanded(!poolExpanded)}
            >
              {/* Pool Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: poolExpanded ? '8px' : '0'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {parsedMoves && parsedMoves.length > 0 ? (
                    <span>
                      {getCurrentPool().length}
                      {createRack(currentMoveRef.current, parsedMoves).length > 0 && (
                        <span style={{ opacity: 0.7 }}> • {createRack(currentMoveRef.current, parsedMoves).length} on rack</span>
                      )}
                    </span>
                  ) : (
                    <span>Pool</span>
                  )}
                </Box>
                <Box sx={{ color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4B5563', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  {poolExpanded ? <ExpandLessIcon style={{ fontSize: 18 }} /> : <ExpandMoreIcon style={{ fontSize: 18 }} />}
                </Box>
              </Box>
              
              {/* Pool Content */}
              {poolExpanded && (
                <Collapse in={poolExpanded}>
                  <Box sx={{ 
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '8px'
                  }}>
                    {parsedMoves && parsedMoves.length > 0 ? (
                      <Pool 
                        board={getCurrentPool()}
                        rack={createRack(currentMoveRef.current + 1, parsedMoves)}
                      />  
                    ) : (
                      <div>Loading pool...</div>
                    )}
                  </Box>
                </Collapse>
              )}
            </Box>
          </Box>
        </Box>
        </Box>
        

      </Box>   
            <BrowsePlayersModal 
        open={showPlayersModal}
        onClose={handleClosePlayersModal}
        onLoadGame={handleLoadGame}
      />
      <SubmittedGamesModal 
        open={showSubmittedGamesModal}
        onClose={handleCloseSubmittedGamesModal}
        onLoadGame={handleLoadGame}
      />
    </Box>
  );
}
