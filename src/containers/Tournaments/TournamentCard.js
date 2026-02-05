import React from 'react';
import { Calendar, MapPin, Users } from '@phosphor-icons/react';

/**
 * Card for a single tournament with left-border accent.
 * Green = upcoming, Blue = recent.
 */
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
      onClick={onClick}
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 10,
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 6px 20px ${colors.shadow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, flex: 1 }}>
          {name}
        </div>
        {type && (
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: 6,
            backgroundColor: colors.badgeBg,
            color: colors.textSecondary,
            whiteSpace: 'nowrap',
          }}>
            {type}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {dateStr && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: colors.textSecondary }}>
            <Calendar size={15} style={{ marginRight: 7, flexShrink: 0 }} />
            {dateStr}
          </div>
        )}
        {location && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: colors.textSecondary }}>
            <MapPin size={15} style={{ marginRight: 7, flexShrink: 0 }} />
            {location}
          </div>
        )}
        {entrants !== undefined && entrants !== null && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: colors.textSecondary }}>
            <Users size={15} style={{ marginRight: 7, flexShrink: 0 }} />
            {entrants} players
          </div>
        )}
      </div>

      {onClick && (
        <div style={{
          color: accentColor,
          fontSize: 13,
          fontWeight: 500,
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${colors.border}`,
        }}>
          View Details →
        </div>
      )}
    </div>
  );
}
