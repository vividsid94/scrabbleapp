import React, { useContext, useState } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import { ThemeContext } from '../../App';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import LithMode from './modes/LithMode';
import ComingSoonMode from './modes/ComingSoonMode';
import ClassicMode from './modes/ClassicMode';
import styles from './Snakes.module.css';

const TABS = [
  { id: 1, label: 'Lith Mode' },
  { id: 2, label: 'Mode 2', disabled: true },
  { id: 3, label: 'Classic' },
];

export default function Snakes() {
  const { lightMode } = useContext(ThemeContext);
  const tileColor = useColorSchemeStore((state) => state.color);
  const [mode, setMode] = useState(1);

  return (
    <div className={styles.page}>
      <Sidenav />
      <div className={styles.main} data-theme={lightMode}>
        <div className={styles.header}>
          <div className={styles.heading}>Snakes</div>
        </div>

        <div className={styles.tabBar} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              disabled={tab.disabled}
              className={mode === tab.id ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setMode(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 1 && <LithMode tileColor={tileColor} />}
        {mode === 2 && <ComingSoonMode />}
        {mode === 3 && <ClassicMode tileColor={tileColor} />}
      </div>
    </div>
  );
}
