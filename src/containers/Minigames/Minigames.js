import React, { useState, useRef, useLayoutEffect } from 'react';
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
  const tabBarRef = useRef(null);
  const [tabBarWidth, setTabBarWidth] = useState(null);

  useLayoutEffect(() => {
    if (tabBarRef.current) {
      setTabBarWidth(tabBarRef.current.offsetWidth);
    }
  }, [selected]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidenav />
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: { xs: 2, sm: 4, md: 6 },
        px: { xs: 1, sm: 2, md: 3 }
      }}>
        <Box sx={{ 
          width: '100%', 
          maxWidth: { xs: '100%', sm: 800, md: 900 }, 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 0 
        }}>
          <div
            className="minigames-tabs"
            ref={tabBarRef}
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: { xs: 4, sm: 6, md: 8 }, 
              marginBottom: 0,
              width: '100%',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              padding: { xs: '0 8px', sm: 0 }
            }}
          >
            {MINIGAMES.map(game => (
              <button
                key={game.key}
                className={`minigames-tab${selected === game.key ? ' selected' : ''}`}
                onClick={() => setSelected(game.key)}
                style={{
                  height: { xs: 40, sm: 45, md: 50 },
                  fontSize: { xs: 14, sm: 16, md: 18 },
                  fontWeight: 700,
                  letterSpacing: { xs: 1, sm: 1.5, md: 2 },
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  background: selected === game.key
                    ? 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)'
                    : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                  boxShadow: selected === game.key
                    ? '6px 0px 0px #3D5A80'
                    : '6px 0px 0px #374151',
                  outline: 'transparent',
                  position: 'relative',
                  userSelect: 'none',
                  marginLeft: { xs: 4, sm: 6, md: 8 },
                  marginRight: { xs: 4, sm: 6, md: 8 },
                  marginBottom: 0,
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                  transform: selected === game.key ? 'scale(1.04)' : 'scale(1)',
                  zIndex: selected === game.key ? 2 : 1,
                  flex: { xs: '1 1 calc(50% - 8px)', sm: 'none' },
                  minWidth: { xs: 'auto', sm: 'auto' }
                }}
              >
                {game.label}
                {selected === game.key && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -6,
                    height: 5,
                    background: '#4ECDC4',
                    borderRadius: 3,
                    width: '100%',
                    display: 'block',
                  }} />
                )}
              </button>
            ))}
          </div>
          <Box
            className="bookCard"
            sx={{
              width: { xs: '100%', sm: tabBarWidth ? `${tabBarWidth}px` : 'auto' },
              minWidth: 0,
            }}
          >
            {MINIGAMES.find(game => game.key === selected)?.component}
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default Minigames; 