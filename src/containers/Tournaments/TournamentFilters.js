import React from 'react';
import { SortAscending, SortDescending } from '@phosphor-icons/react';
import styles from './TournamentFilters.module.css';

export default function TournamentFilters({ sortField, sortDirection, onSortChange, colors }) {
  const fields = [
    { key: 'date', label: 'Date' },
    { key: 'name', label: 'Name' },
    { key: 'entrants', label: 'Size' },
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
    <div
      className={styles.container}
      style={{
        '--text-secondary': colors.textSecondary,
        '--border': colors.border,
        '--card-bg': colors.cardBg,
        '--brand': '#D97706',
        '--brand-bg': colors.accentGoldBg,
      }}
    >
      <span className={styles.label}>Sort</span>
      {fields.map(f => {
        const active = sortField === f.key;
        return (
          <button
            key={f.key}
            type="button"
            className={`${styles.btn} ${active ? styles.btnActive : ''}`}
            onClick={() => handleClick(f.key)}
          >
            {f.label}
            {active && <SortIcon size={14} />}
          </button>
        );
      })}
    </div>
  );
}
