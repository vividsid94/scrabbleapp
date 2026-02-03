import React, { useState } from 'react';
import { scoreCalculatorRounds } from '../data/puzzleBank';
import { standardBoard, premiumLabels, letterScores } from '../data/scrabbleData';
import PuzzleFrame from '../components/PuzzleFrame';
import ScrabbleTile from '../components/ScrabbleTile';
import HintSystem from '../components/HintSystem';

const premiumColors = {
  0: 'rgba(139,119,101,0.3)',
  1: 'rgba(126,214,221,0.6)',
  2: 'rgba(114,105,214,0.7)',
  3: 'rgba(244,159,212,0.6)',
  4: 'rgba(206,34,34,0.7)',
};

export default function ScoreCalculator({ onSolve, theme }) {
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [solved, setSolved] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const current = scoreCalculatorRounds[round];
  const totalRounds = scoreCalculatorRounds.length;

  // Safety check: if current is undefined, don't render
  if (!current) {
    return null;
  }

  const handleSubmit = () => {
    const guess = parseInt(input, 10);
    const isCorrect = guess === current.answer;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    if (isCorrect) {
      setFeedback('Correct!');
    } else {
      setFeedback(`Wrong! The answer is ${current.answer}.`);
    }

    setCorrectCount(newCorrect);

    setTimeout(() => {
      if (round < totalRounds - 1) {
        setRound(r => r + 1);
        setInput('');
        setFeedback('');
      } else {
        if (newCorrect >= 4) { // Need 4/6 instead of 2/4 (now 6 rounds total)
          setSolved(true);
          setFeedback(`Calculation complete! ${newCorrect}/${totalRounds} correct.`);
          setTimeout(() => onSolve(100 + newCorrect * 30), 600);
        } else {
          setFeedback(`Only ${newCorrect}/${totalRounds} correct. Restarting...`);
          setTimeout(() => {
            setRound(0);
            setInput('');
            setCorrectCount(0);
            setFeedback('');
          }, 1500);
        }
      }
    }, 1500);
  };

  // Calculate visible area around the word
  const minRow = Math.max(0, Math.min(...current.tiles.map(t => t.row)) - 1);
  const maxRow = Math.min(14, Math.max(...current.tiles.map(t => t.row)) + 1);
  const minCol = Math.max(0, Math.min(...current.tiles.map(t => t.col)) - 1);
  const maxCol = Math.min(14, Math.max(...current.tiles.map(t => t.col)) + 1);

  const cellSize = 36;

  return (
    <PuzzleFrame title="Score Calculator" solved={solved} theme={theme}>
      <p style={{ color: '#b8a88a', textAlign: 'center', marginBottom: 6, fontSize: 14 }}>
        Calculate the total score for this word placement.
      </p>
      <p style={{ color: '#8a7a6a', textAlign: 'center', marginBottom: 8, fontSize: 13 }}>
        Round {round + 1}/{totalRounds} &middot; {correctCount} correct &middot; Need 4
      </p>
      <p style={{ color: '#c9a84c', textAlign: 'center', marginBottom: 16, fontSize: 15, fontStyle: 'italic' }}>
        {current.description}
      </p>

      {/* Board section */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxCol - minCol + 1}, ${cellSize}px)`,
          gap: 2,
          background: 'rgba(0,0,0,0.5)',
          padding: 4,
          borderRadius: 6,
        }}>
          {Array.from({ length: maxRow - minRow + 1 }, (_, ri) => {
            const r = minRow + ri;
            return Array.from({ length: maxCol - minCol + 1 }, (_, ci) => {
              const c = minCol + ci;
              const tile = current.tiles.find(t => t.row === r && t.col === c);
              const cellType = standardBoard[r][c];
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: tile ? 'linear-gradient(145deg, #f0e0c0, #d4c4a0)' : premiumColors[cellType],
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    position: 'relative',
                  }}
                >
                  {tile ? (
                    <>
                      <span style={{ fontSize: 16, fontWeight: 'bold', color: '#2c1810', fontFamily: "'Georgia', serif" }}>
                        {tile.letter}
                      </span>
                      <span style={{ fontSize: 8, color: '#5c4a3a', position: 'absolute', bottom: 1, right: 3 }}>
                        {letterScores[tile.letter]}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontFamily: "'Georgia', serif" }}>
                      {premiumLabels[cellType]}
                    </span>
                  )}
                </div>
              );
            });
          }).flat()}
        </div>
      </div>

      {/* Tile values reference */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap',
      }}>
        {current.tiles.map((t, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 12, color: '#b8a88a' }}>
            <ScrabbleTile letter={t.letter} size="small" />
            <div style={{ marginTop: 2 }}>{letterScores[t.letter]}pt</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
        <span style={{ color: '#c9a84c', fontFamily: "'Georgia', serif", fontSize: 16 }}>Score:</span>
        <input
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && input && handleSubmit()}
          style={{
            width: 80,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(201,168,76,0.4)',
            background: 'rgba(0,0,0,0.3)',
            color: '#e8d5b7',
            fontSize: 20,
            fontFamily: "'Georgia', serif",
            textAlign: 'center',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input}
          style={{
            background: input ? 'linear-gradient(135deg, #c9a84c, #a08030)' : 'rgba(255,255,255,0.1)',
            color: input ? '#1a0a2e' : '#666',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontSize: 14,
            fontFamily: "'Georgia', serif",
            fontWeight: 'bold',
            cursor: input ? 'pointer' : 'default',
          }}
        >
          Submit
        </button>
      </div>

      {feedback && (
        <div style={{
          textAlign: 'center', marginTop: 12,
          color: feedback.includes('Correct') || feedback.includes('complete') ? '#52b788' : '#f87171',
          fontFamily: "'Georgia', serif", fontSize: 15,
        }}>
          {feedback}
        </div>
      )}

      <HintSystem hints={[
        current.hint,
        'Letter multipliers (DLS/TLS) apply first. Then word multipliers (DWS/TWS). Bingo = +50.',
      ]} />
    </PuzzleFrame>
  );
}
