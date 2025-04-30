import React from 'react';
import Box from '@mui/material/Box';
import styles from '../Viewer.module.css';
import Rack from '../../../components/AppContent/Board/Rack';
import { createRack } from '../../../functions/rackFunctions.js';

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
  onTurnClick
}) => {
  const totalTurns = moveSet ? moveSet.length : 0;

  return (
    <Box className={styles.playerPanel}>
      {totalTurns > 0 && (
        <Box className={styles.turnNumbers}>
          {Array.from({ length: totalTurns }, (_, i) => (
            <Box 
              key={i + 1}
              className={styles.turnNumber}
              onClick={() => onTurnClick && onTurnClick(i)}
            >
              {i + 1}
            </Box>
          ))}
        </Box>
      )}
      {mode === "VIEWER" ? name1 : revealedName1}{revealedElo ? ", " + revealedElo : ''}
      <Box className={styles.Rack}>
        {(moveSet[currentMoveRef.current + 1] ? moveSet[currentMoveRef.current + 1].split(':')[0] : 'null') === origPlayerRaw ? 
          <Rack board={createRack(moveSet, currentMoveRef.current)} tiles={tiles} color={color.current}/> : null}
      </Box> 
      <Box>
        {player1points} points
      </Box>
      <Box className={styles.playerPanel}>
        {mode === "VIEWER" ? name2 : revealedName2}{revealedElo2 ? ", " + revealedElo2 : ''}
        <Box className={styles.Rack}>
          {(moveSet[currentMoveRef.current + 1] ? moveSet[currentMoveRef.current + 1].split(':')[0] : 'null') !== origPlayerRaw ? 
            <Rack board={createRack(moveSet, currentMoveRef.current)} tiles={tiles} color={color.current}/> : null}
        </Box>
        <Box>
          {player2points} points
        </Box>
      </Box> 
    </Box>
  );
};

export default PlayerInfo; 