import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidWordLocal, initializeDictionary, isDictionaryLoaded } from '../../utils/localDictionary';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import './WordStorm.css';

const MIN_WORD_LEN = 7;
const MAX_WORD_LEN = 9;

const letterScores = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1,
  'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1,
  'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10,
};

// Letter pool with more awkward tiles (Q, Z, X, J, K, V, W, Y) for harder bingos
const LETTER_POOL = 'AAAAAAABBCCDDDEEEEEEEEEEFFGGGHHIIIIIIIJJJKKKLLLLMMMNNNNOOOOOOPPQQRRRRRSSSTTTTTUUUUVVVWWWXXYYYZZ';

function getRandomLetter() {
  return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
}

const GAME_DURATION = 90;
const BASE_SPAWN_INTERVAL = 800;
const MIN_SPAWN_INTERVAL = 250;
const BASE_ORB_LIFETIME = 6000;
const MIN_ORB_LIFETIME = 2500;

let orbIdCounter = 0;

export default function WordStorm() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameAreaRef = useRef(null);
  const animFrameRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const tickTimerRef = useRef(null);
  const lightningRef = useRef([]);
  const rainRef = useRef([]);

  const [gamePhase, setGamePhase] = useState('intro'); // intro, playing, gameover
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [wordsFound, setWordsFound] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [collected, setCollected] = useState([]);
  const [flash, setFlash] = useState(null); // 'success' | 'fail' | null
  const [lastWordScore, setLastWordScore] = useState(null);
  const [shakeWord, setShakeWord] = useState(false);
  const [dictReady, setDictReady] = useState(isDictionaryLoaded());
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('wordstorm-highscore') || '0', 10); } catch { return 0; }
  });

  // Load dictionary on mount
  useEffect(() => {
    if (!isDictionaryLoaded()) {
      initializeDictionary().then(() => setDictReady(isDictionaryLoaded()));
    }
  }, []);

  // Storm canvas animation (rain + lightning)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize rain
    rainRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: Math.random() * 20 + 10,
      speed: Math.random() * 6 + 4,
      opacity: Math.random() * 0.3 + 0.05,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw rain
      rainRef.current.forEach(drop => {
        drop.y += drop.speed;
        drop.x += 1.5;
        if (drop.y > canvas.height) { drop.y = -drop.len; drop.x = Math.random() * canvas.width; }
        if (drop.x > canvas.width) drop.x = 0;

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + 1.5, drop.y + drop.len);
        ctx.strokeStyle = `rgba(140, 180, 255, ${drop.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw lightning bolts
      const now = Date.now();
      lightningRef.current = lightningRef.current.filter(l => now - l.born < l.duration);
      lightningRef.current.forEach(l => {
        const age = (now - l.born) / l.duration;
        const alpha = age < 0.1 ? 1 : Math.max(0, 1 - (age - 0.1) / 0.9);
        ctx.beginPath();
        ctx.moveTo(l.points[0].x, l.points[0].y);
        for (let i = 1; i < l.points.length; i++) {
          ctx.lineTo(l.points[i].x, l.points[i].y);
        }
        ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Spawn lightning bolt helper
  const spawnLightning = useCallback((startX, startY) => {
    const points = [{ x: startX, y: startY }];
    let x = startX, y = startY;
    const segments = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < segments; i++) {
      x += (Math.random() - 0.5) * 80;
      y += Math.random() * 60 + 20;
      points.push({ x, y });
    }
    lightningRef.current.push({ points, born: Date.now(), duration: 300 + Math.random() * 200 });
  }, []);

  // Get difficulty multiplier based on time elapsed
  const getDifficulty = useCallback(() => {
    const elapsed = GAME_DURATION - timeLeft;
    return Math.min(1, elapsed / 60); // 0 to 1 over 60 seconds
  }, [timeLeft]);

  // Spawn orbs during gameplay
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const spawnOrb = () => {
      const difficulty = getDifficulty();
      const area = gameAreaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const padding = 60;
      const x = padding + Math.random() * (rect.width - padding * 2);
      const y = padding + Math.random() * (Math.min(rect.height, 500) - padding * 2);
      const letter = getRandomLetter();
      const lifetime = BASE_ORB_LIFETIME - difficulty * (BASE_ORB_LIFETIME - MIN_ORB_LIFETIME);

      setOrbs(prev => [...prev, {
        id: ++orbIdCounter,
        letter,
        x,
        y,
        born: Date.now(),
        lifetime,
        dx: (Math.random() - 0.5) * 1.5,
        dy: (Math.random() - 0.5) * 1.5,
      }]);
    };

    const scheduleSpawn = () => {
      const difficulty = getDifficulty();
      const interval = BASE_SPAWN_INTERVAL - difficulty * (BASE_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
      spawnTimerRef.current = setTimeout(() => {
        spawnOrb();
        scheduleSpawn();
      }, interval);
    };

    // Spawn a few immediately
    for (let i = 0; i < 8; i++) setTimeout(spawnOrb, i * 150);
    scheduleSpawn();

    return () => { if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current); };
  }, [gamePhase, getDifficulty]);

  // Move orbs and expire them
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const interval = setInterval(() => {
      const now = Date.now();
      setOrbs(prev => prev
        .filter(o => now - o.born < o.lifetime)
        .map(o => {
          const area = gameAreaRef.current;
          const maxW = area ? area.clientWidth - 50 : 600;
          const maxH = Math.min(area ? area.clientHeight - 50 : 400, 450);
          let { x, y, dx, dy } = o;
          x += dx;
          y += dy;
          if (x < 10 || x > maxW) dx = -dx;
          if (y < 10 || y > maxH) dy = -dy;
          return { ...o, x: Math.max(10, Math.min(x, maxW)), y: Math.max(10, Math.min(y, maxH)), dx, dy };
        })
      );
    }, 50);
    return () => clearInterval(interval);
  }, [gamePhase]);

  // Game timer
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    tickTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(tickTimerRef.current);
          setGamePhase('gameover');
          return 0;
        }
        // Random lightning during storm
        if (Math.random() < 0.08) {
          spawnLightning(Math.random() * window.innerWidth, 0);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tickTimerRef.current);
  }, [gamePhase, spawnLightning]);

  // Save high score on game over
  useEffect(() => {
    if (gamePhase === 'gameover' && score > highScore) {
      setHighScore(score);
      try { localStorage.setItem('wordstorm-highscore', String(score)); } catch {}
    }
  }, [gamePhase, score, highScore]);

  const startGame = () => {
    setGamePhase('playing');
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setWordsFound([]);
    setOrbs([]);
    setCollected([]);
    setFlash(null);
    setLastWordScore(null);
    orbIdCounter = 0;
  };

  const collectOrb = (orb) => {
    setOrbs(prev => prev.filter(o => o.id !== orb.id));
    setCollected(prev => [...prev, { letter: orb.letter, id: orb.id }]);
  };

  const removeCollected = (index) => {
    setCollected(prev => prev.filter((_, i) => i !== index));
  };

  const clearCollected = () => setCollected([]);

  const shuffleCollected = () => {
    setCollected(prev => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  };

  const submitWord = () => {
    if (collected.length < 2) return;
    const word = collected.map(c => c.letter).join('');

    // Bingos only: 7–9 letters
    if (word.length < MIN_WORD_LEN || word.length > MAX_WORD_LEN) {
      setCombo(0);
      setFlash('fail');
      setShakeWord(true);
      setTimeout(() => { setFlash(null); setShakeWord(false); }, 500);
      return;
    }

    // Check if already found
    if (wordsFound.some(w => w.word === word)) {
      setFlash('fail');
      setShakeWord(true);
      setTimeout(() => { setFlash(null); setShakeWord(false); }, 500);
      return;
    }

    const isValid = isValidWordLocal(word);
    if (isValid) {
      // Calculate score
      const tileScore = word.split('').reduce((sum, ch) => sum + (letterScores[ch] || 0), 0);
      const lengthBonus = word.length >= 9 ? 75 : word.length >= 8 ? 60 : 50; // 7–9 only
      const newCombo = combo + 1;
      const comboMultiplier = Math.min(newCombo, 5);
      const wordScore = (tileScore + lengthBonus) * comboMultiplier;

      setScore(prev => prev + wordScore);
      setCombo(newCombo);
      setBestCombo(prev => Math.max(prev, newCombo));
      setWordsFound(prev => [{ word, score: wordScore, combo: comboMultiplier }, ...prev]);
      setCollected([]);
      setLastWordScore({ word, score: wordScore, combo: comboMultiplier });
      setFlash('success');

      // Lightning celebration
      for (let i = 0; i < 3; i++) {
        setTimeout(() => spawnLightning(Math.random() * window.innerWidth, 0), i * 100);
      }

      setTimeout(() => { setFlash(null); setLastWordScore(null); }, 1500);
    } else {
      // Invalid word - break combo
      setCombo(0);
      setFlash('fail');
      setShakeWord(true);
      setTimeout(() => { setFlash(null); setShakeWord(false); }, 500);
    }
  };

  // Keyboard support
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const handler = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submitWord(); }
      if (e.key === 'Backspace') {
        e.preventDefault();
        setCollected(prev => prev.slice(0, -1));
      }
      if (e.key === 'Escape') { e.preventDefault(); clearCollected(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // --- RENDER ---

  const gameContent = (content) => (
    <div className="ws-root">
      <Sidenav />
      <div className="ws-outer">
        {content}
      </div>
    </div>
  );

  if (gamePhase === 'intro') {
    return gameContent(
      <div className="ws-container">
        <canvas ref={canvasRef} className="ws-canvas" />
        <div className="ws-intro">
          <div className="ws-title">WORD STORM</div>
          <div className="ws-subtitle">Catch letters from the storm. Forge words. Survive.</div>

          <div className="ws-rules">
            <div className="ws-rule">
              <span className="ws-rule-icon">&#9889;</span>
              <span>Click floating letter orbs to collect them</span>
            </div>
            <div className="ws-rule">
              <span className="ws-rule-icon">&#9998;</span>
              <span>Arrange collected letters into valid words (7–9 letters only)</span>
            </div>
            <div className="ws-rule ws-rule-bingos">
              <span className="ws-rule-icon">&#11088;</span>
              <span><strong>Bingos only</strong> — no shorter words count</span>
            </div>
            <div className="ws-rule">
              <span className="ws-rule-icon">&#9733;</span>
              <span>Scrabble tile scoring + length bonuses + combo multiplier</span>
            </div>
            <div className="ws-rule">
              <span className="ws-rule-icon">&#8986;</span>
              <span>90 seconds. The storm intensifies over time.</span>
            </div>
          </div>

          {!dictReady && (
            <div className="ws-loading">Loading dictionary...</div>
          )}

          <button className="ws-start-btn" onClick={startGame} disabled={!dictReady}>
            Enter the Storm
          </button>

          {highScore > 0 && (
            <div className="ws-high-score-intro">Best: {highScore}</div>
          )}

          <button className="ws-back-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'gameover') {
    const isNewHigh = score >= highScore && score > 0;
    return gameContent(
      <div className="ws-container">
        <canvas ref={canvasRef} className="ws-canvas" />
        <div className="ws-gameover">
          <div className="ws-gameover-title">
            {isNewHigh ? 'NEW HIGH SCORE!' : 'STORM CLEARED'}
          </div>
          <div className="ws-final-score">{score}</div>
          <div className="ws-final-label">points</div>

          <div className="ws-stats-grid">
            <div className="ws-stat">
              <div className="ws-stat-value">{wordsFound.length}</div>
              <div className="ws-stat-label">Words</div>
            </div>
            <div className="ws-stat">
              <div className="ws-stat-value">{bestCombo}x</div>
              <div className="ws-stat-label">Best Combo</div>
            </div>
            <div className="ws-stat">
              <div className="ws-stat-value">
                {wordsFound.length > 0 ? wordsFound.reduce((best, w) => w.score > best.score ? w : best, wordsFound[0]).word : '-'}
              </div>
              <div className="ws-stat-label">Best Word</div>
            </div>
          </div>

          {wordsFound.length > 0 && (
            <div className="ws-word-log">
              <div className="ws-word-log-title">Words Found</div>
              {wordsFound.map((w, i) => (
                <div key={i} className="ws-word-log-item">
                  <span className="ws-word-log-word">{w.word}</span>
                  <span className="ws-word-log-score">+{w.score}{w.combo > 1 ? ` (${w.combo}x)` : ''}</span>
                </div>
              ))}
            </div>
          )}

          <div className="ws-gameover-buttons">
            <button className="ws-start-btn" onClick={startGame}>Play Again</button>
            <button className="ws-back-btn" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING ---
  const difficulty = getDifficulty();
  const urgency = timeLeft <= 15;

  return gameContent(
    <div className={`ws-container ${flash === 'success' ? 'ws-flash-success' : ''} ${flash === 'fail' ? 'ws-flash-fail' : ''}`}>
      <canvas ref={canvasRef} className="ws-canvas" />

      {/* HUD */}
      <div className="ws-hud">
        <div className="ws-hud-left">
          <div className={`ws-timer ${urgency ? 'ws-timer-urgent' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="ws-hud-center">
          <div className="ws-score-display">{score}</div>
          {combo > 1 && <div className="ws-combo">{combo}x COMBO</div>}
        </div>
        <div className="ws-hud-right">
          <div className="ws-words-count">{wordsFound.length} words</div>
        </div>
      </div>

      {/* Intensity bar */}
      <div className="ws-intensity-bar">
        <div className="ws-intensity-fill" style={{ width: `${difficulty * 100}%` }} />
        <span className="ws-intensity-label">Storm Intensity</span>
      </div>

      {/* Score popup */}
      {lastWordScore && (
        <div className="ws-score-popup" key={lastWordScore.word}>
          <div className="ws-score-popup-word">{lastWordScore.word}</div>
          <div className="ws-score-popup-pts">+{lastWordScore.score}</div>
          {lastWordScore.combo > 1 && <div className="ws-score-popup-combo">{lastWordScore.combo}x</div>}
        </div>
      )}

      {/* Game area with floating orbs */}
      <div className="ws-game-area" ref={gameAreaRef}>
        {orbs.map(orb => {
          const age = (Date.now() - orb.born) / orb.lifetime;
          const fadeOut = age > 0.7 ? 1 - ((age - 0.7) / 0.3) : 1;
          const val = letterScores[orb.letter] || 0;
          const isHighValue = val >= 4;
          return (
            <button
              key={orb.id}
              className={`ws-orb ${isHighValue ? 'ws-orb-high' : ''}`}
              style={{
                left: orb.x,
                top: orb.y,
                opacity: fadeOut,
                '--orb-hue': isHighValue ? '280' : '210',
              }}
              onClick={() => collectOrb(orb)}
            >
              <span className="ws-orb-letter">{orb.letter}</span>
              <span className="ws-orb-value">{val}</span>
            </button>
          );
        })}
      </div>

      {/* Word tray */}
      <div className="ws-tray-area">
        <div className="ws-tray-label">Bingos only (7–9 letters)</div>
        <div className={`ws-tray ${shakeWord ? 'ws-shake' : ''}`}>
          {collected.length === 0 && (
            <div className="ws-tray-placeholder">Tap letters above to collect them (need 7–9 for a word)…</div>
          )}
          {collected.map((c, i) => (
            <div key={`${c.id}-${i}`} className="ws-tray-tile" onClick={() => removeCollected(i)}>
              <span className="ws-tray-letter">{c.letter}</span>
              <span className="ws-tray-val">{letterScores[c.letter]}</span>
            </div>
          ))}
        </div>
        <div className="ws-tray-actions">
          <button className="ws-action-btn ws-btn-shuffle" onClick={shuffleCollected} disabled={collected.length < 2}>
            Shuffle
          </button>
          <button className="ws-action-btn ws-btn-clear" onClick={clearCollected} disabled={collected.length === 0}>
            Clear
          </button>
          <button
            className="ws-action-btn ws-btn-submit"
            onClick={submitWord}
            disabled={collected.length < MIN_WORD_LEN || collected.length > MAX_WORD_LEN}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
