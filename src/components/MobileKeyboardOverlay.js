import React from 'react';
import Box from '@mui/material/Box';
import styles from '../containers/Play/Play.module.css';

/**
 * Shared mobile keyboard overlay for board input.
 *
 * Props:
 * - visible: boolean – whether to render the overlay
 * - onKeyPress: (key: string) => void – called with letter / 'Backspace' / 'Enter'
 * - label?: string – optional label text above keyboard (e.g. mode or hint)
 */
export default function MobileKeyboardOverlay({ visible, onKeyPress, label }) {
  if (!visible) return null;

  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  return (
    <Box className={styles.mobileKeyboardOverlay}>
      {label && (
        <Box className={styles.mobileKeyboardLabel}>
          {label}
        </Box>
      )}
      {rows.map((row, rowIndex) => (
        <Box key={row} className={styles.mobileKeyboardRow}>
          {row.split('').map((letter) => (
            <Box
              key={letter}
              className={styles.mobileKey}
              onClick={() => onKeyPress && onKeyPress(letter)}
            >
              {letter}
            </Box>
          ))}
          {rowIndex === 2 && (
            <>
              <Box
                className={`${styles.mobileKey} ${styles.mobileKeyWide}`}
                onClick={() => onKeyPress && onKeyPress('Backspace')}
              >
                ⌫
              </Box>
              <Box
                className={`${styles.mobileKey} ${styles.mobileKeyWide} ${styles.mobileKeyPrimary}`}
                onClick={() => onKeyPress && onKeyPress('Enter')}
              >
                ↵
              </Box>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
}

