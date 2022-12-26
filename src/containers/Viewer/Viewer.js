import React, { useState, useEffect, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Typography from "@mui/material/Typography";
import styles from './Viewer.module.css';
import axios from 'axios';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import { GoQuestion, GoTriangleLeft, GoTriangleRight } from "react-icons/go";
import Modal from '@mui/material/Modal';

import cellType from "../../components/AppContent/Board/cellType.js";
import Cell from "../../components/AppContent/Board/Cell.js";
import { IoIosSettings } from "react-icons/io";

import { letterLookup, origPool, origBoard} from "../../components/AppContent/References/staticData.js";

export default function Viewer({ onChange }){
  const [gameArray, setGameArray] = useState("");
  const [gameNum, setGameNum] = useState(39600);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [boardClickCount, setBoardClickCount] = useState(0);
  const [moves, setMoves] = useState("");
  const [currentMoveCoords, setCurrentMoveCoords] = useState([]);
  const [boardCoords, setBoardCoords] = useState([]); 
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pointsScored, setPointsScored] = useState(0);
  const [pool, setPool] = useState(origPool);
  const [mode, setMode] = useState("VIEWER");
  const [resetCount, setResetCount] = useState(0);
  const [theme, setTheme] = useState("STANDARD");
  const [open, setOpen] = React.useState(false);
  const currentMoveRef = useRef(-1);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleThemeChange = event => {
    setTheme(event.target.value);
  };

  const style = {
    position: 'absolute',
    border: '5px solid rgb(173, 88, 39)',
    width: 'auto',
    outline: 'none',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    p: 4,
  };

  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const handleBoardClick = () => {
    setBoardClickCount(prevCount => prevCount + 1);
    let result = (Math.floor(boardClickCount / 10) % 10);
    let newMode = result % 2 === 0 ? "VIEWER" : "GUESSELO";
    if (mode !== newMode) {
      randomizeGame();
      setMode(newMode);
      onChange(newMode);
    }
  }

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setBoardCoords(parsedOrigBoardCoords); 
    setPlayer1points(0);
    setPlayer2points(0);
    setPointsScored(0);
    setPool(origPool);
    console.log(gameNum)
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
  }, [resetCount]);

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
    const letters = currentMoveCoords.filter(element => /^\s*[A-Za-z]\s*$/.test(element));
    let result = play;
    letters.forEach((letter, index) => {
      result = result.replace(".", "(" + letter + ")");
      result = result.replace(")(", "");
    });
    return result;
    
  }
  
  function createBoard() {
    return (
      boardCoords.map((row, rowIndex) => (
        row.map((col, colIndex) => {
          if (currentMoveCoords.some(coord => coord[0] === rowIndex && coord[1] === colIndex)) {  
            return Cell(rowIndex, colIndex, cellType(col, "flagged"), "board", theme);
          } else {
            return Cell(rowIndex, colIndex, cellType(col, "apple"), "board", theme);
          }
        })
      ))
    ); 
  }

  function createRack() {
    var move = moves[currentMoveRef.current + 1];
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
    let curMoveCoords = [];
    const locationParts = extractLoc(location);
    const part1 = locationParts[0]; 
    const part2 = locationParts[1];
    let i, coord1, coord2;
    if (Number.isInteger(Number(part1))) {
      // Horizontal play
      coord1 = part1 - 1;
      coord2 = letterLookup[part2.toUpperCase()] - 1; 
      for (i = 0; i < play.length; i++) {
        if (play[i] !== '.') {
          newBoardCoords[coord1][coord2 + i] = type === "add" ? play[i] : parsedOrigBoardCoords[coord1][coord2 + i];
          curMoveCoords.push([coord1, coord2 + i]);
        } else {
          curMoveCoords.push(boardCoords[coord1][coord2 + i]);
        }
      }
    } else {
      // Vertical play
      coord1 = part2 - 1;
      coord2 = letterLookup[part1.toUpperCase()] - 1;
      for (i = 0; i < play.length; i++) {
        if (play[i] !== '.') {
          newBoardCoords[coord1 + i][coord2] = type === "add" ? play[i] : parsedOrigBoardCoords[coord1 + i][coord2];
          curMoveCoords.push([coord1 + i, coord2]);
        } else {
          curMoveCoords.push(boardCoords[coord1 + i][coord2]);
        }
      }
    }
    console.log(curMoveCoords);
    setCurrentMoveCoords(curMoveCoords);
    return newBoardCoords;
  }

  function highlightPreviousMove(location, play){
    let curMoveCoords = [];
    const locationParts = extractLoc(location);
    const part1 = locationParts[0]; 
    const part2 = locationParts[1];
    let i, coord1, coord2;
    if (Number.isInteger(Number(part1))) {
      // Horizontal play
      coord1 = part1 - 1;
      coord2 = letterLookup[part2.toUpperCase()] - 1; 
      for (i = 0; i < play.length; i++) {
        if (play[i] !== '.') {
          curMoveCoords.push([coord1, coord2 + i]);
        } else {
          curMoveCoords.push(boardCoords[coord1][coord2 + i]);
        }
      }
    } else {
      // Vertical play
      coord1 = part2 - 1;
      coord2 = letterLookup[part1.toUpperCase()] - 1;
      for (i = 0; i < play.length; i++) {
        if (play[i] !== '.') {
          curMoveCoords.push([coord1 + i, coord2]);
        } else {
          curMoveCoords.push(boardCoords[coord1 + i][coord2]);
        }
      }
    }
    setCurrentMoveCoords(curMoveCoords);
  }
  
  function handleMove(lastMove, thisMove, nextMove, type) {
    console.log("USEREF", currentMoveRef.current);
    console.log("USEREF lastmove", lastMove);
    console.log("USEREF thismove", thisMove);
    console.log("USEREF nextmove", nextMove);
  
    const moves = [
      { move: lastMove, parts: lastMove ? lastMove.split(" ") : null, location: null, play: null, points: null, score: null },
      { move: thisMove, parts: thisMove ? thisMove.split(" ") : null, location: null, play: null, points: null, score: null },
      { move: nextMove, parts: nextMove ? nextMove.split(" ") : null, location: null, play: null, points: null, score: null }
    ];

    //lastMove = lastMove.replace(/\s+/g, ' ');
    //thisMove = thisMove.replace(/\s+/g, ' ');
    //nextMove = nextMove.replace(/\s+/g, ' ');

    moves.forEach(move => {
      move.location = move.parts ? move.parts[2] : null;
      move.play = move.parts ? move.parts[3] : null;
      move.points = move.parts ? move.parts[4] : null;
      move.score = move.parts ? move.parts[5] : null;
    });

    if (type === "previous"){
      if (moves[2].location[0] === null){

      }
      else if (moves[2].location[0] !== "-"){
        setBoardCoords(updateBoard(moves[2].location, moves[2].play, "remove")) 
        highlightPreviousMove(moves[1].location, moves[1].play);
      }
      else {
        moves[2].points = moves[2].parts[2];
        moves[2].score = moves[2].parts[4];
      }
      if (currentMoveRef.current % 2 === 1) {
        setPlayer1points(moves[0].score)
      } else {
        setPlayer2points(moves[0].score)
      } 
    } else {
      if (moves[1].location[0] === null){

      }
      else if (moves[1].location[0] !== "-"){
        setBoardCoords(updateBoard(moves[1].location, moves[1].play, "add"));
      }
      else {
        moves[1].points = moves[1].parts[2];
        moves[1].score = moves[1].parts[4];
      }
      if (currentMoveRef.current % 2 === 0) {
        setPlayer1points(moves[1].score)
      } else {
        setPlayer2points(moves[1].score)
      } 
    }
    setPointsScored(moves[1].points);
  }

  function randomizeGame(){
    currentMoveRef.current = -1;
    setResetCount(resetCount + 1);
    let randomNumber = getRandomNumber(10000, 40000).toString();
    setGameNum(randomNumber);
  }

  function chooseGame(event){
    event.preventDefault();
    setResetCount(resetCount + 1);
    setGameNum(event.target.elements.num.value);
  };

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <select className={styles.styleSelection} value={theme} onChange={handleThemeChange}>
            <option value="STANDARD">Standard</option>
            <option value="APPLE">Apple</option>
          </select>
        </Box>
      </Modal>
      <Box className={styles.page}>
      <Box className={styles.title}>
        {mode === "VIEWER" ? "Annotated Game Viewer" : "Guess the Elo!"} <GoQuestion className={styles.questionMark}></GoQuestion>
      </Box>
      <Box className={styles.mainPanel}>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Board onBoardChildClick={handleBoardClick} board={createBoard()} points={pointsScored} theme={theme} move={getMove(moves[currentMoveRef.current])}/>   
        </Box>

        <Box className={styles.rightPanel}>
          <Box className={styles.topPlayerPanel}>
            <Box className={styles.playerPanel}>
              {mode === "VIEWER" ? player1 : "Player 1"} 
              <Box className={styles.Rack} sx={{visibility: (currentMoveRef.current + 1) % 2 === 1 ? 'hidden' : 'visible'}}>
                <Rack board={createRack()}/> 
              </Box> 
              <Box>
                {player1points} points
              </Box>
            </Box>  
            <Box className={styles.playerPanel}>
            {mode === "VIEWER" ? player2 : "Player 2"} 
              <Box className={styles.Rack} sx={{visibility: (currentMoveRef.current + 1) % 2 === 0 ? 'hidden' : 'visible'}}>
                <Rack sx={{display: "none !important"}} board={createRack()}/>  
              </Box>
              <Box>
                {player2points} points
              </Box>
            </Box>  
            <Box className={`${styles.playerPanel} ${styles.playerToggle}`}>
              <GoTriangleLeft className={styles.Arrows} onClick={() => {if (currentMoveRef.current > -1) {currentMoveRef.current -= 1; handleMove(moves[currentMoveRef.current - 1] /*last move*/, moves[currentMoveRef.current] /*this move*/, moves[currentMoveRef.current + 1] /*next move*/, "previous");}}}></GoTriangleLeft>
              <GoTriangleRight className={styles.Arrows} onClick={() => {currentMoveRef.current += 1; handleMove(moves[currentMoveRef.current - 1] /*last move*/, moves[currentMoveRef.current] /*this move*/, moves[currentMoveRef.current + 1] /*next move*/, "next");}}></GoTriangleRight>
              <button className={styles.randomizeBtn} onClick={randomizeGame}>random</button>
              <IoIosSettings onClick={handleOpen} className={styles.settingsBtn}/>
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
