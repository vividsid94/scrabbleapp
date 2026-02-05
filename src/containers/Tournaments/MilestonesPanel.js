import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from '@phosphor-icons/react';

/**
 * Horizontal scrollable strip showing players who hit rating milestones.
 */
export default function MilestonesPanel({ milestones = [], colors }) {
  const navigate = useNavigate();

  if (milestones.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}>
        <Star size={18} weight="fill" style={{ color: colors.accentGold }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>
          Recent Milestones
        </span>
      </div>
      <div style={{
        display: 'flex',
        gap: 14,
        overflowX: 'auto',
        paddingBottom: 8,
        WebkitOverflowScrolling: 'touch',
      }}>
        {milestones.map((m, i) => (
          <div
            key={m.playerid || i}
            onClick={() => m.playerid && navigate(`/player/${m.playerid}`)}
            style={{
              minWidth: 150,
              padding: '12px 16px',
              borderRadius: 10,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.accentGold}40`,
              borderTop: `3px solid ${colors.accentGold}`,
              cursor: m.playerid ? 'pointer' : 'default',
              transition: 'transform 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {m.photourl && (
              <img
                src={m.photourl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: `2px solid ${colors.accentGold}` }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.name || m.playername}
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.accentGold,
            }}>
              {m.milestone || m.rating || m.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
