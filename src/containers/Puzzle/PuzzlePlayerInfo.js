import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import { Tooltip } from "@mui/material";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Pause, Play, GridFour, Lightning, ArrowClockwise, ScribbleLoop } from '@phosphor-icons/react';
import Rack from '../../components/AppContent/Board/Rack.js';
import LatestMove from '../Play/components/LatestMove.js';
import { usePuzzleStore } from '../../stores/puzzleStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { ThemeContext } from '../../App';
import styles from './Puzzle.module.css';

// Memoized LatestMove component that only subscribes to what it needs
const MemoizedLatestMove = React.memo(() => {
  const { lightMode } = useContext(ThemeContext);
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
      lightMode={lightMode}
    />
  );
});

const PuzzlePlayerInfo = React.memo(({ telestratorEnabled, onToggleTelestrator }) => {
  const { lightMode } = useContext(ThemeContext);
  // Get global color scheme
  const color = useColorSchemeStore(state => state.color);
  
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
  const showAllBingos = usePuzzleStore(state => state.showAllBingos);
  
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
    setShowAllBingos(false);
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
        <Tooltip title={gameStarted ? "Start New Theo vs Theo Game" : "Start Theo vs Theo Game"}>
            <SmartToyIcon 
              className={`${styles.keyBtn} ${styles.botIcon} ${styles.startIcon} ${gameStarted ? styles.active : ''} ${isBotThinking ? styles.thinking : ''}`}
            style={{ 
              fontSize: 20, 
              cursor: 'pointer',
              color: gameStarted ? '#FF9800' : '#4CAF50',
              marginRight: '4px'
            }}
            onClick={() => handleBotModeToggle()}
            sx={{ color: lightMode === 'dark' ? (gameStarted ? '#FF9800' : '#4CAF50') : (gameStarted ? '#EA580C' : '#059669') }}
            />
        </Tooltip>
        <Tooltip title="Puzzle Mode">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <GridFour 
              className={`${styles.keyBtn} ${styles.settingsIcon} ${showSettingsPanel ? styles.active : ''}`}
              style={{ 
                fontSize: 20, 
                cursor: 'pointer',
                marginRight: '4px',
                color: lightMode === 'dark' ? '#fff' : '#1F2937'
              }}
              onClick={() => {
                const newShowSettings = !showSettingsPanel;
                setShowSettingsPanelLocal(newShowSettings);
                // Pause game when settings open, resume when closed
                setIsManuallyPausedLocal(newShowSettings);
              }}
            />
            <div style={{
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
            </div>
          </div>
        </Tooltip>
        <Tooltip title={isFastPlayMode ? "Fast Play On" : "Fast Play Off"}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Lightning 
              className={`${styles.keyBtn} ${isFastPlayMode ? styles.active : ''}`}
              style={{ 
                fontSize: 20, 
                cursor: 'pointer',
                color: lightMode === 'dark' 
                  ? (isFastPlayMode ? '#FF9800' : 'rgba(255, 255, 255, 0.7)')
                  : (isFastPlayMode ? '#EA580C' : 'rgba(31, 41, 55, 0.7)'),
                marginRight: '4px'
              }}
              onClick={() => setIsFastPlayMode(!isFastPlayMode)}
            />
            {isFastPlayMode && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#FF9800',
                borderRadius: '50%',
                width: '12px',
                height: '12px'
              }} />
            )}
          </div>
        </Tooltip>
        {gameStarted && (
          <Tooltip title={telestratorEnabled ? "Disable drawing" : "Enable drawing"}>
            <ScribbleLoop
              className={`${styles.keyBtn} ${telestratorEnabled ? styles.active : ''}`}
              style={{
                fontSize: 20,
                cursor: 'pointer',
                marginRight: '4px',
                color: telestratorEnabled
                  ? (lightMode === 'dark' ? '#10B981' : '#059669')
                  : (lightMode === 'dark' ? '#fff' : '#1F2937')
              }}
              onClick={() => onToggleTelestrator && onToggleTelestrator(!telestratorEnabled)}
            />
          </Tooltip>
        )}
        {gameStarted && (
          <Tooltip title={isManuallyPaused ? "Resume Game" : "Pause Game"}>
              {isManuallyPaused ? (
              <Play 
                className={`${styles.keyBtn} ${styles.pauseIcon} ${styles.active}`}
                style={{ 
                  fontSize: 20, 
                  cursor: 'pointer',
                  color: lightMode === 'dark' ? '#fff' : '#1F2937'
                }}
                onClick={() => setIsManuallyPausedLocal(!isManuallyPaused)}
              />
            ) : (
              <Pause 
                className={`${styles.keyBtn} ${styles.pauseIcon}`}
                style={{ 
                  fontSize: 20, 
                  cursor: 'pointer',
                  color: lightMode === 'dark' ? '#fff' : '#1F2937'
                }}
                onClick={() => setIsManuallyPausedLocal(!isManuallyPaused)}
              />
              )}
          </Tooltip>
        )}
        {gameStarted && (
          <Tooltip title="Reset Rack">
            <ArrowClockwise 
              className={`${styles.keyBtn} ${styles.resetIcon}`}
              style={{ 
                fontSize: 20, 
                cursor: 'pointer',
                color: lightMode === 'dark' ? '#fff' : '#1F2937'
              }}
              onClick={() => {
                console.log(' Reset rack clicked');
                clearPuzzlePlacement();
              }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Puzzle Instructions Banner */}
      <Box sx={{
        marginTop: '16px',
        padding: '8px 12px',
        backgroundColor: lightMode === 'dark' ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
        color: lightMode === 'dark' ? 'white' : '#1F2937',
        fontSize: '12px',
        fontWeight: '500',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
        boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {gameStarted && !isPausedForBingo && !gameEnded ? (
          <><strong>Solve puzzles as Theo plays itself</strong>
            <Box className={styles.thinkingDots}>
              <div></div>
              <div></div>
              <div></div>
            </Box>
          </>
        ) : (
          <><strong>Solve puzzles as Theo plays itself</strong></>
        )}
      </Box>

      {gameStarted && (
        <Box className={styles.playerPanel} sx={{
          background: lightMode === 'dark' 
            ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%)',
          border: lightMode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: lightMode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
          backgroundImage: 'none'
        }}>
          <Box className={styles.playerInfo}>
            <Box className={styles.playerName} style={{ 
              minWidth: '120px', 
              textAlign: 'center',
              color: lightMode === 'dark' ? '#fff' : '#1F2937'
            }}>
              {currentName}
              <Box component="span" className={styles.thinkingEmoji} style={{ 
                visibility: isBotThinking ? 'visible' : 'hidden',
                marginLeft: '4px'
              }}>
                {currentPlayer === 1 ? '🤔' : '🧠'}
              </Box>
            </Box>
          </Box>
          {/* Derive a display rack that hides tiles already placed on the board during a puzzle,
              similar to how Play removes tiles from the rack on drag. */}
          <Box style={{ marginTop: '12px' }}>
            {(() => {
              const rack = currentRack || [];
              // Only hide tiles while we are in puzzle pause mode and have placed tiles
              if (!isPausedForBingo || !selectedTiles || selectedTiles.length === 0) {
                return rack.length > 0 ? (
                  <Box className={styles.Rack}>
                    <Rack 
                      rack={rack} 
                      color={color.current} 
                      onTileClick={handleTileClick}
                      // During puzzles, selection is represented on the board, so we don't need rack highlighting
                      selectedTiles={[]}
                    />
                  </Box>
                ) : null;
              }

              // Build a multiset of tiles that are already on the board for this guess
              const toRemove = {};
              selectedTiles.forEach(t => {
                const letter = t.tile;
                toRemove[letter] = (toRemove[letter] || 0) + 1;
              });

              const remaining = { ...toRemove };
              const displayRack = [];
              rack.forEach(letter => {
                if (remaining[letter] > 0) {
                  remaining[letter] -= 1; // consume one copy
                } else {
                  displayRack.push(letter);
                }
              });

              if (displayRack.length === 0) return null;

              return (
                <Box className={styles.Rack}>
                  <Rack 
                    rack={displayRack} 
                    color={color.current} 
                    onTileClick={handleTileClick}
                    selectedTiles={[]}
                  />
                </Box>
              );
            })()}
          </Box>
        </Box>
      )}

      <MemoizedLatestMove />

      {/* Bingo challenge section */}
      {isPausedForBingo && (
        <Box className={styles.playerPanel} sx={{ 
          marginTop: '16px',
          padding: '16px',
          backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)',
          border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          <Box style={{ textAlign: 'center', marginBottom: '12px' }}>
            <Box sx={{ 
              fontSize: '14px', 
              marginBottom: '8px',
              color: lightMode === 'dark' ? '#fff' : '#1F2937'
            }}>
              {currentPlayer === 1 ? player1Name : player2Name} found a {puzzleMode === 'bingo' || puzzleMode === 'only-bingo' ? 'bingo' : 'significant play'}!
            </Box>
            <Box sx={{ 
              fontSize: '12px', 
              marginBottom: '12px', 
              opacity: lightMode === 'dark' ? 0.8 : 0.7,
              color: lightMode === 'dark' ? '#fff' : '#4B5563'
            }}>
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
            <Box sx={{ 
              fontSize: '11px', 
              marginBottom: '12px', 
              opacity: lightMode === 'dark' ? 0.7 : 0.8,
              padding: '8px',
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: '4px',
              color: lightMode === 'dark' ? '#fff' : '#1F2937'
            }}>
              <Box sx={{ marginBottom: '4px', fontWeight: 'bold' }}>How to play:</Box>
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
                  border: 'none',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Syne, sans-serif',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  position: 'relative'
                }}
              >
                Reveal/Skip
                <Box sx={{
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
                  1
                </Box>
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
                  border: 'none',
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
                onClick={() => setShowAllBingos(!showAllBingos)}
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
                  border: 'none',
                  fontWeight: 'bold',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Syne, sans-serif',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  position: 'relative'
                }}
              >
                {showAllBingos ? (
                  <Box style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                    {puzzleMode === 'bingo' ? (
                      storedTopMoves?.filter(move => move.tiles && move.tiles.length === 7 && !move.isExchange).map((move, index) => (
                        <Box key={index} style={{ fontSize: '10px', fontWeight: 'normal' }}>
                          {move.startPosition} {move.word} ({move.score} pts)
                        </Box>
                      ))
                    ) : (puzzleMode === 'significant-best' || puzzleMode === 'non-bingo-significant') ? (
                      storedTopMoves?.slice(0, 2).map((move, index) => (
                        <Box key={index} style={{ fontSize: '10px', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                          {index + 1}. {move.startPosition} {move.word} ({move.score} pts)
                        </Box>
                      ))
                    ) : null}
                  </Box>
                ) : (
                  puzzleMode === 'bingo' 
                    ? `Show ${storedTopMoves ? storedTopMoves.filter(move => move.tiles && move.tiles.length === 7 && !move.isExchange).length : 0} bingos`
                    : puzzleMode === 'significant-best' || puzzleMode === 'non-bingo-significant'
                    ? 'Show Top 2 Moves'
                    : 'Show Moves'
                )}
                <Box 
                  onClick={() => setShowAllBingos(!showAllBingos)}
                  style={{
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
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  2
                </Box>
              </button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Game ended message */}
      {gameEnded && (
        <Box className={styles.playerPanel} sx={{ 
          marginTop: '16px',
          padding: '16px',
          backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)',
          border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: lightMode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <Box style={{ textAlign: 'center' }}>
            <Box sx={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: lightMode === 'dark' ? '#fff' : '#1F2937'
            }}>
              Game Ended
            </Box>
            <Box sx={{ 
              fontSize: '12px', 
              opacity: lightMode === 'dark' ? 0.8 : 0.7,
              color: lightMode === 'dark' ? '#fff' : '#4B5563'
            }}>
              Too few tiles left. There aren't any more matching puzzles for this game. Start a new one!
            </Box>
          </Box>
        </Box>
      )}

      {/* Settings panel */}
      {showSettingsPanel && (
        <Box className={styles.playerPanel} sx={{ 
          marginTop: '16px',
          padding: '16px',
          backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)',
          border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          <Box style={{ marginBottom: '12px' }}>
            <Box sx={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: lightMode === 'dark' ? '#fff' : '#1F2937'
            }}>
              Puzzle Challenge Mode
            </Box>
            <Box sx={{ 
              fontSize: '12px', 
              marginBottom: '12px', 
              opacity: lightMode === 'dark' ? 0.8 : 0.7,
              color: lightMode === 'dark' ? '#fff' : '#4B5563'
            }}>
              Choose when to pause for puzzle challenges
            </Box>
          </Box>
          
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Box 
              onClick={() => handlePuzzleModeChange('bingo')}
              sx={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: puzzleMode === 'bingo' 
                  ? (lightMode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(5, 150, 105, 0.15)')
                  : (lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                fontSize: '14px',
                position: 'relative',
                border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                color: lightMode === 'dark' ? '#fff' : '#1F2937'
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
              <Box sx={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>All Bingos</Box>
              <Box sx={{ fontSize: '12px', opacity: lightMode === 'dark' ? 0.8 : 0.7, marginLeft: '40px' }}>Pause when a bingo is found</Box>
            </Box>
            <Box 
              onClick={() => handlePuzzleModeChange('only-bingo')}
              sx={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: puzzleMode === 'only-bingo' 
                  ? (lightMode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(5, 150, 105, 0.15)')
                  : (lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                fontSize: '14px',
                position: 'relative',
                border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                color: lightMode === 'dark' ? '#fff' : '#1F2937'
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
              <Box sx={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Only Bingo</Box>
              <Box sx={{ fontSize: '12px', opacity: lightMode === 'dark' ? 0.8 : 0.7, marginLeft: '40px' }}>Pause when there's exactly 1 bingo available</Box>
            </Box>
            <Box 
              onClick={() => handlePuzzleModeChange('significant-best')}
              sx={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: puzzleMode === 'significant-best' 
                  ? (lightMode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(5, 150, 105, 0.15)')
                  : (lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                fontSize: '14px',
                position: 'relative',
                border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                color: lightMode === 'dark' ? '#fff' : '#1F2937'
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
              <Box sx={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Significant Move</Box>
              <Box sx={{ fontSize: '12px', opacity: lightMode === 'dark' ? 0.8 : 0.7, marginLeft: '40px' }}>Pause when the best move is 10+ equity better than next best move</Box>
            </Box>
            <Box 
              onClick={() => handlePuzzleModeChange('non-bingo-significant')}
              sx={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: puzzleMode === 'non-bingo-significant' 
                  ? (lightMode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(5, 150, 105, 0.15)')
                  : (lightMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                fontSize: '14px',
                position: 'relative',
                border: lightMode === 'dark' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                color: lightMode === 'dark' ? '#fff' : '#1F2937'
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
              <Box sx={{ fontWeight: 'bold', marginBottom: '2px', marginLeft: '40px' }}>Significant Non-Bingo Move</Box>
              <Box sx={{ fontSize: '12px', opacity: lightMode === 'dark' ? 0.8 : 0.7, marginLeft: '40px' }}>Pause when the best move is a non-bingo that is 10+ equity better than next best move</Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default PuzzlePlayerInfo; 