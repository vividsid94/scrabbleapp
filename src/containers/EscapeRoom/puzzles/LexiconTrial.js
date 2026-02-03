import React, { useState, useEffect } from 'react';
import { lexiconTrialChallenges } from '../data/puzzleBank';
import PuzzleFrame from '../components/PuzzleFrame';
import ScrabbleTile from '../components/ScrabbleTile';
import HintSystem from '../components/HintSystem';

export default function LexiconTrial({ onSolve, theme }) {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);
  const [chargesLit, setChargesLit] = useState(0);

  // Anagram state
  const [anagramSelected, setAnagramSelected] = useState([]);
  const [anagramAvailable, setAnagramAvailable] = useState([]);

  const challenge = lexiconTrialChallenges[step];

  useEffect(() => {
    if (challenge?.type === 'anagram') {
      setAnagramAvailable(challenge.scrambled.split('').map((l, i) => ({ letter: l, id: i })));
      setAnagramSelected([]);
    }
  }, [step, challenge]);

  // Safety check: if challenge is undefined, don't render
  if (!challenge) {
    return null;
  }

  const handleAnswer = (answer) => {
    if (solved) return;
    let correct = false;

    if (challenge.type === 'word-judgment') {
      correct = (answer === 'Valid') === challenge.answer;
    } else {
      correct = answer === challenge.answer;
    }

    if (correct) {
      const newCharges = chargesLit + 1;
      setChargesLit(newCharges);
      setFeedback('Charge activated!');

      setTimeout(() => {
        if (step < lexiconTrialChallenges.length - 1) {
          setStep(s => s + 1);
          setFeedback('');
        } else {
          setSolved(true);
          setFeedback('The Lexicon Sanctum is complete!');
          setTimeout(() => onSolve(250), 800);
        }
      }, 800);
    } else {
      setFeedback('Wrong! Try again.');
      setTimeout(() => setFeedback(''), 1000);
    }
  };

  const handleAnagramSubmit = () => {
    const word = anagramSelected.map(t => t.letter).join('');
    handleAnswer(word === challenge.answer ? challenge.answer : '');
  };

  // Pedestal charges
  const renderPedestal = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
      {lexiconTrialChallenges.map((_, i) => (
        <div key={i} style={{
          width: 20, height: 20, borderRadius: '50%',
          background: i < chargesLit
            ? 'linear-gradient(135deg, #c9a84c, #e8d5b7)'
            : i === step
              ? 'rgba(139,92,246,0.5)'
              : 'rgba(255,255,255,0.1)',
          boxShadow: i < chargesLit ? '0 0 12px rgba(201,168,76,0.6)' : 'none',
          border: i === step ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.15)',
          transition: 'all 0.5s ease',
        }} />
      ))}
    </div>
  );

  const renderChallenge = () => {
    if (!challenge) return null;

    if (challenge.type === 'anagram') {
      return (
        <div>
          <p style={{ color: '#c9a84c', textAlign: 'center', marginBottom: 8, fontStyle: 'italic' }}>
            Clue: {challenge.clue}
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12,
            minHeight: 50, padding: '6px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            border: '1px dashed rgba(139,92,246,0.3)',
          }}>
            {anagramSelected.map(tile => (
              <ScrabbleTile
                key={tile.id}
                letter={tile.letter}
                size="small"
                selected
                onClick={() => {
                  setAnagramAvailable(prev => [...prev, tile].sort((a, b) => a.id - b.id));
                  setAnagramSelected(prev => prev.filter(t => t.id !== tile.id));
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {anagramAvailable.map(tile => (
              <ScrabbleTile
                key={tile.id}
                letter={tile.letter}
                size="small"
                onClick={() => {
                  setAnagramSelected(prev => [...prev, tile]);
                  setAnagramAvailable(prev => prev.filter(t => t.id !== tile.id));
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleAnagramSubmit}
              disabled={anagramSelected.length !== challenge.scrambled.length}
              style={{
                background: anagramSelected.length === challenge.scrambled.length
                  ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255,255,255,0.1)',
                color: anagramSelected.length === challenge.scrambled.length ? '#fff' : '#666',
                border: 'none', borderRadius: 8, padding: '8px 20px',
                fontSize: 14, fontFamily: "'Georgia', serif", fontWeight: 'bold',
                cursor: anagramSelected.length === challenge.scrambled.length ? 'pointer' : 'default',
              }}
            >
              Submit
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p style={{ color: '#e8d5b7', textAlign: 'center', marginBottom: 20, fontSize: 17, lineHeight: 1.5 }}>
          {challenge.question}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {challenge.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(c)}
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                border: '1px solid rgba(139,92,246,0.4)',
                background: 'rgba(139,92,246,0.12)',
                color: '#c4b5fd',
                fontSize: 16,
                fontFamily: "'Georgia', serif",
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(139,92,246,0.25)'}
              onMouseLeave={e => e.target.style.background = 'rgba(139,92,246,0.12)'}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const typeLabels = {
    'rack-value': 'Rack Appraisal',
    'distribution': 'Tile Economics',
    'word-judgment': 'Word Judgment',
    'anagram': 'Anagram',
    'score-calc': 'Score Calculation',
  };

  return (
    <PuzzleFrame title="The Lexicon Trial" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 8, fontSize: 14 }}>
        Charge all five runes to complete the trial.
      </p>
      {challenge && (
        <p style={{ color: '#8b5cf6', textAlign: 'center', marginBottom: 16, fontSize: 13, letterSpacing: 1 }}>
          {typeLabels[challenge.type] || challenge.type}
        </p>
      )}

      {renderPedestal()}
      {renderChallenge()}

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 16,
          color: feedback.includes('activated') || feedback.includes('complete') ? '#52b788' : '#f87171',
          fontFamily: "'Georgia', serif", fontSize: 15,
          textShadow: feedback.includes('complete') ? '0 0 20px rgba(201,168,76,0.5)' : 'none',
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        'Each challenge tests a different Scrabble skill you encountered in the temple.',
      ]} />
    </PuzzleFrame>
  );
}
