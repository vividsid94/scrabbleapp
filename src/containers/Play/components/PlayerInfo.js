import React from 'react';
import Box from '@mui/material/Box';
import styles from '../Play.module.css';
import Rack from '../../../components/AppContent/Board/Rack.js';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Tooltip } from '@mui/material';

const actionButtonStyle = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const PlayerInfoSection = ({ name, time, points, rack, color, onTileClick, selectedTiles }) => (
  <Box className={styles.playerPanel}>
    <Box className={styles.playerInfo}>
      <Box className={styles.playerName}>{name}</Box>
      <Box className={styles.timer}>{time}</Box>
    </Box>
    <Box className={styles.points}>{points}</Box>
    {rack && (
      <Box className={styles.Rack}>
        <Rack 
          rack={rack} 
          color={color.current} 
          onTileClick={onTileClick}
          selectedTiles={selectedTiles}
        />
      </Box>
    )}
  </Box>
);

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
  tilesToExchange,
  icons
}) {
  const isSubmitDisabled = !gameStarted || !selectedBoardPosition || selectedTiles.length === 0;
  const isExchangeDisabled = !gameStarted || tilesToExchange.length === 0;

  return (
    <Box className={styles.playerPanel}>
      <Box className={styles.playerToggle}>
        <Tooltip title="Settings">
          <Box onClick={onSettingsOpen}>
            {icons.settings}
          </Box>
        </Tooltip>
        <Tooltip title="Color Scheme">
          <Box onClick={onColorSchemeOpen}>
            {icons.colorScheme}
          </Box>
        </Tooltip>
        <Tooltip title={isBotMode ? "Playing against bot" : "Play against bot"}>
          {React.cloneElement(icons.botMode, {
            onClick: () => {
              if (isDictionaryLoading) return;
              if (!gameStarted) {
                onStartGame();
              }
              onBotModeToggle();
            },
            style: {
              opacity: isDictionaryLoading ? 0.5 : 1,
              cursor: isDictionaryLoading ? 'not-allowed' : 'pointer'
            }
          })}
        </Tooltip>
        <Tooltip title={gameStarted ? "Get Top Moves" : "Start game to enable top moves"} placement="top">
          {React.cloneElement(icons.topMoves, {
            onClick: onGetTopMoves,
            style: {
              opacity: !gameStarted ? 0.3 : (isLoadingTopMoves ? 0.5 : 1),
              cursor: !gameStarted ? 'not-allowed' : 'pointer',
              pointerEvents: !gameStarted ? 'none' : 'auto'
            }
          })}
        </Tooltip>
      </Box>

      <Box className={styles.playerToggle}>
        <Tooltip title={gameStarted ? "Submit" : "Start game to enable submit"} placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onWordSubmit}
            sx={{ 
              ...actionButtonStyle,
              opacity: !gameStarted ? 0.3 : (isSubmitDisabled ? 0.5 : 1),
              cursor: !gameStarted ? 'not-allowed' : (isSubmitDisabled ? 'not-allowed' : 'pointer'),
              pointerEvents: !gameStarted ? 'none' : 'auto'
            }}
          >
            <SendIcon sx={{ fontSize: 20 }} />
          </Box>
        </Tooltip>
        <Tooltip title={gameStarted ? "Pass" : "Start game to enable pass"} placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onPass}
            sx={{ 
              ...actionButtonStyle,
              opacity: !gameStarted ? 0.3 : 1,
              cursor: !gameStarted ? 'not-allowed' : 'pointer',
              pointerEvents: !gameStarted ? 'none' : 'auto'
            }}
          >
            <CancelIcon sx={{ fontSize: 20 }} />
          </Box>
        </Tooltip>
        <Tooltip title={gameStarted ? "Exchange" : "Start game to enable exchange"} placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onExchange}
            sx={{ 
              ...actionButtonStyle,
              opacity: !gameStarted ? 0.3 : (isExchangeDisabled ? 0.5 : 1),
              cursor: !gameStarted ? 'not-allowed' : (isExchangeDisabled ? 'not-allowed' : 'pointer'),
              pointerEvents: !gameStarted ? 'none' : 'auto'
            }}
          >
            <SwapHorizIcon sx={{ fontSize: 20 }} />
          </Box>
        </Tooltip>
      </Box>

      {currentPlayer === 2 ? (
        <>
          <PlayerInfoSection
            name={player2Name}
            time={player2Time}
            points={player2Points}
            rack={player2Rack}
            color={color}
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
          />
          <PlayerInfoSection
            name={player1Name}
            time={player1Time}
            points={player1Points}
          />
        </>
      ) : (
        <>
          <PlayerInfoSection
            name={player1Name}
            time={player1Time}
            points={player1Points}
            rack={player1Rack}
            color={color}
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
          />
          <PlayerInfoSection
            name={player2Name}
            time={player2Time}
            points={player2Points}
          />
        </>
      )}
    </Box>
  );
} 