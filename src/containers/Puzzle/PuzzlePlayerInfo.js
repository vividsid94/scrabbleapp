import React from 'react';
import Box from '@mui/material/Box';
import { Tooltip } from "@mui/material";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import Rack from '../../components/AppContent/Board/Rack.js';
import LatestMove from '../Play/components/LatestMove.js';
import { usePuzzleStore } from '../../stores/puzzleStore';
import styles from './Puzzle.module.css';

// Memoized LatestMove component that only subscribes to what it needs
const MemoizedLatestMove = React.memo(() => {
  const moveHistory = usePuzzleStore(state => state.moveHistory);
  const player1Name = usePuzzleStore(state => state.player1Name);
  const player2Name = usePuzzleStore(state => state.player2Name);
  const boardCoords = usePuzzleStore(state => state.boardCoords);
  const player1Rack = usePuzzleStore(state => state.player1Rack);
  const player2Rack = usePuzzleStore(state => state.player2Rack);
  const pool = usePuzzleStore(state => state.pool);

  const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  return (
    <LatestMove 
      latestMove={latestMove} 
      player1Name={player1Name} 
      player2Name={player2Name}
      allMoves={moveHistory}
      boardCoords={boardCoords}
      player1Rack={player1Rack}
      player2Rack={player2Rack}
      pool={pool}
    />
  );
});

const PuzzlePlayerInfo = React.memo(() => {
  // Subscribe to board-related state only where it's needed
  const selectedTiles = usePuzzleStore(state => state.selectedTiles);
  const selectedRackTiles = usePuzzleStore(state => state.selectedRackTiles);
  const tilesToExchange = usePuzzleStore(state => state.tilesToExchange);
  const selectedBoardPosition = usePuzzleStore(state => state.selectedBoardPosition);
  const arrowDirection = usePuzzleStore(state => state.arrowDirection);
  
  // Subscribe to other needed state
  const currentPlayer = usePuzzleStore(state => state.currentPlayer);
  const player1Rack = usePuzzleStore(state => state.player1Rack);
  const player2Rack = usePuzzleStore(state => state.player2Rack);
  const player1Name = usePuzzleStore(state => state.player1Name);
  const player2Name = usePuzzleStore(state => state.player2Name);
  const player1points = usePuzzleStore(state => state.player1points);
  const player2points = usePuzzleStore(state => state.player2points);
  const player1Time = usePuzzleStore(state => state.player1Time);
  const player2Time = usePuzzleStore(state => state.player2Time);
  const gameStarted = usePuzzleStore(state => state.gameStarted);
  const isBotThinking = usePuzzleStore(state => state.isBotThinking);
  const isPausedForBingo = usePuzzleStore(state => state.isPausedForBingo);
  const puzzleMode = usePuzzleStore(state => state.puzzleMode);
  const storedTopMoves = usePuzzleStore(state => state.storedTopMoves);
  const isFastPlayMode = usePuzzleStore(state => state.isFastPlayMode);
  const isExecutingFastPlay = usePuzzleStore(state => state.isExecutingFastPlay);
  const gameEnded = usePuzzleStore(state => state.gameEnded);
  
  // Subscribe to actions
  const {
    handlePuzzleTileClick,
    handleBoardPositionSelect,
    submitPuzzleGuess,
    clearPuzzlePlacement,
    setShowAllBingos,
    setIsFastPlayMode,
    setIsManuallyPaused,
    setShowSettingsPanel,
    handleBotModeToggle,
    continueBingoMove,
    setBingoMove,
    setIsPausedForBingo,
    setPuzzleMode,
    startBotGame,
  } = usePuzzleStore();

  // Local state
  const [isManuallyPaused, setIsManuallyPausedLocal] = React.useState(false);
  const [showSettingsPanel, setShowSettingsPanelLocal] = React.useState(false);
  const [showAllBingos, setShowAllBingosLocal] = React.useState(false);

  const currentRack = currentPlayer === 1 ? player1Rack : player2Rack;
  const currentName = currentPlayer === 1 ? player1Name : player2Name;
  const currentPoints = currentPlayer === 1 ? player1points : player2points;
  const currentTime = currentPlayer === 1 ? player1Time : player2Time;
  
  // Conditional tile click handler - only allow when paused for puzzle
  const handleTileClick = (tile, index) => {
    console.log('🎯 Tile clicked:', { tile, index, isPausedForBingo });
    if (isPausedForBingo) {
      handlePuzzleTileClick(tile, index);
    }
  };

  // Resume after bingo challenge
  const handleResume = () => {
    console.log('🔄 handleResume called', { isPausedForBingo });
    
    if (isPausedForBingo) {
      // Continue the bingo move
      console.log('🎯 Continuing bingo move');
      continueBingoMove();
    } else {
      // Resume from manual pause
      console.log('⏸️ Resuming from manual pause');
      setIsPausedForBingo(false);
      setBingoMove(null);
    }
    
    // Hide the bingos list when resuming
    setShowAllBingosLocal(false);
  };

  // Handle puzzle mode change
  const handlePuzzleModeChange = (newMode) => {
    if (newMode !== puzzleMode) {
      setPuzzleMode(newMode);
      setShowSettingsPanelLocal(false);
      setIsManuallyPausedLocal(false); // Resume game
      // Start a new game with the new mode
      startBotGame();
    }
  };

  return (
    <Box className={styles.playerPanel}>
      <Box className={styles.playerToggle}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {null} {/* No time icon in puzzle mode */}
        </Box>
        <Tooltip title={gameStarted ? "Start New SidBot vs SidBot Game" : "Start SidBot vs SidBot Game"}>
          <Box
            onClick={() => handleBotModeToggle()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '4px',
              cursor: 'pointer'
            }}
          >
            <SmartToyIcon 
              className={`${styles.keyBtn} ${styles.botIcon} ${styles.startIcon} ${gameStarted ? styles.active : ''} ${isBotThinking ? styles.thinking : ''}`}
              style={{ 
                fontSize: 24, 
                cursor: 'pointer',
                color: gameStarted ? '#FF9800' : '#4CAF50'
              }}
            />
          </Box>
        </Tooltip>
        <Tooltip title="Puzzle Mode">
          <Box
            onClick={() => {
              const newShowSettings = !showSettingsPanel;
              setShowSettingsPanelLocal(newShowSettings);
              // Pause game when settings open, resume when closed
              setIsManuallyPausedLocal(newShowSettings);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '4px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <ViewModuleIcon 
              className={`${styles.keyBtn} ${styles.settingsIcon} ${showSettingsPanel ? styles.active : ''}`}
              style={{ 
                fontSize: 24, 
                cursor: 'pointer'
              }}
            />
            <Box sx={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: '#4CAF50',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {puzzleMode === 'bingo' ? '1' : 
               puzzleMode === 'only-bingo' ? '2' : 
               puzzleMode === 'significant-best' ? '3' : '4'}
            </Box>
          </Box>
        </Tooltip>
        <Tooltip title={isFastPlayMode ? "Fast Play On" : "Fast Play Off"}>
          <Box
            onClick={() => setIsFastPlayMode(!isFastPlayMode)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '4px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Box 
              className={`${styles.keyBtn} ${isFastPlayMode ? styles.active : ''}`}
              style={{ 
                fontSize: 24, 
                cursor: 'pointer',
                color: isFastPlayMode ? '#FF9800' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 'bold'
              }}
            >
              <FlashOnIcon style={{ fontSize: 24 }} />
            </Box>
            {isFastPlayMode && (
              <Box sx={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#FF9800',
                borderRadius: '50%',
                width: '12px',
                height: '12px'
              }} />
            )}
          </Box>
        </Tooltip>
        {gameStarted && (
          <Tooltip title={isManuallyPaused ? "Resume Game" : "Pause Game"}>
            <Box
              onClick={() => setIsManuallyPausedLocal(!isManuallyPaused)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '6px',
                cursor: 'pointer'
              }}
            >
              {isManuallyPaused ? (
                <PlayArrowIcon 
                  className={`${styles.keyBtn} ${styles.pauseIcon} ${styles.active}`}
                  style={{ 
                    fontSize: 24, 
                    cursor: 'pointer'
                  }}
                />
              ) : (
                <PauseIcon 
                  className={`${styles.keyBtn} ${styles.pauseIcon}`}
                  style={{ 
                    fontSize: 24, 
                    cursor: 'pointer'
                  }}
                />
              )}
            </Box>
          </Tooltip>
        )}
      </Box>

      {gameStarted && (
        <Box className={styles.playerPanel}>
          <Box className={styles.playerInfo}>
            <Box className={styles.playerName} style={{ minWidth: '120px', textAlign: 'center' }}>
              {currentName}
              <Box component="span" className={styles.thinkingEmoji} style={{ 
                visibility: isBotThinking ? 'visible' : 'hidden',
                marginLeft: '4px'
              }}>
                {currentPlayer === 1 ? '🤔' : '🧠'}
              </Box>
              {isExecutingFastPlay && (
                <Box component="span" style={{ 
                  marginLeft: '4px',
                  fontSize: '12px',
                  color: '#FF9800',
                  fontWeight: 'bold'
                }}>
                  ⚡ Fast Playing...
                </Box>
              )}
            </Box>
          </Box>
          <Box style={{ marginTop: '12px' }}>
            {currentRack && currentRack.length > 0 && (
              <Box className={styles.Rack}>
                <Rack 
                  rack={currentRack} 
                  color="#7878a4" 
                  onTileClick={handleTileClick}
                  selectedTiles={isPausedForBingo ? selectedRackTiles : tilesToExchange}
                />
              </Box>
            )}
          </Box>
        </Box>
      )}

      <MemoizedLatestMove />

      {/* Bingo challenge section */}
      {isPausedForBingo && (
        <Box className={styles.playerPanel} style={{ 
          marginTop: '16px',
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <Box style={{ textAlign: 'center', marginBottom: '12px' }}>
            <Box style={{ fontSize: '14px', marginBottom: '8px' }}>
              {currentPlayer === 1 ? player1Name : player2Name} found a {puzzleMode === 'bingo' || puzzleMode === 'only-bingo' ? 'bingo' : 'significant play'}!
            </Box>
            <Box style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.8 }}>
              {puzzleMode === 'only-bingo' 
                ? 'There is only one. Can you find it?'
                : puzzleMode === 'bingo'
                ? 'Can you find the best one?'
                : puzzleMode === 'significant-best'
                ? 'The best move is significant. Can you find it?'
                : puzzleMode === 'non-bingo-significant'
                ? 'The best non-bingo move is significant. Can you find it?'
                : 'Can you find the best move?'
              }
            </Box>
            
            {/* Instructions */}
            <Box style={{ 
              fontSize: '11px', 
              marginBottom: '12px', 
              opacity: 0.7,
              padding: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px'
            }}>
              <Box style={{ marginBottom: '4px', fontWeight: 'bold' }}>How to play:</Box>
              <Box>• Place your guess on the board, or reveal the answer by clicking the button below.</Box>
            </Box>
            
            <Box style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={handleResume} 
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                  e.target.style.transform = 'scale(1) translateY(0)';
                }}
                style={{ 
                  flex: '1',
                  minWidth: '120px',
                  fontSize: 12, 
                  padding: '8px 12px', 
                  borderRadius: 0, 
                  cursor: 'pointer',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Syne, sans-serif',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                Show Answer & Continue
              </button>
              <button 
                onClick={() => {
                  console.log('🎯 Submit button clicked');
                  submitPuzzleGuess();
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(145deg, rgba(76,175,80,0.3), rgba(76,175,80,0.2))';
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(145deg, rgba(76,175,80,0.2), rgba(76,175,80,0.1))';
                  e.target.style.transform = 'scale(1) translateY(0)';
                }}
                style={{ 
                  flex: '1',
                  minWidth: '120px',
                  fontSize: 12, 
                  padding: '8px 12px', 
                  borderRadius: 0, 
                  cursor: 'pointer',
                  background: 'linear-gradient(145deg, rgba(76,175,80,0.2), rgba(76,175,80,0.1))',
                  color: 'white',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Syne, sans-serif',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                Submit Guess
              </button>
              <button 
                onClick={clearPuzzlePlacement}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                  e.target.style.transform = 'scale(1) translateY(0)';
                }}
                style={{ 
                  flex: '1',
                  minWidth: '120px',
                  fontSize: 12, 
                  padding: '8px 12px', 
                  borderRadius: 0, 
                  cursor: 'pointer',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Syne, sans-serif',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                Clear
              </button>
              {puzzleMode === 'bingo' && (
                <button 
                  onClick={() => setShowAllBingosLocal(!showAllBingos)}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                    e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                    e.target.style.transform = 'scale(1) translateY(0)';
                  }}
                  style={{ 
                    flex: '1',
                    minWidth: '120px',
                    fontSize: 12, 
                    padding: '8px 12px', 
                    borderRadius: 0, 
                    cursor: 'pointer',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Syne, sans-serif',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    position: 'relative'
                  }}
                >
                  {showAllBingos ? 'Hide All Bingos' : 'Show All Bingos'}
                  <Box style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {storedTopMoves ? storedTopMoves.filter(move => move.tiles && move.tiles.length === 7 && !move.isExchange).length : 0}
                  </Box>
                </button>
              )}
              {(puzzleMode === 'significant-best' || puzzleMode === 'non-bingo-significant') && (
                <button 
                  onClick={() => setShowAllBingosLocal(!showAllBingos)}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))';
                    e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
                    e.target.style.transform = 'scale(1) translateY(0)';
                  }}
                  style={{ 
                    flex: '1',
                    minWidth: '120px',
                    fontSize: 12, 
                    padding: '8px 12px', 
                    borderRadius: 0, 
                    cursor: 'pointer',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Syne, sans-serif',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    position: 'relative'
                  }}
                >
                  {showAllBingos ? 'Hide Top 2 Plays' : 'Show Top 2 Moves'}
                  <Box style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    2
                  </Box>
                </button>
              )}
            </Box>
          </Box>
          
          {/* All bingos list for mode 1 */}
          {puzzleMode === 'bingo' && showAllBingos && storedTopMoves && (
            <Box style={{ 
              marginTop: '12px', 
              padding: '12px', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px'
            }}>
              <Box style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                All Available Bingos:
              </Box>
              <Box style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {storedTopMoves
                  .filter(move => move.tiles && move.tiles.length === 7 && !move.isExchange)
                  .map((move, index) => (
                    <Box key={index} style={{
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: 'normal'
                    }}>
                      {move.startPosition} {move.word} ({move.score} pts)
                    </Box>
                  ))}
              </Box>
            </Box>
          )}

          {/* Top 2 plays list for modes 3 and 4 */}
          {(puzzleMode === 'significant-best' || puzzleMode === 'non-bingo-significant') && showAllBingos && storedTopMoves && (
            <Box style={{ 
              marginTop: '12px', 
              padding: '12px', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px'
            }}>
              <Box style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                Top 2 Plays:
              </Box>
              <Box style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {storedTopMoves.slice(0, 2).map((move, index) => (
                  <Box key={index} style={{
                    fontSize: '12px',
                    color: 'white',
                    fontWeight: index === 0 ? 'bold' : 'normal',
                    padding: '4px 8px',
                    backgroundColor: index === 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: index === 0 ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px'
                  }}>
                    <Box style={{ marginBottom: '2px' }}>
                      {index + 1}. {move.startPosition} {move.word} ({move.score} pts)
                    </Box>
                    <Box style={{ fontSize: '11px', opacity: 0.8 }}>
                      Total Value: {move.totalValue && !isNaN(parseFloat(move.totalValue)) ? Math.round(parseFloat(move.totalValue)) : 'N/A'} | Leave: {move.leaveValue && !isNaN(parseFloat(move.leaveValue)) ? Math.round(parseFloat(move.leaveValue)) : 'N/A'}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Game ended message */}
      {gameEnded && (
        <Box className={styles.playerPanel} style={{ 
          marginTop: '16px',
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Box style={{ textAlign: 'center' }}>
            <Box style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              Game Ended
            </Box>
            <Box style={{ fontSize: '12px', opacity: 0.8 }}>
              Too few tiles left. There aren't any more matching puzzles for this game. Start a new one!
            </Box>
          </Box>
        </Box>
      )}

      {/* Settings panel */}
      {showSettingsPanel && (
        <Box className={styles.playerPanel} style={{ 
          marginTop: '16px',
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <Box style={{ marginBottom: '12px' }}>
            <Box style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              Puzzle Challenge Mode
            </Box>
            <Box style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.8 }}>
              Choose when to pause for puzzle challenges
            </Box>
          </Box>
          
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Box 
              onClick={() => handlePuzzleModeChange('bingo')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: puzzleMode === 'bingo' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: puzzleMode === 'bingo' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '14px',
                position: 'relative'
              }}
            >
              <Box style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                1
              </Box>
              <Box style={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>All Bingos</Box>
              <Box style={{ fontSize: '12px', opacity: 0.8, marginLeft: '40px' }}>Pause when a bingo is found</Box>
            </Box>
            <Box 
              onClick={() => handlePuzzleModeChange('only-bingo')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: puzzleMode === 'only-bingo' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: puzzleMode === 'only-bingo' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '14px',
                position: 'relative'
              }}
            >
              <Box style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                2
              </Box>
              <Box style={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Only Bingo</Box>
              <Box style={{ fontSize: '12px', opacity: 0.8, marginLeft: '40px' }}>Pause when there's exactly 1 bingo available</Box>
            </Box>
            <Box 
              onClick={() => handlePuzzleModeChange('significant-best')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: puzzleMode === 'significant-best' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: puzzleMode === 'significant-best' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '14px',
                position: 'relative'
              }}
            >
              <Box style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                3
              </Box>
              <Box style={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Significant Move</Box>
              <Box style={{ fontSize: '12px', opacity: 0.8, marginLeft: '40px' }}>Pause when the best move is 10+ equity better than next best move</Box>
            </Box>
            <Box 
              onClick={() => handlePuzzleModeChange('non-bingo-significant')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: puzzleMode === 'non-bingo-significant' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: puzzleMode === 'non-bingo-significant' ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '14px',
                position: 'relative'
              }}
            >
              <Box style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                4
              </Box>
              <Box style={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Significant Non-Bingo Move</Box>
              <Box style={{ fontSize: '12px', opacity: 0.8, marginLeft: '40px' }}>Pause when the best move is a non-bingo that is 10+ equity better than next best move</Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default PuzzlePlayerInfo; 