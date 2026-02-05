import React from 'react';

/**
 * 4-column stats grid: TWL Rating+rank, CSW Rating+rank, Record, Total Events.
 * Fixed font sizes: 12px labels, 18px values.
 */
export default function StatsPanel({ twlRating, twlRank, cswRating, cswRank, wins, losses, ties, totalEvents, colors }) {
  const formatRating = (r) => {
    if (r === undefined || r === null || r === '') return 'N/A';
    return Math.round(Number(r));
  };

  const stats = [
    {
      label: 'TWL Rating',
      value: formatRating(twlRating),
      sub: twlRank ? `#${twlRank} rank` : null,
    },
    {
      label: 'CSW Rating',
      value: formatRating(cswRating),
      sub: cswRank ? `#${cswRank} rank` : null,
    },
    {
      label: 'Record',
      value: `${wins || 0}-${losses || 0}${(ties && ties > 0) ? `-${ties}` : ''}`,
      sub: null,
    },
    {
      label: 'Total Events',
      value: totalEvents || 0,
      sub: null,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8,
      marginBottom: 16,
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: '10px 12px',
          borderRadius: 8,
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          transition: 'transform 0.15s',
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 500,
            color: colors.textSecondary,
            marginBottom: 4,
            lineHeight: 1.3,
          }}>
            {s.label}
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: colors.textPrimary,
            lineHeight: 1.3,
          }}>
            {s.value}
          </div>
          {s.sub && (
            <div style={{
              fontSize: 11,
              color: colors.textSecondary,
              marginTop: 2,
              lineHeight: 1.3,
            }}>
              {s.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
