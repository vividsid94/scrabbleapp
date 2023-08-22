import React, { useEffect } from "react";
import { useState } from "react";
import { findEligibleCoordinates, generateRandomRack, getAllWordsFromRack } from "../../functions/moveFunctions";
import styles from './Bot.module.css';
import Board from "../../components/AppContent/Board/Board";
import Box from '@mui/material/Box';
import { createBoard } from "../../functions/boardFunctions";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';


const Bots = () => {
  const [board, setBoard] = useState([
    [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4],
    [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
    [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
    [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
    [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
    [0, 0, 1, 0, 0, 0, 1, "F", 1, 0, 0, 0, 1, 0, 0],
    [4, 0, 0, 1, 0, 0, 0, "U", "H", 0, 0, 1, 0, 0, 4],
    [0, 0, 1, 0, 0, 0, 1, "G", 1, 0, 0, 0, 1, 0, 0],
    [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
    [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
    [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
    [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
    [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
    [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, "Z"],
  ]);
  
  useEffect(() => {
    let dictionary = ['ARE', 'ES', 'ET', 'AM', 'AIRT', 'ANEROID', 'AMIE'];
    let rack = generateRandomRack(7);
    let validWords = getAllWordsFromRack(rack, dictionary);
    console.log(rack, validWords);


    
    const eligibleCoordinatesWithDistances = findEligibleCoordinates(board);
    console.log(eligibleCoordinatesWithDistances);
  }, []);

  return (
    <Box sx={{ display: 'flex'}}>
    <Sidenav/>
      <Box className={styles.mainBox} component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Board dictionary="NWL20" board={createBoard(board, [], "PROTILES", "STANDARD")}/>   
      </Box>
    </Box>
  );
};

export default Bots;