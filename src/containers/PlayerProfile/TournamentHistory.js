import React from 'react';
import { useNavigate } from 'react-router-dom';
import SortableTable from '../../components/common/CrossTables/SortableTable';
import TournamentLink from '../../components/common/CrossTables/TournamentLink';

/**
 * Sortable, paginated tournament history table.
 * Replaces the duplicated "recent" + "all" sections.
 */
export default function TournamentHistory({ results = [], colors, pageSize = 15 }) {
  const navigate = useNavigate();

  const formatDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      width: 110,
      sortValue: (row) => new Date(row.date || 0).getTime(),
      render: (row) => (
        <span style={{ color: colors.textSecondary, fontSize: 12 }}>
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: 'tourneyname',
      label: 'Tournament',
      sortable: true,
      sortValue: (row) => (row.tourneyname || row.name || '').toLowerCase(),
      render: (row, c) => (
        <TournamentLink
          tourneyId={row.tourneyid}
          name={row.tourneyname || row.name || 'Unknown'}
          colors={c}
          style={{ fontSize: 13 }}
        />
      ),
    },
    {
      key: 'rank',
      label: 'Rank',
      sortable: true,
      align: 'center',
      width: 60,
      sortValue: (row) => Number(row.rank) || 9999,
      render: (row) => {
        const r = Number(row.rank);
        let color = colors.textSecondary;
        if (r === 1) color = colors.accentGold;
        else if (r === 2) color = colors.accentSilver;
        else if (r === 3) color = colors.accentBronze;
        return <span style={{ fontWeight: 600, color }}>#{row.rank || '-'}</span>;
      },
    },
    {
      key: 'record',
      label: 'W-L',
      sortable: true,
      align: 'center',
      width: 60,
      sortValue: (row) => Number(row.wins) || 0,
      render: (row) => (
        <span style={{ color: colors.textPrimary, fontSize: 13 }}>
          {row.wins ?? '-'}-{row.losses ?? '-'}
        </span>
      ),
    },
    {
      key: 'spread',
      label: 'Spread',
      sortable: true,
      align: 'right',
      width: 80,
      sortValue: (row) => Number(row.spread) || 0,
      render: (row) => {
        if (row.spread === undefined || row.spread === null) return <span style={{ color: colors.textSecondary }}>-</span>;
        const val = Number(row.spread);
        return (
          <span style={{ fontWeight: 600, color: val >= 0 ? colors.positive : colors.negative }}>
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
      width: 80,
      sortValue: (row) => Number(row.ratingchange) || 0,
      render: (row) => {
        if (row.ratingchange === undefined || row.ratingchange === null) return <span style={{ color: colors.textSecondary }}>-</span>;
        const val = Number(row.ratingchange);
        return (
          <span style={{ fontWeight: 600, color: val >= 0 ? colors.positive : colors.negative }}>
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
      defaultSort={{ key: 'date', direction: 'desc' }}
      pageSize={pageSize}
      onRowClick={(row) => row.tourneyid && navigate(`/tournament/${row.tourneyid}`)}
      colors={colors}
      rowKey={(row, i) => `${row.tourneyid}-${i}`}
      emptyMessage="No tournament results found"
    />
  );
}
