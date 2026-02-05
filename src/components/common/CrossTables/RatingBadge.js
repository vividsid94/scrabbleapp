import React from 'react';

/**
 * Displays a rating value with optional rank and change indicator.
 */
export default function RatingBadge({ rating, rank, change, label, colors }) {
  const formatRating = (r) => {
    if (r === undefined || r === null || r === '') return 'N/A';
    return Math.round(Number(r));
  };

  const ratingVal = formatRating(rating);
  const changeVal = change !== undefined && change !== null ? Number(change) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 500, color: colors?.textSecondary }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: colors?.textPrimary }}>
          {ratingVal}
        </span>
        {rank && (
          <span style={{ fontSize: 12, color: colors?.textSecondary }}>
            #{rank}
          </span>
        )}
        {changeVal !== null && changeVal !== 0 && (
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: changeVal > 0 ? colors?.positive : colors?.negative,
          }}>
            {changeVal > 0 ? '+' : ''}{changeVal}
          </span>
        )}
      </div>
    </div>
  );
}
