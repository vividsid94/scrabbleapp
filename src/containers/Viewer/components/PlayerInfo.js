import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import styles from '../Viewer.module.css';
import Rack from '../../../components/AppContent/Board/Rack';
import { createRack } from '../../../functions/rackFunctions.js';
import { ThemeContext } from '../../../App';

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
  const { lightMode } = useContext(ThemeContext);
  const totalTurns = moveSet ? moveSet.length : 0;
  const textColor = lightMode === 'dark' ? '#fff' : '#000';

  return (
    <Box className={styles.playerPanel} style={{color: textColor}}>
      {totalTurns > 0 && (
        <Box className={styles.turnNumbers}>
          {Array.from({ length: totalTurns }, (_, i) => (
            <Box 
              key={i + 1}
              className={styles.turnNumber}
              onClick={() => onTurnClick && onTurnClick(i)}
              style={{color: textColor}}
            >
              {i + 1}
            </Box>
          ))}
        </Box>
      )}
      <Box style={{color: textColor}}>
        {mode === "VIEWER" ? name1 : revealedName1}{revealedElo ? ", " + revealedElo : ''}
      </Box>
      <Box className={styles.Rack}>
        {(moveSet[currentMoveRef.current + 1] ? moveSet[currentMoveRef.current + 1].split(':')[0] : 'null') === origPlayerRaw ? 
          <Rack board={createRack(moveSet, currentMoveRef.current)} tiles={tiles} color={color.current}/> : null}
      </Box> 
      <Box style={{color: textColor}}>
        {player1points} points
      </Box>
      <Box className={styles.player2Panel} style={{color: textColor}}>
        <Box style={{color: textColor}}>
          {mode === "VIEWER" ? name2 : revealedName2}{revealedElo2 ? ", " + revealedElo2 : ''}
        </Box>
        <Box className={styles.Rack}>
          {(moveSet[currentMoveRef.current + 1] ? moveSet[currentMoveRef.current + 1].split(':')[0] : 'null') !== origPlayerRaw ? 
            <Rack board={createRack(moveSet, currentMoveRef.current)} tiles={tiles} color={color.current}/> : null}
        </Box>
        <Box style={{color: textColor}}>
          {player2points} points
        </Box>
      </Box> 
    </Box>
  );
};

export default PlayerInfo; 