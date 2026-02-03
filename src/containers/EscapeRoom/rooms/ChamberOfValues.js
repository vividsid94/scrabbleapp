import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';
import TileValueSafe from '../puzzles/TileValueSafe';
import LetterDistribution from '../puzzles/LetterDistribution';
import TempleParticles from '../effects/TempleParticles';
import TorchLight from '../effects/TorchLight';
import './ChamberOfValues.css';

export default function ChamberOfValues() {
  const { currentPuzzleIndex, solvePuzzle, advancePuzzle } = useEscapeRoomStore();

  const handleSolve = (points) => {
    solvePuzzle(points);
    setTimeout(() => advancePuzzle(), 800);
  };

  return (
    <div className="room room-gold">
      <TempleParticles theme="gold" />
      <TorchLight theme="gold" />
      <div className="room-content">
        <div className="room-header">
          <h1 className="room-title gold-text">Chamber of Values</h1>
          <p className="room-subtitle">Master the worth of each sacred tile</p>
        </div>
        {currentPuzzleIndex === 0 && <TileValueSafe onSolve={handleSolve} theme="gold" />}
        {currentPuzzleIndex === 1 && <LetterDistribution onSolve={handleSolve} theme="gold" />}
      </div>
    </div>
  );
}
