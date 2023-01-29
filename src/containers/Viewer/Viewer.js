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
import YoutubeSearchedForIcon from '@mui/icons-material/YoutubeSearchedFor';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { getMoveSet, getRecentGameInfo, getGameInfo, getGibsonGameInfo, findPlayerId } from "../../axios/api.js";
import { getMove, highlightPreviousMove, updateBoard, createBoard } from "../../functions/boardFunctions.js";
import { addToPool, removeFromPool } from "../../functions/poolFunctions.js";
import { createRack } from "../../functions/rackFunctions.js";
import { TextField } from "@mui/material";

export default function Viewer({ onChange }){
  const [gameNum, setGameNum] = useState(27775);
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
  const [ELOCommentary, setELOCommentary] = useState("NO");
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

  const gibsonMode = useRef("");
  const [showUnlockText, setShowUnlockText] = useState(false);
  const [origPlayerRaw, setOrigPlayerRaw] = useState("");
  const [notes, setNote] = useState([]);
  const [gamesViewed, setGamesViewed] = useState([]);

  const [recentNames, setRecentNames] = useState([]);
  const [recentDictionaries, setRecentDictionaries] = useState([]);
  const [recentGameNums, setRecentGameNums] = useState([]);
  const [gibsonGameNums, setGibsonGameNums] = useState([]);

  const flag = useRef("false");

  const textFieldRef = useRef(null);
  const swtichValue = (event) => {
    setDictionary("ANY");
  }
  const handleGibsonMode = (event) => {
    gibsonMode.current = event.target.value;
  };
  const handleDictionaryChange = event => {
    setDictionary(event.target.value);
    gibsonMode.current = "";
  };
  const handleELOCommentaryChange = event => {
    setELOCommentary(event.target.value);
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
          else if (extractedText === null){
            randomizeGame();
          }
          else{
            setGamesViewed([...gamesViewed, gameNum]);
            console.log("FINISHED");
            setTimeout(() => {
              setOpen(false);
            }, "1000")
          }
          setGameDictionary(extractedText);
        }
      }
      else{
        randomizeGame();
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
  
  function handleMove(superLastMove, lastMove, thisMove, nextMove, type) {
    superLastMove = superLastMove ? superLastMove.replace(/\s+/g, ' ') : superLastMove;
    lastMove = lastMove ? lastMove.replace(/\s+/g, ' ') : lastMove;
    thisMove = thisMove ? thisMove.replace(/\s+/g, ' ') : thisMove;
    nextMove = nextMove ? nextMove.replace(/\s+/g, ' ') : nextMove;
    console.log("MOVE", currentMoveRef.current);
    console.log("MOVE superlastmove", superLastMove);
    console.log("MOVE lastmove", lastMove);
    console.log("MOVE thismove", thisMove);
    console.log("MOVE nextmove", nextMove);
    console.log("------------------------------------------")
  
    const moves = {
      superlastmove: { move: superLastMove, parts: superLastMove ? superLastMove.split(" ") : null, location: null, play: null, points: null, score: null },
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
      let lastMoveName = lastMove ? moves['lastmove'].parts[0] : 'empty';
      let nextMoveName = nextMove ? moves['nextmove'].parts[0] : 'empty';
      let firstMovePlayerName = moveSet[0].split(" ")[0];
      let thisMovePlayerName = thisMove ? moves['thismove'].parts[0] : 'empty';
      if (moveName === nextMoveName && moves['thismove'].location === "--"){
        //console.log("CONDITION 1")
        let props = {location: moves['thismove'].location, play: moves['thismove'].play, type: "add", boardCoords: boardCoords, origBoard: origBoard};
        setBoardCoords(updateBoardShortcut({...props}));
        setPool(removeFromPool(moves['thismove'].play, pool));
      }
      else if (moves['nextmove'].location[0] === null){
        //console.log("CONDITION 2")
      }
      else if (moves['nextmove'].location[0] !== "-"){
        //console.log("CONDITION 3")
        let props = {location: moves['nextmove'].location, play: moves['nextmove'].play, type: "remove", boardCoords: boardCoords, origBoard: origBoard};
        setBoardCoords(updateBoardShortcut({...props}))
        if (moves['thismove'].move !== undefined && moves['thismove'].location[0] !== "-"){
          setCurrentMoveCoords(highlightPreviousMove(moves['thismove'].location, moves['thismove'].play, boardCoords));
        }
        if (moveName !== nextMoveName)
          setPool(addToPool(moves['nextmove'].play, pool));
      }
      else if (moves['nextmove'].location === "--"){
        //console.log("CONDITION 4")
        let props = {location: moves['thismove'].location, play: moves['thismove'].play, type: "add", boardCoords: boardCoords, origBoard: origBoard};
        setBoardCoords(updateBoardShortcut({...props}));
        setPool(removeFromPool(moves['thismove'].play, pool));
      }
      else {
        //console.log("CONDITION 5")
        moves['nextmove'].points = moves['nextmove'].parts[2];
        moves['nextmove'].score = moves['nextmove'].parts[4];
      }
      if (moveName !== nextMoveName) {
        if (thisMovePlayerName === firstMovePlayerName){
          //console.log("CONDITION A")
          setPlayer2points(lastMove ? (moves['lastmove'].score ? moves['lastmove'].score : moves['lastmove'].points) : 0)
        }
        else{
          //console.log("CONDITION B")
          if (moveName !== lastMoveName) {
            setPlayer1points(lastMove ? (moves['lastmove'].score ? moves['lastmove'].score : moves['lastmove'].points) : 0)
          } else{
            setPlayer1points(superLastMove ? moves['superlastmove'].score : 0)
          }
        }
      } else {
        if (thisMovePlayerName === firstMovePlayerName){
          //console.log("CONDITION C")
          setPlayer1points(moves['thismove'].score)
        }
        else{
          //console.log("CONDITION D")
          setPlayer2points(moves['thismove'].score)
        }
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
          setPlayer1points(moves['thismove'].score ? moves['thismove'].score : moves['thismove'].points)
        else
        {
          setPlayer2points(moves['thismove'].points ? moves['thismove'].points : moves['thismove'].score);
        }
      } 
    }
    setPointsScored(moves['thismove'].points);
  }

  function randomizeGame(){
    setOpen(true);
    setModalContent("loading");
    const loadGibsonGameInfo = async () => {
      const info = gibsonMode.current ? await getGibsonGameInfo('https://cross-tables.com/rest/players.php?search=', 'https://www.cross-tables.com/anno.php?p=', gibsonMode.current) : null;
      let randomNumber;
      if (info){
        let randomIndex = Math.floor(Math.random() * info.length);
        randomNumber = info[randomIndex];
      } else{
        randomNumber = getRandomNumber(10000, 40000).toString();
      }
      currentMoveRef.current = -1;
      setResetCount(resetCount + 1);
      setGameNum(randomNumber);
    };
    loadGibsonGameInfo();
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

  function GamesHistory() {
    const [gamesPerPage, setGamesPerPage] = React.useState(5);
    const matches = useMediaQuery('(max-width:676px)');
  
    React.useEffect(() => {
      if (matches) {
        setGamesPerPage(5);
      }
    }, [matches]);
  
    const currentGames = gamesViewed.slice(-gamesPerPage).reverse();
    return (
      <div>
        <Typography
          variant="h8"
          id="tableTitle"
          component="div"
          sx={{padding: '8px'}}
        >
          <b>Most recent games you <br></br>viewed this session</b>
        </Typography>
        <Table className={styles.recentGames}>
          <TableHead>
            <TableRow>
              <TableCell sx={{padding: '8px !important'}}>Game</TableCell>
              <TableCell sx={{padding: '8px !important'}}>Number</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentGames.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{display: 'flex'}}>
                    <VisibilityOutlinedIcon className={styles.keyBtnSmall} target="_blank" onClick={() => chooseGame(currentGames[index], handleClose())}/>
                    <LaunchIcon className={styles.keyBtnSmall} onClick={() => window.open(`https://www.cross-tables.com/annotated.php?u=${currentGames[index]}`, '_blank')}/>
                  </Box>
                </TableCell>
                <TableCell>
                  {currentGames[index]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  function LoadingL() {
    return (
      <div>
        Loading...
      </div>
    );
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
          sx={{padding: '8px'}}
        >
          <b>Recent XT Games {mode === "GUESSELO" ? "(names hidden in this mode!)" : ""}</b>
        </Typography>
        <Table className={styles.recentGames}>
          <TableHead>
            <TableRow>
              <TableCell sx={{padding: '8px !important'}}>Game</TableCell>
              <TableCell sx={{padding: '8px !important'}}>Dictionary</TableCell>
              <TableCell sx={{padding: '8px !important'}}>Players</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentGames.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{display: 'flex'}}>
                    <VisibilityOutlinedIcon className={styles.keyBtnSmall} target="_blank" onClick={() => chooseGame(recentGameNums[startIndex + index], handleClose())}/>
                    <LaunchIcon className={styles.keyBtnSmall} onClick={() => window.open(`https://www.cross-tables.com/annotated.php?u=${recentGameNums[startIndex + index]}`, '_blank')}/>
                  </Box>
                </TableCell>
                <TableCell>{recentDictionaries[startIndex + index]}</TableCell>
                <TableCell style={{color: mode !== "VIEWER" ? "transparent" : "black", background: mode !== "VIEWER" ? 'repeating-linear-gradient(45deg, #3D3B35, #3D3B35 5px, #767266 5px, #767266 10px)' : 'none'}}>{recentNames[startIndex + index + 1]}</TableCell>
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

  const handleGamesHistoryOpen = () => {
    setModalContent("gamesHistory")
    setOpen(true);
  };
  
  const SettingsContent = () => { 
    flag.current = "false";
    return (
    <>
      <Box className={styles.modalContainer__dictionary}>
        Dictionary
        {<select className={styles.styleSelection} value={dictionary} onChange={handleDictionaryChange}>
          <option value="ANY">Any</option>
          <option value="TWL">TWL/NWL</option>
          <option value="CSW">CSW</option>
        </select>}
      </Box>
      <Box className={styles.modalContainer__dictionary}>
        Tiles
        {<select className={styles.styleSelection} value={tiles} onChange={handleTileChange}>
          <option value="PROTILES">Protiles</option>
          <option value="LETTERS">Letters</option>
        </select>}
      </Box>
      <Box className={styles.modalContainer__dictionary}>
        Commentary always on?
        {<select className={styles.styleSelection} value={ELOCommentary} onChange={handleELOCommentaryChange}>
          <option value="NO">No</option>
          <option value="YES">Yes</option>
        </select>}
      </Box>
      <Box className={styles.modalContainer__tiles}>
        Favorite player? You'll <br>
        </br>only generate their games.
        <TextField autoComplete="off" placeholder={gibsonMode.current} onFocus={(event) => swtichValue(event)} onChange={(event) => handleGibsonMode(event)} />
      </Box>
    </>
    )
};
  
  const RecentGamesContent = () => (
    <>
      {RecentGames()}
    </>
  );

  const GamesHistoryContent = () => (
    <>
      {GamesHistory()}
    </>
  );


  const Loading = () => (
    <>
      {LoadingL()}
    </>
  );

  const iconList = [  {icon: KeyboardDoubleArrowLeftIcon, onClick: beginningOfGame},  {icon: KeyboardArrowLeftIcon, onClick: () => {if (currentMoveRef.current > -1) {currentMoveRef.current -= 1; handleMove(moveSet[currentMoveRef.current - 2], moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "previous");}}},
    {icon: KeyboardArrowRightIcon, onClick: () => {if (currentMoveRef.current + 1 < moveSet.length) currentMoveRef.current += 1; handleMove(moveSet[currentMoveRef.current - 2], moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "next");}},
    {icon: SettingsOutlinedIcon, onClick: handleDictionaryTilesOpen},
    {icon: FiberNewIcon, onClick: randomizeGame},
    {icon: SwapHorizIcon, onClick: () => (!unlockEloMode ? setShowUnlockText(true) : switchMode()),condition: {color: !unlockEloMode ? 'transparent' : 'white', background: !unlockEloMode ? 'repeating-linear-gradient(45deg, #3D3B35, #3D3B35 5px, #767266 5px, #767266 10px)' : 'none'}}
  ]

  const groupedIcons = [
    {
      icon1: {icon: YoutubeSearchedForIcon, onClick: handleGamesHistoryOpen},
      icon2: {icon: HistoryIcon, onClick: handleRecentGamesOpen}
    }
  ]

  const groupedIcons2 = [
    {
      icon1: {icon: GroupIcon, onClick: revealPlayers,condition: {display: mode === "GUESSELO" ? 'flex' : 'none'}},
      icon2: {icon: Typography, onClick: revealElo, text: 'Elo',condition: {display: mode === "GUESSELO" ? 'flex' : 'none'}},
      icon3: {icon: LaunchIcon, onClick: () => window.open('https://www.cross-tables.com/annotated.php?u=' + gameNum, '_blank')}
    }
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
          {modalContent === "gamesHistory" && <GamesHistoryContent />}
          {modalContent === "loading" && <Loading />}
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
              <Box sx={{padding: '8px 0px'}} className={`${styles.playerPanel} ${styles.playerToggle}`}>
                {groupedIcons.map((group, index) => (
                  <Box /*sx={{width: mode === "VIEWER" ? "66%" : "auto", border: mode === "VIEWER" ? "none" : "solid 2px #6e7491", boxShadow: mode === "VIEWER" ? "none" : "3px 15px 8px -10px rgba(0, 0, 0, 0.3)"}}*/ key={index} className={styles.groupedBox}>
                      <group.icon1.icon 
                        className={styles.keyBtn} 
                        onClick={group.icon1.onClick}
                      />
                      <group.icon2.icon 
                        className={styles.keyBtn} 
                        onClick={group.icon2.onClick}
                      />
                  </Box>
                ))}
                {groupedIcons2.map((group, index) => (
                  <Box /*sx={{width: mode === "VIEWER" ? "33%" : "auto", border: mode === "VIEWER" ? "none" : "solid 2px #6e7491", boxShadow: mode === "VIEWER" ? "none" : "3px 15px 8px -10px rgba(0, 0, 0, 0.3)"}}*/ key={index} className={styles.groupedBox}>
                      <group.icon1.icon 
                        className={styles.keyBtn} 
                        onClick={group.icon1.onClick}
                        sx={group.icon1.condition}
                      />
                      <group.icon2.icon 
                        className={styles.keyBtn} 
                        onClick={group.icon2.onClick}
                        sx={group.icon2.condition}
                      >{group.icon2.text}</group.icon2.icon>
                      <group.icon3.icon 
                        className={styles.keyBtn} 
                        onClick={group.icon3.onClick}
                      />
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
            <Box className={styles.commentaryContainer}>
              {notes.map(([note, moveNumber], index) => (
                <Box className={styles.commentaryBox} key={index} style={{ display: currentMoveRef.current + 1 === moveNumber && (mode === "VIEWER" || ELOCommentary === "YES") ? 'block' : 'none' }}>
                  "{note.trim()}"
                </Box>
              ))}
            </Box>  
            <Box className={styles.poolBox}>
              <Pool board={pool} rack={createRack(moveSet, currentMoveRef.current)}/>  
            </Box>
          </Box>  
        </Box>
      </Box>  
      </Box>   
    </Box>
  )
}
