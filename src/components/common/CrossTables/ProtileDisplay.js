import React from 'react';

/**
 * Scrabble-tile letter display for player names.
 * Extracted from PlayerProfile to avoid duplication.
 */
export default function ProtileDisplay({ name, size = 24 }) {
  if (!name) return null;

  const parts = name.split(' ').filter(p => p.trim().length > 0);
  const firstName = parts.length > 0 ? parts[0].toUpperCase() : '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ').toUpperCase() : '';

  const renderWord = (word, prefix) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 2,
        backgroundColor: '#fff',
        borderRadius: 4,
      }}
    >
      {word.split('').map((letter, i) => {
        const tile = /[A-Z]/.test(letter) ? letter : '_';
        return (
          <img
            key={`${prefix}-${i}`}
            src={`/images/compressed-clean-protiles/${tile}.png`}
            alt={letter}
            style={{
              width: size,
              height: size,
              display: 'block',
              imageRendering: 'pixelated',
              objectFit: 'contain',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        );
      })}
    </span>
  );

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, height: size + 4, flexShrink: 0 }}>
      {firstName && renderWord(firstName, 'first')}
      {lastName && renderWord(lastName, 'last')}
    </span>
  );
}
