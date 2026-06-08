import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import { ThemeContext } from '../App';
import styles from './MobileKeyboardOverlay.module.css';

/**
 * Shared mobile keyboard overlay for board input.
 *
 * Props:
 * - visible: boolean – whether to render the overlay
 * - onKeyPress: (key: string) => void – called with letter / 'Backspace' / 'Enter'
 * - label?: string – optional label text above keyboard (e.g. mode or hint)
 */
export default function MobileKeyboardOverlay({ visible, onKeyPress, label }) {
  const { lightMode } = useContext(ThemeContext);

  if (!visible) return null;

  const isDark = lightMode === 'dark';
  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const keyClass = isDark ? styles.keyDark : styles.keyLight;
  const wideKeyClass = isDark ? styles.keyWideDark : styles.keyWideLight;

  return (
    <Box
      className={`${styles.overlay} ${isDark ? styles.overlayDark : styles.overlayLight}`}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {label && (
        <Box className={`${styles.label} ${isDark ? styles.labelDark : styles.labelLight}`}>
          {label}
        </Box>
      )}
      {rows.map((row, rowIndex) => (
        <Box key={row} className={styles.row}>
          {row.split('').map((letter) => (
            <Box
              key={letter}
              className={`${styles.key} ${keyClass}`}
              onClick={() => onKeyPress && onKeyPress(letter)}
            >
              {letter}
            </Box>
          ))}
          {rowIndex === 2 && (
            <>
              <Box
                className={`${styles.key} ${styles.keyWide} ${wideKeyClass}`}
                onClick={() => onKeyPress && onKeyPress('Backspace')}
              >
                Del
              </Box>
              <Box
                className={`${styles.key} ${styles.keyWide} ${styles.keyPrimary}`}
                onClick={() => onKeyPress && onKeyPress('Enter')}
              >
                Go
              </Box>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
}
