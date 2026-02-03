import React, { useState } from 'react';
import { strategyChoiceRounds } from '../data/puzzleBank';
import PuzzleFrame from '../components/PuzzleFrame';
import ScrabbleTile from '../components/ScrabbleTile';
import HintSystem from '../components/HintSystem';

export default function StrategyChoice({ onSolve, theme }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);
  const [selected, setSelected] = useState(null);

  const current = strategyChoiceRounds[round];

  // Safety check: if current is undefined, don't render
  if (!current) {
    return null;
  }

  const handleChoice = (option, index) => {
    if (solved || selected !== null) return;
    setSelected(index);

    if (option.correct) {
      setFeedback('Correct!');
    } else {
      const correctOpt = current.options.find(o => o.correct);
      setFeedback(`Not optimal. Best: ${correctOpt.move}`);
    }

    setTimeout(() => {
      // Show explanation briefly
      setFeedback(current.explanation);

      setTimeout(() => {
        if (round < strategyChoiceRounds.length - 1) {
          setRound(r => r + 1);
          setFeedback('');
          setSelected(null);
        } else {
          setSolved(true);
          setFeedback('Strategic mastery achieved!');
          setTimeout(() => onSolve(150), 600);
        }
      }, 2500);
    }, 1200);
  };

  return (
    <PuzzleFrame title="Strategy Choice" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 16, fontSize: 14 }}>
        Pick the best strategic move. Scenario {round + 1}/{strategyChoiceRounds.length}
      </p>

      {/* Scenario */}
      <div style={{
        background: 'rgba(155,35,53,0.1)',
        border: '1px solid rgba(155,35,53,0.3)',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        color: '#e8d5b7',
        fontFamily: "'Georgia', serif",
        fontSize: 15,
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        {current.scenario}
      </div>

      {/* Rack */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        {current.rack.map((l, i) => (
          <ScrabbleTile key={i} letter={l} size="small" />
        ))}
      </div>

      {/* 4 Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {current.options.map((opt, i) => {
          const isSelected = selected === i;
          const showCorrect = selected !== null && opt.correct;
          const showWrong = isSelected && !opt.correct;
          return (
            <button
              key={i}
              onClick={() => handleChoice(opt, i)}
              disabled={selected !== null}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: showCorrect
                  ? '2px solid #52b788'
                  : showWrong
                    ? '2px solid #f87171'
                    : '1px solid rgba(155,35,53,0.3)',
                background: showCorrect
                  ? 'rgba(45,106,79,0.2)'
                  : showWrong
                    ? 'rgba(155,35,53,0.2)'
                    : 'rgba(155,35,53,0.08)',
                color: '#e8d5b7',
                fontSize: 14,
                fontFamily: "'Georgia', serif",
                cursor: selected !== null ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (selected === null) e.target.style.background = 'rgba(155,35,53,0.2)'; }}
              onMouseLeave={e => { if (selected === null) e.target.style.background = 'rgba(155,35,53,0.08)'; }}
            >
              {opt.move}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 14,
          color: feedback.includes('Correct') || feedback.includes('mastery') ? '#52b788'
            : feedback.includes('Not optimal') ? '#f87171'
            : '#c9a84c',
          fontFamily: "'Georgia', serif", fontSize: 14,
          fontStyle: feedback.includes('Correct') || feedback.includes('Not optimal') || feedback.includes('mastery') ? 'normal' : 'italic',
          lineHeight: 1.5,
          padding: '0 8px',
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        'Consider both the points scored AND what you leave on your rack.',
        'In the endgame with few tiles left, blocking is often more valuable than scoring.',
      ]} />
    </PuzzleFrame>
  );
}
