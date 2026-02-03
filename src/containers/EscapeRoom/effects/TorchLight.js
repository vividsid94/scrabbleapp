import React from 'react';

const themeGlows = {
  gold: 'rgba(201,168,76,0.08)',
  emerald: 'rgba(45,106,79,0.08)',
  azure: 'rgba(59,130,246,0.08)',
  ruby: 'rgba(155,35,53,0.08)',
  purple: 'rgba(139,92,246,0.06)',
};

export default function TorchLight({ theme = 'gold' }) {
  const glow = themeGlows[theme] || themeGlows.gold;

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none',
      zIndex: 1,
      background: `
        radial-gradient(ellipse at 10% 20%, ${glow} 0%, transparent 50%),
        radial-gradient(ellipse at 90% 80%, ${glow} 0%, transparent 50%),
        radial-gradient(ellipse at 50% 10%, ${glow} 0%, transparent 40%)
      `,
      animation: 'torch-flicker 4s ease-in-out infinite alternate',
    }} />
  );
}
