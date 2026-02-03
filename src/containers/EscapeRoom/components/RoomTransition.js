import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';

export default function RoomTransition() {
  const transitionText = useEscapeRoomStore(s => s.transitionText);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#0a0514',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fade-in-out 2s ease',
    }}>
      <div style={{
        fontFamily: "'Georgia', serif",
        fontSize: 16,
        color: '#c9a84c',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 16,
        opacity: 0.7,
      }}>
        Entering
      </div>
      <div style={{
        fontFamily: "'Georgia', serif",
        fontSize: 42,
        color: '#e8d5b7',
        textShadow: '0 0 30px rgba(201,168,76,0.5)',
        letterSpacing: 3,
        animation: 'glow-pulse 1.5s ease infinite',
      }}>
        {transitionText}
      </div>
      <div style={{
        width: 100,
        height: 2,
        background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
        marginTop: 24,
      }} />
    </div>
  );
}
