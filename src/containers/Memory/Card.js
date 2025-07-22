import React from 'react';
import Box from '@mui/material/Box';
import styles from './Memory.module.css';
import Typography from '@mui/material/Typography';

const Card = ({ className, onClick, imgSource, imgDesc }) => {
  return (
    <Box
      className={`${styles.card} ${className}`}
      onClick={onClick}
    >
      <Box className={styles.cardInner}>
        <Box className={styles.cardFront}>
          <Box className={styles.cardContent}>
            {/* No text or '?' on the front */}
          </Box>
        </Box>
        <Box className={styles.cardBack}>
          <Box className={styles.cardContent}>
            <img 
              src={imgSource} 
              alt={imgDesc} 
              className={styles.cardImage}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Card;
