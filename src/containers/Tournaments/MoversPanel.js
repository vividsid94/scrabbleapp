import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendUp } from '@phosphor-icons/react';
import styles from './ScrollPanel.module.css';

function Chip({ item, onClick, accent }) {
  return (
    <button type="button" className={styles.chip} onClick={onClick} style={{ '--accent': accent }}>
      {item.photourl && (
        <img
          src={item.photourl}
          alt=""
          className={styles.avatar}
          style={{ borderColor: accent }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <div className={styles.chipName}>{item.name || item.playername}</div>
      <div className={styles.chipStats}>
        <span className={styles.rating}>{item.rating || item.twlrating}</span>
        <span className={styles.change}>+{item.change || item.ratingchange || item.gain}</span>
      </div>
    </button>
  );
}

export default function MoversPanel({ movers = [], colors }) {
  const navigate = useNavigate();

  if (movers.length === 0) return null;

  const vars = {
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--card-bg': colors.cardBg,
    '--border-accent': `${colors.accentGreen}35`,
    '--accent': colors.accentGreen,
    '--fade-bg': colors.pageBg,
  };

  const handleClick = (m) => m.playerid && navigate(`/player/${m.playerid}`);

  return (
    <section className={styles.panel} style={vars}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <TrendUp size={17} weight="fill" style={{ color: colors.accentGreen }} />
          <span className={styles.title}>Top Movers (12 mo)</span>
        </div>
        <span className={styles.hint}>Swipe</span>
      </div>

      <div className={styles.scrollWrap}>
        <div className={styles.strip}>
          {movers.map((m, i) => (
            <Chip key={m.playerid || i} item={m} onClick={() => handleClick(m)} accent={colors.accentGreen} />
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {movers.slice(0, 6).map((m, i) => (
          <Chip key={m.playerid || `g-${i}`} item={m} onClick={() => handleClick(m)} accent={colors.accentGreen} />
        ))}
      </div>
    </section>
  );
}
