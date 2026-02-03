import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidWordLocal, initializeDictionary, isDictionaryLoaded } from '../../utils/localDictionary';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import './ScrabbleDash.css';

// ─── Constants ───
const GRAVITY = 1800;
const JUMP_VEL = -620;
const JUMP_VEL_MIN = -340; // tap jump (release early)
const DOUBLE_JUMP_VEL = -540;
const WALL_JUMP_VEL_X = 280;
const WALL_JUMP_VEL_Y = -520;
const WALL_SLIDE_SPEED = 80;
const DASH_SPEED = 600;
const DASH_DURATION = 0.2;
const DASH_COOLDOWN = 0.8;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER_TIME = 0.1;
const PLAYER_W = 44;
const PLAYER_H = 56;
const TILE_W = 44;
const TILE_H = 44;
const MAX_RACK = 7;
const MAX_HP = 5;
const INVINCIBLE_TIME = 2.0;
const RAMP_DURATION = 180;

const BASE_SCROLL_SPEED = 100;
const MAX_SCROLL_SPEED = 260;
const CHUNK_MIN_W = 800;
const CHUNK_MAX_W = 1200;
const LETTER_BOB_SPEED = 3;
const LETTER_BOB_AMP = 8;
const COIN_VALUE = 10;

const letterScores = {
  A:1, B:3, C:3, D:2, E:1, F:4, G:2, H:4, I:1,
  J:8, K:5, L:1, M:3, N:1, O:1, P:3, Q:10, R:1,
  S:1, T:1, U:1, V:4, W:4, X:8, Y:4, Z:10,
};

const LETTER_POOL = 'AAAAAAAAABBCCDDDDEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ';

// Rare letters glow gold, semi-rare glow blue
const RARE_LETTERS = new Set(['Q','Z','X','J']);
const SEMI_RARE_LETTERS = new Set(['K','V','W','Y','F','H']);

function randLetter() {
  return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
}
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randFloat(a, b) { return Math.random() * (b - a) + a; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutQuad(t) { return t * (2 - t); }

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

let _entityId = 0;
function nextId() { return ++_entityId; }

const ENEMY_WORDS_BY_TIER = {
  easy:   ['CAT','DOG','RUN','HIT','BAD','HOP','BUG','RAT','BAT','ANT'],
  medium: ['FROG','WASP','HAWK','WOLF','BEAR','LYNX','SLUG','MOTH','CRAB','TOAD'],
  hard:   ['VIPER','SHARK','RAVEN','SQUID','COBRA','GHOST','DRONE','TROLL','BEAST','FIEND'],
};

function scramble(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('') === word ? scramble(word) : arr.join('');
}

// ─── Theo Image Loader ───
const theoImages = [null, null, null, null];
let theoLoaded = false;
const THEO_PATHS = [
  '/images/theomascot.png',
  '/images/theomascot2.png',
  '/images/theomascot3.png',
  '/images/theomascot4.png',
];

function preloadTheo() {
  if (theoLoaded) return Promise.resolve();
  return Promise.all(THEO_PATHS.map((src, i) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { theoImages[i] = img; resolve(); };
    img.onerror = () => resolve(); // graceful fallback
    img.src = src;
  }))).then(() => { theoLoaded = true; });
}

// ─── Protile Image Loader (same as Rack/Cell elsewhere on site) ───
const protileImages = {};
let protilesLoaded = false;
const PROTILE_LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

function preloadProtiles() {
  if (protilesLoaded) return Promise.resolve();
  return Promise.all(PROTILE_LETTERS.map((letter) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { protileImages[letter] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = `/images/compressed-clean-protiles/${letter}.png`;
  }))).then(() => { protilesLoaded = true; });
}

// ─── Component ───
export default function ScrabbleDash() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  const [gamePhase, setGamePhase] = useState('intro');
  const [rack, setRack] = useState([]);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [distance, setDistance] = useState(0);
  const [wordFlash, setWordFlash] = useState(null);
  const [powerups, setPowerups] = useState({ speed: 0, magnet: 0, shield: 0 });
  const [dictReady, setDictReady] = useState(isDictionaryLoaded());
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('scrabbledash-highscore') || '0', 10); } catch { return 0; }
  });
  const [wordsSubmitted, setWordsSubmitted] = useState([]);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [combo, setCombo] = useState(0);
  const [coins, setCoins] = useState(0);

  // Dictionary + Theo + Protiles preload
  useEffect(() => {
    preloadTheo();
    preloadProtiles();
    if (!isDictionaryLoaded()) {
      initializeDictionary().then(() => setDictReady(isDictionaryLoaded()));
    }
  }, []);

  // ─── Init Game State ───
  const initGame = useCallback(() => {
    _entityId = 0;
    const g = {
      cameraX: 0, scrollSpeed: BASE_SCROLL_SPEED,
      elapsed: 0, difficulty: 0,

      // Player physics
      px: 200, py: 300, pvx: 0, pvy: 0,
      onGround: false, jumpsLeft: 2,
      facingRight: true, alive: true,
      legPhase: 0, theoFrame: 0, theoFrameTimer: 0,

      // Advanced movement
      coyoteTimer: 0,       // time since leaving ground
      jumpBufferTimer: 0,   // pre-land jump buffering
      jumpHeld: false,       // is jump key held (for variable height)
      wallSliding: false,
      wallDir: 0,            // -1 left wall, 1 right wall
      dashTimer: 0,
      dashCooldown: 0,
      dashDir: 1,
      isDashing: false,

      // Combat / state
      invincibleTimer: 0,
      stompBounceTimer: 0,  // brief invuln after stomp

      // Entities
      platforms: [], letters: [], enemies: [], bridges: [],
      particles: [], coinEntities: [], hazards: [],

      // Generation
      genX: 0, chunkCount: 0,
      lastEnemyX: 0, // avoid enemy clusters
      bossSpawned: {},

      // Effects
      shakeTimer: 0, shakeIntensity: 0,
      flashAlpha: 0, flashColor: '#fff',
      speedLineTimer: 0,

      // Powerups
      speedTimer: 0, magnetTimer: 0, shieldTimer: 0,

      // Combo
      comboTimer: 0, comboCount: 0,

      // Input
      keys: {}, keysJustPressed: {},
      touchLeft: false, touchRight: false, touchJump: false, touchDash: false,

      // Parallax
      stars: Array.from({ length: 80 }, () => ({
        x: Math.random() * 2000, y: Math.random() * 600,
        r: Math.random() * 1.5 + 0.5, bright: Math.random(),
      })),

      // Step-on-letters: spell words by landing on platform tiles in sequence
      steppedLetters: [],
      lastLandedPlatformId: null,
    };

    generateInitialPlatforms(g);
    return g;
  }, []);

  function generateInitialPlatforms(g) {
    const groundY = 450;
    for (let x = 0; x < 800; x += TILE_W) {
      g.platforms.push({ id: nextId(), x, y: groundY, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
    }
    // A few coins on the starting area
    for (let i = 0; i < 4; i++) {
      g.coinEntities.push({ id: nextId(), x: 150 + i * 120, y: groundY - 70, collected: false });
    }
    g.genX = 800;
    for (let i = 0; i < 6; i++) generateChunk(g);
  }

  function getEnemyWord(diff) {
    if (diff > 0.7) return ENEMY_WORDS_BY_TIER.hard[randInt(0, ENEMY_WORDS_BY_TIER.hard.length - 1)];
    if (diff > 0.35) return ENEMY_WORDS_BY_TIER.medium[randInt(0, ENEMY_WORDS_BY_TIER.medium.length - 1)];
    return ENEMY_WORDS_BY_TIER.easy[randInt(0, ENEMY_WORDS_BY_TIER.easy.length - 1)];
  }

  function generateChunk(g) {
    const diff = g.difficulty;
    const chunkW = randInt(CHUNK_MIN_W, CHUNK_MAX_W);
    const startX = g.genX;
    const baseY = 420;

    const patterns = ['flat','stairUp','stairDown','gap','enemyRun','floating','bridge','crumble','bounce','gauntlet'];
    const weights = [
      3 - diff * 2,       // flat
      2,                    // stairUp
      1.5,                  // stairDown
      1 + diff * 2,        // gaps
      0.5 + diff * 2.5,   // enemies
      1 + diff * 1.5,     // floating
      0.3 + diff * 0.7,   // bridges
      diff * 2,            // crumbling platforms (harder = more)
      0.5 + diff,          // bounce pads
      diff * 1.5,          // gauntlet (multi-enemy)
    ];
    const pattern = weightedPick(patterns, weights);

    let x = startX;
    const endX = startX + chunkW;

    switch (pattern) {
      case 'flat': {
        const y = baseY + randInt(-60, 40);
        while (x < endX) {
          g.platforms.push({ id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
          if (Math.random() < 0.12) g.letters.push({ id: nextId(), x: x + TILE_W / 2, y: y - 80, letter: randLetter(), collected: false });
          if (Math.random() < 0.08) g.coinEntities.push({ id: nextId(), x: x + TILE_W / 2, y: y - 60, collected: false });
          x += TILE_W;
        }
        break;
      }
      case 'stairUp': {
        let y = baseY + 40;
        const step = randInt(30, 50);
        while (x < endX) {
          for (let i = 0; i < 3 && x < endX; i++, x += TILE_W) {
            g.platforms.push({ id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
          }
          // Coin arc on stairs
          g.coinEntities.push({ id: nextId(), x: x - TILE_W * 1.5, y: y - 50, collected: false });
          y -= step;
          if (Math.random() < 0.2) g.letters.push({ id: nextId(), x: x - TILE_W, y: y - 60, letter: randLetter(), collected: false });
        }
        break;
      }
      case 'stairDown': {
        let y = baseY - 80;
        const step = randInt(30, 50);
        while (x < endX) {
          for (let i = 0; i < 3 && x < endX; i++, x += TILE_W) {
            g.platforms.push({ id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
          }
          y = Math.min(y + step, 500);
        }
        break;
      }
      case 'gap': {
        const gapW = lerp(110, 240, diff);
        const preY = baseY + randInt(-40, 20);
        for (let i = 0; i < 4; i++, x += TILE_W) {
          g.platforms.push({ id: nextId(), x, y: preY, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
        }
        // Letter + coin arc above gap
        const gapMid = x + gapW / 2;
        g.letters.push({ id: nextId(), x: gapMid, y: preY - 120, letter: randLetter(), collected: false });
        for (let c = 0; c < 3; c++) {
          const cx = x + gapW * (c + 1) / 4;
          const cy = preY - 60 - Math.sin((c + 1) / 4 * Math.PI) * 60;
          g.coinEntities.push({ id: nextId(), x: cx, y: cy, collected: false });
        }
        x += gapW;
        const postY = preY + randInt(-30, 30);
        while (x < endX) {
          g.platforms.push({ id: nextId(), x, y: postY, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
          x += TILE_W;
        }
        break;
      }
      case 'enemyRun': {
        const y = baseY + randInt(-20, 20);
        const word = getEnemyWord(diff);
        let enemyPlaced = false;
        while (x < endX) {
          g.platforms.push({ id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
          if (!enemyPlaced && x > startX + chunkW * 0.3 && x - g.lastEnemyX > 300) {
            const patrolSpeed = 30 + diff * 60;
            g.enemies.push({
              id: nextId(), x, y: y - 44, w: word.length * 28, h: 38,
              word, scrambled: scramble(word), alive: true,
              vx: patrolSpeed, patrolLeft: x - 60, patrolRight: x + 200,
              tier: diff > 0.7 ? 'hard' : diff > 0.35 ? 'medium' : 'easy',
              hp: diff > 0.6 ? 2 : 1, maxHp: diff > 0.6 ? 2 : 1,
              flashTimer: 0,
            });
            g.lastEnemyX = x;
            enemyPlaced = true;
          }
          if (Math.random() < 0.08) g.letters.push({ id: nextId(), x: x + TILE_W / 2, y: y - 90, letter: randLetter(), collected: false });
          x += TILE_W;
        }
        break;
      }
      case 'floating': {
        let cy = baseY - 40;
        while (x < endX) {
          const platLen = randInt(2, 4);
          const py = clamp(cy + randInt(-60, 60), 200, 480);
          const isMoving = Math.random() < 0.3 + diff * 0.3;
          for (let i = 0; i < platLen && x < endX; i++, x += TILE_W) {
            g.platforms.push({
              id: nextId(), x, y: py, w: TILE_W, h: TILE_H, letter: randLetter(),
              type: isMoving ? 'moving' : 'normal',
              moveBaseY: py, moveAmp: randInt(30, 60), moveSpeed: randFloat(1, 2.5), movePhase: Math.random() * Math.PI * 2,
            });
          }
          if (Math.random() < 0.3) g.letters.push({ id: nextId(), x: x - TILE_W * platLen / 2, y: py - 80, letter: randLetter(), collected: false });
          if (Math.random() < 0.15) g.coinEntities.push({ id: nextId(), x: x - TILE_W, y: py - 50, collected: false });
          x += randInt(80, 160 + Math.floor(diff * 60));
          cy = py;
        }
        break;
      }
      case 'bridge': {
        const y = baseY + randInt(-20, 10);
        for (let i = 0; i < 5; i++, x += TILE_W) {
          g.platforms.push({ id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
        }
        const bridgeX = x;
        const bridgeW = 200;
        g.bridges.push({ id: nextId(), x: bridgeX, y, w: bridgeW, built: false });
        // Letters near bridge
        for (let i = 0; i < 3; i++) {
          g.letters.push({ id: nextId(), x: bridgeX + i * 50 - 30, y: y - 100, letter: randLetter(), collected: false });
        }
        x += bridgeW;
        while (x < endX) {
          g.platforms.push({ id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
          x += TILE_W;
        }
        break;
      }
      case 'crumble': {
        const y = baseY + randInt(-30, 20);
        while (x < endX) {
          const isCrumble = Math.random() < 0.4 + diff * 0.2;
          g.platforms.push({
            id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(),
            type: isCrumble ? 'crumble' : 'normal',
            crumbleTimer: isCrumble ? 0 : undefined,
            crumbling: false, crumbled: false,
          });
          if (Math.random() < 0.15) g.coinEntities.push({ id: nextId(), x: x + TILE_W / 2, y: y - 55, collected: false });
          x += TILE_W;
        }
        break;
      }
      case 'bounce': {
        const y = baseY + randInt(0, 30);
        // Platforms with bounce pads interspersed
        while (x < endX) {
          const isBounce = Math.random() < 0.2;
          g.platforms.push({
            id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(),
            type: isBounce ? 'bounce' : 'normal',
          });
          if (isBounce) {
            // Coins high above bounce pads
            for (let c = 0; c < 3; c++) {
              g.coinEntities.push({ id: nextId(), x: x + TILE_W / 2, y: y - 120 - c * 40, collected: false });
            }
            // High letter
            g.letters.push({ id: nextId(), x: x + TILE_W / 2, y: y - 250, letter: randLetter(), collected: false });
          }
          x += TILE_W;
        }
        break;
      }
      case 'gauntlet': {
        // Multiple enemies in a row with narrow platforms
        const y = baseY + randInt(-10, 10);
        let enemyCount = 0;
        const maxEnemies = 2 + Math.floor(diff * 2);
        while (x < endX) {
          g.platforms.push({ id: nextId(), x, y, w: TILE_W, h: TILE_H, letter: randLetter(), type: 'normal' });
          if (enemyCount < maxEnemies && Math.random() < 0.12 && x - g.lastEnemyX > 200) {
            const word = getEnemyWord(diff);
            g.enemies.push({
              id: nextId(), x, y: y - 44, w: word.length * 28, h: 38,
              word, scrambled: scramble(word), alive: true,
              vx: 40 + diff * 80, patrolLeft: x - 40, patrolRight: x + 150,
              tier: diff > 0.5 ? 'medium' : 'easy',
              hp: 1, maxHp: 1, flashTimer: 0,
            });
            g.lastEnemyX = x;
            enemyCount++;
          }
          if (Math.random() < 0.06) g.letters.push({ id: nextId(), x: x + TILE_W / 2, y: y - 85, letter: randLetter(), collected: false });
          x += TILE_W;
        }
        break;
      }
      default: break;
    }

    // Boss spawn at milestones
    const distKm = Math.floor(g.genX / 3000);
    if (distKm > 0 && distKm % 3 === 0 && !g.bossSpawned[distKm]) {
      g.bossSpawned[distKm] = true;
      const bossWord = ['QUARTZ','JINXED','SPHINX','FJORDS','GLYPH'][randInt(0, 4)];
      const bossY = baseY - 60;
      g.enemies.push({
        id: nextId(), x: g.genX + 200, y: bossY, w: bossWord.length * 32, h: 50,
        word: bossWord, scrambled: scramble(bossWord), alive: true,
        vx: 60, patrolLeft: g.genX + 100, patrolRight: g.genX + 500,
        tier: 'boss', hp: 3, maxHp: 3, flashTimer: 0,
      });
    }

    g.genX = Math.max(g.genX, endX);
    g.chunkCount++;
  }

  function weightedPick(items, weights) {
    const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= Math.max(0, weights[i]);
      if (r <= 0) return items[i];
    }
    return items[0];
  }

  // ─── Input Handling ───
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const g = gameRef.current;
    if (!g) return;

    const onKeyDown = (e) => {
      if (!g.keys[e.code]) g.keysJustPressed[e.code] = true;
      g.keys[e.code] = true;
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && g.alive) {
        g.jumpHeld = true;
        g.jumpBufferTimer = JUMP_BUFFER_TIME;
        tryJump(g);
      }
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && g.alive) {
        tryDash(g);
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        // Slide / fast fall
        if (!g.onGround && g.pvy > 0) g.pvy += 300;
      }
      if (e.code === 'Backspace') {
        e.preventDefault();
        setRack(prev => prev.slice(0, -1));
      }
    };
    const onKeyUp = (e) => {
      g.keys[e.code] = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        g.jumpHeld = false;
        // Variable jump: cut jump short if released early
        if (g.pvy < JUMP_VEL_MIN) g.pvy = JUMP_VEL_MIN;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gamePhase]);

  function tryJump(g) {
    // Wall jump
    if (g.wallSliding && g.wallDir !== 0) {
      g.pvx = -g.wallDir * WALL_JUMP_VEL_X;
      g.pvy = WALL_JUMP_VEL_Y;
      g.facingRight = g.wallDir < 0;
      g.wallSliding = false;
      g.jumpsLeft = 1;
      spawnJumpParticles(g);
      return;
    }
    // Coyote time: allow jump shortly after leaving ground
    if (g.jumpsLeft === 2 || (g.coyoteTimer > 0 && g.jumpsLeft >= 1)) {
      g.pvy = JUMP_VEL;
      g.jumpsLeft = 1;
      g.onGround = false;
      g.coyoteTimer = 0;
      spawnJumpParticles(g);
    } else if (g.jumpsLeft === 1) {
      g.pvy = DOUBLE_JUMP_VEL;
      g.jumpsLeft = 0;
      // Double jump puff
      for (let i = 0; i < 10; i++) {
        g.particles.push({
          x: g.px + PLAYER_W / 2, y: g.py + PLAYER_H * 0.6,
          vx: randFloat(-80, 80), vy: randFloat(-60, 30),
          life: 0.4, maxLife: 0.4, r: randFloat(3, 5),
          color: 'rgba(255,200,100,0.5)', type: 'puff',
        });
      }
    }
  }

  function tryDash(g) {
    if (g.dashCooldown > 0 || g.isDashing) return;
    g.isDashing = true;
    g.dashTimer = DASH_DURATION;
    g.dashCooldown = DASH_COOLDOWN;
    g.dashDir = g.facingRight ? 1 : -1;
    g.pvy = 0; // freeze vertical during dash
    g.invincibleTimer = Math.max(g.invincibleTimer, DASH_DURATION); // i-frames during dash
    // Dash particles
    for (let i = 0; i < 8; i++) {
      g.particles.push({
        x: g.px + PLAYER_W / 2, y: g.py + PLAYER_H / 2,
        vx: -g.dashDir * randFloat(60, 200), vy: randFloat(-30, 30),
        life: 0.3, maxLife: 0.3, r: randFloat(2, 4),
        color: 'rgba(255,180,60,0.6)', type: 'dash',
      });
    }
  }

  function spawnJumpParticles(g) {
    for (let i = 0; i < 6; i++) {
      g.particles.push({
        x: g.px + PLAYER_W / 2, y: g.py + PLAYER_H,
        vx: randFloat(-60, 60), vy: randFloat(-40, 10),
        life: 0.35, maxLife: 0.35, r: randFloat(2, 4),
        color: 'rgba(245,222,179,0.6)', type: 'dust',
      });
    }
  }

  // ─── Submit Word ───
  const submitWord = useCallback(() => {
    const g = gameRef.current;
    if (!g || !g.alive) return;
    const word = rack.map(t => t.letter).join('');
    if (word.length < 2) return;

    const valid = isValidWordLocal(word);
    if (valid) {
      // Score calculation with combo
      let wordScore = 0;
      rack.forEach(t => { wordScore += (letterScores[t.letter] || 1); });
      wordScore *= word.length;

      // Combo multiplier (consecutive valid words within 10s)
      const newCombo = g.comboTimer > 0 ? g.comboCount + 1 : 1;
      g.comboCount = newCombo;
      g.comboTimer = 10; // 10s combo window
      const comboMult = 1 + (newCombo - 1) * 0.5; // 1x, 1.5x, 2x, 2.5x...
      wordScore = Math.round(wordScore * comboMult);

      setCombo(newCombo);

      // Power-ups based on word length
      if (word.length >= 7) {
        g.shieldTimer = 10;
        setPowerups(p => ({ ...p, shield: 10 }));
        wordScore *= 3;
        // Full heal on bingo
        setHp(MAX_HP);
      } else if (word.length >= 5) {
        g.magnetTimer = 8;
        setPowerups(p => ({ ...p, magnet: 8 }));
        wordScore *= 2;
        // Partial heal
        setHp(prev => Math.min(prev + 1, MAX_HP));
      } else if (word.length >= 4) {
        g.speedTimer = 5;
        setPowerups(p => ({ ...p, speed: 5 }));
        wordScore = Math.round(wordScore * 1.5);
      }

      // 3-letter words: small score bonus, brief speed
      if (word.length === 3) {
        g.speedTimer = Math.max(g.speedTimer, 2);
        setPowerups(p => ({ ...p, speed: Math.max(p.speed, 2) }));
      }

      setScore(prev => prev + wordScore);
      setWordsSubmitted(prev => [...prev, word]);
      setWordFlash({ text: word, score: wordScore, combo: newCombo, success: true });
      setTimeout(() => setWordFlash(null), 1500);

      // Celebration particles (more for bigger words)
      const particleCount = 10 + word.length * 5;
      for (let i = 0; i < particleCount; i++) {
        g.particles.push({
          x: g.px + PLAYER_W / 2, y: g.py,
          vx: randFloat(-180, 180), vy: randFloat(-250, -50),
          life: 1.2, maxLife: 1.2, r: randFloat(3, 7),
          color: `hsl(${randInt(20, 60)}, 100%, ${randInt(50, 85)}%)`, type: 'sparkle',
        });
      }

      g.flashAlpha = 0.25;
      g.flashColor = word.length >= 7 ? '#f1c40f' : '#2ecc71';

      // Build nearby bridges
      g.bridges.forEach(b => {
        if (!b.built && Math.abs((b.x + b.w / 2) - (g.px + g.cameraX)) < 500) {
          b.built = true;
          for (let bx = b.x; bx < b.x + b.w; bx += TILE_W) {
            g.platforms.push({
              id: nextId(), x: bx, y: b.y, w: TILE_W, h: TILE_H,
              letter: word[Math.floor(Math.random() * word.length)] || 'A',
              type: 'bridge',
            });
          }
        }
      });
    } else {
      setWordFlash({ text: word, score: 0, success: false });
      setTimeout(() => setWordFlash(null), 1200);
      g.flashAlpha = 0.2;
      g.flashColor = '#e74c3c';
      g.shakeTimer = 0.3;
      g.shakeIntensity = 5;
      // Break combo
      g.comboCount = 0;
      g.comboTimer = 0;
      setCombo(0);
    }
    setRack([]);
  }, [rack]);

  // Enter key to submit
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const onKey = (e) => { if (e.code === 'Enter') submitWord(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gamePhase, submitWord]);

  // ─── Start Game ───
  const startGame = useCallback(() => {
    const g = initGame();
    gameRef.current = g;
    setRack([]);
    setScore(0);
    setHp(MAX_HP);
    setDistance(0);
    setWordsSubmitted([]);
    setEnemiesDefeated(0);
    setPowerups({ speed: 0, magnet: 0, shield: 0 });
    setWordFlash(null);
    setCombo(0);
    setCoins(0);
    setGamePhase('playing');
  }, [initGame]);

  // ─── Damage ───
  const takeDamage = useCallback((g) => {
    if (g.invincibleTimer > 0 || g.shieldTimer > 0) return;
    setHp(prev => {
      const next = prev - 1;
      if (next <= 0) {
        g.alive = false;
        setGamePhase('gameover');
        setScore(s => {
          const best = parseInt(localStorage.getItem('scrabbledash-highscore') || '0', 10);
          if (s > best) {
            localStorage.setItem('scrabbledash-highscore', String(s));
            setHighScore(s);
          }
          return s;
        });
      }
      return next;
    });
    g.invincibleTimer = INVINCIBLE_TIME;
    g.shakeTimer = 0.4;
    g.shakeIntensity = 8;
    g.flashAlpha = 0.3;
    g.flashColor = '#e74c3c';
    // Knockback
    g.pvx = g.facingRight ? -200 : 200;
    g.pvy = -200;
    for (let i = 0; i < 12; i++) {
      g.particles.push({
        x: g.px + PLAYER_W / 2, y: g.py + PLAYER_H / 2,
        vx: randFloat(-120, 120), vy: randFloat(-120, 120),
        life: 0.6, maxLife: 0.6, r: randFloat(2, 5),
        color: 'rgba(231,76,60,0.8)', type: 'damage',
      });
    }
  }, []);

  // ─── Main Game Loop ───
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();
    let animFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now) => {
      animFrame = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const g = gameRef.current;
      if (!g || !g.alive) return;

      const W = canvas.width;
      const H = canvas.height;

      // ── Update ──
      g.elapsed += dt;
      g.difficulty = clamp(g.elapsed / RAMP_DURATION, 0, 1);

      // Scroll speed
      const baseSpeed = lerp(BASE_SCROLL_SPEED, MAX_SCROLL_SPEED, g.difficulty);
      g.scrollSpeed = g.speedTimer > 0 ? baseSpeed * 1.4 : baseSpeed;
      g.cameraX += g.scrollSpeed * dt;
      setDistance(Math.floor(g.cameraX / 10));

      // Generate new chunks
      while (g.genX < g.cameraX + W + 800) generateChunk(g);

      // Cull off-screen entities
      const cullX = g.cameraX - 200;
      g.platforms = g.platforms.filter(p => p.x + p.w > cullX && !p.crumbled);
      g.letters = g.letters.filter(l => l.x > cullX && !l.collected);
      g.enemies = g.enemies.filter(e => e.x + e.w > cullX);
      g.bridges = g.bridges.filter(b => b.x + b.w > cullX);
      g.coinEntities = g.coinEntities.filter(c => c.x > cullX && !c.collected);

      // Moving platforms
      g.platforms.forEach(p => {
        if (p.type === 'moving') {
          p.y = p.moveBaseY + Math.sin(g.elapsed * p.moveSpeed + p.movePhase) * p.moveAmp;
        }
        // Crumbling platforms
        if (p.type === 'crumble' && p.crumbling) {
          p.crumbleTimer += dt;
          if (p.crumbleTimer > 0.6) p.crumbled = true;
        }
      });

      // Enemy AI - patrolling
      g.enemies.forEach(e => {
        if (!e.alive) return;
        e.x += e.vx * dt;
        if (e.x <= e.patrolLeft) { e.x = e.patrolLeft; e.vx = Math.abs(e.vx); }
        if (e.x + e.w >= e.patrolRight) { e.x = e.patrolRight - e.w; e.vx = -Math.abs(e.vx); }
        if (e.flashTimer > 0) e.flashTimer -= dt;
      });

      // ── Player Update ──
      // Dash
      if (g.isDashing) {
        g.dashTimer -= dt;
        if (g.dashTimer <= 0) g.isDashing = false;
      }
      if (g.dashCooldown > 0) g.dashCooldown -= dt;

      // Horizontal movement
      const moveSpeed = g.isDashing ? DASH_SPEED : 220;
      let moveDir = 0;
      if (g.keys['ArrowLeft'] || g.keys['KeyA'] || g.touchLeft) moveDir = -1;
      if (g.keys['ArrowRight'] || g.keys['KeyD'] || g.touchRight) moveDir = 1;

      if (g.isDashing) {
        g.pvx = g.dashDir * DASH_SPEED;
      } else {
        g.pvx = moveDir * moveSpeed;
      }
      if (moveDir !== 0 && !g.isDashing) g.facingRight = moveDir > 0;

      // Gravity (reduced during wall slide)
      if (!g.isDashing) {
        const gravMult = g.wallSliding ? 0.3 : 1;
        g.pvy += GRAVITY * gravMult * dt;
        // Wall slide max speed
        if (g.wallSliding && g.pvy > WALL_SLIDE_SPEED) g.pvy = WALL_SLIDE_SPEED;
      }

      g.px += g.pvx * dt;
      if (!g.isDashing) g.py += g.pvy * dt;

      // Keep player on screen horizontally
      const screenX = g.px - g.cameraX + W * 0.3;
      if (screenX < 30) g.px = g.cameraX - W * 0.3 + 30;
      if (screenX > W - 50) g.px = g.cameraX + W * 0.7 - 50;

      // ── Platform collisions ──
      const wasOnGround = g.onGround;
      g.onGround = false;
      g.wallSliding = false;
      g.wallDir = 0;

      for (const p of g.platforms) {
        if (p.crumbled) continue;

        // Top collision (landing) - only when falling
        if (g.pvy >= 0) {
          const platTop = p.y;
          const prevBottom = g.py + PLAYER_H - g.pvy * dt;
          if (
            g.px + PLAYER_W - 4 > p.x && g.px + 4 < p.x + p.w &&
            prevBottom <= platTop + 6 &&
            g.py + PLAYER_H >= platTop &&
            g.py + PLAYER_H <= platTop + PLAYER_H
          ) {
            g.py = platTop - PLAYER_H;
            g.pvy = 0;
            g.onGround = true;
            g.jumpsLeft = 2;
            g.coyoteTimer = COYOTE_TIME;

            // Bounce pad
            if (p.type === 'bounce') {
              g.pvy = JUMP_VEL * 1.6;
              g.onGround = false;
              g.jumpsLeft = 2;
              g.shakeTimer = 0.1;
              g.shakeIntensity = 3;
              for (let i = 0; i < 8; i++) {
                g.particles.push({
                  x: g.px + PLAYER_W / 2, y: g.py + PLAYER_H,
                  vx: randFloat(-80, 80), vy: randFloat(-120, -40),
                  life: 0.5, maxLife: 0.5, r: randFloat(3, 5),
                  color: 'rgba(46,204,113,0.7)', type: 'bounce',
                });
              }
            }

            // Crumble trigger
            if (p.type === 'crumble' && !p.crumbling) {
              p.crumbling = true;
              p.crumbleTimer = 0;
            }

            // Landing particles
            if (!wasOnGround) {
              for (let i = 0; i < 4; i++) {
                g.particles.push({
                  x: g.px + PLAYER_W / 2, y: g.py + PLAYER_H,
                  vx: randFloat(-50, 50), vy: randFloat(-25, 0),
                  life: 0.3, maxLife: 0.3, r: randFloat(2, 3),
                  color: 'rgba(200,180,150,0.5)', type: 'dust',
                });
              }
              // Step-on-letters: add this platform's letter and check for words
              if (p.letter) {
                g.steppedLetters = (g.steppedLetters.concat(p.letter)).slice(-7);
                for (let len = Math.min(7, g.steppedLetters.length); len >= 3; len--) {
                  const word = g.steppedLetters.slice(-len).join('');
                  if (isValidWordLocal(word)) {
                    let stepScore = 0;
                    g.steppedLetters.slice(-len).forEach(l => { stepScore += (letterScores[l] || 1); });
                    stepScore *= len * 2; // bonus for step words
                    setScore(prev => prev + stepScore);
                    setWordFlash({ text: word, score: stepScore, combo: 1, success: true, stepWord: true });
                    setTimeout(() => setWordFlash(null), 1400);
                    g.steppedLetters = g.steppedLetters.slice(0, -len);
                    for (let i = 0; i < 8; i++) {
                      g.particles.push({
                        x: g.px + PLAYER_W / 2, y: g.py,
                        vx: randFloat(-100, 100), vy: randFloat(-120, -40),
                        life: 0.6, maxLife: 0.6, r: randFloat(2, 5),
                        color: `hsl(${randInt(45, 55)}, 100%, 60%)`, type: 'sparkle',
                      });
                    }
                    break;
                  }
                }
              }
            }
            break;
          }
        }

        // Side collision (wall detection for wall-slide)
        if (!g.onGround && g.pvy > 50) {
          // Left wall
          if (moveDir === -1 && g.px < p.x + p.w && g.px > p.x + p.w - 8 &&
              g.py + PLAYER_H > p.y + 4 && g.py < p.y + p.h - 4) {
            g.wallSliding = true;
            g.wallDir = -1;
            g.jumpsLeft = Math.max(g.jumpsLeft, 1);
          }
          // Right wall
          if (moveDir === 1 && g.px + PLAYER_W > p.x && g.px + PLAYER_W < p.x + 8 &&
              g.py + PLAYER_H > p.y + 4 && g.py < p.y + p.h - 4) {
            g.wallSliding = true;
            g.wallDir = 1;
            g.jumpsLeft = Math.max(g.jumpsLeft, 1);
          }
        }
      }

      // Coyote time management
      if (wasOnGround && !g.onGround && g.pvy >= 0) {
        g.coyoteTimer = COYOTE_TIME;
      }
      if (g.coyoteTimer > 0 && !g.onGround) g.coyoteTimer -= dt;

      // Jump buffer: pressed jump right before landing
      if (g.jumpBufferTimer > 0) {
        g.jumpBufferTimer -= dt;
        if (g.onGround) { tryJump(g); g.jumpBufferTimer = 0; }
      }

      // Player auto-moves with camera
      g.px += g.scrollSpeed * dt;

      // Fall off screen
      if (g.py > H + 80) {
        let bestPlat = null, bestDist = Infinity;
        for (const p of g.platforms) {
          if (p.crumbled) continue;
          const d = Math.abs(p.x - g.cameraX - W * 0.3);
          if (d < bestDist && p.y < H - 50) { bestDist = d; bestPlat = p; }
        }
        if (bestPlat) {
          g.px = bestPlat.x;
          g.py = bestPlat.y - PLAYER_H - 30;
        } else {
          g.px = g.cameraX + W * 0.3;
          g.py = 200;
        }
        g.pvy = 0;
        g.pvx = 0;
        takeDamage(g);
      }

      // Theo animation
      if (g.onGround && (Math.abs(g.pvx) > 30 || g.scrollSpeed > 50)) {
        g.legPhase += dt * 12;
        g.theoFrameTimer += dt;
        if (g.theoFrameTimer > 0.2) {
          g.theoFrameTimer = 0;
          g.theoFrame = (g.theoFrame + 1) % 4;
        }
      }

      // ── Letter collection ──
      const magnetRange = g.magnetTimer > 0 ? 220 : 0;
      g.letters.forEach(l => {
        if (l.collected) return;
        if (magnetRange > 0) {
          const dx = (g.px + PLAYER_W / 2) - l.x;
          const dy = (g.py + PLAYER_H / 2) - l.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < magnetRange && dist > 0) {
            const speed = 350 * (1 - dist / magnetRange); // faster when closer
            l.x += (dx / dist) * speed * dt;
            l.y += (dy / dist) * speed * dt;
          }
        }
        if (aabb(g.px, g.py, PLAYER_W, PLAYER_H, l.x - 15, l.y - 15, 30, 30)) {
          l.collected = true;
          setRack(prev => {
            if (prev.length >= MAX_RACK) return prev;
            return [...prev, { letter: l.letter, id: nextId() }];
          });
          for (let i = 0; i < 8; i++) {
            const isRare = RARE_LETTERS.has(l.letter);
            g.particles.push({
              x: l.x, y: l.y,
              vx: randFloat(-80, 80), vy: randFloat(-80, 80),
              life: 0.5, maxLife: 0.5, r: randFloat(2, 5),
              color: isRare ? `hsl(${randInt(280, 320)}, 100%, 70%)` : `hsl(${randInt(40, 60)}, 100%, 70%)`,
              type: 'sparkle',
            });
          }
        }
      });

      // ── Coin collection ──
      g.coinEntities.forEach(c => {
        if (c.collected) return;
        if (magnetRange > 0) {
          const dx = (g.px + PLAYER_W / 2) - c.x;
          const dy = (g.py + PLAYER_H / 2) - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < magnetRange * 0.7 && dist > 0) {
            c.x += (dx / dist) * 250 * dt;
            c.y += (dy / dist) * 250 * dt;
          }
        }
        if (aabb(g.px, g.py, PLAYER_W, PLAYER_H, c.x - 10, c.y - 10, 20, 20)) {
          c.collected = true;
          setCoins(prev => prev + 1);
          setScore(prev => prev + COIN_VALUE);
          for (let i = 0; i < 5; i++) {
            g.particles.push({
              x: c.x, y: c.y,
              vx: randFloat(-50, 50), vy: randFloat(-70, -20),
              life: 0.4, maxLife: 0.4, r: randFloat(2, 3),
              color: 'rgba(255,215,0,0.8)', type: 'coin',
            });
          }
        }
      });

      // ── Enemy collisions ──
      g.enemies.forEach(e => {
        if (!e.alive) return;
        if (aabb(g.px, g.py, PLAYER_W, PLAYER_H, e.x, e.y, e.w, e.h)) {
          // Stomping
          if (g.pvy > 0 && g.py + PLAYER_H < e.y + e.h * 0.5) {
            e.hp--;
            e.flashTimer = 0.15;
            g.pvy = JUMP_VEL * 0.65;
            if (e.hp <= 0) {
              e.alive = false;
              const pts = e.tier === 'boss' ? 300 : e.tier === 'hard' ? 100 : e.tier === 'medium' ? 75 : 50;
              setScore(prev => prev + pts);
              setEnemiesDefeated(prev => prev + 1);
              // Big explosion for bosses
              const pCount = e.tier === 'boss' ? 30 : 15;
              for (let i = 0; i < pCount; i++) {
                g.particles.push({
                  x: e.x + e.w / 2, y: e.y + e.h / 2,
                  vx: randFloat(-200, 200), vy: randFloat(-200, 60),
                  life: 0.8, maxLife: 0.8, r: randFloat(3, 8),
                  color: e.tier === 'boss'
                    ? `hsl(${randInt(270, 330)}, 90%, ${randInt(40, 70)}%)`
                    : `hsl(${randInt(0, 30)}, 80%, ${randInt(40, 70)}%)`,
                  type: 'explosion',
                });
              }
              // Drop letters on kill
              if (e.word) {
                const dropCount = Math.min(2, e.word.length);
                for (let d = 0; d < dropCount; d++) {
                  g.letters.push({
                    id: nextId(),
                    x: e.x + e.w / 2 + randFloat(-30, 30),
                    y: e.y - 20 - d * 20,
                    letter: e.word[d],
                    collected: false,
                  });
                }
              }
              g.shakeTimer = e.tier === 'boss' ? 0.5 : 0.2;
              g.shakeIntensity = e.tier === 'boss' ? 10 : 4;
            } else {
              // Enemy took a hit but not dead
              g.shakeTimer = 0.1;
              g.shakeIntensity = 3;
            }
          } else if (g.isDashing) {
            // Dash through enemies
            e.hp--;
            e.flashTimer = 0.15;
            if (e.hp <= 0) {
              e.alive = false;
              setScore(prev => prev + (e.tier === 'boss' ? 300 : 50));
              setEnemiesDefeated(prev => prev + 1);
              for (let i = 0; i < 12; i++) {
                g.particles.push({
                  x: e.x + e.w / 2, y: e.y + e.h / 2,
                  vx: randFloat(-150, 150), vy: randFloat(-150, 50),
                  life: 0.6, maxLife: 0.6, r: randFloat(3, 6),
                  color: `hsl(${randInt(0, 30)}, 80%, ${randInt(40, 70)}%)`, type: 'explosion',
                });
              }
            }
          } else {
            takeDamage(g);
          }
        }
      });

      // ── Timers ──
      if (g.speedTimer > 0) { g.speedTimer -= dt; setPowerups(p => ({ ...p, speed: Math.max(0, g.speedTimer) })); }
      if (g.magnetTimer > 0) { g.magnetTimer -= dt; setPowerups(p => ({ ...p, magnet: Math.max(0, g.magnetTimer) })); }
      if (g.shieldTimer > 0) { g.shieldTimer -= dt; setPowerups(p => ({ ...p, shield: Math.max(0, g.shieldTimer) })); }
      if (g.invincibleTimer > 0) g.invincibleTimer -= dt;
      if (g.shakeTimer > 0) g.shakeTimer -= dt;
      if (g.flashAlpha > 0) g.flashAlpha = Math.max(0, g.flashAlpha - dt * 2);
      if (g.speedTimer > 0) g.speedLineTimer += dt;

      // Combo timer
      if (g.comboTimer > 0) {
        g.comboTimer -= dt;
        if (g.comboTimer <= 0) { g.comboCount = 0; setCombo(0); }
      }

      // Particles
      g.particles = g.particles.filter(p => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.type === 'dust' || p.type === 'explosion' || p.type === 'damage' || p.type === 'bounce') p.vy += 200 * dt;
        if (p.type === 'sparkle') p.vy += 80 * dt;
        return p.life > 0;
      });

      // Touch jump
      if (g.touchJump) { tryJump(g); g.touchJump = false; }
      if (g.touchDash) { tryDash(g); g.touchDash = false; }

      // Clear just-pressed
      g.keysJustPressed = {};

      // ══════════ RENDER ══════════
      ctx.clearRect(0, 0, W, H);

      let shakeX = 0, shakeY = 0;
      if (g.shakeTimer > 0) {
        shakeX = (Math.random() - 0.5) * g.shakeIntensity * 2;
        shakeY = (Math.random() - 0.5) * g.shakeIntensity * 2;
      }
      ctx.save();
      ctx.translate(shakeX, shakeY);

      const camOff = -g.cameraX + W * 0.3;

      // ── 1. Background ──
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#0a0a2e');
      skyGrad.addColorStop(0.4, '#141438');
      skyGrad.addColorStop(0.7, '#1a1a3e');
      skyGrad.addColorStop(1, '#0d0d2a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-10, -10, W + 20, H + 20);

      // Stars
      g.stars.forEach(s => {
        const sx = ((s.x - g.cameraX * 0.05) % W + W) % W;
        const twinkle = 0.5 + 0.5 * Math.sin(g.elapsed * 2 + s.bright * 10);
        ctx.beginPath();
        ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,240,${twinkle * 0.8})`;
        ctx.fill();
      });

      // Parallax layers
      drawMountains(ctx, W, H, g.cameraX * 0.12, 'rgba(20,20,50,0.8)', H * 0.5, 140);
      drawCity(ctx, W, H, g.cameraX * 0.22, H * 0.58);
      drawMountains(ctx, W, H, g.cameraX * 0.35, 'rgba(15,15,40,0.85)', H * 0.68, 70);

      // Ground fill below platforms
      ctx.fillStyle = 'rgba(8,8,20,0.95)';
      ctx.fillRect(-10, H * 0.88, W + 20, H * 0.15);

      // ── 2. Platforms ──
      g.platforms.forEach(p => {
        if (p.crumbled) return;
        const sx = p.x + camOff;
        if (sx > -TILE_W - 5 && sx < W + TILE_W + 5) {
          drawScrabbleTile(ctx, sx, p.y, p.w, p.h, p.letter, p.type, p.crumbling, g.elapsed);
        }
      });

      // ── 3. Bridges ──
      g.bridges.forEach(b => {
        if (b.built) return;
        const sx = b.x + camOff;
        if (sx > -b.w && sx < W + b.w) {
          ctx.save();
          ctx.strokeStyle = `rgba(245,222,179,${0.3 + 0.2 * Math.sin(g.elapsed * 3)})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.strokeRect(sx, b.y, b.w, TILE_H);
          ctx.setLineDash([]);
          ctx.fillStyle = `rgba(245,222,179,${0.5 + 0.3 * Math.sin(g.elapsed * 2)})`;
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SUBMIT WORD TO BRIDGE', sx + b.w / 2, b.y - 8);
          ctx.restore();
        }
      });

      // ── 4. Coins ──
      g.coinEntities.forEach(c => {
        if (c.collected) return;
        const sx = c.x + camOff;
        if (sx > -20 && sx < W + 20) {
          const bob = Math.sin(g.elapsed * 4 + c.id * 0.5) * 5;
          drawCoin(ctx, sx, c.y + bob, g.elapsed);
        }
      });

      // ── 5. Floating letters ──
      g.letters.forEach(l => {
        if (l.collected) return;
        const sx = l.x + camOff;
        if (sx > -30 && sx < W + 30) {
          const bob = Math.sin(g.elapsed * LETTER_BOB_SPEED + l.id) * LETTER_BOB_AMP;
          drawLetterOrb(ctx, sx, l.y + bob, l.letter, g.elapsed);
        }
      });

      // ── 6. Enemies ──
      g.enemies.forEach(e => {
        if (!e.alive) return;
        const sx = e.x + camOff;
        if (sx > -e.w - 10 && sx < W + e.w + 10) {
          drawEnemy(ctx, sx, e.y, e.w, e.h, e.scrambled, e.tier, e.hp, e.maxHp, e.flashTimer, g.elapsed);
        }
      });

      // ── 7. Player (Theo) ──
      if (g.alive) {
        const psx = g.px + camOff;
        const visible = g.invincibleTimer <= 0 || Math.sin(g.invincibleTimer * 20) > 0;
        if (visible) {
          drawTheo(ctx, psx, g.py, g.facingRight, g.theoFrame, g.onGround, g.wallSliding,
            g.isDashing, g.shieldTimer > 0, g.legPhase, g.elapsed);
        }
      }

      // ── 8. Particles ──
      g.particles.forEach(p => {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        if (p.type === 'sparkle') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          const cx = p.x + camOff;
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2 + g.elapsed * 2;
            const r = p.r * (i % 2 === 0 ? 1 : 0.4);
            ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x + camOff, p.y, p.r * alpha, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });

      // ── 9. Speed lines ──
      if (g.speedTimer > 0) {
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = '#f5deb3';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 15; i++) {
          const ly = ((i * 53 + g.speedLineTimer * 500) % H);
          const lLen = W * (0.15 + Math.random() * 0.2);
          ctx.beginPath();
          ctx.moveTo(0, ly);
          ctx.lineTo(lLen, ly + randFloat(-3, 3));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Dash trail
      if (g.isDashing) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ffa500';
        const psx2 = g.px + camOff;
        for (let i = 1; i <= 4; i++) {
          const trailX = psx2 - g.dashDir * i * 12;
          ctx.beginPath();
          ctx.ellipse(trailX + PLAYER_W / 2, g.py + PLAYER_H / 2, PLAYER_W / 2 - i * 2, PLAYER_H / 2 - i * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Screen flash
      if (g.flashAlpha > 0) {
        ctx.globalAlpha = g.flashAlpha;
        ctx.fillStyle = g.flashColor;
        ctx.fillRect(-10, -10, W + 20, H + 20);
        ctx.globalAlpha = 1;
      }

      ctx.restore(); // shake

      // ── 10. HUD ──
      // Hearts
      for (let i = 0; i < MAX_HP; i++) {
        drawHeart(ctx, 20 + i * 32, 20, 12, i < hp);
      }

      // Distance
      ctx.fillStyle = '#a0a0c0';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.floor(g.cameraX / 10)}m`, 20, 60);

      // Coins – pill badge with icon + count
      const coinPillX = 12;
      const coinPillY = 68;
      const coinPillW = 56;
      const coinPillH = 28;
      const coinPillR = coinPillH / 2;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(coinPillX + coinPillR, coinPillY);
      ctx.lineTo(coinPillX + coinPillW - coinPillR, coinPillY);
      ctx.arc(coinPillX + coinPillW - coinPillR, coinPillY + coinPillR, coinPillR, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(coinPillX + coinPillR, coinPillY + coinPillH);
      ctx.arc(coinPillX + coinPillR, coinPillY + coinPillR, coinPillR, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(20,20,35,0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const coinIconX = coinPillX + 16;
      const coinIconY = coinPillY + coinPillH / 2;
      const pulse = 0.85 + 0.15 * Math.sin(g.elapsed * 4);
      ctx.beginPath();
      ctx.arc(coinIconX, coinIconY, 8 * pulse, 0, Math.PI * 2);
      const coinGrad = ctx.createRadialGradient(coinIconX - 2, coinIconY - 2, 0, coinIconX, coinIconY, 10);
      coinGrad.addColorStop(0, '#ffe066');
      coinGrad.addColorStop(0.6, '#ffd700');
      coinGrad.addColorStop(1, '#b8860b');
      ctx.fillStyle = coinGrad;
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#5a4000';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('T', coinIconX, coinIconY);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(coins), coinPillX + 30, coinIconY);
      ctx.restore();

      // Score
      ctx.fillStyle = '#f5deb3';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(score.toLocaleString(), W - 20, 36);
      ctx.fillStyle = '#808090';
      ctx.font = '10px sans-serif';
      ctx.fillText('SCORE', W - 20, 50);

      // Combo indicator
      if (combo > 1) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${combo}x COMBO`, W - 20, 68);
      }

      // Dash cooldown indicator
      if (g.dashCooldown > 0) {
        ctx.fillStyle = 'rgba(255,165,0,0.3)';
        ctx.fillRect(W / 2 - 30, 12, 60, 6);
        ctx.fillStyle = 'rgba(255,165,0,0.8)';
        const dashPct = 1 - g.dashCooldown / DASH_COOLDOWN;
        ctx.fillRect(W / 2 - 30, 12, 60 * dashPct, 6);
      }
    };

    animFrame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, [gamePhase, hp, score, takeDamage, combo, coins]);

  // ─── Drawing helpers ───
  function drawScrabbleTile(ctx, x, y, w, h, letter, type, crumbling, time) {
    // Crumble shake
    let ox = 0, oy = 0;
    if (crumbling) {
      ox = (Math.random() - 0.5) * 4;
      oy = (Math.random() - 0.5) * 4;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 2 + ox, y + 3 + oy, w, h);

    const protileImg = protileImages[letter];
    if (protileImg && protileImg.complete && protileImg.naturalWidth) {
      // Draw protile image (same tiles as elsewhere on site)
      ctx.save();
      if (type === 'crumble' && crumbling) ctx.globalAlpha = 0.6;
      if (type === 'bridge') {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = 'rgba(200,230,200,0.4)';
        ctx.fillRect(x + ox, y + oy, w, h);
      }
      ctx.drawImage(protileImg, x + ox, y + oy, w, h);
      ctx.restore();
    } else {
      // Fallback: wood-style gradient when protiles not loaded yet
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      if (type === 'bridge') {
        grad.addColorStop(0, '#c8e6c9');
        grad.addColorStop(1, '#a5d6a7');
      } else if (type === 'bounce') {
        grad.addColorStop(0, '#a5f0c8');
        grad.addColorStop(1, '#2ecc71');
      } else if (type === 'crumble') {
        const fade = crumbling ? 0.5 : 1;
        grad.addColorStop(0, `rgba(200,180,160,${fade})`);
        grad.addColorStop(1, `rgba(170,150,130,${fade})`);
      } else {
        grad.addColorStop(0, '#f5e6c8');
        grad.addColorStop(0.5, '#e8d4a0');
        grad.addColorStop(1, '#d4bc7c');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x + ox, y + oy, w, h);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + ox, y + oy, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(x + 2 + ox, y + 2 + oy, w - 4, h - 4);

    // Bounce pad arrow overlay
    if (type === 'bounce') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      const cx = x + w / 2 + ox;
      const cy = y + h / 2 + oy - 2;
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx - 6, cy + 2);
      ctx.lineTo(cx + 6, cy + 2);
      ctx.closePath();
      ctx.fill();
      return;
    }

    // Crumble cracks overlay
    if (type === 'crumble' && crumbling) {
      ctx.strokeStyle = 'rgba(80,60,40,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3 + ox, y + oy);
      ctx.lineTo(x + w * 0.5 + ox, y + h * 0.5 + oy);
      ctx.lineTo(x + w * 0.7 + ox, y + h + oy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.7 + ox, y + oy);
      ctx.lineTo(x + w * 0.4 + ox, y + h * 0.6 + oy);
      ctx.stroke();
    }

    // Letter and points only when no protile (fallback already drew gradient)
    if (!protileImg || !protileImg.complete) {
      ctx.fillStyle = '#2c1810';
      ctx.font = 'bold 18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x + w / 2 + ox, y + h / 2 - 2 + oy);
      const pts = letterScores[letter] || 0;
      ctx.fillStyle = '#5a4030';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(pts), x + w - 3 + ox, y + h - 2 + oy);
    }
  }

  function drawCoin(ctx, x, y, time) {
    const stretch = 0.6 + 0.4 * Math.abs(Math.cos(time * 3 + x * 0.1));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(stretch, 1);

    // Glow
    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 14);
    glow.addColorStop(0, 'rgba(255,215,0,0.3)');
    glow.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Coin body
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // T symbol
    ctx.fillStyle = '#b8860b';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', 0, 0);

    ctx.restore();
  }

  function drawLetterOrb(ctx, x, y, letter, time) {
    const isRare = RARE_LETTERS.has(letter);
    const isSemiRare = SEMI_RARE_LETTERS.has(letter);

    // Glow
    const glowColor = isRare ? 'rgba(180,100,255' : isSemiRare ? 'rgba(100,180,255' : 'rgba(255,215,0';
    const glow = ctx.createRadialGradient(x, y, 5, x, y, 28);
    glow.addColorStop(0, glowColor + ',0.5)');
    glow.addColorStop(1, glowColor + ',0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Orb
    const hue = isRare ? 280 : isSemiRare ? 210 : 45;
    ctx.fillStyle = `hsl(${hue}, 100%, ${55 + 10 * Math.sin(time * 4)}%)`;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = `hsla(${hue}, 100%, 90%, 0.4)`;
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 5, 0, Math.PI * 2);
    ctx.fill();

    // Letter
    ctx.fillStyle = isRare ? '#fff' : '#2c1810';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x, y);
  }

  function drawEnemy(ctx, x, y, w, h, scrambled, tier, hp, maxHp, flashTimer, time) {
    const tileW = w / scrambled.length;
    const isFlashing = flashTimer > 0;

    for (let i = 0; i < scrambled.length; i++) {
      const tx = x + i * tileW;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(tx + 1, y + 2, tileW - 1, h);

      const grad = ctx.createLinearGradient(tx, y, tx, y + h);
      if (tier === 'boss') {
        grad.addColorStop(0, isFlashing ? '#fff' : '#a855f7');
        grad.addColorStop(1, isFlashing ? '#ddd' : '#7c3aed');
      } else if (tier === 'hard') {
        grad.addColorStop(0, isFlashing ? '#fff' : '#dc2626');
        grad.addColorStop(1, isFlashing ? '#ddd' : '#991b1b');
      } else if (tier === 'medium') {
        grad.addColorStop(0, isFlashing ? '#fff' : '#ea580c');
        grad.addColorStop(1, isFlashing ? '#ddd' : '#c2410c');
      } else {
        grad.addColorStop(0, isFlashing ? '#fff' : '#e88');
        grad.addColorStop(1, isFlashing ? '#ddd' : '#c55');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(tx, y, tileW - 1, h);

      ctx.fillStyle = tier === 'boss' ? '#2d0060' : '#400';
      ctx.font = `bold ${tier === 'boss' ? 16 : 13}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(scrambled[i], tx + tileW / 2, y + h / 2);
    }

    // Eyes
    const eyeY2 = y - 10;
    const eyeX1 = x + w * 0.35;
    const eyeX2 = x + w * 0.65;
    const eyeR = tier === 'boss' ? 7 : 5;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(eyeX1, eyeY2, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX2, eyeY2, eyeR, 0, Math.PI * 2); ctx.fill();

    const pupilColor = tier === 'boss' ? '#7c3aed' : '#c00';
    ctx.fillStyle = pupilColor;
    const pupilR = tier === 'boss' ? 3.5 : 2.5;
    ctx.beginPath(); ctx.arc(eyeX1, eyeY2 + 1, pupilR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX2, eyeY2 + 1, pupilR, 0, Math.PI * 2); ctx.fill();

    // Brows
    ctx.strokeStyle = tier === 'boss' ? '#4c1d95' : '#800';
    ctx.lineWidth = tier === 'boss' ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(eyeX1 - 5, eyeY2 - 7); ctx.lineTo(eyeX1 + 4, eyeY2 - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(eyeX2 + 5, eyeY2 - 7); ctx.lineTo(eyeX2 - 4, eyeY2 - 3); ctx.stroke();

    // HP bar for multi-hit enemies
    if (maxHp > 1) {
      const barW = w * 0.7;
      const barH = 4;
      const barX = x + (w - barW) / 2;
      const barY = y - 20;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = tier === 'boss' ? '#a855f7' : '#e74c3c';
      ctx.fillRect(barX, barY, barW * (hp / maxHp), barH);
    }

    // Boss crown
    if (tier === 'boss') {
      const crownX = x + w / 2;
      const crownY = y - 22;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(crownX - 12, crownY + 8);
      ctx.lineTo(crownX - 12, crownY);
      ctx.lineTo(crownX - 6, crownY + 4);
      ctx.lineTo(crownX, crownY - 4);
      ctx.lineTo(crownX + 6, crownY + 4);
      ctx.lineTo(crownX + 12, crownY);
      ctx.lineTo(crownX + 12, crownY + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawTheo(ctx, x, y, facingRight, frame, onGround, wallSliding, isDashing, hasShield, legPhase, time) {
    ctx.save();

    // Shield aura
    if (hasShield) {
      const shieldGlow = ctx.createRadialGradient(
        x + PLAYER_W / 2, y + PLAYER_H / 2, 15,
        x + PLAYER_W / 2, y + PLAYER_H / 2, 45
      );
      shieldGlow.addColorStop(0, `rgba(241,196,15,${0.12 + 0.06 * Math.sin(time * 4)})`);
      shieldGlow.addColorStop(1, 'rgba(241,196,15,0)');
      ctx.fillStyle = shieldGlow;
      ctx.beginPath();
      ctx.arc(x + PLAYER_W / 2, y + PLAYER_H / 2, 45, 0, Math.PI * 2);
      ctx.fill();

      // Shield ring
      ctx.strokeStyle = `rgba(241,196,15,${0.3 + 0.15 * Math.sin(time * 6)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + PLAYER_W / 2, y + PLAYER_H / 2, 35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dash glow
    if (isDashing) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'rgba(255,165,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(x + PLAYER_W / 2, y + PLAYER_H / 2, PLAYER_W, PLAYER_H / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Try to draw Theo image
    const theoImg = theoImages[frame] || theoImages[0];
    if (theoImg) {
      ctx.save();
      if (!facingRight) {
        ctx.translate(x + PLAYER_W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(theoImg, 0, y - 6, PLAYER_W + 8, PLAYER_H + 12);
      } else {
        ctx.drawImage(theoImg, x - 4, y - 6, PLAYER_W + 8, PLAYER_H + 12);
      }
      ctx.restore();

      // Wall slide indicator
      if (wallSliding) {
        ctx.fillStyle = 'rgba(200,180,150,0.4)';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(x + PLAYER_W / 2, y + PLAYER_H + 5 + i * 6, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Fallback: draw a fox-like character procedurally
      drawTheoFallback(ctx, x, y, facingRight, onGround, legPhase, time);
    }

    ctx.restore();
  }

  function drawTheoFallback(ctx, x, y, facingRight, onGround, legPhase, time) {
    ctx.save();
    if (!facingRight) {
      ctx.translate(x + PLAYER_W, 0);
      ctx.scale(-1, 1);
      x = 0;
    }

    const bx = x + 4, by = y + 6, bw = PLAYER_W - 8, bh = PLAYER_H - 18;

    // Body (orange fox)
    const bodyGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    bodyGrad.addColorStop(0, '#FF8C22');
    bodyGrad.addColorStop(0.7, '#FF7700');
    bodyGrad.addColorStop(1, '#CC5500');
    ctx.fillStyle = bodyGrad;

    // Rounded body
    const r = 6;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + bw - r, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
    ctx.lineTo(bx + bw, by + bh - r);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
    ctx.lineTo(bx + r, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
    ctx.lineTo(bx, by + r);
    ctx.quadraticCurveTo(bx, by, bx + r, by);
    ctx.closePath();
    ctx.fill();

    // Belly (cream)
    ctx.fillStyle = '#FFFACD';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh * 0.55, bw * 0.35, bh * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#FF8C22';
    // Left ear
    ctx.beginPath();
    ctx.moveTo(bx + 3, by);
    ctx.lineTo(bx - 2, by - 14);
    ctx.lineTo(bx + 10, by - 2);
    ctx.closePath();
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(bx + bw - 3, by);
    ctx.lineTo(bx + bw + 2, by - 14);
    ctx.lineTo(bx + bw - 10, by - 2);
    ctx.closePath();
    ctx.fill();
    // Inner ears
    ctx.fillStyle = '#FFB366';
    ctx.beginPath();
    ctx.moveTo(bx + 5, by);
    ctx.lineTo(bx + 1, by - 9);
    ctx.lineTo(bx + 9, by - 1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + bw - 5, by);
    ctx.lineTo(bx + bw - 1, by - 9);
    ctx.lineTo(bx + bw - 9, by - 1);
    ctx.closePath();
    ctx.fill();

    // Eyes
    const ey = by + bh * 0.28;
    const elx = bx + bw * 0.3, erx = bx + bw * 0.7;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(elx, ey, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(erx, ey, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(elx + 1.5, ey, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(erx + 1.5, ey, 2.5, 0, Math.PI * 2); ctx.fill();
    // Eye highlight
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(elx + 0.5, ey - 1.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(erx + 0.5, ey - 1.5, 1, 0, Math.PI * 2); ctx.fill();

    // Nose
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by + bh * 0.4);
    ctx.lineTo(bx + bw / 2 - 3, by + bh * 0.36);
    ctx.lineTo(bx + bw / 2 + 3, by + bh * 0.36);
    ctx.closePath();
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bx + bw / 2, by + bh * 0.43, 4, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // "T" badge on chest
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', bx + bw / 2, by + bh * 0.65);

    // Tail
    ctx.strokeStyle = '#FF8C22';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const tailSwing = Math.sin(time * 3) * 8;
    ctx.beginPath();
    ctx.moveTo(bx, by + bh * 0.7);
    ctx.quadraticCurveTo(bx - 12 + tailSwing, by + bh * 0.4, bx - 8 + tailSwing, by + bh * 0.2);
    ctx.stroke();
    // White tail tip
    ctx.strokeStyle = '#FFFACD';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx - 10 + tailSwing, by + bh * 0.3);
    ctx.lineTo(bx - 8 + tailSwing, by + bh * 0.2);
    ctx.stroke();

    // Legs
    const legY2 = by + bh;
    const legSwing = onGround ? Math.sin(legPhase) * 7 : 4;
    ctx.strokeStyle = '#CC5500';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.3, legY2);
    ctx.lineTo(bx + bw * 0.3 - legSwing, legY2 + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.7, legY2);
    ctx.lineTo(bx + bw * 0.7 + legSwing, legY2 + 10);
    ctx.stroke();

    // Arms
    const armSwing = onGround ? Math.sin(legPhase + Math.PI) * 5 : -5;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by + bh * 0.35);
    ctx.lineTo(bx - 7 - armSwing, by + bh * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + bw, by + bh * 0.35);
    ctx.lineTo(bx + bw + 7 + armSwing, by + bh * 0.6);
    ctx.stroke();

    ctx.restore();
  }

  function drawMountains(ctx, W, H, offset, color, baseY, height) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    const segW = 200;
    for (let x = -segW; x <= W + segW; x += segW / 2) {
      const wx = x + (offset % segW);
      const peakH = baseY - Math.abs(Math.sin((wx + offset) * 0.003)) * height - height * 0.3;
      ctx.lineTo(x, peakH);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawCity(ctx, W, H, offset, baseY) {
    ctx.fillStyle = 'rgba(25,25,45,0.7)';
    const bldgW = 40;
    for (let x = -bldgW; x <= W + bldgW; x += bldgW + 10) {
      const wx = x + (offset % (bldgW + 10));
      const h = 30 + Math.abs(Math.sin(wx * 0.02)) * 80;
      ctx.fillRect(wx, baseY - h, bldgW - 5, h);
      ctx.fillStyle = 'rgba(255,200,100,0.15)';
      for (let wy = baseY - h + 8; wy < baseY - 5; wy += 12) {
        for (let wwx = wx + 5; wwx < wx + bldgW - 10; wwx += 10) {
          ctx.fillRect(wwx, wy, 4, 6);
        }
      }
      ctx.fillStyle = 'rgba(25,25,45,0.7)';
    }
  }

  function drawHeart(ctx, x, y, r, filled) {
    ctx.save();
    ctx.fillStyle = filled ? '#e74c3c' : 'rgba(100,100,100,0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.3);
    ctx.bezierCurveTo(x, y - r * 0.5, x - r * 1.2, y - r * 0.5, x - r * 1.2, y + r * 0.2);
    ctx.bezierCurveTo(x - r * 1.2, y + r * 0.8, x, y + r * 1.2, x, y + r * 1.5);
    ctx.bezierCurveTo(x, y + r * 1.2, x + r * 1.2, y + r * 0.8, x + r * 1.2, y + r * 0.2);
    ctx.bezierCurveTo(x + r * 1.2, y - r * 0.5, x, y - r * 0.5, x, y + r * 0.3);
    ctx.closePath();
    ctx.fill();
    if (filled) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ─── Touch handlers ───
  const handleTouchJump = () => { const g = gameRef.current; if (g) tryJump(g); };
  const handleTouchDash = () => { const g = gameRef.current; if (g) tryDash(g); };
  const removeTile = (index) => setRack(prev => prev.filter((_, i) => i !== index));

  // ─── Render ───
  return (
    <div className="sd-root">
      <Sidenav />
      <div className="sd-outer">
    <div className="scrabble-dash">
      <canvas ref={canvasRef} />

      {/* Intro */}
      {gamePhase === 'intro' && (
        <div className="sd-overlay">
          <div className="sd-title">ScrabbleDash</div>
          <div className="sd-subtitle">Help Theo dash through the word world!</div>

          <div className="sd-controls-info">
            <div className="sd-control-row">
              <span className="sd-key">A / D</span>
              <span>Move left / right</span>
            </div>
            <div className="sd-control-row">
              <span className="sd-key">Space</span>
              <span>Jump (double-jump!)</span>
            </div>
            <div className="sd-control-row">
              <span className="sd-key">Shift</span>
              <span>Dash (i-frames!)</span>
            </div>
            <div className="sd-control-row">
              <span className="sd-key">S / Down</span>
              <span>Fast fall</span>
            </div>
            <div className="sd-control-row">
              <span className="sd-key">Enter</span>
              <span>Submit word for power-ups</span>
            </div>
            <div className="sd-control-row">
              <span className="sd-key">Backspace</span>
              <span>Remove last letter</span>
            </div>
          </div>

          <div className="sd-controls-info" style={{ fontSize: '0.85rem', color: '#b0b0c0' }}>
            <div><b style={{ color: '#2ecc71' }}>4-letter word:</b> Speed boost</div>
            <div><b style={{ color: '#3498db' }}>5-6 letter word:</b> Magnet + heal</div>
            <div><b style={{ color: '#f1c40f' }}>7+ letter bingo:</b> Shield + full heal</div>
            <div><b style={{ color: '#e67e22' }}>Chain words:</b> Combo multiplier!</div>
            <div><b style={{ color: '#9b59b6' }}>Step words:</b> Land on tiles in order to spell a word for bonus points!</div>
          </div>

          <button className="sd-start-btn" onClick={startGame} disabled={!dictReady}>
            {dictReady ? 'START' : 'Loading Dictionary...'}
          </button>
          <div className="sd-hint">
            Collect letters, chain combos, stomp or dash through enemies!
          </div>
        </div>
      )}

      {/* Game Over */}
      {gamePhase === 'gameover' && (
        <div className="sd-overlay">
          <div className="sd-gameover-title">Game Over</div>
          <div className="sd-gameover-subtitle">
            {score > highScore && highScore > 0 ? 'New High Score!' : `High Score: ${Math.max(score, highScore).toLocaleString()}`}
          </div>
          <div className="sd-stats">
            <div className="sd-stat">
              <div className="sd-stat-label">Score</div>
              <div className={`sd-stat-value${score >= highScore && highScore > 0 ? ' new-high' : ''}`}>{score.toLocaleString()}</div>
            </div>
            <div className="sd-stat">
              <div className="sd-stat-label">Distance</div>
              <div className="sd-stat-value">{distance}m</div>
            </div>
            <div className="sd-stat">
              <div className="sd-stat-label">Words</div>
              <div className="sd-stat-value">{wordsSubmitted.length}</div>
            </div>
            <div className="sd-stat">
              <div className="sd-stat-label">Enemies</div>
              <div className="sd-stat-value">{enemiesDefeated}</div>
            </div>
            <div className="sd-stat">
              <div className="sd-stat-label">Coins</div>
              <div className="sd-stat-value">{coins}</div>
            </div>
            <div className="sd-stat">
              <div className="sd-stat-label">Best Combo</div>
              <div className="sd-stat-value">{Math.max(combo, ...wordsSubmitted.map(() => 1), 0)}x</div>
            </div>
          </div>
          <button className="sd-start-btn" onClick={startGame}>PLAY AGAIN</button>
        </div>
      )}

      {/* Word Flash */}
      {wordFlash && (
        <div className="sd-word-flash">
          {wordFlash.stepWord && (
            <div className="sd-word-flash-step-label">STEP!</div>
          )}
          <div className={`sd-word-flash-text ${wordFlash.success ? 'success' : 'fail'}`}>
            {wordFlash.text}
          </div>
          {wordFlash.success && (
            <>
              <div className="sd-word-flash-score">+{wordFlash.score}</div>
              {wordFlash.combo > 1 && !wordFlash.stepWord && (
                <div className="sd-word-flash-score" style={{ color: '#f1c40f', fontSize: '1.1rem' }}>
                  {wordFlash.combo}x COMBO
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Rack */}
      {gamePhase === 'playing' && (
        <div className="sd-rack-container">
          <div className="sd-rack">
            {rack.map((tile, i) => (
              <div key={tile.id} className={`sd-rack-tile${RARE_LETTERS.has(tile.letter) ? ' rare' : SEMI_RARE_LETTERS.has(tile.letter) ? ' semi-rare' : ''}`} onClick={() => removeTile(i)}>
                {tile.letter}
                <span className="sd-tile-pts">{letterScores[tile.letter] || 0}</span>
              </div>
            ))}
            {Array.from({ length: MAX_RACK - rack.length }).map((_, i) => (
              <div key={`empty-${i}`} className="sd-rack-empty" />
            ))}
          </div>
          <button className="sd-submit-btn" onClick={submitWord} disabled={rack.length < 2}>Submit</button>
          <button className="sd-clear-btn" onClick={() => setRack([])} disabled={rack.length === 0}>Clear</button>
        </div>
      )}

      {/* Powerups */}
      {gamePhase === 'playing' && (
        <div className="sd-powerups">
          {powerups.speed > 0 && (
            <div className="sd-powerup speed">
              SPEED
              <div className="sd-powerup-bar"><div className="sd-powerup-fill" style={{ width: `${(powerups.speed / 5) * 100}%` }} /></div>
            </div>
          )}
          {powerups.magnet > 0 && (
            <div className="sd-powerup magnet">
              MAGNET
              <div className="sd-powerup-bar"><div className="sd-powerup-fill" style={{ width: `${(powerups.magnet / 8) * 100}%` }} /></div>
            </div>
          )}
          {powerups.shield > 0 && (
            <div className="sd-powerup shield">
              SHIELD
              <div className="sd-powerup-bar"><div className="sd-powerup-fill" style={{ width: `${(powerups.shield / 10) * 100}%` }} /></div>
            </div>
          )}
        </div>
      )}

      {/* Touch controls */}
      {gamePhase === 'playing' && (
        <div className="sd-touch-controls">
          <div className="sd-touch-left">
            <button className="sd-touch-btn"
              onTouchStart={() => { if (gameRef.current) gameRef.current.touchLeft = true; }}
              onTouchEnd={() => { if (gameRef.current) gameRef.current.touchLeft = false; }}>&#9664;</button>
            <button className="sd-touch-btn"
              onTouchStart={() => { if (gameRef.current) gameRef.current.touchRight = true; }}
              onTouchEnd={() => { if (gameRef.current) gameRef.current.touchRight = false; }}>&#9654;</button>
          </div>
          <div className="sd-touch-right">
            <button className="sd-touch-btn" onTouchStart={handleTouchDash} style={{ fontSize: '0.9rem' }}>DASH</button>
            <button className="sd-touch-btn jump-btn" onTouchStart={handleTouchJump}>JUMP</button>
          </div>
        </div>
      )}
    </div>
      </div>
    </div>
  );
}
