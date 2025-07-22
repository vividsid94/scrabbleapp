import React, { useState } from 'react';
import JigsawPuzzle from '../Home/Jigsaw';
import MemoryGame from '../Memory/Memory';
import WordSearch from './WordSearch';
import Boggle from '../Boggle/Boggle';
import Crossword from './Crossword';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav';
import Box from '@mui/material/Box';
import './Minigames.css';

const MINIGAMES = [
  { key: 'jigsaw', label: 'Jigsaw', component: <JigsawPuzzle /> },
  { key: 'memory', label: 'Memory', component: <MemoryGame /> },
  { key: 'wordsearch', label: 'Word Search', component: <WordSearch /> },
  { key: 'boggle', label: 'Boggle', component: <Boggle /> },
  { key: 'crossword', label: 'Crossword', component: <Crossword /> },
  // Add more minigames here
];

const Minigames = () => {
  const [selected, setSelected] = useState('jigsaw');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidenav />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
        <Box sx={{ width: '100%', maxWidth: 1200, margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ textAlign: 'center', fontSize: 40, fontWeight: 900, margin: '0 0 24px 0', letterSpacing: 1 }}>🎮 Minigames</h1>
          <div className="minigames-tabs" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, gap: 16 }}>
            {MINIGAMES.map(game => (
              <button
                key={game.key}
                className={`minigames-tab${selected === game.key ? ' selected' : ''}`}
                onClick={() => setSelected(game.key)}
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  padding: '14px 38px',
                  borderRadius: 12,
                  border: 'none',
                  background: selected === game.key ? '#4ECDC4' : 'rgba(255,255,255,0.85)',
                  color: selected === game.key ? '#fff' : '#333',
                  boxShadow: selected === game.key ? '0 4px 24px #4ECDC455' : '0 2px 8px #0001',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(.4,2,.6,1)',
                  transform: selected === game.key ? 'scale(1.08)' : 'scale(1)',
                  outline: selected === game.key ? '3px solid #4ECDC4' : 'none',
                  position: 'relative',
                  zIndex: selected === game.key ? 2 : 1,
                  marginBottom: 0,
                  minWidth: 120,
                }}
              >
                {game.label}
                {selected === game.key && (
                  <span className="minigames-tab-underline" style={{
                    display: 'block',
                    height: 6,
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #4ECDC4 60%, #3D5A80 100%)',
                    marginTop: 8,
                    width: '80%',
                    marginLeft: '10%',
                    transition: 'width 0.2s',
                  }} />
                )}
              </button>
            ))}
          </div>
          <Box sx={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
            border: 'none',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.10) inset',
            padding: '32px 24px',
            minHeight: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 24,
            animation: 'none',
          }}>
            {MINIGAMES.find(game => game.key === selected)?.component}
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default Minigames; 