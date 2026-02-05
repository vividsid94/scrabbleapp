import React from 'react';
import { Calendar, MapPin, Users, ListBullets } from '@phosphor-icons/react';

/**
 * Large tournament header with name, date, location, players, and format meta.
 */
export default function TournamentHeader({ tournament, colors }) {
  const name = tournament.name || tournament.tourneyname || 'Tournament';

  const formatDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return d; }
  };

  const date = formatDate(tournament.date);
  const location = tournament.location;
  const entrants = tournament.entrants || tournament.numplayers;
  const format = tournament.format || tournament.tourneytype;

  const metaItems = [
    date && { icon: Calendar, text: date },
    location && { icon: MapPin, text: location },
    entrants && { icon: Users, text: `${entrants} players` },
    format && { icon: ListBullets, text: format },
  ].filter(Boolean);

  return (
    <div>
      <h1 style={{
        fontSize: 22,
        fontWeight: 700,
        color: colors.textPrimary,
        margin: '0 0 14px 0',
      }}>
        {name}
      </h1>
      {metaItems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          {metaItems.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 13,
              color: colors.textSecondary,
            }}>
              <item.icon size={16} style={{ marginRight: 6, flexShrink: 0 }} />
              {item.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
