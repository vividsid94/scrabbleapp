import React from 'react';
import { SortAscending, SortDescending } from '@phosphor-icons/react';

/**
 * Sort buttons for tournament list: Date, Name, Entrants with toggle direction.
 */
export default function TournamentFilters({ sortField, sortDirection, onSortChange, colors }) {
  const fields = [
    { key: 'date', label: 'Date' },
    { key: 'name', label: 'Name' },
    { key: 'entrants', label: 'Players' },
  ];

  const handleClick = (key) => {
    if (sortField === key) {
      onSortChange(key, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, key === 'date' ? 'desc' : 'asc');
    }
  };

  const SortIcon = sortDirection === 'asc' ? SortAscending : SortDescending;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: colors.textSecondary, marginRight: 4 }}>Sort:</span>
      {fields.map(f => {
        const active = sortField === f.key;
        return (
          <button
            key={f.key}
            onClick={() => handleClick(f.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              borderRadius: 6,
              border: `1px solid ${active ? colors.accentBlue : colors.border}`,
              backgroundColor: active ? colors.accentBlueBg : 'transparent',
              color: active ? colors.accentBlue : colors.textSecondary,
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
            {active && <SortIcon size={14} />}
          </button>
        );
      })}
    </div>
  );
}
