import React, { useState } from 'react';
import { boardMapRounds } from '../data/puzzleBank';
import { standardBoard } from '../data/scrabbleData';
import PuzzleFrame from '../components/PuzzleFrame';
import HintSystem from '../components/HintSystem';

export default function BoardMapChallenge({ onSolve, theme }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);

  const current = boardMapRounds[round];
  const options = ['DL', 'TL', 'DW', 'TW'];

  // Safety check: if current is undefined, don't render
  if (!current) {
    return null;
  }

  const handleChoice = (choice) => {
    if (solved) return;
    const correct = choice === current.answer;

    if (correct) {
      if (round < boardMapRounds.length - 1) {
        setFeedback('Correct!');
        setTimeout(() => {
          setRound(r => r + 1);
          setFeedback('');
        }, 800);
      } else {
        setSolved(true);
        setFeedback('Board mastered!');
        setTimeout(() => onSolve(140), 600);
      }
    } else {
      setFeedback(`Wrong! That square is ${current.answer}.`);
      setTimeout(() => setFeedback(''), 1200);
    }
  };

  const cellSize = 22;

  return (
    <PuzzleFrame title="Board Map Challenge" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 6, fontSize: 14 }}>
        What type of premium square is at the highlighted position?
      </p>
      <p style={{ color: '#9b2335', textAlign: 'center', marginBottom: 8, fontSize: 13, fontWeight: 'bold' }}>
        No labels shown &mdash; identify from memory!
      </p>
      <p style={{ color: '#8a7a6a', textAlign: 'center', marginBottom: 16, fontSize: 13 }}>
        Round {round + 1}/{boardMapRounds.length}
      </p>

      {/* Monochrome mini board — premium squares shown but NOT labeled */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 20, overflowX: 'auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(15, ${cellSize}px)`,
          gap: 1,
          background: 'rgba(0,0,0,0.5)',
          padding: 2,
          borderRadius: 4,
        }}>
          {standardBoard.map((row, r) =>
            row.map((cell, c) => {
              const isHighlighted = r === current.row && c === current.col;
              const isPremium = cell !== 0;
              const isCenter = r === 7 && c === 7;
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    // Monochrome: all premium squares same muted color, no type distinction
                    background: isHighlighted
                      ? 'rgba(255,255,255,0.6)'
                      : isPremium
                        ? 'rgba(100,130,160,0.35)'
                        : 'rgba(60,50,40,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: "'Georgia', serif",
                    position: 'relative',
                    border: isHighlighted ? '2px solid #fff' : 'none',
                    boxShadow: isHighlighted ? '0 0 14px rgba(255,255,255,0.9)' : 'none',
                    animation: isHighlighted ? 'glow-pulse 1.5s infinite' : 'none',
                    borderRadius: 1,
                  }}
                >
                  {isCenter && !isHighlighted && <span style={{ fontSize: 8 }}>&#9733;</span>}
                  {isHighlighted && <span style={{ fontSize: 14, color: '#1a0a2e', fontWeight: 'bold' }}>?</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Position hint */}
      <p style={{ color: '#8a7a6a', textAlign: 'center', marginBottom: 16, fontSize: 12 }}>
        Position: Row {current.row + 1}, Column {current.col + 1}
      </p>

      {/* Answer options */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleChoice(opt)}
            disabled={solved}
            style={{
              padding: '12px 22px',
              borderRadius: 8,
              border: '1px solid rgba(59,130,246,0.4)',
              background: 'rgba(59,130,246,0.15)',
              color: '#93c5fd',
              fontSize: 16,
              fontFamily: "'Georgia', serif",
              fontWeight: 'bold',
              cursor: solved ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!solved) e.target.style.background = 'rgba(59,130,246,0.3)'; }}
            onMouseLeave={e => { if (!solved) e.target.style.background = 'rgba(59,130,246,0.15)'; }}
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 12,
          color: feedback.includes('Correct') || feedback.includes('mastered') ? '#52b788' : '#f87171',
          fontFamily: "'Georgia', serif", fontSize: 15,
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        'TWS: the 4 corners and the 4 edge midpoints (8 total). DWS: diagonal lines from the center.',
        'TLS squares sit between DWS squares. DLS squares are scattered around the inner board.',
      ]} />
    </PuzzleFrame>
  );
}
