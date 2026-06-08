import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from '@phosphor-icons/react';
import styles from './RankingsPodium.module.css';

export default function RankingsPodium({ players = [], lexicon = 'twl', colors }) {
  const navigate = useNavigate();
  const rankField = lexicon === 'csw' ? 'cswrank' : 'twlrank';
  const ratingField = lexicon === 'csw' ? 'cswrating' : 'twlrating';

  const sorted = [...players]
    .sort((a, b) => (Number(a[rankField] || a.rank) || 999) - (Number(b[rankField] || b.rank) || 999))
    .slice(0, 3);

  if (sorted.length === 0) return null;

  const order = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : sorted;
  const ranks = sorted.length >= 3 ? [2, 1, 3] : sorted.map((p, i) => Number(p[rankField] || p.rank) || i + 1);

  const podiumHeight = (rank) => (rank === 1 ? styles.first : rank === 2 ? styles.second : styles.third);
  const medalColor = (rank) => {
    if (rank === 1) return colors.accentGold;
    if (rank === 2) return colors.accentSilver;
    return colors.accentBronze;
  };

  return (
    <section
      className={styles.podium}
      style={{
        '--card-bg': colors.cardBg,
        '--border': colors.border,
        '--text-primary': colors.textPrimary,
        '--text-secondary': colors.textSecondary,
        '--accent': colors.accentBlue,
      }}
    >
      <h2 className={styles.heading}>Top rated</h2>
      <div className={styles.stand}>
        {order.map((player, i) => {
          const rank = ranks[i];
          const name = player.name || player.playername || 'Unknown';
          const rating = player[ratingField] || player.rating;
          const location = player.state || player.location;

          return (
            <button
              key={player.playerid || i}
              type="button"
              className={`${styles.slot} ${podiumHeight(rank)}`}
              onClick={() => player.playerid && navigate(`/player/${player.playerid}`)}
              style={{ borderColor: medalColor(rank) }}
            >
              <div className={styles.rankBadge} style={{ backgroundColor: medalColor(rank) }}>
                {rank === 1 ? <Crown size={14} weight="fill" /> : rank}
              </div>
              {player.photourl ? (
                <img src={player.photourl} alt="" className={styles.avatar} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <div className={styles.avatarFallback} style={{ backgroundColor: colors.badgeBg }}>
                  {name.charAt(0)}
                </div>
              )}
              <div className={styles.playerName}>{name.split(' ')[0]}</div>
              <div className={styles.rating}>{rating ? Math.round(Number(rating)) : '—'}</div>
              {location && <div className={styles.location}>{location}</div>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
