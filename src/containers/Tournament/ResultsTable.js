import React from 'react';
import { useNavigate } from 'react-router-dom';
import SortableTable from '../../components/common/CrossTables/SortableTable';
import PlayerLink from '../../components/common/CrossTables/PlayerLink';

/**
 * Sortable results table for completed tournaments.
 */
export default function ResultsTable({ results = [], colors, pageSize = 25 }) {
  const navigate = useNavigate();

  const getRankStyle = (rank) => {
    const r = Number(rank);
    if (r === 1) return { color: colors.accentGold, fontWeight: 700 };
    if (r === 2) return { color: colors.accentSilver, fontWeight: 700 };
    if (r === 3) return { color: colors.accentBronze, fontWeight: 700 };
    return { color: colors.textSecondary, fontWeight: 600 };
  };

  const columns = [
    {
      key: 'rank',
      label: '#',
      sortable: true,
      width: 50,
      align: 'center',
      sortValue: (row) => Number(row.rank) || 9999,
      render: (row) => {
        const style = getRankStyle(row.rank);
        return <span style={style}>#{row.rank || '-'}</span>;
      },
    },
    {
      key: 'playername',
      label: 'Player',
      sortable: true,
      sortValue: (row) => (row.playername || row.name || '').toLowerCase(),
      render: (row, c) => (
        <PlayerLink
          playerId={row.playerid}
          name={row.playername || row.name || 'Unknown'}
          colors={c}
          style={{ fontSize: 13 }}
        />
      ),
    },
    {
      key: 'wins',
      label: 'W',
      sortable: true,
      align: 'center',
      width: 50,
      sortValue: (row) => Number(row.wins) || 0,
      render: (row) => <span style={{ color: colors.textPrimary }}>{row.wins ?? '-'}</span>,
    },
    {
      key: 'losses',
      label: 'L',
      sortable: true,
      align: 'center',
      width: 50,
      sortValue: (row) => Number(row.losses) || 0,
      render: (row) => <span style={{ color: colors.textPrimary }}>{row.losses ?? '-'}</span>,
    },
    {
      key: 'spread',
      label: 'Spread',
      sortable: true,
      align: 'right',
      width: 80,
      sortValue: (row) => Number(row.spread) || 0,
      render: (row) => {
        if (row.spread === undefined || row.spread === null) return '-';
        const val = Number(row.spread);
        return (
          <span style={{
            fontWeight: 600,
            color: val >= 0 ? colors.positive : colors.negative,
          }}>
            {val >= 0 ? '+' : ''}{val}
          </span>
        );
      },
    },
    {
      key: 'ratingchange',
      label: 'Rating +/-',
      sortable: true,
      align: 'right',
      width: 90,
      sortValue: (row) => Number(row.ratingchange) || 0,
      render: (row) => {
        if (row.ratingchange === undefined || row.ratingchange === null) return '-';
        const val = Number(row.ratingchange);
        return (
          <span style={{
            fontWeight: 600,
            color: val >= 0 ? colors.positive : colors.negative,
          }}>
            {val >= 0 ? '+' : ''}{val}
          </span>
        );
      },
    },
  ];

  return (
    <SortableTable
      columns={columns}
      data={results}
      defaultSort={{ key: 'rank', direction: 'asc' }}
      pageSize={pageSize}
      onRowClick={(row) => row.playerid && navigate(`/player/${row.playerid}`)}
      colors={colors}
      rowKey={(row, i) => row.playerid || i}
      emptyMessage="No results available"
    />
  );
}
