import React from 'react';
import { X, Trash, Pause, Play } from '@phosphor-icons/react';
import { useConsoleLogStore } from '../../stores/consoleLogStore';
import styles from './DevConsoleOverlay.module.css';

const LEVEL_COLORS = {
  log: '#9CA3AF',
  info: '#60A5FA',
  warn: '#F59E0B',
  error: '#EF4444',
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return `${d.toLocaleTimeString('en-US', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
};

// Just the panel now - the toggle lives in Sidenav (desktop sidebar +
// mobile menu) instead of a floating button, both driven by the same
// consoleLogStore.isOpen so either entry point opens the same panel.
export default function DevConsoleOverlay() {
  const isOpen = useConsoleLogStore(state => state.isOpen);
  const logs = useConsoleLogStore(state => state.logs);
  const paused = useConsoleLogStore(state => state.paused);
  const { clearLogs, setPaused, setOpen } = useConsoleLogStore();

  if (!isOpen) return null;

  return (
    <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.title}>Console ({logs.length})</span>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setPaused(!paused)}
                aria-label={paused ? 'Resume capturing' : 'Pause capturing'}
                title={paused ? 'Resume capturing' : 'Pause capturing'}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={clearLogs}
                aria-label="Clear logs"
                title="Clear logs"
              >
                <Trash size={16} />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setOpen(false)}
                aria-label="Close"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className={styles.logList}>
            {logs.length === 0 ? (
              <div className={styles.emptyState}>{paused ? 'Capturing paused.' : 'No logs yet.'}</div>
            ) : (
              [...logs].reverse().map((entry) => (
                <div key={entry.id} className={styles.logEntry}>
                  <span className={styles.logTime}>{formatTime(entry.timestamp)}</span>
                  <span
                    className={styles.logLevel}
                    style={{ color: LEVEL_COLORS[entry.level] || LEVEL_COLORS.log }}
                  >
                    {entry.level.toUpperCase()}
                  </span>
                  <span
                    className={styles.logMessage}
                    style={{ color: entry.level === 'log' ? '#E5E7EB' : LEVEL_COLORS[entry.level] }}
                  >
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
    </div>
  );
}
