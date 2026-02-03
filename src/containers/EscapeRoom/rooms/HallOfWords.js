import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';
import WordJudgment from '../puzzles/WordJudgment';
import AnagramForge from '../puzzles/AnagramForge';
import TempleParticles from '../effects/TempleParticles';
import TorchLight from '../effects/TorchLight';
import './HallOfWords.css';

export default function HallOfWords() {
  const { currentPuzzleIndex, solvePuzzle, advancePuzzle } = useEscapeRoomStore();

  const handleSolve = (points) => {
    solvePuzzle(points);
    setTimeout(() => advancePuzzle(), 800);
  };

  return (
    <div className="room room-emerald">
      <TempleParticles theme="emerald" />
      <TorchLight theme="emerald" />
      <div className="room-content">
        <div className="room-header">
          <h1 className="room-title emerald-text">Hall of Words</h1>
          <p className="room-subtitle">Prove your command of the lexicon</p>
        </div>
        {currentPuzzleIndex === 0 && <WordJudgment onSolve={handleSolve} theme="emerald" />}
        {currentPuzzleIndex === 1 && <AnagramForge onSolve={handleSolve} theme="emerald" />}
      </div>
    </div>
  );
}
