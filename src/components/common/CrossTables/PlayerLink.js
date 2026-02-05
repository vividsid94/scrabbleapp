import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Clickable player name that navigates to /player/:id
 */
export default function PlayerLink({ playerId, name, style = {}, colors }) {
  if (!playerId) {
    return <span style={style}>{name || 'Unknown'}</span>;
  }
  return (
    <Link
      to={`/player/${playerId}`}
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
