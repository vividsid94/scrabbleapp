import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';

export default function IntroScreen() {
  const startGame = useEscapeRoomStore(s => s.startGame);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: 32,
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        fontSize: 14,
        color: '#c9a84c',
        letterSpacing: 6,
        textTransform: 'uppercase',
        marginBottom: 16,
        opacity: 0.8,
      }}>
        Welcome to
      </div>

      <h1 style={{
        fontSize: 52,
        color: '#e8d5b7',
        textShadow: '0 0 40px rgba(201,168,76,0.4)',
        marginBottom: 8,
        letterSpacing: 3,
        lineHeight: 1.2,
      }}>
        The Lexicon Sanctum
      </h1>

      <div style={{
        width: 120,
        height: 2,
        background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
        margin: '16px 0 24px',
      }} />

      <p style={{
        fontSize: 17,
        color: '#b8a88a',
        maxWidth: 520,
        lineHeight: 1.7,
        marginBottom: 32,
      }}>
        An ancient temple of word mastery stands before you.
        Five chambers await, each testing a different aspect of Scrabble knowledge.
        Solve every puzzle to prove yourself worthy and become the <span style={{ color: '#c9a84c' }}>Lexicon Master</span>.
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 36,
        fontSize: 14,
        color: '#8a7a6a',
      }}>
        <div>5 Chambers &middot; 9 Puzzles &middot; 5 Minutes per Room</div>
        <div>5 Hints Available &middot; Time Bonus for Speed</div>
      </div>

      <button
        onClick={startGame}
        style={{
          background: 'linear-gradient(135deg, #c9a84c, #a08030)',
          color: '#1a0a2e',
          border: 'none',
          borderRadius: 12,
          padding: '16px 48px',
          fontSize: 20,
          fontFamily: "'Georgia', serif",
          fontWeight: 'bold',
          letterSpacing: 2,
          cursor: 'pointer',
          textTransform: 'uppercase',
          boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 30px rgba(201,168,76,0.6)';
        }}
        onMouseLeave={e => {
          e.target.style.transform = 'none';
          e.target.style.boxShadow = '0 4px 20px rgba(201,168,76,0.4)';
        }}
      >
        Enter the Sanctum
      </button>
    </div>
  );
}
