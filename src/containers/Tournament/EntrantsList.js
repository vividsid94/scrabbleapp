import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Grid of entrant cards for upcoming tournaments.
 */
export default function EntrantsList({ entrants = [], colors }) {
  const navigate = useNavigate();

  if (entrants.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
        No entrants listed yet.
      </div>
    );
  }

  // entrants may come nested in divisions
  const flatEntrants = entrants.flatMap(div => {
    if (div.entrants && Array.isArray(div.entrants)) {
      return div.entrants.map(e => ({ ...e, division: div.division || div.name }));
    }
    return [div];
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 12,
    }}>
      {flatEntrants.map((ent, i) => {
        const name = ent.name || ent.playername || 'Unknown';
        const rating = ent.rating || ent.twlrating;
        return (
          <div
            key={ent.playerid || i}
            onClick={() => ent.playerid && navigate(`/player/${ent.playerid}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              cursor: ent.playerid ? 'pointer' : 'default',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => { if (ent.playerid) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {ent.photourl ? (
              <img
                src={ent.photourl}
                alt=""
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: colors.badgeBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: colors.textSecondary,
                flexShrink: 0,
              }}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: ent.playerid ? colors.accentBlue : colors.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {name}
              </div>
              {rating && (
                <div style={{ fontSize: 11, color: colors.textSecondary }}>
                  Rating: {Math.round(Number(rating))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
