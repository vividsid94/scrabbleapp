import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';

export default function VictoryScreen() {
  const { score, totalTimeElapsed, resetGame } = useEscapeRoomStore();
  const minutes = Math.floor(totalTimeElapsed / 60);
  const seconds = totalTimeElapsed % 60;

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
      animation: 'victory-glow 2s ease',
    }}>
      <div style={{
        fontSize: 64,
        marginBottom: 16,
      }}>
        &#x1F3C6;
      </div>

      <div style={{
        fontSize: 14,
        color: '#c9a84c',
        letterSpacing: 6,
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        You have become
      </div>

      <h1 style={{
        fontSize: 48,
        color: '#e8d5b7',
        textShadow: '0 0 40px rgba(201,168,76,0.6)',
        marginBottom: 24,
        letterSpacing: 4,
      }}>
        LEXICON MASTER
      </h1>

      <div style={{
        width: 120,
        height: 2,
        background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
        margin: '0 0 32px',
      }} />

      <div style={{
        display: 'flex',
        gap: 40,
        marginBottom: 40,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <div>
          <div style={{ fontSize: 36, color: '#c9a84c', fontWeight: 'bold' }}>{score}</div>
          <div style={{ fontSize: 13, color: '#8a7a6a', marginTop: 4 }}>Total Score</div>
        </div>
        <div>
          <div style={{ fontSize: 36, color: '#c9a84c', fontWeight: 'bold' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div style={{ fontSize: 13, color: '#8a7a6a', marginTop: 4 }}>Total Time</div>
        </div>
        <div>
          <div style={{ fontSize: 36, color: '#c9a84c', fontWeight: 'bold' }}>5/5</div>
          <div style={{ fontSize: 13, color: '#8a7a6a', marginTop: 4 }}>Chambers Cleared</div>
        </div>
      </div>

      <p style={{
        fontSize: 16,
        color: '#b8a88a',
        maxWidth: 480,
        lineHeight: 1.6,
        marginBottom: 36,
      }}>
        The ancient temple acknowledges your mastery of the lexicon.
        Your knowledge of tiles, words, and strategy is unmatched.
      </p>

      <button
        onClick={resetGame}
        style={{
          background: 'linear-gradient(135deg, #c9a84c, #a08030)',
          color: '#1a0a2e',
          border: 'none',
          borderRadius: 12,
          padding: '14px 40px',
          fontSize: 18,
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
        Play Again
      </button>
    </div>
  );
}
