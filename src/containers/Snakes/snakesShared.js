import React from 'react';
import { ClockCountdown } from '@phosphor-icons/react';
import Cell from '../../components/AppContent/Board/Cell.js';
import { getHooksLocal } from '../../utils/localDictionary';
import styles from './Snakes.module.css';

export const PRESETS = [
  { label: 'High Probability', min: 1, max: 1000 },
  { label: 'Midrange', min: 1000, max: 6000 },
  { label: 'Low Probability', min: 6000, max: 15000 },
  { label: 'Rare', min: 15000, max: 25000 },
];

// One distinct, legible-with-white-text color per remaining-solutions
// count, so a badge's color visibly changes (not just its number) when a
// word is knocked off a multi-solution alphagram - e.g. spotting "that one
// went from 5 to 4" at a glance instead of having to re-read the digit.
// Green is reserved for the fully-solved state, so it's deliberately not
// in this list; counts past the palette's length cycle back around.
const BADGE_COLORS = [
  '#3D5A80', // 1 - blue
  '#7C5295', // 2 - purple
  '#0F766E', // 3 - teal
  '#A8527A', // 4 - rose
  '#4338CA', // 5 - indigo
  '#B45309', // 6 - burnt orange
  '#475569', // 7 - slate
  '#9D174D', // 8 - wine
];

export function badgeColorForCount(count) {
  if (!count || count < 1) return BADGE_COLORS[0];
  return BADGE_COLORS[(count - 1) % BADGE_COLORS.length];
}

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
    // Cell.js's own native render size jumps 30px -> 40px at a 1920px
    // viewport breakpoint (Cell.module.css) - the scale has to be computed
    // against whichever native size is actually in effect, or the tile
    // ends up 33% too big above 1920px (a fixed size/30 scale keeps
    // assuming 30px). Driven by a CSS var + media query, not JS, so it
    // can't drift out of sync with Cell.module.css's own breakpoint.
    return (
      <div className={styles.miniProtileBox} style={{ '--mini-tile-size': size }}>
        <div className={styles.miniProtileInner}>
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

// Toggle + conditional percent slider for the Dead Racks difficulty option
// (shared by Lith and Zyz mode's setup screens - state stays local to each
// mode, this is just the reusable control). A custom track/thumb switch and
// a gradient-filled range input, rather than bare native controls, so this
// reads as a real settings module and not an afterthought. `hint` is
// mode-specific (the two modes resolve a fake differently), so it's passed
// in by the caller rather than hardcoded here.
export function DeadRacksSetting({ enabled, percent, onToggleChange, onPercentChange, hint }) {
  return (
    <div className={styles.deadRacksBox}>
      <label className={styles.toggleRow}>
        <span className={styles.toggleLabel}>💀 Dead racks</span>
        <span className={styles.toggleSwitch}>
          <input
            type="checkbox"
            className={styles.toggleInput}
            checked={enabled}
            onChange={(e) => onToggleChange(e.target.checked)}
          />
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
        </span>
      </label>
      {hint && <div className={styles.deadRacksHint}>{hint}</div>}
      {enabled && (
        <>
          <div className={styles.deadRacksHint}>
            <strong>Disclaimer:</strong> fakes are added on top of the real alphagrams in your range rather than replacing any of them, so every real one still gets drilled — raising the percentage makes the session longer instead.
          </div>
          <div className={styles.sliderRow}>
            <input
              type="range"
              className={styles.percentSlider}
              min={0}
              max={50}
              value={percent}
              onChange={(e) => onPercentChange(Number(e.target.value))}
              style={{ background: `linear-gradient(to right, var(--amber) ${percent * 2}%, var(--border) ${percent * 2}%)` }}
            />
            <span className={styles.sliderValue}>{percent}%</span>
          </div>
        </>
      )}
    </div>
  );
}

// Toggle + conditional countdown-duration slider for the optional Time
// Limit setting - shared by all three modes' setup screens the same way
// DeadRacksSetting is. `unit`/`onUnitChange` are only passed by modes where
// a "round" can hold multiple words (Zyz/Classic), to expose the
// per-word-vs-per-alphagram choice; Lith mode (one timer per page, no
// per-word concept) omits them and gets just the toggle + slider.
export function TimeLimitSetting({ enabled, onToggleChange, seconds, onSecondsChange, min, max, step, formatValue, hint, unit, onUnitChange }) {
  const fillPercent = ((seconds - min) / (max - min)) * 100;
  return (
    <div className={styles.deadRacksBox}>
      <label className={styles.toggleRow}>
        <span className={styles.toggleLabel}>
          <ClockCountdown size={16} weight="bold" style={{ verticalAlign: -3, marginRight: 5 }} />
          Time limit
        </span>
        <span className={styles.toggleSwitch}>
          <input
            type="checkbox"
            className={styles.toggleInput}
            checked={enabled}
            onChange={(e) => onToggleChange(e.target.checked)}
          />
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
        </span>
      </label>
      {hint && <div className={styles.deadRacksHint}>{hint}</div>}
      {enabled && (
        <>
          {unit && (
            <div className={styles.presetRow} style={{ marginTop: 4 }}>
              <button
                type="button"
                className={styles.presetPill}
                style={unit === 'word' ? { background: 'var(--amber)', color: '#fff', borderColor: 'var(--amber)' } : undefined}
                onClick={() => onUnitChange('word')}
              >
                Per word
              </button>
              <button
                type="button"
                className={styles.presetPill}
                style={unit === 'alphagram' ? { background: 'var(--amber)', color: '#fff', borderColor: 'var(--amber)' } : undefined}
                onClick={() => onUnitChange('alphagram')}
              >
                Per alphagram
              </button>
            </div>
          )}
          <div className={styles.sliderRow}>
            <input
              type="range"
              className={styles.percentSlider}
              min={min}
              max={max}
              step={step}
              value={seconds}
              onChange={(e) => onSecondsChange(Number(e.target.value))}
              style={{ background: `linear-gradient(to right, var(--amber) ${fillPercent}%, var(--border) ${fillPercent}%)` }}
            />
            <span className={styles.sliderValue}>{formatValue(seconds)}</span>
          </div>
        </>
      )}
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
