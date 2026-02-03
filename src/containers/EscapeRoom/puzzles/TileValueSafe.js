import React, { useState } from 'react';
import { rackAppraisalRounds } from '../data/puzzleBank';
import PuzzleFrame from '../components/PuzzleFrame';
import ScrabbleTile from '../components/ScrabbleTile';
import HintSystem from '../components/HintSystem';

export default function TileValueSafe({ onSolve, theme }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const current = rackAppraisalRounds[round];

  // Safety check: if current is undefined, don't render
  if (!current) {
    return null;
  }

  const handleChoice = (choice) => {
    if (solved) return;
    const isCorrect = choice === current.answer;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    if (round < rackAppraisalRounds.length - 1) {
      setFeedback(isCorrect ? 'Correct!' : `Wrong! The answer was ${current.answer}.`);
      setCorrectCount(newCorrect);
      setTimeout(() => {
        setRound(r => r + 1);
        setFeedback('');
      }, 1200);
    } else {
      if (newCorrect + (isCorrect ? 0 : 0) >= 4) { // Need 4/5 instead of 3/5
        setSolved(true);
        setFeedback(isCorrect
          ? `Appraisal complete! ${newCorrect}/${rackAppraisalRounds.length} correct.`
          : `Answer was ${current.answer}. ${newCorrect}/${rackAppraisalRounds.length} — passing.`);
        setTimeout(() => onSolve(100 + newCorrect * 20), 800);
      } else {
        setFeedback(`Only ${newCorrect}/${rackAppraisalRounds.length} correct. Restarting...`);
        setTimeout(() => {
          setRound(0);
          setCorrectCount(0);
          setFeedback('');
        }, 1500);
      }
    }
  };

  return (
    <PuzzleFrame title="Rack Appraisal" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 6, fontSize: 14 }}>
        Study the rack, then answer the question.
      </p>
      <p style={{ color: '#8a7a6a', textAlign: 'center', marginBottom: 20, fontSize: 13 }}>
        Round {round + 1}/{rackAppraisalRounds.length} &middot; {correctCount} correct &middot; Need 4
      </p>

      {/* Rack display */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        {current.rack.map((letter, i) => (
          <ScrabbleTile key={i} letter={letter} size="medium" />
        ))}
      </div>

      {/* Question */}
      <div style={{
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 17,
        color: '#e8d5b7',
        fontFamily: "'Georgia', serif",
        lineHeight: 1.5,
        padding: '0 8px',
      }}>
        {current.question}
      </div>

      {/* Choices */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        {current.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => handleChoice(c)}
            disabled={solved}
            style={{
              minWidth: current.isLetterAnswer ? 56 : 80,
              padding: current.isLetterAnswer ? '12px 18px' : '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(201,168,76,0.4)',
              background: 'rgba(201,168,76,0.1)',
              color: '#e8d5b7',
              fontSize: current.isLetterAnswer ? 22 : 16,
              fontFamily: "'Georgia', serif",
              fontWeight: 'bold',
              cursor: solved ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!solved) e.target.style.background = 'rgba(201,168,76,0.25)'; }}
            onMouseLeave={e => { if (!solved) e.target.style.background = 'rgba(201,168,76,0.1)'; }}
          >
            {c}
          </button>
        ))}
      </div>

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 14,
          color: feedback.includes('Correct') || feedback.includes('complete') || feedback.includes('passing') ? '#52b788' : '#f87171',
          fontFamily: "'Georgia', serif", fontSize: 15,
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        'J and X are both 8 points. Q and Z are both 10.',
        'All 7-letter bingos earn +50 bonus on top of the word score.',
      ]} />
    </PuzzleFrame>
  );
}
