import React from 'react';
import { useNavigate } from 'react-router-dom';
import SortableTable from '../../components/common/CrossTables/SortableTable';
import PlayerLink from '../../components/common/CrossTables/PlayerLink';

/**
 * Sortable rankings table for top players.
 */
export default function RankingsTable({ players = [], lexicon = 'twl', colors, pageSize = 25 }) {
  const navigate = useNavigate();

  const ratingField = lexicon === 'csw' ? 'cswrating' : 'twlrating';
  const rankField = lexicon === 'csw' ? 'cswrank' : 'twlrank';

  const columns = [
    {
      key: 'rank',
      label: '#',
      sortable: true,
      width: 50,
      align: 'center',
      sortValue: (row) => Number(row[rankField] || row.rank) || 9999,
      render: (row) => {
        const r = Number(row[rankField] || row.rank);
        let color = colors.textSecondary;
        let weight = 600;
        if (r === 1) { color = colors.accentGold; weight = 700; }
        else if (r === 2) { color = colors.accentSilver; weight = 700; }
        else if (r === 3) { color = colors.accentBronze; weight = 700; }
        return <span style={{ color, fontWeight: weight }}>{r || '-'}</span>;
      },
    },
    {
      key: 'name',
      label: 'Player',
      sortable: true,
      sortValue: (row) => (row.name || row.playername || '').toLowerCase(),
      render: (row, c) => (
        <PlayerLink
          playerId={row.playerid}
          name={row.name || row.playername || 'Unknown'}
          colors={c}
          style={{ fontSize: 13 }}
        />
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      sortValue: (row) => (row.location || row.state || '').toLowerCase(),
      render: (row) => (
        <span style={{ color: colors.textSecondary, fontSize: 12 }}>
          {row.location || row.state || '-'}
        </span>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      align: 'right',
      width: 80,
      sortValue: (row) => Number(row[ratingField] || row.rating) || 0,
      render: (row) => {
        const val = row[ratingField] || row.rating;
        return (
          <span style={{ fontWeight: 700, color: colors.textPrimary, fontSize: 14 }}>
            {val ? Math.round(Number(val)) : '-'}
          </span>
        );
      },
    },
    {
      key: 'record',
      label: 'Record',
      sortable: true,
      align: 'center',
      width: 80,
      sortValue: (row) => Number(row.w || row.wins) || 0,
      render: (row) => {
        const w = row.w || row.wins;
        const l = row.l || row.losses;
        if (w === undefined && l === undefined) return <span style={{ color: colors.textSecondary }}>-</span>;
        return (
          <span style={{ color: colors.textPrimary, fontSize: 13 }}>
            {w || 0}-{l || 0}
          </span>
        );
      },
    },
  ];

  return (
    <SortableTable
      columns={columns}
      data={players}
      defaultSort={{ key: 'rank', direction: 'asc' }}
      pageSize={pageSize}
      onRowClick={(row) => row.playerid && navigate(`/player/${row.playerid}`)}
      colors={colors}
      rowKey={(row, i) => row.playerid || i}
      emptyMessage="No players found"
    />
  );
}
