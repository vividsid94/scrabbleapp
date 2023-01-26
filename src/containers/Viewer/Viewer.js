import React, { useState, useEffect, useRef } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './Viewer.module.css';
import axios from 'axios';
import Board from "../../components/AppContent/Board/Board.js";
import Rack from "../../components/AppContent/Board/Rack.js";
import Pool from "../../components/AppContent/Board/Pool.js";
import Modal from '@mui/material/Modal';

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import { letterLookup, origPool, origBoard } from "../../components/AppContent/References/staticData.js";  
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import GroupIcon from '@mui/icons-material/Group';
import LaunchIcon from '@mui/icons-material/Launch';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HistoryIcon from '@mui/icons-material/History';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { getMoveSet, getRecentGameInfo, getGameInfo } from "../../axios/api.js";
import { getMove, highlightPreviousMove, updateBoard, createBoard } from "../../functions/boardFunctions.js";
import { addToPool, removeFromPool } from "../../functions/poolFunctions.js";
import { createRack } from "../../functions/rackFunctions.js";

export default function Viewer({ onChange }){
  const [gameNum, setGameNum] = useState(27775 /*- Josh*/ /*36230 Nigel*/);
  const [boardClickCount, setBoardClickCount] = useState(0);
  const [moveSet, setMoveSet] = useState("");
  const [currentMoveCoords, setCurrentMoveCoords] = useState([]);
  const [boardCoords, setBoardCoords] = useState([]); 
  const [player1points, setPlayer1points] = useState(0);
  const [player2points, setPlayer2points] = useState(0);
  const [pointsScored, setPointsScored] = useState(0);
  const [pool, setPool] = useState(origPool);
  const [mode, setMode] = useState("VIEWER");
  const [resetCount, setResetCount] = useState(0);
  const [theme, setTheme] = useState("STANDARD");
  const [tiles, setTiles] = useState("PROTILES");
  const [dictionary, setDictionary] = useState("ANY");
  const [open, setOpen] = useState(false);
  const [gameDictionary, setGameDictionary] = useState("Loading...")
  const currentMoveRef = useRef(-1);
  const handleClose = () => setOpen(false);
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [revealedName1, setRevealedName1] = useState('Player 1');
  const [revealedName2, setRevealedName2] = useState('Player 2');
  const [revealedElo, setRevealedElo] = useState("");
  const [revealedElo2, setRevealedElo2] = useState("");
  const [tourneyNum, setTourneyNum] = useState(0);
  const [unlockEloMode, setUnlockEloMode] = useState(false);
  const [showUnlockText, setShowUnlockText] = useState(false);
  const [origPlayerRaw, setOrigPlayerRaw] = useState("");
  const [notes, setNote] = useState([])

  const [recentNames, setRecentNames] = useState([]);
  const [recentDictionaries, setRecentDictionaries] = useState([]);
  const [recentGameNums, setRecentGameNums] = useState([]);

  const handleDictionaryChange = event => {
    setDictionary(event.target.value);
  };
  const handleThemeChange = event => {
    setTheme(event.target.value);
  };
  const handleTileChange = event => {
    setTiles(event.target.value);
  };
  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const handleBoardClick = () => {
    setBoardClickCount(prevCount => prevCount + 1);
    if (boardClickCount >= 5) {
      setUnlockEloMode(true);
    }
  }

  const switchMode = () => {
    let newMode = mode === "GUESSELO" ? "VIEWER" : "GUESSELO";
    if (mode !== newMode) {
      randomizeGame();
      setMode(newMode);
      onChange(newMode);
    }
  }

  useEffect(() => {
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    document.title = 'Game Viewer';
    setBoardCoords(parsedOrigBoardCoords); 
    setPlayer1points(0);
    setPlayer2points(0);
    setPointsScored(0);
    setRevealedName1("Player 1");
    setRevealedName2("Player 2");
    setRevealedElo("");
    setRevealedElo2("");
    setPool(origPool);
    setRecentNames([]);
    setRecentDictionaries([]);
    const loadMoveSet = async () => {
        const moveRes = await getMoveSet('https://www.cross-tables.com/annotated/selfgcg/', gameNum);
        setMoveSet(moveRes[0])
        setOrigPlayerRaw(moveRes[1])
        setNote(moveRes[2])
    };
    const loadRecentGameInfo = async () => {
        const infoRes = await getRecentGameInfo('https://www.cross-tables.com/annolistself.php');
        setRecentNames(infoRes[0])
        setRecentDictionaries(infoRes[1])
        setRecentGameNums(infoRes[2])
    };
    const loadGameInfo = async () => {
      let text = await getGameInfo('https://www.cross-tables.com/annotated.php?u=', gameNum);
      const startIndex = text.indexOf('<p>Dictionary: <b>');
      if (startIndex !== -1) {
        const endIndex = text.indexOf('</b>', startIndex);
        if (endIndex !== -1) {
          const extractedText = text.substring(startIndex + 18, endIndex);
          if (dictionary === "TWL" && !(extractedText.startsWith("TWL") || extractedText.startsWith("NWL"))){
            randomizeGame();
          }
          else if (dictionary === "CSW" && !extractedText.startsWith("CSW")){
            randomizeGame();
          }
          else{
            console.log("FINISHED")
          }
          setGameDictionary(extractedText);
        }
      }

      const regex = /<tr><td>([^<]+)<\/td>/g;
      const matches = text.matchAll(regex);
      let i = 0;
      for (const match of matches) {
        if (i === 0) {
          setName1(match[1]);
        } else if (i === 1) {
          setName2(match[1]);
        }
        i++;
      }

      let matchTourney = text.match(/<a href='tourney\.php\?t=(\d+)'>/);
      let tourneyNumber = 0;
      if (matchTourney)
        tourneyNumber = matchTourney[1];
      setTourneyNum(tourneyNumber);
    };

    loadMoveSet();
    loadRecentGameInfo();
    loadGameInfo();
  }, [resetCount]);
  
  const updateBoardShortcut = (boardProperties) => {
    const board = updateBoard(boardProperties);
    setCurrentMoveCoords(board[0]);
    return board[1];
  };
  
  function handleMove(lastMove, thisMove, nextMove, type) {
    lastMove = lastMove ? lastMove.replace(/\s+/g, ' ') : lastMove;
    thisMove = thisMove ? thisMove.replace(/\s+/g, ' ') : thisMove;
    nextMove = nextMove ? nextMove.replace(/\s+/g, ' ') : nextMove;
    console.log("MOVE", currentMoveRef.current);
    console.log("MOVE lastmove", lastMove);
    console.log("MOVE thismove", thisMove);
    console.log("MOVE nextmove", nextMove);
    console.log("------------------------------------------")
  
    const moves = {
      lastmove: { move: lastMove, parts: lastMove ? lastMove.split(" ") : null, location: null, play: null, points: null, score: null },
      thismove: { move: thisMove, parts: thisMove ? thisMove.split(" ") : null, location: null, play: null, points: null, score: null },
      nextmove: { move: nextMove, parts: nextMove ? nextMove.split(" ") : null, location: null, play: null, points: null, score: null }
    };

    for (const id in moves) {
      const move = moves[id];
      move.location = move.parts ? move.parts[2] : null;
      move.play = move.parts ? move.parts[3] : null;
      move.points = move.parts ? move.parts[4] : null;
      move.score = move.parts ? move.parts[5] : null;
    }    

    if (type === "previous"){
      let moveName = thisMove ? moves['thismove'].parts[0] : 'empty';
      let nextMoveName = nextMove ? moves['nextmove'].parts[0] : 'empty';
      let firstMovePlayerName = moveSet[0].split(" ")[0];
      let thisMovePlayerName = thisMove ? moves['thismove'].parts[0] : 'empty';
      if (moveName === nextMoveName && moves['thismove'].location === "--"){
        let props = {location: moves['thismove'].location, play: moves['thismove'].play, type: "add", boardCoords: boardCoords, origBoard: origBoard};
        setBoardCoords(updateBoardShortcut({...props}));
        setPool(removeFromPool(moves['thismove'].play, pool));
      }
      else if (moves['nextmove'].location[0] === null){

      }
      else if (moves['nextmove'].location[0] !== "-"){
        let props = {location: moves['nextmove'].location, play: moves['nextmove'].play, type: "remove", boardCoords: boardCoords, origBoard: origBoard};
        setBoardCoords(updateBoardShortcut({...props}))
        if (moves['thismove'].move !== undefined && moves['thismove'].location[0] !== "-"){
          setCurrentMoveCoords(highlightPreviousMove(moves['thismove'].location, moves['thismove'].play, boardCoords));
        }
        if (moveName !== nextMoveName)
          setPool(addToPool(moves['nextmove'].play, pool));
      }
      else if (moves['nextmove'].location === "--"){
        let props = {location: moves['thismove'].location, play: moves['thismove'].play, type: "add", boardCoords: boardCoords, origBoard: origBoard};
        setBoardCoords(updateBoardShortcut({...props}));
        setPool(removeFromPool(moves['thismove'].play, pool));
      }
      else {
        moves['nextmove'].points = moves['nextmove'].parts[2];
        moves['nextmove'].score = moves['nextmove'].parts[4];
      }
      if (moveName !== nextMoveName) {
        if (thisMovePlayerName === firstMovePlayerName)
          setPlayer2points(lastMove ? moves['lastmove'].score : 0)
        else
          setPlayer1points(lastMove ? moves['lastmove'].score : 0)
      } else {
        if (thisMovePlayerName === firstMovePlayerName)
          setPlayer2points(lastMove ? moves['lastmove'].score : 0)
        else
          setPlayer1points(lastMove ? moves['lastmove'].points : 0)
      } 

    } else {
      let moveName = thisMove ? moves['thismove'].parts[0] : 'empty';
      let lastMoveName = lastMove ? moves['lastmove'].parts[0] : 'empty';
      let firstMovePlayerName = moveSet[0].split(" ")[0];
      let thisMovePlayerName = moves['thismove'].parts[0];
      if (moveName === lastMoveName && moves['thismove'].location === "--"){
        let props = {location: moves['lastmove'].location, play: moves['lastmove'].play, type: "remove", boardCoords: boardCoords, origBoard: origBoard};
        setBoardCoords(updateBoardShortcut({...props}));
        setPool(addToPool(moves['lastmove'].play, pool));
      }
      else if (moveName === lastMoveName && moves['thismove'].location !== "--"){
        moves['thismove'].score = moves['thismove'].play;
      }
      else if (moves['thismove'].location[0] === null){

      }
      else if (moves['thismove'].location[0] !== "-"){
        let props = {location: moves['thismove'].location, play: moves['thismove'].play, type: "add", boardCoords: boardCoords, origBoard: origBoard};
        setBoardCoords(updateBoardShortcut({...props}));
        setPool(removeFromPool(moves['thismove'].play, pool));
      }
      else {
        moves['thismove'].points = moves['thismove'].parts[2];
        moves['thismove'].score = moves['thismove'].parts[4];
      }
      if (moveName !== lastMoveName) {
        if (thisMovePlayerName === firstMovePlayerName)
          setPlayer1points(moves['thismove'].score)
        else
          setPlayer2points(moves['thismove'].score)
      } else {
        if (thisMovePlayerName === firstMovePlayerName)
          setPlayer1points(moves['thismove'].score)
        else
          setPlayer2points(moves['thismove'].points)
      } 
    }
    setPointsScored(moves['thismove'].points);
  }

  function randomizeGame(){
    currentMoveRef.current = -1;
    setResetCount(resetCount + 1);
    let randomNumber = getRandomNumber(10000, 40000).toString();
    setGameNum(randomNumber);
  }

  function chooseGame(gameNum){
    currentMoveRef.current = -1;
    setResetCount(resetCount + 1);
    setGameNum(gameNum);
  };

  function revealPlayers(){
    setRevealedName1(name1);
    setRevealedName2(name2);
  }

  function beginningOfGame(){
    let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
    setBoardCoords(parsedOrigBoardCoords); 
    currentMoveRef.current = -1;
    setPool(origPool);
  }

  function revealElo(){
    console.log(tourneyNum);
    if (tourneyNum != 0){
      axios.get('https://cross-tables.com/rest/tourney.php?tourney=' + tourneyNum + '&results=1')
      .then((posRes)=>{
          let sampleData = posRes.data;
          let result = sampleData.tourney.results.find(
            result => result.playername === name1
          );
          let result2 = sampleData.tourney.results.find(
            result => result.playername === name2
          );
          if (result) {
            setRevealedElo(result.oldrating + " at event");
          }
          if (result) {
            setRevealedElo2(result2.oldrating + " at event");
          }
      },(errRes)=>{
          console.log(errRes)
      })
    }
    else{
      axios.get('https://cross-tables.com/rest/players.php?search=' + name1)
      .then((posRes)=>{
          let sampleData = posRes.data;
          for (let player of sampleData.players) {
            if (player.name === name1) {
              setRevealedElo(player.twlrating + " currently");
            }
          }
      },(errRes)=>{
          console.log(errRes)
      })
      axios.get('https://cross-tables.com/rest/players.php?search=' + name2)
      .then((posRes)=>{
          let sampleData = posRes.data;
          for (let player of sampleData.players) {
            if (player.name === name2) {
              setRevealedElo2(player.twlrating + " currently");
            }
          }
      },(errRes)=>{
          console.log(errRes)
      })
    }
  }

  function RecentGames() {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [gamesPerPage, setGamesPerPage] = React.useState(10);
  
    const matches = useMediaQuery('(max-width:676px)');
  
    React.useEffect(() => {
      if (matches) {
        setGamesPerPage(5);
      } else {
        setGamesPerPage(10);
      }
    }, [matches]);
  
    const handlePageChange = (event, value) => {
      setCurrentPage(value);
    };
  
    const startIndex = (currentPage - 1) * gamesPerPage;
    const endIndex = startIndex + gamesPerPage;
    const currentGames = recentDictionaries.slice(startIndex, endIndex);
    return (
      <div>
        <Typography
          variant="h8"
          id="tableTitle"
          component="div"
        >
          Recent Games
        </Typography>
        <Table className={styles.recentGames}>
          <TableHead>
            <TableRow>
              <TableCell>Game</TableCell>
              <TableCell>Dictionary</TableCell>
              <TableCell>Players</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentGames.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <VisibilityOutlinedIcon className={styles.keyBtnSmall} target="_blank" onClick={() => chooseGame(recentGameNums[startIndex + index], handleClose())}/>
                  <LaunchIcon className={styles.keyBtnSmall} onClick={() => window.open(`https://www.cross-tables.com/annotated.php?u=${recentGameNums[startIndex + index]}`, '_blank')}/>
                </TableCell>
                <TableCell>{recentDictionaries[startIndex + index]}</TableCell>
                <TableCell>{recentNames[startIndex + index + 1]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          sx={{marginTop: '20px'}}
          count={Math.ceil(recentDictionaries.length / gamesPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color='primary'
        />
      </div>
    );
  }

  const [modalContent, setModalContent] = useState("dictionaryTiles")
  
  const handleDictionaryTilesOpen = () => {
    setModalContent("dictionaryTiles")
    setOpen(true);
  };

  const handleRecentGamesOpen = () => {
    setModalContent("recentGames")
    setOpen(true);
  };
  
  const SettingsContent = () => (
    <>
      <Box className={styles.modalContainer__dictionary}>
        Dictionary
        {<select className={styles.styleSelection} value={dictionary} onChange={handleDictionaryChange}>
          <option value="ANY">Any</option>
          <option value="TWL">TWL/NWL</option>
          <option value="CSW">CSW</option>
        </select>}
      </Box>
      <Box className={styles.modalContainer__tiles}>
        Tiles
        {<select className={styles.styleSelection} value={tiles} onChange={handleTileChange}>
          <option value="PROTILES">Protiles</option>
          <option value="LETTERS">Letters</option>
        </select>}
      </Box>
    </>
  );
  
  const RecentGamesContent = () => (
    <>
      {RecentGames()}
    </>
  );

  const iconList = [  {icon: KeyboardDoubleArrowLeftIcon, onClick: beginningOfGame},  {icon: KeyboardArrowLeftIcon, onClick: () => {if (currentMoveRef.current > -1) {currentMoveRef.current -= 1; handleMove(moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "previous");}}},
    {icon: KeyboardArrowRightIcon, onClick: () => {if (currentMoveRef.current + 1 < moveSet.length) currentMoveRef.current += 1; handleMove(moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "next");}},
    {icon: SettingsOutlinedIcon, onClick: handleDictionaryTilesOpen},
    {icon: FiberNewIcon, onClick: randomizeGame},
    {icon: SwapHorizIcon, onClick: () => (!unlockEloMode ? setShowUnlockText(true) : switchMode()),condition: {color: !unlockEloMode ? 'transparent' : 'white', background: !unlockEloMode ? 'repeating-linear-gradient(45deg, #3D3B35, #3D3B35 5px, #767266 5px, #767266 10px)' : 'none'}}
  ]

  const revealBoxList = [
    {icon: GroupIcon, onClick: revealPlayers,condition: {display: mode === "GUESSELO" ? 'flex' : 'none'}},
    {icon: Typography, onClick: revealElo, text: 'Elo',condition: {display: mode === "GUESSELO" ? 'flex' : 'none'}},
    {icon: HistoryIcon, onClick: handleRecentGamesOpen,condition: {display: mode !== "GUESSELO" ? 'flex' : 'none'}},
    {icon: LaunchIcon, onClick: () => window.open('https://www.cross-tables.com/annotated.php?u=' + gameNum, '_blank')}
  ]

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className={styles.modalContainer}>
          {modalContent === "dictionaryTiles" && <SettingsContent />}
          {modalContent === "recentGames" && <RecentGamesContent />}
        </Box>
      </Modal>  
      <Box className={styles.page}>
      <Box className={styles.title}>
        {mode === "VIEWER" ? "Annotated Game Viewer" : "Guess the Elo!"}
      </Box>
      <Box className={styles.mainPanel}>
        <Box className={styles.mainBox} component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Board onBoardChildClick={handleBoardClick} dictionary={gameDictionary} board={createBoard(boardCoords, currentMoveCoords, tiles, theme)} points={pointsScored} theme={theme} move={getMove(moveSet[currentMoveRef.current], currentMoveCoords)} lastMove={currentMoveRef.current >= moveSet.length - 1}/>   
        </Box>

        <Box className={styles.rightPanel}>
          <Box className={styles.topPlayerPanel}>
            <Box sx={{flexDirection: 'column', lineHeight: '0px'}} className={`${styles.playerPanel}`}>
            <Box className={styles.playerToggle}>
              {iconList.map((icon, index) => (
                <icon.icon key={index}
                  className={styles.Arrows} 
                  onClick={icon.onClick}
                  sx={icon.condition}
                />
              ))}
            </Box>
              <Box sx={{display: showUnlockText && !unlockEloMode ? 'flex' : 'none'}} className={styles.unlockText}>
                Hit the board {6 - boardClickCount} {(6 - boardClickCount) === 1 ? 'more time' : 'more times'} to unlock me!
              </Box>
              <Box className={`${styles.playerPanel} ${styles.playerToggle}`}>
                {revealBoxList.map((box, index) => (
                  <Box key={index} className={styles.revealBox} sx={box.condition}>
                    <box.icon 
                      className={styles.keyBtn} 
                      onClick={box.onClick}
                    >
                      {box.text}
                    </box.icon>
                  </Box>
                ))}
              </Box>
            </Box> 
            <Box className={styles.playerPanel}>
              {mode === "VIEWER" ? name1 : revealedName1}{revealedElo ? ", " + revealedElo : ''}
              <Box className={styles.Rack}>
                {(moveSet[currentMoveRef.current + 1] ? moveSet[currentMoveRef.current + 1].split(':')[0] : 'null') === origPlayerRaw ? 
                  <Rack board={createRack(moveSet, currentMoveRef.current)} tiles={tiles}/> : null}
              </Box> 
              <Box>
                {player1points} points
              </Box>
              <Box className={styles.playerPanel}>
                {mode === "VIEWER" ? name2 : revealedName2}{revealedElo2 ? ", " + revealedElo2 : ''}
                <Box className={styles.Rack}>
                  {(moveSet[currentMoveRef.current + 1] ? moveSet[currentMoveRef.current + 1].split(':')[0] : 'null') !== origPlayerRaw ? 
                    <Rack board={createRack(moveSet, currentMoveRef.current)} tiles={tiles}/> : null}
                </Box>
                <Box>
                  {player2points} points
                </Box>
              </Box> 
            </Box> 
          </Box>
          <Box className={styles.playerPanel}>
            <Box className={styles.poolBox}>
              <Pool board={pool} rack={createRack(moveSet, currentMoveRef.current)}/>  
            </Box>
            <Box className={styles.playerPanel}>
              {notes.map(([note, moveNumber], index) => (
                <Box className={styles.commentaryBox} key={index} style={{ display: currentMoveRef.current + 1 === moveNumber && mode === "VIEWER" ? 'block' : 'none' }}>
                  "{note}"
                </Box>
              ))}
            </Box>  
          </Box>  
        </Box>
      </Box>  
      </Box>   
    </Box>
  )
}
