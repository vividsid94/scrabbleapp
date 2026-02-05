import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@phosphor-icons/react';

/**
 * List of registered upcoming tournaments for a player.
 */
export default function UpcomingTournaments({ tournaments = [], colors }) {
  const navigate = useNavigate();

  const formatDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  };

  if (tournaments.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
        No upcoming tournaments registered.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tournaments.map((t, i) => {
        const name = t.name || t.tourneyname || 'Unknown';
        return (
          <div
            key={t.tourneyid || t.upcomingid || i}
            onClick={() => {
              if (t.tourneyid) navigate(`/tournament/${t.tourneyid}`);
              else if (t.upcomingid) navigate(`/tournament/upcoming-${t.upcomingid}`);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderLeft: `4px solid ${colors.accentGreen}`,
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 3 }}>
                {name}
              </div>
              {t.date && (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: colors.textSecondary }}>
                  <Calendar size={13} style={{ marginRight: 5 }} />
                  {formatDate(t.date)}
                </div>
              )}
            </div>
            <span style={{ color: colors.accentGreen, fontSize: 13, fontWeight: 500 }}>→</span>
          </div>
        );
      })}
    </div>
  );
}
