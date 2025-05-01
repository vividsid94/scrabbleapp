import React from 'react';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import styles from '../Viewer.module.css';

const GameControls = ({
  currentMoveRef,
  moveSet,
  setMoveDirection,
  handleMove,
  randomizeGame,
  beginningOfGame,
  unlockEloMode,
  setShowUnlockText,
  switchMode,
}) => {
  const iconList = [  
    {icon: KeyboardDoubleArrowLeftIcon, toolTip: "Beginning of game", onClick: beginningOfGame},  
    {icon: KeyboardArrowLeftIcon, toolTip: "Move back", onClick: () => {
      if (currentMoveRef.current > -1) {
        currentMoveRef.current -= 1; 
        setMoveDirection("backward"); 
        handleMove(
          moveSet[currentMoveRef.current - 2], 
          moveSet[currentMoveRef.current - 1], 
          moveSet[currentMoveRef.current], 
          moveSet[currentMoveRef.current + 1], 
          "previous"
        );
      }
    }},
    {icon: KeyboardArrowRightIcon, toolTip: "Move forward", onClick: () => {
      if (currentMoveRef.current + 1 < moveSet.length) {
        currentMoveRef.current += 1; 
        setMoveDirection("forward"); 
        handleMove(
          moveSet[currentMoveRef.current - 2], 
          moveSet[currentMoveRef.current - 1], 
          moveSet[currentMoveRef.current], 
          moveSet[currentMoveRef.current + 1], 
          "next"
        );
      }
    }},
    {icon: FiberNewIcon, toolTip: "New game", onClick: randomizeGame},
    {icon: SwapHorizIcon, onClick: () => (!unlockEloMode ? setShowUnlockText(true) : switchMode()),
      condition: {color: !unlockEloMode ? 'transparent' : 'white', 
                 background: !unlockEloMode ? 'repeating-linear-gradient(45deg, #3D3B35, #3D3B35 5px, #767266 5px, #767266 10px)' : 'none'}}
  ];

  return (
    <Box className={styles.playerToggle}>
      {iconList.map((icon, index) => (
        <Tooltip key={`icon-${index}`} title={icon.toolTip}>
          <icon.icon
            className={styles.Arrows} 
            onClick={icon.onClick}
            sx={icon.condition}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

export default GameControls; 