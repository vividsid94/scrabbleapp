import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import { MenuItem, Select, TextField, Button } from '@mui/material';
import { Play, Stop, Download } from '@phosphor-icons/react';
import Rack from '../../components/AppContent/Board/Rack.js';
import LatestMove from '../Play/components/LatestMove.js';
import { useSandboxStore } from '../../stores/sandboxStore';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import { ThemeContext } from '../../App';
import styles from './Sandbox.module.css';

const BOT_OPTIONS = ['Theo', 'Tess', 'Intermediate'];

const SandboxPlayerInfo = React.memo(() => {
  const { lightMode } = useContext(ThemeContext);
  const color = useColorSchemeStore(state => state.color);

  const player1BotName = useSandboxStore(state => state.player1BotName);
  const player2BotName = useSandboxStore(state => state.player2BotName);
  const totalGames = useSandboxStore(state => state.totalGames);
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

  const selectSx = {
    fontSize: '13px',
    color: textColor,
    '.MuiOutlinedInput-notchedOutline': { borderColor },
  };

  return (
    <Box className={styles.playerPanel}>
      {/* Setup */}
      <Box sx={sectionSx}>
        <Box sx={labelSx}>Series Setup</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Select
            size="small"
            value={player1BotName}
            onChange={(e) => setPlayer1BotName(e.target.value)}
            disabled={isRunning}
            sx={{ ...selectSx, flex: 1 }}
          >
            {BOT_OPTIONS.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </Select>
          <Box sx={{ fontSize: '11px', color: mutedTextColor }}>vs</Box>
          <Select
            size="small"
            value={player2BotName}
            onChange={(e) => setPlayer2BotName(e.target.value)}
            disabled={isRunning}
            sx={{ ...selectSx, flex: 1 }}
          >
            {BOT_OPTIONS.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </Select>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Box sx={{ fontSize: '12px', color: textColor }}>Number of games</Box>
          <TextField
            size="small"
            type="number"
            value={totalGames}
            onChange={(e) => setTotalGames(Math.max(1, parseInt(e.target.value, 10) || 1))}
            disabled={isRunning}
            inputProps={{ min: 1, max: 100, style: { fontSize: '13px', color: textColor, width: '50px' } }}
          />
        </Box>
        <Button
          fullWidth
          variant="contained"
          startIcon={isRunning ? <Stop weight="fill" /> : <Play weight="fill" />}
          onClick={() => isRunning ? stopSeries() : startSeries()}
          sx={{
            textTransform: 'none',
            fontFamily: 'Syne, sans-serif',
            backgroundColor: isRunning ? '#DC2626' : '#059669',
            '&:hover': { backgroundColor: isRunning ? '#B91C1C' : '#047857' }
          }}
        >
          {isRunning ? 'Stop Series' : 'Start Series'}
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
