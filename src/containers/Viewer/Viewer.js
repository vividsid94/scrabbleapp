import React, { useState, useEffect } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
import styles from './Viewer.module.css';
import axios from 'axios';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import { GoQuestion, GoTriangleLeft, GoTriangleRight } from "react-icons/go";

import cellType from "../../components/AppContent/Board/cellType.js";
import Cell from "../../components/AppContent/Board/Cell.js";

import { letterLookup, origPool, origBoard} from "../../components/AppContent/References/staticData.js";

export default function Viewer({ onChange }){
  const [gameArray, setGameArray] = useState("");
  const [gameNum, setGameNum] = useState(28625);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [boardClickCount, setBoardClickCount] = useState(0);
  const [moves, setMoves] = useState("");
  const [currentMove, setCurrentMove] = useState(0);
  const [boardCoords, setBoardCoords] = useState([]); 
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pointsScored, setPointsScored] = useState(0);
  const [pool, setPool] = useState(origPool);
  const [mode, setMode] = useState("VIEWER");
  const [resetCount, setResetCount] = useState(0);

  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const handleBoardClick = () => {
    setBoardClickCount(prevCount => prevCount + 1);
    let result = (Math.floor(boardClickCount / 10) % 10);
    if (result % 2 === 0) {
      setMode("VIEWER");
      onChange("VIEWER");
    }
    else{
      setMode("GUESSELO");
      onChange("GUESSELO");
    }
  }

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setBoardCoords(parsedOrigBoardCoords); 
    setPlayer1points(0);
    setPlayer2points(0);
    setPointsScored(0);
    setPool(origPool);
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
  }, [mode, resetCount]);

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
    console.log(moves[currentMove]);


    const startRow = 6;
    const endRow = 6;
    const startCol = 8;
    const endCol = 10;
  
    return (
      boardCoords.map((row, rowIndex) => (
        row.map((col, colIndex) => {
          if (rowIndex >= startRow && rowIndex <= endRow && colIndex >= startCol && colIndex <= endCol) {
            return Cell(rowIndex, colIndex, cellType(col, "flagged"), "board");
          } else {
            return Cell(rowIndex, colIndex, cellType(col, "apple"), "board");
          }
        })
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

  function extractLoc(str) {
    let parts = str.match(/^(\d+)(\D+)|^(\D+)(\d+)$/);
    let part1 = parts[1] || parts[3];
    let part2 = parts[2] || parts[4];
    return [part1, part2];
  } 

  function updateBoard(location, play, type) {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number))
    let newBoardCoords = [...boardCoords];
    const locationParts = extractLoc(location);
    const part1 = locationParts[0]; 
    const part2 = locationParts[1];
    let i, coord1, coord2;
    if (Number.isInteger(Number(part1))) {
      // Horizontal play
      coord1 = part1 - 1;
      coord2 = letterLookup[part2.toUpperCase()] - 1; 
      for (i = 0; i < play.length; i++) {
        if (play[i].match(/[a-z]/)) {
          newBoardCoords[coord1][coord2 + i] = type === "add" ? ' ' : parsedOrigBoardCoords[coord1][coord2 + i];
        } else if (play[i] !== '.') {
          newBoardCoords[coord1][coord2 + i] = type === "add" ? play[i] : parsedOrigBoardCoords[coord1][coord2 + i];
        }
      }
    } else {
      // Vertical play
      coord1 = part2 - 1;
      coord2 = letterLookup[part1.toUpperCase()] - 1;
      for (i = 0; i < play.length; i++) {
        if (play[i].match(/[a-z]/)) {
          newBoardCoords[coord1 + i][coord2] = type === "add" ? ' ' : parsedOrigBoardCoords[coord1 + i][coord2];
        } else if (play[i] !== '.') {
          newBoardCoords[coord1 + i][coord2] = type === "add" ? play[i] : parsedOrigBoardCoords[coord1 + i][coord2];
        }
      }
    }
    return newBoardCoords;
  }
  
  function handleMove(move, type){
    move = move.replace(/\s+/g, ' ');
    console.log(move);
    const parts = move.split(" ");
    const location = parts[2];
    const play = parts[3];
    let points = parts[4];
    let score = parts[5];
    if (location[0] !== "-"){
      type === "previous" ? setBoardCoords(updateBoard(location, play, "remove")) : setBoardCoords(updateBoard(location, play, "add"));
    } else{
      points = parts[2];
      score = parts[4];
    }
    type === "previous" ? setCurrentMove(currentMove - 1) : setCurrentMove(currentMove + 1);
    if (currentMove % 2 === (type === "previous" ? 1 : 0))
      setPlayer1points(score)
    else
      setPlayer2points(score)
    setPointsScored(points);
  }

  function randomizeGame(){
    setResetCount(resetCount + 1);
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
              <GoTriangleLeft className={styles.Arrows} onClick={() => handleMove(moves[currentMove - 1], "previous")}></GoTriangleLeft>
              <GoTriangleRight className={styles.Arrows} onClick={() => handleMove(moves[currentMove], "next")}></GoTriangleRight>
              <button className={styles.randomizeBtn} onClick={randomizeGame}>Randomize</button>
              <input type="number" className={styles.customInputNum} placeholder="num"></input>
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
