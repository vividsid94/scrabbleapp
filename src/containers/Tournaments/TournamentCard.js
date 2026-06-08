import React from 'react';
import { Calendar, MapPin, Users, ArrowRight } from '@phosphor-icons/react';
import styles from './TournamentCard.module.css';

export default function TournamentCard({ tournament, isUpcoming, colors, onClick }) {
  const accentColor = isUpcoming ? colors.accentGreen : colors.accentBlue;
  const name = tournament.name || tournament.tourneyname || tournament.mastername || 'Untitled';

  const formatDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  };

  const entrants = tournament.entrants || tournament.numplayers;
  const location = tournament.location || tournament.city;
  const dateStr = formatDate(tournament.date || tournament.startdate);
  const type = tournament.tourneytype || tournament.type;

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
      style={{
        '--card-bg': colors.cardBg,
        '--border': colors.border,
        '--accent': accentColor,
        '--text-primary': colors.textPrimary,
        '--text-secondary': colors.textSecondary,
        '--badge-bg': colors.badgeBg,
        '--shadow': colors.shadow,
      }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.name}>{name}</div>
        {type && <span className={styles.badge}>{type}</span>}
      </div>

      <div className={styles.meta}>
        {dateStr && (
          <div className={styles.metaRow}>
            <Calendar size={15} weight="duotone" />
            {dateStr}
          </div>
        )}
        {location && (
          <div className={styles.metaRow}>
            <MapPin size={15} weight="duotone" />
            {location}
          </div>
        )}
        {entrants !== undefined && entrants !== null && (
          <div className={styles.metaRow}>
            <Users size={15} weight="duotone" />
            {entrants} players
          </div>
        )}
      </div>

      {onClick && (
        <div className={styles.footer}>
          View details <ArrowRight size={14} weight="bold" style={{ verticalAlign: -2, marginLeft: 4 }} />
        </div>
      )}
    </div>
  );
}
