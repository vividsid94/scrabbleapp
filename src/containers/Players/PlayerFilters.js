import React from 'react';
import { X } from '@phosphor-icons/react';

/**
 * Location filter for the players list.
 * Extracts unique locations from the player data and lets users filter.
 */
export default function PlayerFilters({ locations = [], selectedLocation, onLocationChange, colors }) {
  if (locations.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: colors.textSecondary, marginRight: 4 }}>State:</span>
      {selectedLocation && (
        <button
          onClick={() => onLocationChange(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 6,
            border: `1px solid ${colors.accentBlue}`,
            backgroundColor: colors.accentBlueBg,
            color: colors.accentBlue,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {selectedLocation}
          <X size={12} />
        </button>
      )}
      <select
        value={selectedLocation || ''}
        onChange={(e) => onLocationChange(e.target.value || null)}
        style={{
          padding: '5px 10px',
          borderRadius: 6,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.inputBg,
          color: colors.textPrimary,
          fontSize: 12,
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="">All locations</option>
        {locations.map(loc => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>
    </div>
  );
}
