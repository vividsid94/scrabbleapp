import React, { useRef, useEffect } from 'react';

const themeParticles = {
  gold: { colors: ['#c9a84c', '#e8d5b7', '#a08030'], speed: 0.3, count: 40 },
  emerald: { colors: ['#2d6a4f', '#52b788', '#95d5b2'], speed: 0.25, count: 35 },
  azure: { colors: ['#3b82f6', '#60a5fa', '#93c5fd'], speed: 0.35, count: 35 },
  ruby: { colors: ['#9b2335', '#dc2626', '#f87171'], speed: 0.3, count: 30 },
  purple: { colors: ['#8b5cf6', '#c9a84c', '#a78bfa'], speed: 0.2, count: 50 },
};

export default function TempleParticles({ theme = 'gold' }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const config = themeParticles[theme] || themeParticles.gold;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    particlesRef.current = Array.from({ length: config.count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * config.speed,
      speedY: -Math.random() * config.speed - 0.1,
      opacity: Math.random() * 0.5 + 0.1,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      pulse: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;
        const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentOpacity;
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentOpacity * 0.15;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
