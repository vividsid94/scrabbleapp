import React from 'react';
import { MapPin, Users, CaretRight } from '@phosphor-icons/react';
import styles from './TournamentListItem.module.css';

export default function TournamentListItem({ tournament, isUpcoming, colors, onClick }) {
  const accentColor = isUpcoming ? colors.accentGreen : colors.accentBlue;
  const name = tournament.name || tournament.tourneyname || tournament.mastername || 'Untitled';

  const formatDate = (d) => {
    if (!d) return { day: '—', month: '' };
    try {
      const date = new Date(d);
      return {
        day: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      };
    } catch {
      return { day: '—', month: '' };
    }
  };

  const entrants = tournament.entrants || tournament.numplayers;
  const location = tournament.location || tournament.city;
  const type = tournament.tourneytype || tournament.type;
  const { day, month } = formatDate(tournament.date || tournament.startdate);

  return (
    <button
      type="button"
      className={styles.row}
      onClick={onClick}
      style={{
        '--card-bg': colors.cardBg,
        '--border': colors.border,
        '--accent': accentColor,
        '--text-primary': colors.textPrimary,
        '--text-secondary': colors.textSecondary,
        '--badge-bg': colors.badgeBg,
      }}
    >
      <div className={styles.dateBlock} style={{ borderColor: accentColor }}>
        <span className={styles.dateDay}>{day}</span>
        {month && <span className={styles.dateMonth}>{month}</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.topLine}>
          <span className={styles.name}>{name}</span>
          {type && <span className={styles.badge}>{type}</span>}
        </div>
        <div className={styles.meta}>
          {location && (
            <span className={styles.metaItem}>
              <MapPin size={13} weight="fill" />
              {location}
            </span>
          )}
          {entrants !== undefined && entrants !== null && (
            <span className={styles.metaItem}>
              <Users size={13} weight="fill" />
              {entrants}
            </span>
          )}
        </div>
      </div>

      <CaretRight size={18} className={styles.chevron} style={{ color: colors.textMuted }} />
    </button>
  );
}
