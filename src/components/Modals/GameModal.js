import React from 'react';
import { Box, Modal } from '@mui/material';
import { useGameStore } from '../../stores/gameStore';
import ColorScheme from '../common/ColorScheme';
import styles from '../../containers/Play/Play.module.css';

const GameModal = () => {
  const {
    open,
    modalContent,
    theme,
    playerMoveSoundType,
    botMoveSoundType,
    setTheme,
    setPlayerMoveSoundType,
    setBotMoveSoundType,
    handleClose,
  } = useGameStore();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box className={styles.modalContainer}>
        {modalContent === "settings" && (
          <Box>
            <Box className={styles.modalContainer__dictionary}>
              Board Mode
              <select 
                className={styles.styleSelection} 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="STANDARD">Standard</option>
                {/* <option value="FULLBOARD">Full Board</option> */}
              </select>
            </Box>
            <Box className={styles.modalContainer__dictionary}>
              Player Move Sound
              <select
                className={styles.styleSelection}
                value={playerMoveSoundType}
                onChange={e => setPlayerMoveSoundType(e.target.value)}
              >
                <option value="classic">Classic</option>
                <option value="sword">Sword</option>
                <option value="puzzle">Puzzle</option>
              </select>
            </Box>
            <Box className={styles.modalContainer__dictionary}>
              Bot Move Sound
              <select
                className={styles.styleSelection}
                value={botMoveSoundType}
                onChange={e => setBotMoveSoundType(e.target.value)}
              >
                <option value="classic">Classic</option>
                <option value="sword">Sword</option>
                <option value="puzzle">Puzzle</option>
              </select>
            </Box>
          </Box>
        )}
        {modalContent === "colorScheme" && (
          <ColorScheme />
        )}
      </Box>
    </Modal>
  );
};

export default GameModal; 