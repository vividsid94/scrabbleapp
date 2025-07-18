import React, { useEffect, useRef, useMemo, useState } from "react";
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
import { handleTileDrop, handleTileClick } from '../../functions/play/tileFunctions';
import { handleBoardPositionSelect } from "../../functions/play/boardFunctions.js";
import { formatTime } from '../../functions/play/timeUtils';
import { useGameStore } from '../../stores/gameStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { initializeSounds, updateSoundType } from '../../functions/play/soundFunctions';
import { preWarmGoService, stopPeriodicWarmup } from '../../functions/play/botFunctions';

export default function Play() {
  // Use Zustand Game Store
  const {
    // Board state
    boardCoords,
    tempBoardCoords,
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
    setPlayer1Rack,
    setPlayer2Rack,
    setPlayer1Name,
    setPlayer2Name,
    
    // Game state
    pool,
    gameStarted,
    gameEnded,
    isBotMode,
    setGameEnded,
    
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
    
    // Bot state
    isBotThinking,
    isPlayerThinking,

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
    
    // Dictionary loading
    isDictionaryLoading,
    
    // Auto-play
    autoPlayBest,
    isAutoPlaying,
    setAutoPlayBest,
    setIsAutoPlaying,
    
    // Victory state
    winner,
    
    // Simulation state
    simulatingMove,
    simulationResult,
    simulationProgress,
    previewBoard,
    previewTileOwnership,
    moveWithResults,
    simulationBoard,
    showSimulationModal,
    allMoveResults,
    isSimulatingAllMoves,
    previewScore,
    previewScorePosition,
    isHeatMapMode,
    heatMapData,
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
    
    // UI state
    theme,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showTimeSlider,
    showConfetti,
    showVictoryOverlay,
    setSnackbarOpen,
    setShowTimeSlider,
    
    // Settings state
    playerMoveSoundType,
    botMoveSoundType,
    
    // New store actions
    initializeGame,
    handleNewGame,
    startTimer,
    handleMoveSelectClick,
    handleConfettiComplete,
    runSimulation,
    
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

  // Get global color scheme - subscribe to the current value
  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);

  // Refs (keep these local)
  const complementaryColor = useRef('#9F7A83');
  const timerRef = useRef(null);
  const botMoveMadeRef = useRef(false);

  // Initialize sounds (simplified) - only once
  const [sounds, setSounds] = useState(null);
  
  useEffect(() => {
    const soundObjects = initializeSounds() || {};
    setSounds(soundObjects);
  }, []);

  // Pre-warm the Go service when component mounts
  useEffect(() => {
    preWarmGoService();
    
    // Cleanup function to stop periodic warmup when component unmounts
    return () => {
      stopPeriodicWarmup();
    };
  }, []);

  const { gameStartSound, playerMoveSound, botMoveSound } = sounds || {};

  // Initialize game using store action
  useEffect(() => {
    if (sounds) {
      initializeGame(origBoard, origPool, TEST_RACKS, gameStartSound, botMoveSound);
    }
  }, [sounds]);

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
    if (isBotMode && currentPlayer === 2 && !isBotThinking && !gameEnded && !botMoveMadeRef.current) {
      botMoveMadeRef.current = true;
      makeBotMove(botMoveSound);
    }
  }, [currentPlayer, isBotMode, isBotThinking, gameEnded, gameStarted]);

  // Reset bot move flag when player changes to 1
  useEffect(() => {
    if (currentPlayer === 1) {
      botMoveMadeRef.current = false;
    }
  }, [currentPlayer]);

  // Reset bot move flag when game starts (for new games)
  useEffect(() => {
    if (gameStarted) {
      botMoveMadeRef.current = false;
    }
  }, [gameStarted, isBotMode, currentPlayer]);

  // Reset bot move flag when bot mode is enabled
  useEffect(() => {
    if (isBotMode) {
      botMoveMadeRef.current = false;
    }
  }, [isBotMode]);

  // Wrapper function to pass sound objects to handleBotModeToggle
  const handleBotModeToggleWithSounds = () => {
    handleBotModeToggle(gameStartSound, botMoveSound);
  };

  // Update sound types when they change in settings
  useEffect(() => {
    if (playerMoveSound && playerMoveSoundType) {
      const playerMoveSoundRef = { current: playerMoveSound };
      updateSoundType(playerMoveSoundRef, playerMoveSoundType, 'player');
      // Update the local sound object
      Object.assign(playerMoveSound, playerMoveSoundRef.current);
    }
  }, [playerMoveSoundType]);

  useEffect(() => {
    if (botMoveSound && botMoveSoundType) {
      const botMoveSoundRef = { current: botMoveSound };
      updateSoundType(botMoveSoundRef, botMoveSoundType, 'bot');
      // Update the local sound object
      Object.assign(botMoveSound, botMoveSoundRef.current);
    }
  }, [botMoveSoundType]);

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
    // Safety check for null/undefined board coordinates
    if (!tempBoardCoords || !boardCoords) {
      return [];
    }
    
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
  }, [tempBoardCoords, boardCoords, theme, color.current, boardColor.current, blankTiles, lastMoveCoordinates]);

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
            onBotModeToggle={handleBotModeToggleWithSounds}
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
          previewBoard={previewBoard}
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
        heatMapData={heatMapData}
        isHeatMapMode={isHeatMapMode}
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