import React, { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';

const Confetti = ({ winner, isVisible, onComplete }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  // Confetti particle class
  class Particle {
    constructor(x, y, color, isWinner) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 12 + (isWinner ? 3 : -3); // Velocity X
      this.vy = Math.random() * -20 - 8; // Velocity Y (upward)
      this.gravity = 0.4;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 15;
      this.color = color;
      this.size = Math.random() * 6 + 3;
      this.life = 1.0; // Life decreases over time
      this.decay = Math.random() * 0.015 + 0.008; // How fast it fades
      this.shape = Math.random() > 0.6 ? 'rect' : Math.random() > 0.3 ? 'star' : 'circle';
      this.trail = []; // Add trail effect
      this.maxTrailLength = 5;
    }

    update() {
      // Store position for trail
      this.trail.push({ x: this.x, y: this.y, life: this.life });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }

      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.rotation += this.rotationSpeed;
      this.life -= this.decay;
      
      // Add some wind effect
      this.vx += (Math.random() - 0.5) * 0.8;
      
      // Bounce off walls
      if (this.x < 0 || this.x > window.innerWidth) {
        this.vx *= -0.8;
      }
    }

    draw(ctx) {
      if (this.life <= 0) return;

      ctx.save();
      
      // Draw trail
      this.trail.forEach((trailPoint, index) => {
        const trailAlpha = (trailPoint.life * (index / this.trail.length)) * 0.3;
        ctx.globalAlpha = trailAlpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(trailPoint.x - 1, trailPoint.y - 1, 2, 2);
      });
      
      ctx.globalAlpha = this.life;
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      
      if (this.shape === 'rect') {
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      } else if (this.shape === 'star') {
        this.drawStar(ctx, 0, 0, this.size / 2, this.size / 4, 5);
      } else {
        // Circle
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      ctx.restore();
    }

    drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Determine confetti colors and position based on winner
    const isPlayerWinner = winner === 'player';
    const colors = isPlayerWinner 
      ? ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FFD93D', '#6BCF7F', '#4D96FF'] // Player colors
      : ['#A8E6CF', '#DCEDC8', '#FFD3B6', '#FFAAA5', '#FF8B94', '#FF6B9D', '#C44569', '#F8B500']; // Bot colors
    
    // Multiple starting positions for more dynamic effect
    const startPositions = [];
    if (isPlayerWinner) {
      // Player wins - confetti from left side
      for (let i = 0; i < 5; i++) {
        startPositions.push({
          x: 50 + Math.random() * 100,
          y: canvas.height - 50 - Math.random() * 100
        });
      }
    } else {
      // Bot wins - confetti from right side
      for (let i = 0; i < 5; i++) {
        startPositions.push({
          x: canvas.width - 50 - Math.random() * 100,
          y: canvas.height - 50 - Math.random() * 100
        });
      }
    }

    // Create particles
    particlesRef.current = [];
    for (let i = 0; i < 150; i++) { // Increased particle count
      const color = colors[Math.floor(Math.random() * colors.length)];
      const startPos = startPositions[Math.floor(Math.random() * startPositions.length)];
      particlesRef.current.push(new Particle(startPos.x, startPos.y, color, isPlayerWinner));
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let activeParticles = 0;
      
      particlesRef.current.forEach(particle => {
        if (particle.life > 0) {
          particle.update();
          particle.draw(ctx);
          activeParticles++;
        }
      });

      if (activeParticles > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (onComplete) onComplete();
      }
    };

    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, winner, onComplete]);

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default Confetti; 