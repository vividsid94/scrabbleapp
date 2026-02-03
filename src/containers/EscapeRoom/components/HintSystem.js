import React, { useState, useEffect } from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';

export default function HintSystem({ hints = [] }) {
  const hintsRemaining = useEscapeRoomStore(s => s.hintsRemaining);
  const consumeHint = useEscapeRoomStore(s => s.useHint);
  const [revealedCount, setRevealedCount] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleRevealHint = () => {
    if (revealedCount >= hints.length) return;
    if (consumeHint()) {
      const nextHint = hints[revealedCount];
      setIsTyping(true);
      setDisplayText('');
      let i = 0;
      const interval = setInterval(() => {
        if (i < nextHint.length) {
          setDisplayText(nextHint.substring(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          setRevealedCount(prev => prev + 1);
        }
      }, 40);
    }
  };

  const canReveal = revealedCount < hints.length && hintsRemaining > 0 && !isTyping;

  return (
    <div style={{ marginTop: 16, textAlign: 'center' }}>
      {revealedCount > 0 && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 8,
          color: '#c9a84c',
          fontFamily: "'Georgia', serif",
          fontSize: 14,
          fontStyle: 'italic',
          marginBottom: 8,
          minHeight: 24,
        }}>
          {displayText}
          {isTyping && <span style={{ animation: 'blink 0.5s infinite' }}>|</span>}
        </div>
      )}
      {canReveal && (
        <button
          onClick={handleRevealHint}
          style={{
            background: 'rgba(201,168,76,0.2)',
            border: '1px solid rgba(201,168,76,0.4)',
            borderRadius: 8,
            color: '#c9a84c',
            padding: '6px 16px',
            cursor: 'pointer',
            fontFamily: "'Georgia', serif",
            fontSize: 13,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(201,168,76,0.3)'}
          onMouseLeave={e => e.target.style.background = 'rgba(201,168,76,0.2)'}
        >
          Reveal Hint ({hintsRemaining} remaining)
        </button>
      )}
    </div>
  );
}
