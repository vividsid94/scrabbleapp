import React, { useState, useEffect } from 'react';
import { bingoHuntRounds } from '../data/puzzleBank';
import PuzzleFrame from '../components/PuzzleFrame';
import ScrabbleTile from '../components/ScrabbleTile';
import HintSystem from '../components/HintSystem';

export default function BingoHunt({ onSolve, theme }) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState([]);
  const [available, setAvailable] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);

  const current = bingoHuntRounds[round];

  useEffect(() => {
    if (current) {
      // Shuffle the rack
      const shuffled = [...current.rack].map((l, i) => ({ letter: l, id: i }));
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setAvailable(shuffled);
      setSelected([]);
    }
  }, [round, current]);

  // Safety check: if current is undefined, don't render
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
    setAvailable(prev => [...prev, tile]);
    setSelected(prev => prev.filter(t => t.id !== tile.id));
  };

  const handleSubmit = () => {
    const word = selected.map(t => t.letter).join('');
    if (word === current.answer) {
      if (round < bingoHuntRounds.length - 1) {
        setFeedback('BINGO! +50 bonus! Next rack...');
        setTimeout(() => {
          setRound(r => r + 1);
          setFeedback('');
        }, 1000);
      } else {
        setSolved(true);
        setFeedback('All bingos found!');
        setTimeout(() => onSolve(200), 600);
      }
    } else {
      setFeedback('Not the bingo word. Try again!');
      setTimeout(() => setFeedback(''), 1200);
    }
  };

  const handleClear = () => {
    const all = [...selected, ...available].sort((a, b) => a.id - b.id);
    setAvailable(all);
    setSelected([]);
  };

  return (
    <PuzzleFrame title="Bingo Hunt" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 6, fontSize: 14 }}>
        Find the 7-letter bingo word using all tiles.
      </p>
      <p style={{
        color: '#9b2335', textAlign: 'center', marginBottom: 20, fontSize: 14,
        fontWeight: 'bold', letterSpacing: 2,
      }}>
        NO CLUES &mdash; Round {round + 1}/{bingoHuntRounds.length}
      </p>

      {/* Answer slots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16,
        minHeight: 56, padding: '8px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        border: '1px dashed rgba(155,35,53,0.4)',
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
        {Array.from({ length: 7 - selected.length }, (_, i) => (
          <div key={`empty-${i}`} style={{
            width: 44, height: 44,
            borderRadius: 4,
            border: '1px dashed rgba(155,35,53,0.3)',
            background: 'rgba(155,35,53,0.05)',
          }} />
        ))}
      </div>

      {/* Rack tiles */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
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
          disabled={selected.length !== 7}
          style={{
            background: selected.length === 7 ? 'linear-gradient(135deg, #9b2335, #7a1c2a)' : 'rgba(255,255,255,0.1)',
            color: selected.length === 7 ? '#fff' : '#666',
            border: 'none',
            borderRadius: 8,
            padding: '8px 24px',
            fontSize: 14,
            fontFamily: "'Georgia', serif",
            fontWeight: 'bold',
            cursor: selected.length === 7 ? 'pointer' : 'default',
          }}
        >
          Submit Bingo
        </button>
      </div>

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 12,
          color: feedback.includes('BINGO') || feedback.includes('All') ? '#52b788' : '#f87171',
          fontFamily: "'Georgia', serif", fontSize: 15,
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        `The word starts with "${current.answer[0]}".`,
        `The word ends with "${current.answer[current.answer.length - 1]}".`,
      ]} />
    </PuzzleFrame>
  );
}
