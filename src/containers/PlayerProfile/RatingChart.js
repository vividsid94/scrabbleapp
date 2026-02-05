import React, { useMemo } from 'react';

/**
 * Pure SVG line chart of rating over time from tournament results.
 * Graceful degradation if no data.
 */
export default function RatingChart({ results = [], colors }) {
  const chartData = useMemo(() => {
    // Extract rating data points from results (ordered by date)
    const points = results
      .filter(r => r.date && (r.newrating || r.rating))
      .map(r => ({
        date: new Date(r.date).getTime(),
        rating: Number(r.newrating || r.rating),
        name: r.tourneyname || r.name || '',
      }))
      .sort((a, b) => a.date - b.date);

    return points;
  }, [results]);

  if (chartData.length < 2) {
    return (
      <div style={{
        padding: 20,
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 13,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        backgroundColor: colors.cardBg,
      }}>
        Not enough rating data to display chart.
      </div>
    );
  }

  const width = 700;
  const height = 200;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const ratings = chartData.map(d => d.rating);
  const minR = Math.min(...ratings) - 20;
  const maxR = Math.max(...ratings) + 20;
  const minDate = chartData[0].date;
  const maxDate = chartData[chartData.length - 1].date;
  const dateRange = maxDate - minDate || 1;
  const rRange = maxR - minR || 1;

  const toX = (date) => padLeft + ((date - minDate) / dateRange) * chartW;
  const toY = (rating) => padTop + chartH - ((rating - minR) / rRange) * chartH;

  const pathD = chartData.map((d, i) => {
    const x = toX(d.date);
    const y = toY(d.rating);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Grid lines
  const gridLines = 5;
  const yLabels = [];
  for (let i = 0; i <= gridLines; i++) {
    const val = Math.round(minR + (rRange * i / gridLines));
    yLabels.push({ val, y: toY(val) });
  }

  return (
    <div style={{
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      backgroundColor: colors.cardBg,
      padding: '12px 8px',
      overflow: 'hidden',
    }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
        {/* Grid */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={l.y}
              y2={l.y}
              stroke={colors.border}
              strokeWidth={0.5}
            />
            <text
              x={padLeft - 6}
              y={l.y + 4}
              textAnchor="end"
              fill={colors.textSecondary}
              fontSize={10}
            >
              {l.val}
            </text>
          </g>
        ))}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={colors.accentBlue}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {chartData.map((d, i) => (
          <circle
            key={i}
            cx={toX(d.date)}
            cy={toY(d.rating)}
            r={3}
            fill={colors.accentBlue}
            stroke={colors.cardBg}
            strokeWidth={1.5}
          >
            <title>{`${d.name}: ${d.rating}`}</title>
          </circle>
        ))}

        {/* Date labels (first and last) */}
        <text
          x={padLeft}
          y={height - 6}
          fill={colors.textSecondary}
          fontSize={10}
          textAnchor="start"
        >
          {new Date(minDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </text>
        <text
          x={width - padRight}
          y={height - 6}
          fill={colors.textSecondary}
          fontSize={10}
          textAnchor="end"
        >
          {new Date(maxDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </text>
      </svg>
    </div>
  );
}
