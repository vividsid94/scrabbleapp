import React from 'react';
import Box from '@mui/material/Box';
import styles from '../Play.module.css';
import Rack from '../../../components/AppContent/Board/Rack.js';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ColorizeIcon from '@mui/icons-material/Colorize';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckIcon from '@mui/icons-material/Check';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Tooltip, Button } from '@mui/material';

export default function PlayerInfo({
  player1Name,
  player2Name,
  player1Points,
  player2Points,
  player1Time,
  player2Time,
  currentPlayer,
  player1Rack,
  player2Rack,
  color,
  onTileClick,
  selectedTiles,
  isBotMode,
  gameStarted,
  isDictionaryLoading,
  isLoadingTopMoves,
  onSettingsOpen,
  onColorSchemeOpen,
  onBotModeToggle,
  onGetTopMoves,
  onStartGame,
  onWordSubmit,
  onPass,
  onExchange,
  selectedBoardPosition,
  tilesToExchange
}) {
  return (
    <Box className={styles.playerPanel}>
      <Box className={styles.playerToggle}>
        <Tooltip title="Settings">
          <SettingsOutlinedIcon className={styles.keyBtn} onClick={onSettingsOpen}/>
        </Tooltip>
        <Tooltip title="Color Scheme">
          <ColorizeIcon className={styles.keyBtn} onClick={onColorSchemeOpen}/>
        </Tooltip>
        <Tooltip title={isBotMode ? "Playing against bot" : "Play against bot"}>
          <SmartToyIcon 
            className={`${styles.keyBtn} ${isBotMode ? styles.activeBot : ''}`} 
            onClick={onBotModeToggle}
          />
        </Tooltip>
        <Tooltip title="Get Top Moves">
          <LightbulbIcon 
            className={styles.keyBtn}
            onClick={onGetTopMoves}
            sx={{ 
              color: isLoadingTopMoves ? '#FFD700' : 'inherit'
            }}
          />
        </Tooltip>
      </Box>

      <Box className={styles.playerToggle}>
        <Tooltip title="Start Game" placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onStartGame}
            sx={{ 
              opacity: gameStarted || isDictionaryLoading ? 0.5 : 1,
              cursor: gameStarted || isDictionaryLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 18 }} />
          </Box>
        </Tooltip>
        <Tooltip title="Submit" placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onWordSubmit}
            sx={{ 
              opacity: !selectedBoardPosition || selectedTiles.length === 0 ? 0.5 : 1,
              cursor: !selectedBoardPosition || selectedTiles.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <CheckIcon sx={{ fontSize: 18 }} />
          </Box>
        </Tooltip>
        <Tooltip title="Pass" placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onPass}
            sx={{ 
              opacity: !gameStarted ? 0.5 : 1,
              cursor: !gameStarted ? 'not-allowed' : 'pointer'
            }}
          >
            <Box sx={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: 'inherit'
            }}>
              P
            </Box>
          </Box>
        </Tooltip>
        <Tooltip title="Exchange" placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onExchange}
            sx={{ 
              opacity: tilesToExchange.length === 0 ? 0.5 : 1,
              cursor: tilesToExchange.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <SwapHorizIcon sx={{ fontSize: 18 }} />
          </Box>
        </Tooltip>
      </Box>

      <Box className={styles.playerPanel}>
        <Box className={styles.playerInfo}>
          <Box className={styles.playerName}>{player1Name}</Box>
          <Box className={styles.timer}>{player1Time}</Box>
        </Box>
        <Box className={styles.points}>{player1Points}</Box>
        {currentPlayer === 1 && (
          <Box className={styles.Rack}>
            <Rack 
              rack={player1Rack} 
              color={color.current} 
              onTileClick={onTileClick}
              selectedTiles={selectedTiles}
            />
          </Box>
        )}
      </Box>

      <Box className={styles.playerPanel}>
        <Box className={styles.playerInfo}>
          <Box className={styles.playerName}>{player2Name}</Box>
          <Box className={styles.timer}>{player2Time}</Box>
        </Box>
        <Box className={styles.points}>{player2Points}</Box>
        {currentPlayer === 2 && (
          <Box className={styles.Rack}>
            <Rack 
              rack={player2Rack} 
              color={color.current} 
              onTileClick={onTileClick}
              selectedTiles={selectedTiles}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
} 