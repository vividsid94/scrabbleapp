import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import styles from '../Viewer.module.css';
import Rack from '../../../components/AppContent/Board/Rack';
import { createRack } from '../../../functions/rackFunctions.js';
import { ThemeContext } from '../../../App';

const PlayerInfoSection = ({ name, points, rack, color, tiles, isCurrentPlayer, textColor, lightMode = 'dark' }) => (
  <Box className={styles.playerPanel} sx={{
    padding: '10px 0px',
    background: lightMode === 'dark' 
      ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.98) 100%)',
    border: lightMode === 'dark' 
      ? '1px solid rgba(255, 255, 255, 0.1)' 
      : '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: '8px',
    boxShadow: lightMode === 'dark'
      ? '0 2px 8px rgba(0, 0, 0, 0.2)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    backgroundImage: 'none'
  }}>
    <Box className={styles.playerInfo}>
      <Box className={styles.playerName} sx={{color: lightMode === 'dark' ? '#fff' : '#1F2937'}}>{name}</Box>
    </Box>
    <Box className={styles.points} sx={{
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#D97706'
    }}>
      {points}
    </Box>
    {rack && (
      <Box className={styles.Rack}>
        <Rack board={rack} tiles={tiles} color={color.current}/>
      </Box>
    )}
  </Box>
);

const PlayerInfo = ({
  mode,
  name1,
  name2,
  revealedName1,
  revealedName2,
  revealedElo,
  revealedElo2,
  player1points,
  player2points,

  currentMoveRef,
  origPlayerRaw,
  tiles,
  color,
  onTurnClick,
  parsedMoves
}) => {
  const { lightMode } = useContext(ThemeContext);
  const totalTurns = parsedMoves ? parsedMoves.length : 0;
  const textColor = lightMode === 'dark' ? '#fff' : '#000';

  // Determine which player is currently active using NEW content-based parsing
  const currentMove = parsedMoves && parsedMoves[currentMoveRef.current + 1];
  const currentPlayer = currentMove ? currentMove.player : null;
  const isPlayer1Active = currentPlayer === origPlayerRaw;

  const player1Name = mode === "VIEWER" ? name1 : revealedName1;
  const player2Name = mode === "VIEWER" ? name2 : revealedName2;
  const player1FullName = revealedElo ? `${player1Name}, ${revealedElo}` : player1Name;
  const player2FullName = revealedElo2 ? `${player2Name}, ${revealedElo2}` : player2Name;

  const player1Rack = isPlayer1Active ? createRack(currentMoveRef.current + 1, parsedMoves) : null;
  const player2Rack = !isPlayer1Active ? createRack(currentMoveRef.current + 1, parsedMoves) : null;

  return (
    <>
      <PlayerInfoSection
        name={player1FullName}
        points={player1points}
        rack={player1Rack}
        color={color}
        tiles={tiles}
        isCurrentPlayer={isPlayer1Active}
        textColor={textColor}
        lightMode={lightMode}
      />
      <PlayerInfoSection
        name={player2FullName}
        points={player2points}
        rack={player2Rack}
        color={color}
        tiles={tiles}
        isCurrentPlayer={!isPlayer1Active}
        textColor={textColor}
        lightMode={lightMode}
      />
    </>
  );
};

export default PlayerInfo; 