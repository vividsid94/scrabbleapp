import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Card for a single player in the grid/list view.
 */
export default function PlayerCard({ player, rank, colors }) {
  const navigate = useNavigate();

  const name = player.name || player.playername || 'Unknown';
  const rating = player.twlrating || player.cswrating || player.rating;
  const location = player.location || player.state || player.city;
  const wins = player.w || player.wins || 0;
  const losses = player.l || player.losses || 0;

  return (
    <div
      onClick={() => player.playerid && navigate(`/player/${player.playerid}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 10,
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        cursor: player.playerid ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 16px ${colors.shadow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Rank badge */}
      {rank != null && (
        <div style={{
          minWidth: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          backgroundColor: rank === 1 ? colors.accentGoldBg
            : rank === 2 ? colors.accentBlueBg
            : rank === 3 ? colors.accentGreenBg
            : colors.badgeBg,
          color: rank === 1 ? colors.accentGold
            : rank === 2 ? colors.accentSilver
            : rank === 3 ? colors.accentBronze
            : colors.textSecondary,
          flexShrink: 0,
        }}>
          {rank}
        </div>
      )}

      {/* Photo */}
      {player.photourl ? (
        <img
          src={player.photourl}
          alt=""
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            objectFit: 'cover',
            flexShrink: 0,
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: colors.badgeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 600,
          color: colors.textSecondary,
          flexShrink: 0,
        }}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: colors.accentBlue,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>
          {name}
        </div>
        {location && (
          <div style={{
            fontSize: 12,
            color: colors.textSecondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {location}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {rating && (
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
            {Math.round(Number(rating))}
          </div>
        )}
        {(wins > 0 || losses > 0) && (
          <div style={{ fontSize: 11, color: colors.textSecondary }}>
            {wins}W-{losses}L
          </div>
        )}
      </div>
    </div>
  );
}
