import React from 'react';

/**
 * Displays a W-L-T record with optional spread (color-coded).
 */
export default function RecordDisplay({ wins, losses, ties, spread, colors, style = {} }) {
  const w = wins || 0;
  const l = losses || 0;
  const t = ties || 0;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
      <span style={{ fontWeight: 600, color: colors?.textPrimary }}>
        {w}-{l}{t > 0 ? `-${t}` : ''}
      </span>
      {spread !== undefined && spread !== null && (
        <span style={{
          fontWeight: 600,
          color: Number(spread) >= 0 ? colors?.positive : colors?.negative,
          fontSize: 'inherit',
        }}>
          ({Number(spread) >= 0 ? '+' : ''}{spread})
        </span>
      )}
    </span>
  );
}
