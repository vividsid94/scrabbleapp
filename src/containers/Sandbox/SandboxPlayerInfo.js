import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import { TextField, Button, ToggleButton, ToggleButtonGroup, Slider } from '@mui/material';
import { Play, Stop, Download } from '@phosphor-icons/react';
import Rack from '../../components/AppContent/Board/Rack.js';
import LatestMove from '../Play/components/LatestMove.js';
import { useSandboxStore } from '../../stores/sandboxStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { ThemeContext } from '../../App';
import styles from './Sandbox.module.css';

// 'Static' stays the internal botName (matches sandboxStore.js/
// sandboxBotFunctions.js's rank mechanism) - "Speedy" is just its label here.
const BOT_OPTIONS = [
  { value: 'Theo', label: 'Theo' },
  { value: 'Tess', label: 'Tess' },
  { value: 'Static', label: 'Speedy' },
];

const SandboxPlayerInfo = React.memo(() => {
  const { lightMode } = useContext(ThemeContext);
  const color = useColorSchemeStore(state => state.color);

  const player1BotName = useSandboxStore(state => state.player1BotName);
  const player2BotName = useSandboxStore(state => state.player2BotName);
  const player1StaticRank = useSandboxStore(state => state.player1StaticRank);
  const player2StaticRank = useSandboxStore(state => state.player2StaticRank);
  const totalGames = useSandboxStore(state => state.totalGames);
  // Any static-bot matchup (Theo or a chosen Nth static, either side) runs
  // server-side in bulk and can handle far more games than the per-move
  // client loop Tess still needs - mirrors sandboxStore.js's getMaxGamesForBots.
  const isStatic = (name) => name === 'Theo' || name === 'Static';
  const maxGames = (isStatic(player1BotName) && isStatic(player2BotName)) ? 500 : 30;
  const isRunning = useSandboxStore(state => state.isRunning);
  const currentGameIndex = useSandboxStore(state => state.currentGameIndex);
  const seriesResults = useSandboxStore(state => state.seriesResults);

  const gameStarted = useSandboxStore(state => state.gameStarted);
  const currentPlayer = useSandboxStore(state => state.currentPlayer);
  const player1Rack = useSandboxStore(state => state.player1Rack);
  const player2Rack = useSandboxStore(state => state.player2Rack);
  const player1Name = useSandboxStore(state => state.player1Name);
  const player2Name = useSandboxStore(state => state.player2Name);
  const player1points = useSandboxStore(state => state.player1points);
  const player2points = useSandboxStore(state => state.player2points);
  const moveHistory = useSandboxStore(state => state.moveHistory);
  const boardCoords = useSandboxStore(state => state.boardCoords);
  const blankTiles = useSandboxStore(state => state.blankTiles);
  const pool = useSandboxStore(state => state.pool);

  const {
    setPlayer1BotName,
    setPlayer2BotName,
    setPlayer1StaticRank,
    setPlayer2StaticRank,
    setTotalGames,
    startSeries,
    stopSeries,
    downloadGameGCG,
  } = useSandboxStore();

  const textColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
  const mutedTextColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#6B7280';
  const borderColor = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.18)';
  const panelBackground = lightMode === 'dark'
    ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
    : '#FFFFFF';
  const panelShadow = lightMode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 3px 10px rgba(100, 95, 80, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)';

  const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

  const gamesPlayed = seriesResults.length;
  const player1Wins = seriesResults.filter(r => r.winner === r.player1Name).length;
  const player2Wins = seriesResults.filter(r => r.winner === r.player2Name).length;
  const ties = gamesPlayed - player1Wins - player2Wins;
  const avgPlayer1Score = gamesPlayed > 0
    ? Math.round(seriesResults.reduce((sum, r) => sum + r.player1Score, 0) / gamesPlayed)
    : 0;
  const avgPlayer2Score = gamesPlayed > 0
    ? Math.round(seriesResults.reduce((sum, r) => sum + r.player2Score, 0) / gamesPlayed)
    : 0;

  const sectionSx = {
    padding: '12px',
    background: panelBackground,
    borderRadius: '8px',
    boxShadow: panelShadow,
    border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(140, 130, 110, 0.28)',
  };

  const labelSx = {
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: mutedTextColor,
    opacity: 0.7,
    marginBottom: '6px',
  };

  const accentColor = lightMode === 'dark' ? '#10B981' : '#059669';

  const toggleButtonSx = {
    flex: 1,
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'Syne, sans-serif',
    textTransform: 'none',
    color: mutedTextColor,
    borderColor: borderColor,
    padding: '5px 4px',
    '&.Mui-selected': {
      backgroundColor: lightMode === 'dark' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(5, 150, 105, 0.15)',
      color: accentColor,
      borderColor: accentColor,
    },
    '&.Mui-selected:hover': {
      backgroundColor: lightMode === 'dark' ? 'rgba(16, 185, 129, 0.32)' : 'rgba(5, 150, 105, 0.25)',
    },
  };

  const sliderSx = {
    color: accentColor,
    padding: '10px 0 4px',
    '& .MuiSlider-valueLabel': {
      backgroundColor: accentColor,
      fontSize: '10px',
      fontWeight: 700,
      fontFamily: 'Syne, sans-serif',
    },
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${lightMode === 'dark' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.16)'}`,
    },
  };

  const gamesCompleted = seriesResults.length;
  const seriesProgressPercent = totalGames > 0 ? Math.min(100, Math.round((gamesCompleted / totalGames) * 100)) : 0;

  return (
    <Box className={styles.playerPanel}>
      {/* Setup */}
      <Box sx={sectionSx}>
        <Box sx={labelSx}>Series Setup</Box>
        {[
          { botName: player1BotName, setBotName: setPlayer1BotName, rank: player1StaticRank, setRank: setPlayer1StaticRank, label: 'Player 1' },
          { botName: player2BotName, setBotName: setPlayer2BotName, rank: player2StaticRank, setRank: setPlayer2StaticRank, label: 'Player 2' },
        ].map((side, i) => (
          <React.Fragment key={side.label}>
            {i === 1 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                <Box sx={{ flex: 1, height: '1px', backgroundColor: borderColor }} />
                <Box sx={{ fontSize: '10px', fontWeight: 700, color: mutedTextColor }}>VS</Box>
                <Box sx={{ flex: 1, height: '1px', backgroundColor: borderColor }} />
              </Box>
            )}
            <Box sx={{ fontSize: '10px', color: mutedTextColor, marginBottom: '4px' }}>{side.label}</Box>
            <ToggleButtonGroup
              value={side.botName}
              exclusive
              fullWidth
              size="small"
              disabled={isRunning}
              onChange={(e, val) => val && side.setBotName(val)}
              sx={{ marginBottom: side.botName === 'Static' ? '2px' : '10px' }}
            >
              {BOT_OPTIONS.map(opt => (
                <ToggleButton key={opt.value} value={opt.value} sx={toggleButtonSx}>
                  {opt.value === 'Static' && side.botName === 'Static' ? `Speedy${side.rank}` : opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {side.botName === 'Static' && (
              <Box sx={{ padding: '0 10px', marginBottom: '10px' }}>
                <Slider
                  size="small"
                  value={side.rank}
                  onChange={(e, val) => side.setRank(val)}
                  min={1}
                  max={15}
                  step={1}
                  disabled={isRunning}
                  valueLabelDisplay="on"
                  valueLabelFormat={(v) => `Speedy${v}`}
                  sx={sliderSx}
                />
              </Box>
            )}
          </React.Fragment>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Box sx={{ fontSize: '12px', color: textColor }}>Number of games</Box>
          <TextField
            size="small"
            type="number"
            value={totalGames}
            onChange={(e) => setTotalGames(parseInt(e.target.value, 10))}
            disabled={isRunning}
            inputProps={{ min: 1, max: maxGames, style: { fontSize: '13px', color: textColor, width: '50px' } }}
          />
        </Box>
        <Box sx={{ fontSize: '10px', color: mutedTextColor, opacity: 0.8, marginBottom: '4px', lineHeight: 1.4 }}>
          Note: series with Tess are capped at 30 games; series with only static bots (Theo or Speedy, either side) are capped at 500.
        </Box>
        <Box sx={{ fontSize: '10px', color: mutedTextColor, opacity: 0.8, marginBottom: '12px', lineHeight: 1.4 }}>
          Series over 30 games skip the move-by-move animation and jump straight to the final board and results - every game still gets its own downloadable GCG.
        </Box>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={() => isRunning ? stopSeries() : startSeries()}
          sx={{
            textTransform: 'none',
            fontFamily: 'Syne, sans-serif',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: isRunning ? 'rgba(220, 38, 38, 0.22)' : '#059669',
            color: isRunning ? '#DC2626' : '#fff',
            '&:hover': { backgroundColor: isRunning ? 'rgba(220, 38, 38, 0.32)' : '#047857' },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: isRunning ? `${seriesProgressPercent}%` : '0%',
              backgroundColor: '#DC2626',
              transition: 'width 0.2s ease',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isRunning ? <Stop weight="fill" size={16} /> : <Play weight="fill" size={16} />}
            {isRunning ? `Stop (${gamesCompleted}/${totalGames})` : 'Start Series'}
          </Box>
        </Button>
      </Box>

      {/* Live */}
      {gameStarted && (
        <Box sx={{ ...sectionSx, marginTop: '16px' }}>
          <Box sx={labelSx}>
            Game {currentGameIndex + 1} of {totalGames}
          </Box>
          <Box sx={{ fontSize: '13px', fontWeight: 600, color: textColor, textAlign: 'center', marginBottom: '10px' }}>
            {currentPlayer === 1 ? player1Name : player2Name}'s turn
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', marginBottom: '8px' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: '11px', color: mutedTextColor }}>{player1Name}</Box>
              <Box sx={{ fontSize: '16px', fontWeight: 'bold', color: '#D97706' }}>{player1points}</Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: '11px', color: mutedTextColor }}>{player2Name}</Box>
              <Box sx={{ fontSize: '16px', fontWeight: 'bold', color: '#D97706' }}>{player2points}</Box>
            </Box>
          </Box>
          <Box className={styles.Rack} sx={{ marginBottom: '4px' }}>
            <Rack rack={currentPlayer === 1 ? player1Rack : player2Rack} color={color.current} selectedTiles={[]} />
          </Box>
        </Box>
      )}

      {gameStarted && (
        <LatestMove
          latestMove={latestMove}
          player1Name={player1Name}
          player2Name={player2Name}
          allMoves={moveHistory}
          boardCoords={boardCoords}
          player1Rack={player1Rack}
          player2Rack={player2Rack}
          blankTiles={blankTiles}
          pool={pool}
          lightMode={lightMode}
        />
      )}

      {/* Results */}
      {gamesPlayed > 0 && (
        <Box sx={{ ...sectionSx, marginTop: '16px' }}>
          <Box sx={labelSx}>Series Results</Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px', fontSize: '12px', color: textColor }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontWeight: 'bold' }}>{player1Wins}-{player2Wins}{ties > 0 ? `-${ties}` : ''}</Box>
              <Box sx={{ fontSize: '10px', color: mutedTextColor }}>Tally</Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontWeight: 'bold' }}>{avgPlayer1Score}</Box>
              <Box sx={{ fontSize: '10px', color: mutedTextColor }}>Avg {seriesResults[0]?.player1Name}</Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontWeight: 'bold' }}>{avgPlayer2Score}</Box>
              <Box sx={{ fontSize: '10px', color: mutedTextColor }}>Avg {seriesResults[0]?.player2Name}</Box>
            </Box>
          </Box>
          <Box sx={{ maxHeight: '220px', overflowY: 'auto' }}>
            {seriesResults.map((result) => (
              <Box
                key={result.gameIndex}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: `1px solid ${borderColor}`,
                  fontSize: '12px',
                  color: textColor,
                }}
              >
                <Box>Game {result.gameIndex + 1}</Box>
                <Box sx={{ color: mutedTextColor }}>
                  {result.player1Score} - {result.player2Score}
                  {result.winner ? '' : ' (tie)'}
                </Box>
                <Box
                  onClick={() => downloadGameGCG(result)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    color: mutedTextColor,
                    '&:hover': { color: textColor }
                  }}
                >
                  <Download size={14} />
                  GCG
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default SandboxPlayerInfo;
