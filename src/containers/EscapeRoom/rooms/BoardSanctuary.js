import React from 'react';
import { useEscapeRoomStore } from '../../../stores/escapeRoomStore';
import BoardMapChallenge from '../puzzles/BoardMapChallenge';
import ScoreCalculator from '../puzzles/ScoreCalculator';
import TempleParticles from '../effects/TempleParticles';
import TorchLight from '../effects/TorchLight';
import './BoardSanctuary.css';

export default function BoardSanctuary() {
  const { currentPuzzleIndex, solvePuzzle, advancePuzzle } = useEscapeRoomStore();

  const handleSolve = (points) => {
    solvePuzzle(points);
    setTimeout(() => advancePuzzle(), 800);
  };

  return (
    <div className="room room-azure">
      <TempleParticles theme="azure" />
      <TorchLight theme="azure" />
      <div className="room-content">
        <div className="room-header">
          <h1 className="room-title azure-text">Board Sanctuary</h1>
          <p className="room-subtitle">Navigate the sacred grid of multipliers</p>
        </div>
        {currentPuzzleIndex === 0 && <BoardMapChallenge onSolve={handleSolve} theme="azure" />}
        {currentPuzzleIndex === 1 && <ScoreCalculator onSolve={handleSolve} theme="azure" />}
      </div>
    </div>
  );
}
