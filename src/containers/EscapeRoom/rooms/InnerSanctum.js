import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';
import LexiconTrial from '../puzzles/LexiconTrial';
import TempleParticles from '../effects/TempleParticles';
import TorchLight from '../effects/TorchLight';
import './InnerSanctum.css';

export default function InnerSanctum() {
  const { solvePuzzle, advancePuzzle } = useEscapeRoomStore();

  const handleSolve = (points) => {
    solvePuzzle(points);
    setTimeout(() => advancePuzzle(), 1200);
  };

  return (
    <div className="room room-purple">
      <TempleParticles theme="purple" />
      <TorchLight theme="purple" />
      <div className="room-content">
        <div className="room-header">
          <h1 className="room-title purple-text">The Inner Sanctum</h1>
          <p className="room-subtitle">The final trial awaits</p>
        </div>
        <LexiconTrial onSolve={handleSolve} theme="purple" />
      </div>
    </div>
  );
}
