import React from 'react';
import { X } from '@phosphor-icons/react';
import styles from './PlayerFilters.module.css';

export default function PlayerFilters({ locations = [], selectedLocation, onLocationChange, colors }) {
  if (locations.length === 0) return null;

  return (
    <div
      className={styles.container}
      style={{
        '--text-secondary': colors.textSecondary,
        '--border': colors.border,
        '--card-bg': colors.cardBg,
        '--text-primary': colors.textPrimary,
        '--brand': '#D97706',
        '--brand-bg': colors.accentGoldBg,
      }}
    >
      <span className={styles.label}>State</span>
      {selectedLocation && (
        <button type="button" className={styles.chip} onClick={() => onLocationChange(null)}>
          {selectedLocation}
          <X size={12} weight="bold" />
        </button>
      )}
      <select
        className={styles.select}
        value={selectedLocation || ''}
        onChange={(e) => onLocationChange(e.target.value || null)}
      >
        <option value="">All locations</option>
        {locations.map(loc => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>
    </div>
  );
}
