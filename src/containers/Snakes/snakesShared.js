import React from 'react';
import Cell from '../../components/AppContent/Board/Cell.js';
import { getHooksLocal } from '../../utils/localDictionary';
import styles from './Snakes.module.css';

export const PRESETS = [
  { label: 'High Probability', min: 1, max: 1000 },
  { label: 'Midrange', min: 1000, max: 6000 },
  { label: 'Low Probability', min: 6000, max: 15000 },
  { label: 'Rare', min: 15000, max: 25000 },
];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A single protile - reuses the app's real tile art (Cell.js) and the
// user's chosen tile color, scaled up from its native 30px board/rack size.
// Pass `size` (px) for a custom scale (e.g. the Lith mode puzzle grid's
// small tiles); omit it for the standard 52px (30px on mobile) size.
export function Protile({ letter, color, size }) {
  if (size) {
    const scale = size / 30;
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ transform: `scale(${scale})` }}>
          <Cell type="rack" bonus={{ value: letter }} color={color} />
        </div>
      </div>
    );
  }
  return (
    <div className={styles.protileBox}>
      <div className={styles.protileInner}>
        <Cell type="rack" bonus={{ value: letter }} color={color} />
      </div>
    </div>
  );
}

// A found/revealed word chip: hooks (front + back) flanking the word, plus
// its probability rank, all pulled from the local dictionary + word lists.
export function WordChip({ entry, variant, hookCache }) {
  const { word, rank } = entry;
  let hooks = hookCache.current.get(word);
  if (hooks === undefined) {
    hooks = getHooksLocal(word) || { front: [], back: [] };
    hookCache.current.set(word, hooks);
  }
  const chipClass = variant === 'found' ? styles.foundChip : styles.revealedChip;
  return (
    <span className={chipClass}>
      {hooks.front.length > 0 && <span className={styles.chipHook}>{hooks.front.join('')}</span>}
      <span className={styles.chipWord}>{word}</span>
      {hooks.back.length > 0 && <span className={styles.chipHook}>{hooks.back.join('')}</span>}
      <span className={styles.chipRank}>#{rank.toLocaleString()}</span>
    </span>
  );
}
