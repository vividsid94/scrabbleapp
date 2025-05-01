import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';

const ColorScheme = ({ color, boardColor }) => {
  const colorInputRef = useRef(null);
  const boardColorInputRef = useRef(null);
  const [currentColor, setCurrentColor] = useState(color.current);
  const [currentBoardColor, setCurrentBoardColor] = useState(boardColor.current);

  useEffect(() => {
    setCurrentColor(color.current);
    setCurrentBoardColor(boardColor.current);
  }, []);

  const handleChange = () => {
    const newColor = colorInputRef.current.value;
    setCurrentColor(newColor);
    color.current = newColor;
  };

  const handleBoardColorChange = () => {
    const newColor = boardColorInputRef.current.value;
    setCurrentBoardColor(newColor);
    boardColor.current = newColor;
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