import React, { useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { getComplementaryColor } from '../../../functions/tileFunctions.js';

const ColorScheme = ({ color, complementaryColor }) => {
  const colorInputRef = useRef(null);
  const [currentColor, setCurrentColor] = useState(color.current);

  useEffect(() => {
    setCurrentColor(color.current);
  }, []);

  const handleChange = () => {
    const newColor = colorInputRef.current.value;
    setCurrentColor(newColor);
    color.current = newColor;
    complementaryColor.current = getComplementaryColor(newColor);
  };

  return (
    <Box>
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
  );
};

export default ColorScheme; 