import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from '@phosphor-icons/react';
import styles from './ScrollPanel.module.css';

function Chip({ item, onClick, accent }) {
  return (
    <button type="button" className={styles.chip} onClick={onClick} style={{ '--accent': accent }}>
      {item.photourl && (
        <img
          src={item.photourl}
          alt=""
          className={styles.avatar}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <div className={styles.chipName}>{item.name || item.playername}</div>
      <div className={styles.chipValue}>{item.milestone || item.rating || item.description}</div>
    </button>
  );
}

export default function MilestonesPanel({ milestones = [], colors }) {
  const navigate = useNavigate();

  if (milestones.length === 0) return null;

  const vars = {
    '--text-primary': colors.textPrimary,
    '--text-secondary': colors.textSecondary,
    '--card-bg': colors.cardBg,
    '--border-accent': `${colors.accentGold}35`,
    '--accent': colors.accentGold,
    '--fade-bg': colors.pageBg,
  };

  const handleClick = (m) => m.playerid && navigate(`/player/${m.playerid}`);

  return (
    <section className={styles.panel} style={vars}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Star size={17} weight="fill" style={{ color: colors.accentGold }} />
          <span className={styles.title}>Recent Milestones</span>
        </div>
        <span className={styles.hint}>Swipe</span>
      </div>

      <div className={styles.scrollWrap}>
        <div className={styles.strip}>
          {milestones.map((m, i) => (
            <Chip key={m.playerid || i} item={m} onClick={() => handleClick(m)} accent={colors.accentGold} />
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {milestones.slice(0, 6).map((m, i) => (
          <Chip key={m.playerid || `g-${i}`} item={m} onClick={() => handleClick(m)} accent={colors.accentGold} />
        ))}
      </div>
    </section>
  );
}
