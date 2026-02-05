import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Clickable tournament name that navigates to /tournament/:id
 */
export default function TournamentLink({ tourneyId, name, style = {}, colors }) {
  if (!tourneyId) {
    return <span style={style}>{name || 'Unknown'}</span>;
  }
  return (
    <Link
      to={`/tournament/${tourneyId}`}
      style={{
        color: colors?.accentBlue || '#3b82f6',
        textDecoration: 'none',
        fontWeight: 600,
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {name || 'Unknown'}
    </Link>
  );
}
