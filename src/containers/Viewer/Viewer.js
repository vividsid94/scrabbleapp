import React, { useState, useEffect } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
import styles from './Viewer.module.css';
import axios from 'axios';
import dictionary from '../../components/AppContent/Dictionary/nwl20bings.json';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import { GoQuestion, GoTriangleLeft, GoTriangleRight } from "react-icons/go";

import cellBonusMap from "../../components/AppContent/Board/cellBonusMap.js";
import Cell from "../../components/AppContent/Board/Cell.js";

export default function Viewer({ onChange }){
  const [gameArray, setGameArray] = useState("");
  const [gameNum, setGameNum] = useState(28625);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [boardClickCount, setBoardClickCount] = useState(0);
  const [moves, setMoves] = useState("");
  const [currentMove, setCurrentMove] = useState(0);
  const [origBoardCoords] = useState([    [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
    [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
    [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
    [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
    [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
    [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
    [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
    [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4],
    [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
    [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
    [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
    [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
    [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
    [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
    [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],]); 
  const [boardCoords, setBoardCoords] = useState([]); 
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pointsScored, setPointsScored] = useState(0);
  const [pool, setPool] = useState("AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ??");
  const [mode, setMode] = useState("VIEWER");
  const [resetCount, setResetCount] = useState(0);

  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const handleBoardClick = () => {
    setBoardClickCount(prevCount => prevCount + 1);
    if (boardClickCount > 10){
      setMode("GUESSELO");
      onChange("GUESSELO");
    }
  }

  useEffect(() => {
    setBoardCoords([    [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
      [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
      [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
      [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
      [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
      [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
      [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
      [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4],
      [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
      [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
      [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
      [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
      [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
      [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
      [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],]); 
    setPlayer1points(0);
    setPlayer2points(0);
    setPointsScored(0);
    setPool("AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ??");
    let first3 = Math.floor(gameNum / 100).toString().substring(0, 3);
    let link = 'https://www.cross-tables.com/annotated/selfgcg/' + first3 + '/anno' + gameNum + '.gcg';
    axios.get('/.netlify/functions/proxy?url=' + encodeURIComponent(link))
    .then((posRes)=>{
        console.log("Game reset");
        setGameArray(posRes.data.toString().split("\n"));
        setMoves(posRes.data.toString().split("\n").filter(str => str.startsWith(">")));
        setPlayer1(getPlayerName(posRes.data.toString().split("\n").filter(str => str.startsWith("#player1"))));
        setPlayer2(getPlayerName(posRes.data.toString().split("\n").filter(str => str.startsWith("#player2"))));
    },(errRes)=>{
        console.log(errRes)
    })
  }, [mode, gameNum, resetCount]);

  const getPlayerName = (input) => {
    const regex = /#player\d+\s+(\S+)/;
    return input[0].replace(regex, "");
  }

  function getMove(moveString){
    let play;
    if (moveString){
      let move = moveString.replace(/\s+/g, ' ');
      const parts = move.split(" ");
      play = parts[2] + " " + parts[3];
    }
    else{
      play = "N/A";
    }
    return play;
  }
  
  function createBoard() {
    return (
        boardCoords.map((row, rowIndex) => (
            row.map((col, colIndex) => (
              Cell(rowIndex, colIndex, cellBonusMap(col), "board")
            ))
        ))
    ); 
  }

  function createRack() {
    var move = moves[currentMove];
    if (move === undefined){
      move = "LOADING LOADING LOADING LOADING";
    }
    const parts = move.split(" ");
    const rack = parts[1].replace(/\?/g, " ").split('');
    return (
      rack.map((col, colIndex) => (
        Cell("0", colIndex, {"color": "purple", "value": col}, "rack")
      ))
    ); 
  }

  function createPool() {
    const modifiedPool = pool.split('');
    return (
      modifiedPool.map((col, colIndex) => (
        Cell("0", colIndex, {"color": "grey", "value": col}, "pool")
      ))
    ); 
  }

  function clearBoard(){

  }

  function previousPlay(move){
    move = move.replace(/\s+/g, ' ');
    const lookup = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10, K: 11, L: 12, M: 13, N: 14, O: 15 };
    console.log(move);
    const parts = move.split(" ");
    const location = parts[2];
    const play = parts[3];
    let points = parts[4];
    let score = parts[5];

    let newBoardCoords = [...boardCoords];
    if (location[0] !== "-"){
      if (Number.isInteger(parseInt(location[0]))) {
        const locationParts = location.match(/(\d+)(\D+)/);  // This will create an array with the parts ["12", "G"]
        const part1 = locationParts[1];  // This will be "12"
        const part2 = locationParts[2];  // This will be "G"
        for (let i = 0; i < play.length; i++) {
          if (play[i] !== ".")
            newBoardCoords[part1 - 1][lookup[part2.toUpperCase()] - 1 + i] = origBoardCoords[part1 - 1][lookup[part2.toUpperCase()] - 1 + i];
        }
      }
      else {
        const locationParts = location.match(/(\D+)(\d+)/);  // This will create an array with the parts ["12", "G"]
        const part1 = locationParts[1];  // This will be "12"
        const part2 = locationParts[2];  // This will be "G"
        for (let i = 0; i < play.length; i++) {
          if (play[i] !== ".")
            newBoardCoords[part2 - 1  + i][lookup[part1.toUpperCase()] - 1] = origBoardCoords[part2 - 1  + i][lookup[part1.toUpperCase()] - 1];
        }
      }
    }
    else{
      points = parts[2];
      score = parts[4];
    }
    setBoardCoords(newBoardCoords);
    setCurrentMove(currentMove - 1);
    if (currentMove % 2 === 1)
      setPlayer1points(score)
    else
      setPlayer2points(score)
    setPointsScored(points);
  }

  function nextPlay(move){
    move = move.replace(/\s+/g, ' ');
    console.log(move)
    const lookup = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10, K: 11, L: 12, M: 13, N: 14, O: 15 };
    const parts = move.split(" ");
    const location = parts[2];
    const play = parts[3];
    let points = parts[4];
    let score = parts[5];
    let newBoardCoords = [...boardCoords];
    let newPool = [...pool];
    console.log(parts)
    if (location[0] !== "-"){
      if (Number.isInteger(parseInt(location[0]))) {
        const locationParts = location.match(/(\d+)(\D+)/);  // This will create an array with the parts ["12", "G"]
        const part1 = locationParts[1];  // This will be "12"
        const part2 = locationParts[2];  // This will be "G"
        for (let i = 0; i < play.length; i++) {
          if (play[i].match(/[a-z]/)){
            setPool(prevPool => prevPool.replace(/\?/, ''));
            newBoardCoords[part1 - 1][lookup[part2.toUpperCase()] - 1 + i] = " ";
          }
          else if (play[i] !== "."){
            setPool(prevPool => prevPool.replace(new RegExp(play[i]), ''));
            newBoardCoords[part1 - 1][lookup[part2.toUpperCase()] - 1 + i] = play[i];
          }
        }
      }
      else {
        const locationParts = location.match(/(\D+)(\d+)/);  // This will create an array with the parts ["12", "G"]
        const part1 = locationParts[1];  // This will be "12"
        const part2 = locationParts[2];  // This will be "G"
        for (let i = 0; i < play.length; i++) {
          if (play[i].match(/[a-z]/)){
            setPool(prevPool => prevPool.replace(/\?/, ''));
            newBoardCoords[part2 - 1  + i][lookup[part1.toUpperCase()] - 1] = " ";
          }
          else  if (play[i] !== "."){
            setPool(prevPool => prevPool.replace(new RegExp(play[i]), ''));
            newBoardCoords[part2 - 1  + i][lookup[part1.toUpperCase()] - 1] = play[i];
          }
        }
      }
    }
    else{
      points = parts[2];
      score = parts[4];
    }
    setBoardCoords(newBoardCoords);
    setCurrentMove(currentMove + 1);
    if (currentMove % 2 === 0)
      setPlayer1points(score)
    else
      setPlayer2points(score)
    setPointsScored(points);


    console.log(boardCoords)
  }

  function randomizeGame(){
    setResetCount(resetCount + 1);
    setBoardCoords((prevBoardCoords) => {
      // Create a new array based on the previous state value of boardCoords
      let newBoardCoords = [...prevBoardCoords];
      newBoardCoords = origBoardCoords;
      console.log(newBoardCoords)
      return newBoardCoords;
    });
    // O

    let randomNumber = getRandomNumber(10000, 40000).toString();
    setGameNum(randomNumber);
    setCurrentMove(0);
  }
  
  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
      <Box className={styles.title}>
        {mode === "VIEWER" ? "Annotated Game Viewer" : "Guess the Elo!"} <GoQuestion className={styles.questionMark}></GoQuestion>
      </Box>
      <Box className={styles.mainPanel}>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Board onBoardChildClick={handleBoardClick} board={createBoard()} points={pointsScored} move={getMove(moves[currentMove - 1])}/>   
        </Box>

        <Box className={styles.rightPanel}>
          <Box className={styles.topPlayerPanel}>
            <Box className={styles.playerPanel}>
              {mode === "VIEWER" ? player1 : "Player 1"} 
              <Box className={styles.Rack} sx={{visibility: currentMove % 2 === 1 ? 'hidden' : 'visible'}}>
                <Rack board={createRack()}/> 
              </Box> 
              <Box>
                {player1points} points
              </Box>
            </Box>  
            <Box className={styles.playerPanel}>
            {mode === "VIEWER" ? player2 : "Player 2"} 
              <Box className={styles.Rack} sx={{visibility: currentMove % 2 === 0 ? 'hidden' : 'visible'}}>
                <Rack sx={{display: "none !important"}} board={createRack()}/>  
              </Box>
              <Box>
                {player2points} points
              </Box>
            </Box>  
            <Box className={`${styles.playerPanel} ${styles.playerToggle}`}>
              <GoTriangleLeft className={styles.Arrows} onClick={() => previousPlay(moves[currentMove - 1])}></GoTriangleLeft>
              <GoTriangleRight className={styles.Arrows} onClick={() => nextPlay(moves[currentMove])}></GoTriangleRight>
              <button onClick={randomizeGame}>Randomize</button>
              <input ></input>
            </Box> 
          </Box>
          <Box className={styles.playerPanel}>
            <Box className={styles.poolBox}>
              <Pool board={createPool()}/>  
            </Box>
          </Box>  
        </Box>

      </Box>  
      </Box>   
    </Box>
  )
}
