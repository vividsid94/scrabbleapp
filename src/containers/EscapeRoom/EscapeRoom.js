import React from 'react';
import { useEscapeRoomStore } from '../../stores/escapeRoomStore';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import IntroScreen from './components/IntroScreen';
import VictoryScreen from './components/VictoryScreen';
import EscapeRoomHUD from './components/EscapeRoomHUD';
import RoomTransition from './components/RoomTransition';
import RoomMap from './components/RoomMap';
import ChamberOfValues from './rooms/ChamberOfValues';
import HallOfWords from './rooms/HallOfWords';
import BoardSanctuary from './rooms/BoardSanctuary';
import StrategyVault from './rooms/StrategyVault';
import InnerSanctum from './rooms/InnerSanctum';
import './EscapeRoom.css';

const roomComponents = [
  ChamberOfValues,
  HallOfWords,
  BoardSanctuary,
  StrategyVault,
  InnerSanctum,
];

export default function EscapeRoom() {
  const { gamePhase, currentRoomIndex, resetGame } = useEscapeRoomStore();

  const RoomComponent = roomComponents[currentRoomIndex];

  return (
    <div className="escape-room-root">
      <Sidenav />
      <div className="escape-room-outer">
        <div className="escape-room-container">
          {gamePhase === 'intro' && <IntroScreen />}

          {gamePhase === 'playing' && (
            <>
              <EscapeRoomHUD />
              <RoomMap />
              <div className="escape-room-stage">
                <RoomComponent />
              </div>
            </>
          )}

          {gamePhase === 'transition' && <RoomTransition />}

          {gamePhase === 'victory' && <VictoryScreen />}

          {gamePhase === 'defeat' && (
            <div className="escape-room-defeat">
              <div className="defeat-icon">&#x23F1;</div>
              <h1 className="defeat-title">Time Expired</h1>
              <p className="defeat-text">
                The temple seals shut. Your Scrabble knowledge was not enough... this time.
              </p>
              <div className="defeat-score">
                Score: {useEscapeRoomStore.getState().score}
              </div>
              <button className="defeat-button" onClick={resetGame}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
