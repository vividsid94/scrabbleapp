import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewerStore } from '../../stores/viewerStore';

/**
 * Filterable annotated games grid with opponent filter.
 */
export default function AnnotatedGamesPanel({ games = [], colors }) {
  const navigate = useNavigate();
  const { setGameNum } = useViewerStore();
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    if (!filter.trim()) return games;
    const q = filter.toLowerCase();
    return games.filter(g =>
      (g.opponentName || '').toLowerCase().includes(q) ||
      (g.tournament || '').toLowerCase().includes(q)
    );
  }, [games, filter]);

  const displayed = showAll ? filtered : filtered.slice(0, 24);

  if (games.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
        No annotated games found.
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Filter by opponent or tournament..."
        value={filter}
        onChange={(e) => { setFilter(e.target.value); setShowAll(false); }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '8px 12px',
          fontSize: 13,
          borderRadius: 6,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.inputBg,
          color: colors.textPrimary,
          outline: 'none',
          marginBottom: 14,
          fontFamily: 'inherit',
        }}
        onFocus={(e) => { e.target.style.borderColor = colors.accentBlue; }}
        onBlur={(e) => { e.target.style.borderColor = colors.border; }}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {displayed.map((game, i) => (
          <div
            key={game.gameNum || i}
            onClick={() => {
              setGameNum(parseInt(game.gameNum));
              navigate('/viewer');
            }}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              transition: 'transform 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = colors.accentBlue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = colors.border;
            }}
          >
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.textPrimary,
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              vs {game.opponentName}
            </div>
            <div style={{
              fontSize: 11,
              color: colors.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 2,
            }}>
              {game.tournament}
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>
              {game.date}
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 24 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            padding: '10px',
            marginTop: 14,
            fontSize: 13,
            fontWeight: 500,
            color: colors.accentBlue,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Show all {filtered.length} games
        </button>
      )}
    </div>
  );
}
