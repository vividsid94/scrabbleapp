import React, { useEffect, useRef } from 'react';

// Particle system for atmospheric effects
export const ParticleSystem = ({ theme, intensity = 1 }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initialize particles based on theme
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.floor(50 * intensity);
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(createParticle(theme, canvas.width, canvas.height));
      }
    };

    const createParticle = (theme, width, height) => {
      const baseParticle = {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        life: 1,
        decay: Math.random() * 0.01 + 0.005
      };

      switch (theme) {
        case 'mystery':
          return {
            ...baseParticle,
            color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`,
            shape: 'circle'
          };
        case 'scifi':
          return {
            ...baseParticle,
            color: `hsl(${180 + Math.random() * 40}, 100%, 70%)`,
            shape: 'square',
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1
          };
        case 'horror':
          return {
            ...baseParticle,
            color: `hsl(${0 + Math.random() * 30}, 80%, 50%)`,
            shape: 'triangle',
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3
          };
        default:
          return {
            ...baseParticle,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            shape: 'circle'
          };
      }
    };

    const updateParticles = () => {
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        particle.opacity = particle.life * 0.7;

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        return particle.life > 0;
      });

      // Add new particles
      if (particlesRef.current.length < 50 * intensity) {
        particlesRef.current.push(createParticle(theme, canvas.width, canvas.height));
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        
        switch (particle.shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'square':
            ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
            break;
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y - particle.size);
            ctx.lineTo(particle.x - particle.size, particle.y + particle.size);
            ctx.lineTo(particle.x + particle.size, particle.y + particle.size);
            ctx.closePath();
            ctx.fill();
            break;
        }
        ctx.restore();
      });
    };

    const animate = () => {
      updateParticles();
      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

// Atmospheric lighting effects
export const AtmosphericLighting = ({ theme, intensity = 1 }) => {
  const lightRef = useRef(null);

  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;

    const animateLight = () => {
      const time = Date.now() * 0.001;
      const x = Math.sin(time * 0.5) * 50 + 50;
      const y = Math.cos(time * 0.3) * 30 + 30;
      
      light.style.background = `radial-gradient(circle at ${x}% ${y}%, 
        ${getThemeColors(theme).primary} 0%, 
        ${getThemeColors(theme).secondary} 30%, 
        transparent 70%)`;
    };

    const interval = setInterval(animateLight, 50);
    return () => clearInterval(interval);
  }, [theme, intensity]);

  const getThemeColors = (theme) => {
    switch (theme) {
      case 'mystery':
        return {
          primary: 'rgba(78, 205, 196, 0.3)',
          secondary: 'rgba(255, 107, 107, 0.2)'
        };
      case 'scifi':
        return {
          primary: 'rgba(0, 255, 255, 0.4)',
          secondary: 'rgba(255, 0, 255, 0.3)'
        };
      case 'horror':
        return {
          primary: 'rgba(255, 0, 0, 0.3)',
          secondary: 'rgba(0, 0, 0, 0.5)'
        };
      default:
        return {
          primary: 'rgba(255, 255, 255, 0.1)',
          secondary: 'rgba(0, 0, 0, 0.1)'
        };
    }
  };

  return (
    <div
      ref={lightRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'all 0.5s ease'
      }}
    />
  );
};

// Sound effects manager
export const SoundManager = ({ theme, soundEnabled, volume = 0.7 }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!soundEnabled) return;

    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    
    switch (theme) {
      case 'mystery':
        audio.src = '/sounds/mystery-ambient.mp3';
        break;
      case 'scifi':
        audio.src = '/sounds/scifi-ambient.mp3';
        break;
      case 'horror':
        audio.src = '/sounds/horror-ambient.mp3';
        break;
      default:
        audio.src = '/sounds/escape-room-ambient.mp3';
    }

    audio.play().catch(console.error);
    audioRef.current = audio;

    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [theme, soundEnabled, volume]);

  return null;
};

// Screen shake effect for dramatic moments
export const ScreenShake = ({ intensity = 1, duration = 500 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const shake = () => {
      container.style.transform = 'translate(0, 0)';
      container.style.transition = 'transform 0.1s ease-out';
      
      const startTime = Date.now();
      const shakeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
          clearInterval(shakeInterval);
          container.style.transform = 'translate(0, 0)';
          return;
        }
        
        const x = (Math.random() - 0.5) * intensity * 10;
        const y = (Math.random() - 0.5) * intensity * 10;
        container.style.transform = `translate(${x}px, ${y}px)`;
      }, 50);
    };

    shake();
  }, [intensity, duration]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    />
  );
};

// Confetti effect for puzzle completion
export const ConfettiEffect = ({ active, theme }) => {
  const canvasRef = useRef(null);
  const confettiRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Create confetti pieces
    const createConfetti = () => {
      for (let i = 0; i < 100; i++) {
        confettiRef.current.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2,
          size: Math.random() * 4 + 2,
          color: getThemeColor(theme),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2
        });
      }
    };

    const getThemeColor = (theme) => {
      const colors = {
        mystery: ['#4ecdc4', '#ff6b6b', '#45b7d1', '#96ceb4'],
        scifi: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00'],
        horror: ['#ff0000', '#800000', '#ff4500', '#ff6347']
      };
      const themeColors = colors[theme] || colors.mystery;
      return themeColors[Math.floor(Math.random() * themeColors.length)];
    };

    const updateConfetti = () => {
      confettiRef.current = confettiRef.current.filter(confetti => {
        confetti.x += confetti.vx;
        confetti.y += confetti.vy;
        confetti.vy += 0.1; // gravity
        confetti.rotation += confetti.rotationSpeed;
        
        return confetti.y < canvas.height + 10;
      });
    };

    const drawConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      confettiRef.current.forEach(confetti => {
        ctx.save();
        ctx.translate(confetti.x, confetti.y);
        ctx.rotate(confetti.rotation);
        ctx.fillStyle = confetti.color;
        ctx.fillRect(-confetti.size/2, -confetti.size/2, confetti.size, confetti.size);
        ctx.restore();
      });
    };

    const animate = () => {
      updateConfetti();
      drawConfetti();
      
      if (confettiRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    createConfetti();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    />
  );
};
