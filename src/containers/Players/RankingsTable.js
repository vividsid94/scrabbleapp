import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SortableTable from '../../components/common/CrossTables/SortableTable';
import PlayerLink from '../../components/common/CrossTables/PlayerLink';
import PlayerCard from './PlayerCard';
import styles from './RankingsTable.module.css';

export default function RankingsTable({ players = [], lexicon = 'twl', colors, pageSize = 25, startRank = 1 }) {
  const navigate = useNavigate();
  const [mobilePage, setMobilePage] = useState(0);

  useEffect(() => {
    setMobilePage(0);
  }, [lexicon, players.length]);

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

  if (players.length === 0) {
    return (
      <div className={styles.empty} style={{ '--text-secondary': colors.textSecondary }}>
        No players found
      </div>
    );
  }

  const sortedByRank = [...players].sort(
    (a, b) => (Number(a[rankField] || a.rank) || 9999) - (Number(b[rankField] || b.rank) || 9999)
  );
  const totalMobilePages = Math.ceil(sortedByRank.length / pageSize);
  const mobileSlice = sortedByRank.slice(mobilePage * pageSize, (mobilePage + 1) * pageSize);

  return (
    <div
      className={styles.container}
      style={{
        '--border': colors.border,
        '--text-secondary': colors.textSecondary,
        '--card-bg': colors.cardBg,
      }}
    >
      <div className={styles.desktopTable}>
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
      </div>

      <div className={styles.mobileList}>
        {mobileSlice.map((player, i) => (
          <PlayerCard
            key={player.playerid || i}
            player={player}
            rank={Number(player[rankField] || player.rank) || startRank + mobilePage * pageSize + i}
            colors={colors}
          />
        ))}
        {totalMobilePages > 1 && (
          <div className={styles.mobilePagination}>
            <button
              className={styles.pageBtn}
              disabled={mobilePage === 0}
              onClick={() => setMobilePage((p) => p - 1)}
              style={{ color: colors.accentBlue, borderColor: colors.border }}
            >
              Prev
            </button>
            <span className={styles.pageInfo}>
              Page {mobilePage + 1} of {totalMobilePages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={mobilePage >= totalMobilePages - 1}
              onClick={() => setMobilePage((p) => p + 1)}
              style={{ color: colors.accentBlue, borderColor: colors.border }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
