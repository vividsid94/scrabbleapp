import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PlayerCard.module.css';

export default function PlayerCard({ player, rank, colors }) {
  const navigate = useNavigate();

  const name = player.name || player.playername || 'Unknown';
  const rating = player.twlrating || player.cswrating || player.rating;
  const location = player.location || player.state || player.city;
  const wins = player.w || player.wins || 0;
  const losses = player.l || player.losses || 0;

  const rankStyle = rank != null ? {
    backgroundColor: rank === 1 ? colors.accentGoldBg
      : rank === 2 ? colors.accentBlueBg
      : rank === 3 ? colors.accentGreenBg
      : colors.badgeBg,
    color: rank === 1 ? colors.accentGold
      : rank === 2 ? colors.accentSilver
      : rank === 3 ? colors.accentBronze
      : colors.textSecondary,
  } : null;

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => player.playerid && navigate(`/player/${player.playerid}`)}
      style={{
        '--card-bg': colors.cardBg,
        '--card-hover': colors.cardBgHover,
        '--border': colors.border,
        '--text-primary': colors.textPrimary,
        '--text-secondary': colors.textSecondary,
      }}
    >
      {rank != null && (
        <div className={styles.rankBadge} style={rankStyle}>{rank}</div>
      )}

      {player.photourl ? (
        <img
          src={player.photourl}
          alt=""
          className={styles.avatar}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div
          className={styles.avatarFallback}
          style={{ backgroundColor: colors.badgeBg, color: colors.textSecondary }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className={styles.info}>
        <div className={styles.name} style={{ color: colors.accentBlue }}>{name}</div>
        {location && <div className={styles.location}>{location}</div>}
      </div>

      <div className={styles.stats}>
        {rating && <div className={styles.rating}>{Math.round(Number(rating))}</div>}
        {(wins > 0 || losses > 0) && (
          <div className={styles.record}>{wins}W-{losses}L</div>
        )}
      </div>
    </button>
  );
}
