import React, { useState, useEffect } from 'react';
import { lowProbBingoRounds } from './bingoWords';
import PuzzleFrame from '../EscapeRoom/components/PuzzleFrame';
import ScrabbleTile from '../EscapeRoom/components/ScrabbleTile';
import HintSystem from '../EscapeRoom/components/HintSystem';

/**
 * Fork of EscapeRoom/puzzles/AnagramForge.js, swapped to only use genuinely
 * low-probability 7s/8s (see bingoWords.js) instead of the live room's
 * gentler 3-8 letter mix — this demo is specifically about bingo-hunting
 * practice, not onboarding-friendly difficulty.
 */
export default function BingoForge({ onSolve, theme }) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState([]);
  const [available, setAvailable] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);

  const current = lowProbBingoRounds[round];

  useEffect(() => {
    if (current) {
      setAvailable(current.scrambled.split('').map((l, i) => ({ letter: l, id: i })));
      setSelected([]);
    }
  }, [round, current?.scrambled]);

  if (!current) {
    return null;
  }

  const handleSelectTile = (tile) => {
    if (solved) return;
    setSelected(prev => [...prev, tile]);
    setAvailable(prev => prev.filter(t => t.id !== tile.id));
  };

  const handleDeselectTile = (tile) => {
    if (solved) return;
    setAvailable(prev => [...prev, tile].sort((a, b) => a.id - b.id));
    setSelected(prev => prev.filter(t => t.id !== tile.id));
  };

  const handleSubmit = () => {
    const word = selected.map(t => t.letter).join('');
    if (word === current.answer) {
      if (round < lowProbBingoRounds.length - 1) {
        setFeedback('Forged! Next word...');
        setTimeout(() => {
          setRound(r => r + 1);
          setFeedback('');
        }, 800);
      } else {
        setSolved(true);
        setFeedback('All bingos forged!');
        setTimeout(() => onSolve(150), 600);
      }
    } else {
      setFeedback('Not the right word. Try again!');
      setTimeout(() => setFeedback(''), 1200);
    }
  };

  const handleClear = () => {
    setAvailable(current.scrambled.split('').map((l, i) => ({ letter: l, id: i })));
    setSelected([]);
  };

  return (
    <PuzzleFrame title="Bingo Forge" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 8, fontSize: 14 }}>
        Rearrange the letters to form a word. Round {round + 1}/{lowProbBingoRounds.length}
      </p>
      <p style={{
        color: '#9b2335', textAlign: 'center', marginBottom: 20, fontSize: 15,
        fontWeight: 'bold', letterSpacing: 2,
      }}>
        LOW-PROBABILITY BINGO &mdash; {current.length} letters
      </p>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16,
        minHeight: 56, padding: '8px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        border: '1px dashed rgba(201,168,76,0.3)',
      }}>
        {selected.map(tile => (
          <ScrabbleTile
            key={tile.id}
            letter={tile.letter}
            size="medium"
            selected
            onClick={() => handleDeselectTile(tile)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {available.map(tile => (
          <ScrabbleTile
            key={tile.id}
            letter={tile.letter}
            size="medium"
            onClick={() => handleSelectTile(tile)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button
          onClick={handleClear}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '8px 20px',
            color: '#b8a88a',
            fontSize: 14,
            fontFamily: "'Georgia', serif",
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={selected.length !== current.length}
          style={{
            background: selected.length === current.length ? 'linear-gradient(135deg, #c9a84c, #a08030)' : 'rgba(255,255,255,0.1)',
            color: selected.length === current.length ? '#1a0a2e' : '#666',
            border: 'none',
            borderRadius: 8,
            padding: '8px 24px',
            fontSize: 14,
            fontFamily: "'Georgia', serif",
            fontWeight: 'bold',
            cursor: selected.length === current.length ? 'pointer' : 'default',
          }}
        >
          Forge Word
        </button>
      </div>

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 12,
          color: feedback.includes('Forged') || feedback.includes('All') ? '#52b788' : '#f87171',
          fontFamily: "'Georgia', serif", fontSize: 15,
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        `The word starts with "${current.answer[0]}" and ends with "${current.answer[current.answer.length - 1]}".`,
        `A ${current.length}-letter bingo, rarely drawn — think uncommon but real English words.`,
      ]} />
    </PuzzleFrame>
  );
}
