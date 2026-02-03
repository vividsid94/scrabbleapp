import React, { useEffect, useRef } from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';

export default function EscapeRoomHUD() {
  const { score, roomTimeRemaining, hintsRemaining, currentRoomIndex, rooms, totalTimeElapsed } = useEscapeRoomStore();
  const tickTimer = useEscapeRoomStore(s => s.tickTimer);
  const timerRef = useRef(null);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    timerRef.current = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(timerRef.current);
  }, [tickTimer]);

  const minutes = Math.floor(roomTimeRemaining / 60);
  const seconds = roomTimeRemaining % 60;
  const urgent = roomTimeRemaining < 60;
  const critical = roomTimeRemaining < 30;

  const room = rooms[currentRoomIndex];
  const solvedPuzzles = rooms.reduce((sum, r) => sum + r.puzzles.filter(p => p.status === 'solved').length, 0);
  const totalPuzzles = rooms.reduce((sum, r) => sum + r.puzzles.length, 0);
  const progress = (solvedPuzzles / totalPuzzles) * 100;

  // Animate score changes
  const scoreChanged = prevScoreRef.current !== score;
  useEffect(() => { prevScoreRef.current = score; }, [score]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      background: 'rgba(10,5,20,0.85)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(201,168,76,0.3)',
      fontFamily: "'Georgia', serif",
      color: '#e8d5b7',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      {/* Room name */}
      <div style={{ fontSize: 14, opacity: 0.8 }}>
        <span style={{ color: '#c9a84c' }}>Room {currentRoomIndex + 1}:</span>{' '}
        {room?.name}
      </div>

      {/* Timer */}
      <div style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: critical ? '#ff4444' : urgent ? '#ff8800' : '#c9a84c',
        textShadow: critical ? '0 0 10px rgba(255,0,0,0.5)' : 'none',
        animation: critical ? 'pulse-red 1s infinite' : 'none',
        minWidth: 80,
        textAlign: 'center',
      }}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>

      {/* Score */}
      <div style={{ fontSize: 16 }}>
        <span style={{ color: '#c9a84c' }}>Score: </span>
        <span style={{
          transition: 'transform 0.3s',
          display: 'inline-block',
          transform: scoreChanged ? 'scale(1.3)' : 'scale(1)',
        }}>
          {score}
        </span>
      </div>

      {/* Hints */}
      <div style={{ fontSize: 14 }}>
        <span style={{ color: '#c9a84c' }}>Hints: </span>
        {'💡'.repeat(hintsRemaining)}{'⚫'.repeat(5 - hintsRemaining)}
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #c9a84c, #e8d5b7)',
          borderRadius: 2,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}
