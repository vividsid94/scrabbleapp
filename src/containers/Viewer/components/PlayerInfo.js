import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import styles from '../Viewer.module.css';
import Rack from '../../../components/AppContent/Board/Rack';
import { createRack } from '../../../functions/rackFunctions.js';
import { ThemeContext } from '../../../App';

const PlayerInfoSection = ({ name, points, rack, color, tiles, isCurrentPlayer, textColor }) => (
  <Box className={styles.playerPanel} style={{padding: '10px 0px'}}>
    <Box className={styles.playerInfo}>
      <Box className={styles.playerName} style={{color: '#333'}}>{name}</Box>
    </Box>
    <Box className={styles.points}>
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
  moveSet,
  currentMoveRef,
  origPlayerRaw,
  tiles,
  color,
  onTurnClick,
  parsedMoves
}) => {
  const { lightMode } = useContext(ThemeContext);
  const totalTurns = moveSet ? moveSet.length : 0;
  const textColor = lightMode === 'dark' ? '#fff' : '#000';

  // Determine which player is currently active
  const currentPlayer = moveSet[currentMoveRef.current + 1] ? 
    moveSet[currentMoveRef.current + 1].split(':')[0] : null;
  const isPlayer1Active = currentPlayer === origPlayerRaw;

  const player1Name = mode === "VIEWER" ? name1 : revealedName1;
  const player2Name = mode === "VIEWER" ? name2 : revealedName2;
  const player1FullName = revealedElo ? `${player1Name}, ${revealedElo}` : player1Name;
  const player2FullName = revealedElo2 ? `${player2Name}, ${revealedElo2}` : player2Name;

  const player1Rack = isPlayer1Active ? createRack(moveSet, currentMoveRef.current, parsedMoves) : null;
  const player2Rack = !isPlayer1Active ? createRack(moveSet, currentMoveRef.current, parsedMoves) : null;

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
      />
      <PlayerInfoSection
        name={player2FullName}
        points={player2points}
        rack={player2Rack}
        color={color}
        tiles={tiles}
        isCurrentPlayer={!isPlayer1Active}
        textColor={textColor}
      />
    </>
  );
};

export default PlayerInfo; 