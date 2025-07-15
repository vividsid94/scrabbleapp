import React from 'react';

const ModeToggleIcon = ({ wooglesMode, onClick, sx = {} }) => {
  const wooglesIcon = '/images/woogles-icon.png';
  const crossTablesIcon = '/images/cross-tables-icon.png';
  const iconSrc = wooglesMode ? wooglesIcon : crossTablesIcon;
  
  return (
    <img
      src={iconSrc}
      alt={wooglesMode ? "Switch to Cross-Tables" : "Switch to Woogles"}
      onClick={onClick}
      style={{
        width: '32px',
        height: '32px',
        cursor: 'pointer',
        objectFit: 'contain',
        verticalAlign: 'middle',
        ...sx
      }}
    />
  );
};

export default ModeToggleIcon; 