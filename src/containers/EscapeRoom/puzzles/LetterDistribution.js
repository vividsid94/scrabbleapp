import React, { useState } from 'react';
import { tileEconomistRounds } from '../data/puzzleBank';
import PuzzleFrame from '../components/PuzzleFrame';
import HintSystem from '../components/HintSystem';

export default function LetterDistribution({ onSolve, theme }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const current = tileEconomistRounds[round];

  // Safety check: if current is undefined, don't render
  if (!current) {
    return null;
  }

  const handleChoice = (choice) => {
    if (solved) return;
    const isCorrect = choice === current.answer;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    if (round < tileEconomistRounds.length - 1) {
      setFeedback(isCorrect ? 'Correct!' : `Wrong! Answer: ${current.answer}`);
      setCorrectCount(newCorrect);
      setTimeout(() => {
        setRound(r => r + 1);
        setFeedback('');
      }, 1400);
    } else {
      if (newCorrect >= 4) { // Need 4/5 instead of 3/5
        setSolved(true);
        setFeedback(isCorrect
          ? `Mastery! ${newCorrect}/${tileEconomistRounds.length} correct.`
          : `Answer: ${current.answer}. ${newCorrect}/${tileEconomistRounds.length} — passing.`);
        setTimeout(() => onSolve(100 + newCorrect * 20), 800);
      } else {
        setFeedback(`Only ${newCorrect}/${tileEconomistRounds.length} correct. Restarting...`);
        setTimeout(() => {
          setRound(0);
          setCorrectCount(0);
          setFeedback('');
        }, 1500);
      }
    }
  };

  return (
    <PuzzleFrame title="Tile Economist" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 6, fontSize: 14 }}>
        Deep knowledge of tile distribution and value.
      </p>
      <p style={{ color: '#8a7a6a', textAlign: 'center', marginBottom: 24, fontSize: 13 }}>
        Round {round + 1}/{tileEconomistRounds.length} &middot; {correctCount} correct &middot; Need 4
      </p>

      {/* Question */}
      <div style={{
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 17,
        color: '#e8d5b7',
        fontFamily: "'Georgia', serif",
        lineHeight: 1.6,
        padding: '0 12px',
      }}>
        {current.question}
      </div>

      {/* Choices */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 420,
        margin: '0 auto',
      }}>
        {current.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => handleChoice(c)}
            disabled={solved}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(201,168,76,0.3)',
              background: 'rgba(201,168,76,0.08)',
              color: '#e8d5b7',
              fontSize: 15,
              fontFamily: "'Georgia', serif",
              cursor: solved ? 'default' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!solved) e.target.style.background = 'rgba(201,168,76,0.2)'; }}
            onMouseLeave={e => { if (!solved) e.target.style.background = 'rgba(201,168,76,0.08)'; }}
          >
            {c}
          </button>
        ))}
      </div>

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 14,
          color: feedback.includes('Correct') || feedback.includes('Mastery') || feedback.includes('passing') ? '#52b788' : '#f87171',
          fontFamily: "'Georgia', serif", fontSize: 15,
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        'There are 100 tiles total. E has the most (12). A and I each have 9.',
        'The total bag value is the sum of (count × value) for every letter.',
      ]} />
    </PuzzleFrame>
  );
}
