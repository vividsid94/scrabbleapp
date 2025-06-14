import React from 'react';
import Box from '@mui/material/Box';
import styles from '../Play.module.css';
import Rack from '../../../components/AppContent/Board/Rack.js';
import SendIcon from '@mui/icons-material/Send';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Tooltip } from '@mui/material';
import { BOT_RACK_VISIBILITY } from '../../../components/AppContent/References/testRacks';

const actionButtonStyle = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const PlayerInfoSection = ({ name, time, points, rack, color, onTileClick, selectedTiles, isBot, currentPlayer }) => (
  <Box className={styles.playerPanel}>
    <Box className={styles.playerInfo}>
      <Box className={styles.playerName}>{name}</Box>
      <Box className={styles.timer}>{time}</Box>
    </Box>
    <Box className={styles.points}>{points}</Box>
    {rack && ((!isBot) || (isBot && (BOT_RACK_VISIBILITY.enabled || currentPlayer === 2))) && (
      <Box className={styles.Rack}>
        {isBot ? (
          <Box sx={{ 
            display: 'flex', 
            gap: '4px', 
            justifyContent: 'center',
            padding: '8px',
            fontSize: '20px'
          }}>
            {rack.map((emoji, index) => (
              <Box key={index} sx={{ 
                width: '24px', 
                height: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: color.current,
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.2)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: '16px',
                color: 'white'
              }}>
                {emoji}
              </Box>
            ))}
          </Box>
        ) : (
          <Rack 
            rack={rack} 
            color={color.current} 
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
          />
        )}
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
          <Box 
            onClick={onSettingsOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icons.settings}
          </Box>
        </Tooltip>
        <Tooltip title="Color Scheme">
          <Box 
            onClick={onColorSchemeOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icons.colorScheme}
          </Box>
        </Tooltip>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icons.time}
        </Box>
        <Tooltip title={isDictionaryLoading ? "Loading dictionary..." : (isBotMode ? "New Game" : "Play")}>
          <Box 
            onClick={() => {
              if (isDictionaryLoading) return;
              onBotModeToggle();
            }}
            sx={{
              opacity: isDictionaryLoading ? 0.5 : 1,
              cursor: isDictionaryLoading ? 'not-allowed' : 'pointer',
              pointerEvents: isDictionaryLoading ? 'none' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icons.botMode}
          </Box>
        </Tooltip>
        <Tooltip title="Choices">
          <Box 
            onClick={onGetTopMoves}
            sx={{
              opacity: !gameStarted ? 0.3 : (isLoadingTopMoves ? 0.5 : 1),
              cursor: !gameStarted ? 'not-allowed' : 'pointer',
              pointerEvents: !gameStarted ? 'none' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icons.topMoves}
          </Box>
        </Tooltip>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icons.moveOrder}
        </Box>
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
        <Tooltip title={gameStarted ? "Pass (1)" : "Start game to enable pass"} placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onPass}
            sx={{ 
              ...actionButtonStyle,
              opacity: !gameStarted ? 0.3 : 1,
              cursor: !gameStarted ? 'not-allowed' : 'pointer',
              pointerEvents: !gameStarted ? 'none' : 'auto',
              position: 'relative'
            }}
          >
            <CancelIcon sx={{ fontSize: 20 }} />
            <Box sx={{ 
              position: 'absolute', 
              top: -5, 
              right: -5, 
              fontSize: '10px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '50%',
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              1
            </Box>
          </Box>
        </Tooltip>
        <Tooltip title={gameStarted ? "Exchange (2)" : "Start game to enable exchange"} placement="top">
          <Box 
            className={styles.keyBtn}
            onClick={onExchange}
            sx={{ 
              ...actionButtonStyle,
              opacity: !gameStarted ? 0.3 : (isExchangeDisabled ? 0.5 : 1),
              cursor: !gameStarted ? 'not-allowed' : (isExchangeDisabled ? 'not-allowed' : 'pointer'),
              pointerEvents: !gameStarted ? 'none' : 'auto',
              position: 'relative'
            }}
          >
            <SwapHorizIcon sx={{ fontSize: 20 }} />
            <Box sx={{ 
              position: 'absolute', 
              top: -5, 
              right: -5, 
              fontSize: '10px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '50%',
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              2
            </Box>
          </Box>
        </Tooltip>
      </Box>

      {currentPlayer === 2 ? (
        <>
          <PlayerInfoSection
            name={player2Name}
            time={player2Time}
            points={player2Points}
            rack={isBotMode ? ['🤖', '👾', '🤖', '👾', '🤖', '👾', '🤖'] : player2Rack}
            color={color}
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
            isBot={isBotMode}
            currentPlayer={currentPlayer}
          />
          <PlayerInfoSection
            name={player1Name}
            time={player1Time}
            points={player1Points}
            rack={player1Rack}
            color={color}
            onTileClick={onTileClick}
            selectedTiles={selectedTiles}
            isBot={false}
            currentPlayer={currentPlayer}
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
            isBot={false}
            currentPlayer={currentPlayer}
          />
          <PlayerInfoSection
            name={player2Name}
            time={player2Time}
            points={player2Points}
            rack={isBotMode ? ['🤖', '👾', '🤖', '👾', '🤖', '👾', '🤖'] : player2Rack}
            color={color}
            isBot={isBotMode}
            currentPlayer={currentPlayer}
          />
        </>
      )}
    </Box>
  );
} 