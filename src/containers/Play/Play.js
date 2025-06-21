import React, { useEffect, useRef, useMemo} from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Play.module.css';
import Board from "../../components/AppContent/Board/Board.js";
import PlayPool from "../../components/AppContent/Board/PlayPool.js";
import { origPool, origBoard, letterLookup } from "../../components/AppContent/References/staticData.js";
import { TEST_RACKS } from "../../components/AppContent/References/testRacks.js";
import { createBoard } from "../../functions/boardFunctions.js";
import { Snackbar, Alert, Tooltip } from "@mui/material";
import SimulationModal from '../../components/Modals/SimulationModal';
import GameModal from '../../components/Modals/GameModal';
import PlayerInfo from './components/PlayerInfo';
import Confetti from '../../components/Confetti/Confetti';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import { simulateMove as simulateMoveFunction, runHeatMapSimulation as runHeatMapSimulationFunction, runAllMovesSimulation as runAllMovesSimulationFunction, runSimulation as runSimulationFunction, openSimulationModal as openSimulationModalFunction, stopSimulation as stopSimulationFunction, resetHeatMapMode as resetHeatMapModeFunction, switchToMetrics as switchToMetricsFunction } from '../../functions/simulationFunctions';
import { initializeSounds, updateSoundType, handleSoundError } from '../../functions/play/soundFunctions';
import { alphabetizeRack } from '../../functions/play/rackFunctions';
import { handleTileDrop, handleTileClick } from '../../functions/play/tileFunctions';
import { handleBoardPositionSelect } from "../../functions/play/boardFunctions.js";
import { handleKeyDown, handleKeyPress } from '../../functions/play/keyboardFunctions';
import { makeBotMove, startBotGame } from '../../functions/play/botFunctions';
import { calculateLeave, fetchLeaveValues, calculateExchangeLeave } from '../../functions/play/leaveFunctions';
import { handleExchange } from '../../functions/play/exchangeFunctions';
import { handleWordSubmit } from '../../functions/play/wordSubmitFunctions';
import { handleGetTopMoves, handlePlayTopMove, generateExchangeCombinations, fetchBoardControl } from '../../functions/play/moveFunctions';
import { generateRandomRack } from '../../functions/moveFunctions';
import { getBoardDiff } from '../../functions/play/boardUtils';
import { handlePass } from '../../functions/play/passFunctions';
import { handleGameEnd } from '../../functions/play/gameEndFunctions';
import { formatTime } from '../../functions/play/timeUtils';
import { useGameStore } from '../../stores/gameStore';

const boardMultipliers = JSON.parse(origBoard);

export default function Play() {
  // Use Zustand Game Store
  const {
    // Board state
    boardCoords,
    tempBoardCoords,
    origBoardCoords,
    setBoardCoords,
    setTempBoardCoords,
    setOrigBoardCoords,
    
    // Player state
    player1points,
    player2points,
    player1Rack,
    player2Rack,
    player1Name,
    player2Name,
    currentPlayer,
    setPlayer1points,
    setPlayer2points,
    setPlayer1Rack,
    setPlayer2Rack,
    setPlayer1Name,
    setPlayer2Name,
    setCurrentPlayer,
    
    // Game state
    pool,
    gameStarted,
    gameEnded,
    isBotMode,
    consecutivePasses,
    setPool,
    setGameStarted,
    setGameEnded,
    setIsBotMode,
    setConsecutivePasses,
    
    // Tile and selection state
    selectedTiles: selectedTilesArray,
    selectedBoardPosition,
    arrowDirection,
    tilesToExchange,
    blankTiles,
    setSelectedTiles,
    setSelectedBoardPosition,
    setArrowDirection,
    setTilesToExchange,
    setBlankTiles,
    
    // Bot state
    isBotThinking,
    isPlayerThinking,
    botGoesFirst,
    setIsBotThinking,
    setIsPlayerThinking,
    setBotGoesFirst,
    
    // Timer state
    player1Time,
    player2Time,
    timerActive,
    gameTime,
    setPlayer1Time,
    setPlayer2Time,
    setTimerActive,
    setGameTime,
    
    // Move history
    moveHistory,
    topMoves,
    isLoadingTopMoves,
    setMoveHistory,
    setTopMoves,
    setIsLoadingTopMoves,
    
    // Dictionary loading
    isDictionaryLoading,
    setIsDictionaryLoading,
    
    // Auto-play
    autoPlayBest,
    isAutoPlaying,
    setAutoPlayBest,
    setIsAutoPlaying,
    
    // Victory state
    winner,
    finalPlayer1Score,
    finalPlayer2Score,
    setWinner,
    setFinalPlayer1Score,
    setFinalPlayer2Score,
    
    // Simulation state
    simulatingMove,
    simulationResult,
    simulationProgress,
    previewBoard,
    previewMove,
    previewTileOwnership,
    moveWithResults,
    simulationBoard,
    leaveValues,
    showSimulationModal,
    shouldStopSimulation,
    allMoveResults,
    isSimulatingAllMoves,
    previewScore,
    previewScorePosition,
    setSimulatingMove,
    setSimulationResult,
    setSimulationProgress,
    setPreviewBoard,
    setPreviewMove,
    setPreviewTileOwnership,
    setMoveWithResults,
    setSimulationBoard,
    setLeaveValues,
    setShowSimulationModal,
    setShouldStopSimulation,
    setAllMoveResults,
    setIsSimulatingAllMoves,
    setPreviewScore,
    setPreviewScorePosition,
    
    // UI state
    theme,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showTimeSlider,
    showConfetti,
    showVictoryOverlay,
    setTheme,
    setSnackbarOpen,
    setSnackbarMessage,
    setSnackbarSeverity,
    setShowTimeSlider,
    setShowConfetti,
    setShowVictoryOverlay,
    
    // Settings state
    playerMoveSoundType,
    botMoveSoundType,
    setPlayerMoveSoundType,
    setBotMoveSoundType,
    
    // Computed values
    getCurrentRack,
    getCurrentPlayerName,
    getCurrentPlayerPoints,
    setCurrentPlayerPoints,
    setCurrentPlayerRack,
    
    // Utility functions
    getBoardDiff,
    
    // New store actions
    initializeGame,
    startBotGame,
    handleVictory,
    handleNewGame,
    startTimer,
    handlePass,
    handleExchange,
    handleWordSubmit,
    handlePlayTopMove,
    getTopMovesForExpandable,
    handleMoveSelectClick,
    calculatePreviewScore,
    handleConfettiComplete,
    runSimulation,
    getSelectedTiles,
    
    // UI handler functions
    handleSettingsOpen,
    handleColorSchemeOpen,
    handleWordSubmitClick,
    handlePassClick,
    handleExchangeClick,
    handlePlayTopMoveClick,
    handleBotModeToggle,
    
    // Simulation handler functions
    openSimulationModal,
    resetHeatMapMode,
    stopSimulation,
    simulateMove,
    runAllMovesSimulation,
    runHeatMapSimulation,
    handleGetTopMovesForExpandable,
    
    // Utility functions
    limitMoveHistory,
    updatePreviewScore,
    fetchLeaveValuesForTopMoves,
    checkDictionary,
    
    // Keyboard event handlers
    handleKeyDownWrapper,
    handleKeyPressWrapper,
    
    // Time slider handler
    handleTimeSliderMouseDown,
    
    // Bot move handler
    makeBotMove,
  } = useGameStore();

  // Refs (keep these local)
  const color = useRef('#b064af');
  const boardColor = useRef('#ffffff');
  const complementaryColor = useRef('#9F7A83');
  const timerRef = useRef(null);

  // Initialize sounds
  const sounds = useRef(initializeSounds());
  const gameStartSound = useRef(sounds.current.gameStartSound);
  const playerMoveSound = useRef(sounds.current.playerMoveSound);
  const botMoveSound = useRef(sounds.current.botMoveSound);

  // Add error handlers for sounds
  useEffect(() => {
    if (!gameStartSound.current || !playerMoveSound.current || !botMoveSound.current) {
      const newSounds = initializeSounds();
      gameStartSound.current = newSounds.gameStartSound;
      playerMoveSound.current = newSounds.playerMoveSound;
      botMoveSound.current = newSounds.botMoveSound;
    }

    gameStartSound.current.addEventListener('error', () => 
      handleSoundError(gameStartSound.current, 'game start', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );
    playerMoveSound.current.addEventListener('error', () => 
      handleSoundError(playerMoveSound.current, 'player move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );
    botMoveSound.current.addEventListener('error', () => 
      handleSoundError(botMoveSound.current, 'bot move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
    );

    return () => {
      if (gameStartSound.current) {
        gameStartSound.current.removeEventListener('error', () => 
          handleSoundError(gameStartSound.current, 'game start', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
      if (playerMoveSound.current) {
        playerMoveSound.current.removeEventListener('error', () => 
          handleSoundError(playerMoveSound.current, 'player move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
      if (botMoveSound.current) {
        botMoveSound.current.removeEventListener('error', () => 
          handleSoundError(botMoveSound.current, 'bot move', setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen)
        );
      }
    };
  }, []);

  // Update audio refs when sound type changes
  useEffect(() => {
    if (playerMoveSound.current && playerMoveSoundType) {
      updateSoundType(playerMoveSound, playerMoveSoundType, 'player');
    }
  }, [playerMoveSoundType]);

  useEffect(() => {
    if (botMoveSound.current && botMoveSoundType) {
      updateSoundType(botMoveSound, botMoveSoundType, 'bot');
    }
  }, [botMoveSoundType]);

  // Initialize game using store action
  useEffect(() => {
    initializeGame(origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound);
  }, []);

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setOrigBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    setTempBoardCoords(JSON.parse(JSON.stringify(parsedOrigBoardCoords)));
    
    // Check dictionary loading state on mount
    checkDictionary();
  }, []);

  // Update useEffect to handle keyboard events
  useEffect(() => {
    const handleKeyDownWrapperWithParams = (e) => {
      handleKeyDownWrapper(e, playerMoveSound, origBoard);
    };

    window.addEventListener('keydown', handleKeyDownWrapperWithParams);
    return () => {
      window.removeEventListener('keydown', handleKeyDownWrapperWithParams);
    };
  }, [handleKeyDownWrapper, playerMoveSound, origBoard]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPressWrapperWithParams = (event) => {
      handleKeyPressWrapper(event, playerMoveSound, origBoard);
    };

    window.addEventListener('keydown', handleKeyPressWrapperWithParams);
    return () => {
      window.removeEventListener('keydown', handleKeyPressWrapperWithParams);
    };
  }, [handleKeyPressWrapper, playerMoveSound, origBoard]);

  // Update the useEffect for bot turns to use the new makeBotMove
  useEffect(() => {
    if (isBotMode && currentPlayer === 2 && !isBotThinking && !gameEnded) {
      makeBotMove(botMoveSound);
    }
  }, [currentPlayer, isBotMode, isBotThinking, gameEnded, makeBotMove, botMoveSound]);

  // Update player2Name when isBotMode changes
  useEffect(() => {
    setPlayer1Name(isBotMode ? 'You' : 'Player 1');
    setPlayer2Name(isBotMode ? 'SidBot' : 'Player 2');
  }, [isBotMode]);

  // Start timer when game starts or player changes
  useEffect(() => {
    if (gameStarted) {
      setTimerActive(true);
    }
  }, [currentPlayer, gameStarted]);

  // Start timer when it's a player's turn
  useEffect(() => {
    return startTimer(timerRef);
  }, [timerActive, currentPlayer, gameStarted]);

  // Get the latest move from move history
  const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  // Extract coordinates of the last played move for highlighting
  const lastMoveCoordinates = useMemo(() => {
    if (!latestMove || !latestMove.boardDiff) {
      return [];
    }
    
    // Extract coordinates from boardDiff
    return latestMove.boardDiff.map(tile => ({
      row: tile.row,
      col: tile.col
    }));
  }, [latestMove]);

  const board = useMemo(() => {
    return createBoard(
      tempBoardCoords.map((row, rowIndex) => 
        row.map((col, colIndex) => {
          // If there's a temporary move, use that
          if (typeof col === 'string') {
            return col;
          }
          // Otherwise use the committed board state
          return boardCoords[rowIndex][colIndex];
        })
      ),
      [], 
      "PROTILES", 
      theme, 
      color.current, 
      complementaryColor.current, 
      blankTiles,
      lastMoveCoordinates
    );
  }, [tempBoardCoords, boardCoords, theme, blankTiles, lastMoveCoordinates]);

  // Update player time states when gameTime changes
  useEffect(() => {
    setPlayer1Time(gameTime * 60);
    setPlayer2Time(gameTime * 60);
  }, [gameTime]);

  // Update the useEffect for auto-play to use isPlayerThinking
  useEffect(() => {
    if (autoPlayBest && gameStarted && currentPlayer === 1 && !isLoadingTopMoves && !isDictionaryLoading && !isAutoPlaying && !isPlayerThinking && !gameEnded) {
      setIsAutoPlaying(true);
      handlePlayTopMoveClick().finally(() => {
        setIsAutoPlaying(false);
      });
    }
  }, [autoPlayBest, gameStarted, currentPlayer, isLoadingTopMoves, isDictionaryLoading, handlePlayTopMoveClick, isAutoPlaying, isPlayerThinking, gameEnded]);

  // Add cleanup effect for all temporary states
  useEffect(() => {
    return () => {
      // Clear all state
      setBoardCoords([]);
      setTempBoardCoords([]);
      setOrigBoardCoords([]);
      setMoveHistory([]);
      setTopMoves([]);
      setSimulatingMove(null);
      setSimulationResult(null);
      setSimulationProgress(0);
      setPreviewBoard(null);
      setPreviewMove(null);
      setMoveWithResults(null);
      setLeaveValues({}); // Clear leave values cache
      setSelectedTiles([]);
      setSelectedBoardPosition(null);
      setArrowDirection('right');
      setGameEnded(false); // Reset game ended state
    };
  }, []);

  // Modify the existing code that sets topMoves to also fetch leave values
  useEffect(() => {
    fetchLeaveValuesForTopMoves();
  }, [topMoves]);

  // Add effect to limit move history size more aggressively
  useEffect(() => {
    limitMoveHistory();
  }, [moveHistory]);

  // Add effect to calculate preview score when tiles are placed
  useEffect(() => {
    updatePreviewScore();
  }, [selectedTilesArray, tempBoardCoords]);

  return (
    <Box className={styles.container}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box className={styles.mainPanel}>
          <Box className={styles.title}>
            <Box className={styles.gameTitle}>
              <Box className={styles.playModeTitle}>
                Playground+
              </Box>
            </Box>
          </Box>
          <Box className={styles.leftContainer}>
            <Box className={`${styles.mainBox} ${styles.mainBoxContent}`} component="main">
              <Board 
                board={board}
                boardMode={theme}
                onBoardChildClick={(row, col) => handleBoardPositionSelect({
                  row,
                  col,
                  boardCoords,
                  selectedBoardPosition,
                  setSelectedBoardPosition,
                  arrowDirection,
                  setArrowDirection
                })}
                onTileDrop={(tile, index, row, col) => handleTileDrop({
                  tile,
                  index,
                  row,
                  col,
                  player1Rack,
                  setPlayer1Rack,
                  player2Rack,
                  setPlayer2Rack,
                  selectedTilesArray,
                  setSelectedTiles,
                  setSelectedBoardPosition,
                  tempBoardCoords,
                  setTempBoardCoords
                })}
                onTileClick={(tile, index) => handleTileClick({
                  tile,
                  index,
                  currentPlayer,
                  player1Rack,
                  player2Rack,
                  selectedTilesArray,
                  setSelectedTiles,
                  tilesToExchange,
                  setTilesToExchange
                })}
                selectedPosition={selectedBoardPosition}
                arrowDirection={arrowDirection}
                onArrowDirectionChange={(newDirection) => {
                    console.log('Play component received direction change:', newDirection);
                    setArrowDirection(newDirection);
                }}
                animate={false}
                showSlip={false}
                showDictionary={false}
                dictionary=""
                previewScore={previewScore}
                previewScorePosition={previewScorePosition}
                lastMoveCoordinates={lastMoveCoordinates}
              />   
            </Box>
          </Box>

          <Box className={styles.rightPanel}>
            <PlayerInfo
              player1Name={player1Name}
              player2Name={player2Name}
              player1Points={player1points}
              player2Points={player2points}
              player1Time={formatTime(player1Time || 0)}
              player2Time={formatTime(player2Time || 0)}
              currentPlayer={currentPlayer}
              player1Rack={player1Rack}
              player2Rack={player2Rack}
              color={color}
              onTileClick={(tile, index) => handleTileClick({
                tile,
                index,
                currentPlayer,
                player1Rack,
                player2Rack,
                selectedTilesArray,
                setSelectedTiles,
                tilesToExchange,
                setTilesToExchange
              })}
              selectedTiles={tilesToExchange}
              isBotMode={isBotMode}
              gameStarted={gameStarted}
              isDictionaryLoading={isDictionaryLoading}
              isLoadingTopMoves={isLoadingTopMoves}
              onSettingsOpen={handleSettingsOpen}
              onColorSchemeOpen={handleColorSchemeOpen}
              onBotModeToggle={handleBotModeToggle}
              onGetTopMoves={handleGetTopMovesForExpandable}
              onWordSubmit={handleWordSubmitClick}
              onPass={handlePassClick}
              onExchange={handleExchangeClick}
              onPlayTopMove={handlePlayTopMoveClick}
              selectedBoardPosition={selectedBoardPosition}
              tilesToExchange={tilesToExchange}
              autoPlayBest={autoPlayBest}
              setAutoPlayBest={setAutoPlayBest}
              isBotThinking={isBotThinking}
              isPlayerThinking={isPlayerThinking}
              latestMove={latestMove}
              moveHistory={moveHistory}
              topMoves={topMoves}
              onMoveSelect={handleMoveSelectClick}
              onSimulateMove={simulateMove}
              onOpenSimulationModal={openSimulationModal}
              simulatingMove={simulatingMove}
              boardCoords={boardCoords}
              pool={pool}
              icons={{
                settings: <TuneIcon className={styles.keyBtn} />,
                colorScheme: <PaletteIcon className={styles.keyBtn} />,
                time: (
                  <Tooltip title={gameStarted ? "Game time cannot be changed after game starts" : "Set game time"}>
                    <TimerIcon 
                        className={`${styles.keyBtn} ${styles.timerIcon} ${showTimeSlider ? styles.active : ''} ${gameStarted ? styles.disabled : ''}`}
                      onClick={() => !gameStarted && setShowTimeSlider(!showTimeSlider)}
                    />
                  </Tooltip>
                ),
                botMode: <SmartToyIcon 
                    className={`${styles.keyBtn} ${styles.botIcon} ${isBotMode ? styles.active : ''} ${isBotMode && currentPlayer === 2 ? styles.thinking : ''}`}
                />,
                topMoves: <LightbulbIcon className={styles.keyBtn} />,
              }}
            />

            {showTimeSlider && !gameStarted && (
                <Box className={styles.timeSliderContainer}>
                  <Box className={styles.timeSliderLabel}>
                  Game Time: {gameTime} min
                </Box>
                  <Box className={styles.timeSliderWrapper}>
                    {[5, 15, 25, 30].map((value) => (
                      <Box
                        key={value}
                        className={styles.timeSliderMark}
                        style={{ left: `${((value - 5) / 25) * 100}%` }}
                      />
                    ))}
                    <Box
                      className={styles.timeSliderThumb}
                      style={{ left: `${((gameTime - 5) / 25) * 100}%` }}
                      onMouseDown={(e) => handleTimeSliderMouseDown(e, setGameTime)}
                    />
                </Box>
              </Box>
            )}

            <Box className={styles.playerPanel}>
              <Box className={styles.poolBox}>
                <PlayPool 
                  pool={pool} 
                  player1Rack={player1Rack} 
                  player2Rack={player2Rack}
                  gameStarted={gameStarted}
                />  
              </Box>
            </Box>
          </Box>
        </Box>

        <GameModal />

        <Snackbar 
          open={snackbarOpen} 
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          autoHideDuration={snackbarMessage === 'Loading dictionary.. (up to 30s)' ? null : 3000}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity={snackbarSeverity}
            className={styles.snackbarAlert}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <SimulationModal
          open={showSimulationModal}
          onClose={() => {
            setShowSimulationModal(false);
            setSimulationBoard(null);
            setPreviewMove(null);
            setPreviewTileOwnership(null);
            setMoveWithResults(null);
            resetHeatMapMode();
          }}
          simulationBoard={previewBoard || simulationBoard}
          previewTileOwnership={previewTileOwnership}
          theme={theme}
          color={color}
          complementaryColor={complementaryColor}
          blankTiles={blankTiles}
          simulatingMove={simulatingMove}
          simulationProgress={simulationProgress}
          simulationResult={simulationResult}
          moveWithResults={moveWithResults}
          onStartSimulation={runSimulation}
          onStartHeatMap={runHeatMapSimulation}
          onStopSimulation={stopSimulation}
          onSwitchToMetrics={() => {}}
          heatMapData={simulationBoard}
          isHeatMapMode={!!simulationBoard}
          simulationSettings={{
            numSimulations: 5,
            turnsPerSim: 1
          }}
          onSimulationSettingsChange={(newSettings) => {
            // This function is now empty as the state is managed by the simulation store
          }}
          topMoves={topMoves}
          onMoveSelect={handleMoveSelectClick}
          onRunAllMovesSimulation={runAllMovesSimulation}
          allMoveResults={allMoveResults}
          isSimulatingAllMoves={isSimulatingAllMoves}
        />

        {/* Victory Celebration Components */}
        <Confetti
          winner={winner}
          isVisible={showConfetti}
          onComplete={handleConfettiComplete}
        />
        
        {/* Floating Victory Message */}
        {showVictoryOverlay && (
          <Box className={styles.victoryOverlay}>
            <Box className={`${styles.victoryCard} ${winner === 'player' ? styles.victoryCardPlayer : styles.victoryCardBot}`}>
              <Box className={styles.victoryIcon}>
                {winner === 'player' ? '🏆' : '🤖'}
              </Box>
              <Box className={styles.victoryTitle}>
                {winner === 'player' ? 'It\'s a huge, huge win!' : 'The bot got the best of you!'}
              </Box>
              <Box className={styles.victorySubtitle}>
                {winner === 'player' ? '' : ''}
              </Box>
              <Box className={`${styles.victoryScore} ${winner === 'player' ? styles.victoryScorePlayer : styles.victoryScoreBot}`}>
                {winner === 'player' ? '' : ''}
              </Box>
              
              {/* Rematch Button */}
              <Box
                onClick={handleNewGame}
                className={styles.rematchButton}
              >
                Rematch
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
} 