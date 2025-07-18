import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { useColorSchemeStore } from '../../stores/colorSchemeStore';

const ColorScheme = () => {
  const colorInputRef = useRef(null);
  const boardColorInputRef = useRef(null);
  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);
  const updateColor = useColorSchemeStore(state => state.updateColor);
  const updateBoardColor = useColorSchemeStore(state => state.updateBoardColor);
  const [currentColor, setCurrentColor] = useState(color.current);
  const [currentBoardColor, setCurrentBoardColor] = useState(boardColor.current);

  useEffect(() => {
    setCurrentColor(color.current);
    setCurrentBoardColor(boardColor.current);
  }, [color.current, boardColor.current]);

  const handleChange = () => {
    const newColor = colorInputRef.current.value;
    setCurrentColor(newColor);
    updateColor(newColor);
  };

  const handleBoardColorChange = () => {
    const newColor = boardColorInputRef.current.value;
    setCurrentBoardColor(newColor);
    updateBoardColor(newColor);
    document.documentElement.style.setProperty('--board-color', newColor);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <input
          type="color"
          ref={colorInputRef}
          value={currentColor}
          onChange={handleChange}
          style={{
            width: '50px',
            height: '50px',
            border: 'none',
            cursor: 'pointer',
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <input
          type="color"
          ref={boardColorInputRef}
          value={currentBoardColor}
          onChange={handleBoardColorChange}
          style={{
            width: '50px',
            height: '50px',
            border: 'none',
            cursor: 'pointer',
          }}
        />
      </Box>
    </Box>
  );
};

export default ColorScheme; 