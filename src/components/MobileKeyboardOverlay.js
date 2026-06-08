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
 * - onClose?: () => void – dismiss the keyboard overlay
 * - label?: string – optional label text above keyboard (e.g. mode or hint)
 */
export default function MobileKeyboardOverlay({ visible, onKeyPress, onClose, label }) {
  const { lightMode } = useContext(ThemeContext);

  if (!visible) return null;

  const isDark = lightMode === 'dark';
  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const keyClass = isDark ? styles.keyDark : styles.keyLight;
  const backspaceClass = isDark ? styles.backspaceBtnDark : styles.backspaceBtnLight;
  const exitClass = isDark ? styles.exitBtnDark : styles.exitBtnLight;

  return (
    <Box
      className={`${styles.overlay} ${isDark ? styles.overlayDark : styles.overlayLight}`}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <Box className={styles.header}>
        {label && (
          <Box className={`${styles.label} ${isDark ? styles.labelDark : styles.labelLight}`}>
            {label}
          </Box>
        )}
        <Box
          className={`${styles.headerBtn} ${backspaceClass}`}
          onClick={() => onKeyPress && onKeyPress('Backspace')}
          aria-label="Backspace"
        >
          ⌫
        </Box>
        <Box
          className={`${styles.headerBtn} ${exitClass}`}
          onClick={() => onClose && onClose()}
          aria-label="Close keyboard"
        >
          ✕
        </Box>
      </Box>

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
            <Box
              className={`${styles.key} ${styles.keyPrimary}`}
              onClick={() => onKeyPress && onKeyPress('Enter')}
            >
              Go
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
