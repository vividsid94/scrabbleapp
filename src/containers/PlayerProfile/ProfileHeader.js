import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import ProtileDisplay from '../../components/common/CrossTables/ProtileDisplay';

/**
 * Player profile header: back button, protile name, photo, location.
 */
export default function ProfileHeader({ player, playerName, playerPhoto, onBack, colors }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 8,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: colors.textSecondary,
          flexShrink: 0,
        }}
      >
        <ArrowLeft size={18} />
      </button>

      {playerName && <ProtileDisplay name={playerName} size={24} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        {player.location && (
          <p style={{
            fontSize: 12,
            color: colors.textSecondary,
            margin: 0,
          }}>
            {player.location}
          </p>
        )}
      </div>

      {playerPhoto ? (
        <img
          src={playerPhoto}
          alt={playerName}
          style={{
            width: 60,
            height: 60,
            borderRadius: 10,
            objectFit: 'cover',
            border: `2px solid ${colors.accentBlue}`,
            boxShadow: `0 2px 8px ${colors.shadow}`,
            flexShrink: 0,
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 10,
          backgroundColor: colors.badgeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 24,
          color: colors.textSecondary,
        }}>
          {playerName ? playerName.charAt(0).toUpperCase() : '?'}
        </div>
      )}
    </div>
  );
}
