import React from 'react';

export default function PuzzleFrame({ children, title, solved, theme = 'gold' }) {
  const themeColors = {
    gold: 'rgba(201,168,76,0.15)',
    emerald: 'rgba(45,106,79,0.15)',
    azure: 'rgba(59,130,246,0.15)',
    ruby: 'rgba(155,35,53,0.15)',
    purple: 'rgba(139,92,246,0.15)',
  };
  const borderColors = {
    gold: 'rgba(201,168,76,0.4)',
    emerald: 'rgba(45,106,79,0.4)',
    azure: 'rgba(59,130,246,0.4)',
    ruby: 'rgba(155,35,53,0.4)',
    purple: 'rgba(139,92,246,0.4)',
  };
  const glowColors = {
    gold: 'rgba(201,168,76,0.3)',
    emerald: 'rgba(45,106,79,0.3)',
    azure: 'rgba(59,130,246,0.3)',
    ruby: 'rgba(155,35,53,0.3)',
    purple: 'rgba(139,92,246,0.3)',
  };

  return (
    <div
      className={`puzzle-frame ${solved ? 'puzzle-frame-solved' : ''}`}
      style={{
        background: themeColors[theme] || themeColors.gold,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${borderColors[theme] || borderColors.gold}`,
        borderRadius: 16,
        padding: '28px 32px',
        maxWidth: 700,
        margin: '0 auto',
        position: 'relative',
        boxShadow: solved
          ? `0 0 40px ${glowColors[theme]}, 0 8px 32px rgba(0,0,0,0.3)`
          : '0 8px 32px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.6s ease',
      }}
    >
      {title && (
        <h2 style={{
          fontFamily: "'Georgia', serif",
          fontSize: 22,
          color: '#e8d5b7',
          marginBottom: 20,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          letterSpacing: 1,
        }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
