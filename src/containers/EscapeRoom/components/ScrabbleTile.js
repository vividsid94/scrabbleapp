import React from 'react';
import { letterScores } from '../data/scrabbleData';

const sizeMap = {
  small: { width: 32, height: 32, fontSize: 14, subSize: 8 },
  medium: { width: 44, height: 44, fontSize: 20, subSize: 10 },
  large: { width: 56, height: 56, fontSize: 26, subSize: 12 },
};

export default function ScrabbleTile({ letter, size = 'medium', selected, solved, onClick, style, disabled }) {
  const s = sizeMap[size] || sizeMap.medium;
  const score = letterScores[letter] ?? '';

  const baseStyle = {
    width: s.width,
    height: s.height,
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    fontFamily: "'Georgia', serif",
    fontWeight: 'bold',
    fontSize: s.fontSize,
    color: '#2c1810',
    background: solved
      ? 'linear-gradient(145deg, #c9a84c, #e8d5b7)'
      : selected
        ? 'linear-gradient(145deg, #f5e6c8, #e8d5b7)'
        : 'linear-gradient(145deg, #f0e0c0, #d4c4a0)',
    boxShadow: selected
      ? '0 0 12px rgba(201,168,76,0.8), 0 2px 4px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
    cursor: disabled ? 'default' : onClick ? 'pointer' : 'default',
    userSelect: 'none',
    transition: 'all 0.2s ease',
    transform: selected ? 'translateY(-3px) scale(1.05)' : 'none',
    position: 'relative',
    border: selected ? '2px solid #c9a84c' : '1px solid #b8a88a',
    ...style,
  };

  return (
    <div
      style={baseStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={(e) => {
        if (!disabled && onClick) e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (!disabled && onClick) e.currentTarget.style.transform = selected ? 'translateY(-3px) scale(1.05)' : 'none';
      }}
    >
      <span>{letter}</span>
      {score !== '' && (
        <span style={{
          position: 'absolute',
          bottom: 2,
          right: 3,
          fontSize: s.subSize,
          fontWeight: 'normal',
          color: '#5c4a3a',
        }}>
          {score}
        </span>
      )}
    </div>
  );
}
