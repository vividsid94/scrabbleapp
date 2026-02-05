import React from 'react';

/**
 * Tabs for multi-division tournaments. Hidden if single division.
 */
export default function DivisionTabs({ divisions = [], activeDivision, onDivisionChange, colors }) {
  if (divisions.length <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      marginBottom: 16,
      flexWrap: 'wrap',
    }}>
      <button
        onClick={() => onDivisionChange(null)}
        style={{
          padding: '6px 14px',
          borderRadius: 6,
          border: `1px solid ${activeDivision === null ? 'transparent' : colors.border}`,
          backgroundColor: activeDivision === null ? colors.tabActive : 'transparent',
          color: activeDivision === null ? colors.tabActiveText : colors.tabText,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'inherit',
        }}
      >
        All Divisions
      </button>
      {divisions.map(div => (
        <button
          key={div}
          onClick={() => onDivisionChange(div)}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: `1px solid ${activeDivision === div ? 'transparent' : colors.border}`,
            backgroundColor: activeDivision === div ? colors.tabActive : 'transparent',
            color: activeDivision === div ? colors.tabActiveText : colors.tabText,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {div}
        </button>
      ))}
    </div>
  );
}
