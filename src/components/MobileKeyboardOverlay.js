import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import { ThemeContext } from '../App';
import styles from './MobileKeyboardOverlay.module.css';

/**
 * Shared mobile keyboard overlay for board input.
 *
 * Props:
 * - visible: boolean – whether to render the overlay
 * - onKeyPress: (key: string) => void – called with letter / 'Backspace' / 'Enter' / 'Dead'
 * - onClose?: () => void – dismiss the keyboard overlay
 * - label?: string – optional label text above keyboard (e.g. mode or hint)
 * - deadKey?: boolean – adds a 💀 header button that calls onKeyPress('Dead')
 *   (Snakes' Zyz/Classic modes use it as an instant "guess DEAD" shortcut).
 *   Omitted everywhere else, so existing callers (e.g. Play.js) are unaffected.
 */
export default function MobileKeyboardOverlay({ visible, onKeyPress, onClose, label, deadKey }) {
  const { lightMode } = useContext(ThemeContext);
  const [pressedKey, setPressedKey] = useState(null);

  if (!visible) return null;

  const isDark = lightMode === 'dark';
  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const keyClass = isDark ? styles.keyDark : styles.keyLight;
  const backspaceClass = isDark ? styles.backspaceBtnDark : styles.backspaceBtnLight;
  const exitClass = isDark ? styles.exitBtnDark : styles.exitBtnLight;

  // Letter keys sit edge-to-edge with only a thin visual gap between them
  // (see .row's gap) - a finger landing exactly on that gap, or just past a
  // key's own edge, would otherwise hit nothing. Handling the touch at the
  // ROW level and picking whichever key's box is horizontally closest to
  // the touch point - instead of relying on the browser's normal per-element
  // hit testing - means there's no dead zone between keys at all, which is
  // what actually made this hard to type on with bigger fingers (the fix
  // isn't bigger keys, it's no gaps a touch can fall through).
  const handleRowPointerDown = (e) => {
    const row = e.currentTarget;
    const x = e.clientX;
    let closestKey = null;
    let closestDist = Infinity;
    for (const child of row.children) {
      const key = child.getAttribute('data-key');
      if (!key) continue;
      const rect = child.getBoundingClientRect();
      const dist = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
      if (dist < closestDist) {
        closestDist = dist;
        closestKey = key;
      }
    }
    if (closestKey) {
      setPressedKey(closestKey);
      onKeyPress && onKeyPress(closestKey);
    }
  };

  const clearPressedKey = () => setPressedKey(null);

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
        {deadKey && (
          <Box
            className={`${styles.headerBtn} ${styles.deadBtn}`}
            onClick={() => onKeyPress && onKeyPress('Dead')}
            aria-label="Guess dead"
          >
            💀
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
        <Box
          key={row}
          className={styles.row}
          onPointerDown={handleRowPointerDown}
          onPointerUp={clearPressedKey}
          onPointerLeave={clearPressedKey}
        >
          {row.split('').map((letter) => (
            <Box
              key={letter}
              data-key={letter}
              className={`${styles.key} ${keyClass} ${pressedKey === letter ? styles.keyPressed : ''}`}
            >
              {letter}
            </Box>
          ))}
          {rowIndex === 2 && (
            <Box
              data-key="Enter"
              className={`${styles.key} ${styles.keyPrimary} ${pressedKey === 'Enter' ? styles.keyPressed : ''}`}
            >
              Go
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
