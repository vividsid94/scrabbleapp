import React from 'react';
import { Modal, Box } from '@mui/material';
import styles from './Modals.module.css';

export default function TopMovesModal({ 
  open, 
  onClose, 
  isLoadingTopMoves, 
  isDictionaryLoading, 
  topMoves,
  onMoveSelect
}) {
  const handleMoveClick = (move) => {
    onMoveSelect(move);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="top-moves-modal"
    >
      <Box className={styles.modalContainer}>
        <Box className={styles.modalTitle}>Top Moves</Box>
        {isLoadingTopMoves ? (
          <Box className={styles.loading}>
            {isDictionaryLoading ? (
              <>
                <Box>Loading dictionary...</Box>
                <Box className={styles.loadingSubtext}>This only happens once per session</Box>
              </>
            ) : (
              <Box>Finding best moves...</Box>
            )}
          </Box>
        ) : (
          <Box className={styles.topMovesList}>
            {topMoves.map((move, index) => (
              <Box 
                key={index} 
                className={styles.topMoveItem}
                onClick={() => handleMoveClick(move)}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <Box className={styles.movePosition}>{move.startPosition}</Box>
                <Box className={styles.moveWord}>{move.word}</Box>
                <Box className={styles.moveScore}>{move.score} pts</Box>
                <Box className={styles.moveDirection}>
                  {move.direction === 'right' ? '→' : '↓'}
                </Box>
              </Box>
            ))}
            {topMoves.length === 0 && (
              <Box className={styles.noMoves}>No valid moves found</Box>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  );
} 