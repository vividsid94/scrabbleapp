import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';
import BingoHunt from '../puzzles/BingoHunt';
import StrategyChoice from '../puzzles/StrategyChoice';
import TempleParticles from '../effects/TempleParticles';
import TorchLight from '../effects/TorchLight';
import './StrategyVault.css';

export default function StrategyVault() {
  const { currentPuzzleIndex, solvePuzzle, advancePuzzle } = useEscapeRoomStore();

  const handleSolve = (points) => {
    solvePuzzle(points);
    setTimeout(() => advancePuzzle(), 800);
  };

  return (
    <div className="room room-ruby">
      <TempleParticles theme="ruby" />
      <TorchLight theme="ruby" />
      <div className="room-content">
        <div className="room-header">
          <h1 className="room-title ruby-text">Strategy Vault</h1>
          <p className="room-subtitle">Prove your tactical mastery</p>
        </div>
        {currentPuzzleIndex === 0 && <BingoHunt onSolve={handleSolve} theme="ruby" />}
        {currentPuzzleIndex === 1 && <StrategyChoice onSolve={handleSolve} theme="ruby" />}
      </div>
    </div>
  );
}
