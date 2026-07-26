import React, { useContext, useState } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import { ThemeContext } from '../../App';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';
import LithMode from './modes/LithMode';
import ZyzMode from './modes/ZyzMode';
import WindUpMode from './modes/WindUpMode';
import RewindMode from './modes/RewindMode';
import styles from './Snakes.module.css';

// Phosphor has no actual snake icon - the 🐍 emoji reads as one, an
// abstract line-icon substitute doesn't. Only on Wind Up/Rewind (the two
// modes that are literally the same drill run forwards/backwards - "wind
// up" a seven into an eight, "rewind" it back down); Lith/Zyz aren't part
// of that pairing.
const TABS = [
  { id: 1, label: 'Lith Mode' },
  { id: 2, label: 'Zyz Mode' },
  { id: 3, label: 'Wind Up', icon: '🐍' },
  { id: 4, label: 'Rewind', icon: '🐍' },
];

export default function Snakes() {
  const { lightMode } = useContext(ThemeContext);
  const tileColor = useColorSchemeStore((state) => state.color);
  const [mode, setMode] = useState(1);

  return (
    <div className={styles.page}>
      <Sidenav />
      <div className={styles.main} data-theme={lightMode}>
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
              {tab.icon && <span aria-hidden="true">{tab.icon} </span>}
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 1 && <LithMode tileColor={tileColor} />}
        {mode === 2 && <ZyzMode tileColor={tileColor} />}
        {mode === 3 && <WindUpMode tileColor={tileColor} />}
        {mode === 4 && <RewindMode tileColor={tileColor} />}
      </div>
    </div>
  );
}
