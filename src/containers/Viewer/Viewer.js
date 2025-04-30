import React, { useState, useEffect, useRef, useCallback } from "react";
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
import ColorizeIcon from '@mui/icons-material/Colorize';
import { origPool, origBoard } from "../../components/AppContent/References/staticData.js";  
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import GroupIcon from '@mui/icons-material/Group';
import LaunchIcon from '@mui/icons-material/Launch';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HistoryIcon from '@mui/icons-material/History';
import YoutubeSearchedForIcon from '@mui/icons-material/YoutubeSearchedFor';
import Button from "@mui/material/Button";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { getMoveSet, getRecentGameInfo, getGameInfo, getCustomPlayerGameInfo } from "../../axios/api.js";
import { getMove, highlightPreviousMove, updateBoard, createBoard } from "../../functions/boardFunctions.js";
import { getComplementaryColor } from "../../functions/tileFunctions.js";
import { addToPool, removeFromPool } from "../../functions/poolFunctions.js";
import { createRack } from "../../functions/rackFunctions.js";
import { TextField, Tooltip } from "@mui/material";

export default function Viewer({ onChange }){
  const [gameNum, setGameNum] = useState(37033);
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
  const [moveDirection, setMoveDirection] = useState("neutral");
  const [theme] = useState("STANDARD");
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
  const color = useRef('#60857C');
  const complementaryColor = useRef('#9F7A83');
  const customPlayerMode = useRef("");
  const [showUnlockText, setShowUnlockText] = useState(false);
  const [origPlayerRaw, setOrigPlayerRaw] = useState("");
  const [notes, setNote] = useState([]);
  const [gamesViewed, setGamesViewed] = useState([]);

  const [recentNames, setRecentNames] = useState([]);
  const [recentDictionaries, setRecentDictionaries] = useState([]);
  const [recentGameNums, setRecentGameNums] = useState([]);

  const [loadingMsg, setLoadingMsg] = useState("Loading...");

  const switchValue = () => {
    setDictionary("ANY");
  }
  const handleCustomPlayerMode = (event) => {
    customPlayerMode.current = event.target.value;
  };
  const handleDictionaryChange = event => {
    setDictionary(event.target.value);
    customPlayerMode.current = "";
  };
  const handleELOCommentaryChange = event => {
    setELOCommentary(event.target.value);
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
  const randomizeGame = useCallback(() => {
    setOpen(true);
    setLoadingMsg("Finding a game...");
    setModalContent("loading");
    setMoveDirection("neutral");
    const loadCustomPlayerGameInfo = async () => {
      const info = customPlayerMode.current ? await getCustomPlayerGameInfo('https://cross-tables.com/rest/players.php?search=', 'https://www.cross-tables.com/anno.php?p=', customPlayerMode.current) : null;
      let randomNumber;
      if (info){
        let randomIndex = Math.floor(Math.random() * info.length);
        randomNumber = info[randomIndex];
      } else{
        randomNumber = getRandomNumber(10000, 40000).toString();
      }
      currentMoveRef.current = -1;
      setGameNum(randomNumber);
    };
    loadCustomPlayerGameInfo();
  }, [customPlayerMode]);

  const loadGameData = useCallback(async () => {
    try {
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

      const moveRes = await getMoveSet('https://www.cross-tables.com/annotated/selfgcg/', gameNum);
      if (!moveRes || !moveRes[0]) {
        console.error('Failed to load move set');
        randomizeGame();
        return;
      }
      setMoveSet(moveRes[0])
      setOrigPlayerRaw(moveRes[1])
      setNote(moveRes[2])

      const infoRes = await getRecentGameInfo('https://www.cross-tables.com/annolistself.php');
      if (!infoRes) {
        console.error('Failed to load recent game info');
        return;
      }
      setRecentNames(infoRes[0])
      setRecentDictionaries(infoRes[1])
      setRecentGameNums(infoRes[2])

      let text = await getGameInfo('https://www.cross-tables.com/annotated.php?u=', gameNum);
      if (!text) {
        console.error('Failed to load game info');
        randomizeGame();
        return;
      }
      const startIndex = text.indexOf('<p>Dictionary: <b>');
      if (startIndex !== -1) {
        const endIndex = text.indexOf('</b>', startIndex);
        if (endIndex !== -1) {
          const extractedText = text.substring(startIndex + 18, endIndex);
          if (dictionary === "TWL" && !(extractedText.startsWith("TWL") || extractedText.startsWith("NWL"))){
            randomizeGame();
            return;
          }
          else if (dictionary === "CSW" && !extractedText.startsWith("CSW")){
            randomizeGame();
            return;
          }
          else if (extractedText === null){
            randomizeGame();
            return;
          }
          else{
            setGamesViewed(prevGames => [...prevGames, gameNum]);
            console.log("Game generated.");
            setLoadingMsg("Loading the game...")
            setTimeout(() => {
              setOpen(false);
            }, "1000")
          }
          setGameDictionary(extractedText);
        }
      }
      else{
        randomizeGame();
        return;
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
    } catch (error) {
      console.error('Error loading game data:', error);
      randomizeGame();
    }
  }, [gameNum, dictionary, randomizeGame]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);
  
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
        if (thisMovePlayerName === firstMovePlayerName){
          setPlayer2points(lastMove ? (moves['lastmove'].score ? moves['lastmove'].score : moves['lastmove'].points) : 0)
        }
        else{
          if (moveName !== lastMoveName) {
            setPlayer1points(lastMove ? (moves['lastmove'].score ? moves['lastmove'].score : moves['lastmove'].points) : 0)
          } else{
            setPlayer1points(superLastMove ? moves['superlastmove'].score : 0)
          }
        }
      } else {
        if (thisMovePlayerName === firstMovePlayerName){
          setPlayer1points(moves['thismove'].score)
        }
        else{
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
    if (tourneyNum !== 0){
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

  function ColorScheme() {
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
  }

  function GamesHistory() {
    const [gamesPerPage, setGamesPerPage] = useState(5);
    const matches = useMediaQuery('(max-width:676px)');
  
    useEffect(() => {
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
          <b>Games you viewed this <br></br> session, sorted by most recent</b>
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

  function RecentGames() {
    const [currentPage, setCurrentPage] = useState(1);
    const [gamesPerPage, setGamesPerPage] = useState(10);
  
    const matches = useMediaQuery('(max-width:676px)');
  
    useEffect(() => {
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
          <b>Recent Games Uploaded to XT <br></br> {mode === "GUESSELO" ? "(names hidden in this mode!)" : ""}</b>
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

  const handleColorSchemeOpen = () => {
    setModalContent("colorScheme")
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
    const [showWhy, setShowWhy] = useState(false);
  
    const handleWhyClick = () => {
      setShowWhy(!showWhy);
    }
  
    return (
      <>
        {!showWhy && (
          <div>
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
              Favorite player? <br></br>Only generate his/her games.
              <Typography sx={{fontSize: '12px'}}>(Note: cannot also filter by dictionary. <br></br><u className={styles.underlinedText} onClick={handleWhyClick}>Click to see why.</u>)</Typography>
              <TextField autoComplete="off" placeholder={customPlayerMode.current} onFocus={(event) => switchValue(event)} onChange={(event) => handleCustomPlayerMode(event)} />
            </Box>
          </div>
        )}
        {showWhy && (
          <Box sx={{width: '350px'}}>
            <Typography sx={{fontSize: '11px'}}>
              This is a front-end-only project and doesn't track which games use which dictionaries. It generates a game and checks the dictionary in real-time, which means filtering by a specific player and dictionary may result in a never-ending loop. 
            </Typography>
            <br></br>
            <Typography sx={{fontSize: '11px'}}>
              One workaround is used on the XT recents page, where dictionaries can be easily obtained through scraping methods and limited to the first X results. However, player profile pages pose a greater challenge for scraping and ensuring high site performance - many players have hundreds or even thousands of games, some of which do not have listed dictionaries.
            </Typography>
            <br></br>
            <Typography sx={{fontSize: '11px'}}>
              In the meantime, you can keep generating a new game with a specific player in the hope of getting a game using your desired dictionary.
            </Typography>
            <br></br>
            <Button onClick={handleWhyClick}>Back</Button>
          </Box>
        )}
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

  const ColorSchemeContent = () => (
    <>
      {ColorScheme()}
    </>
  );

  const Loading = () => (
    <div>
      {loadingMsg}
    </div>
  );

  const iconList = [  
    {icon: KeyboardDoubleArrowLeftIcon, toolTip: "Beginning of game", onClick: beginningOfGame},  
    {icon: KeyboardArrowLeftIcon, toolTip: "Move back", onClick: () => {if (currentMoveRef.current > -1) {currentMoveRef.current -= 1; setMoveDirection("backward"); handleMove(moveSet[currentMoveRef.current - 2], moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "previous");}}},
    {icon: KeyboardArrowRightIcon, toolTip: "Move forward", onClick: () => {if (currentMoveRef.current + 1 < moveSet.length) currentMoveRef.current += 1; setMoveDirection("forward"); handleMove(moveSet[currentMoveRef.current - 2], moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "next");}},
    {icon: FiberNewIcon, toolTip: "New game", onClick: randomizeGame},
    {icon: SwapHorizIcon, onClick: () => (!unlockEloMode ? setShowUnlockText(true) : switchMode()),condition: {color: !unlockEloMode ? 'transparent' : 'white', background: !unlockEloMode ? 'repeating-linear-gradient(45deg, #3D3B35, #3D3B35 5px, #767266 5px, #767266 10px)' : 'none'}}
  ]

  const groupedIcons = [
    {
      icon1: {icon: YoutubeSearchedForIcon, onClick: handleGamesHistoryOpen},
      icon2: {icon: HistoryIcon, onClick: handleRecentGamesOpen},
      icon3: {icon: SettingsOutlinedIcon, onClick: handleDictionaryTilesOpen},
      icon4: {icon: ColorizeIcon, onClick: handleColorSchemeOpen}
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
          {modalContent === "colorScheme" && <ColorSchemeContent/>}
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
          <Board onBoardChildClick={handleBoardClick} moveDirection={moveDirection} dictionary={gameDictionary} board={createBoard(boardCoords, currentMoveCoords, tiles, theme, color.current, complementaryColor.current)} points={pointsScored} theme={theme} rack={createRack(moveSet, currentMoveRef.current - 1).map(char => char === ' ' ? '?' : char).join('')} move={getMove(moveSet[currentMoveRef.current], currentMoveCoords)}/>   
        </Box>

        <Box className={styles.rightPanel}>
          <Box className={styles.topPlayerPanel}>
            <Box sx={{flexDirection: 'column', lineHeight: '0px'}} className={`${styles.playerPanel}`}>
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
              <Box sx={{display: showUnlockText && !unlockEloMode ? 'flex' : 'none'}} className={styles.unlockText}>
                Hit the board {6 - boardClickCount} {(6 - boardClickCount) === 1 ? 'more time' : 'more times'} to unlock me!
              </Box>
              <Box sx={{padding: '8px 0px'}} className={`${styles.playerPanel} ${styles.playerToggle}`}>
                {groupedIcons.map((group, index) => (
                  <Box key={`group-${index}`} className={styles.groupedBox}>
                      <Tooltip key={`tooltip-1-${index}`} title="Games you viewed">
                        <group.icon1.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon1.onClick}
                        />
                      </Tooltip>
                      <Tooltip key={`tooltip-2-${index}`} title="Recents on XT">
                        <group.icon2.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon2.onClick}
                        />
                      </Tooltip>
                      <Tooltip key={`tooltip-3-${index}`} title="Settings">
                        <group.icon3.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon3.onClick}
                        />
                      </Tooltip>
                      <Tooltip key={`tooltip-4-${index}`} title="Colors">
                        <group.icon4.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon4.onClick}
                        />
                      </Tooltip>
                  </Box>
                ))}
                {groupedIcons2.map((group, index) => (
                  <Box key={`group2-${index}`} className={styles.groupedBox}>
                      <Tooltip key={`tooltip2-1-${index}`} title="Reveal players">
                        <group.icon1.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon1.onClick}
                          sx={group.icon1.condition}
                        />
                      </Tooltip>
                      <Tooltip key={`tooltip2-2-${index}`} title="Reveal ELO">
                        <group.icon2.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon2.onClick}
                          sx={group.icon2.condition}
                        >{group.icon2.text}
                        </group.icon2.icon>
                      </Tooltip>
                      <Tooltip key={`tooltip2-3-${index}`} title="View on XT">
                        <group.icon3.icon 
                          className={styles.keyBtn} 
                          onClick={group.icon3.onClick}
                        />
                      </Tooltip>
                  </Box>
                ))}
              </Box>
            </Box> 
            <Box className={styles.playerPanel}>
              {mode === "VIEWER" ? name1 : revealedName1}{revealedElo ? ", " + revealedElo : ''}
              <Box className={styles.Rack}>
                {(moveSet[currentMoveRef.current + 1] ? moveSet[currentMoveRef.current + 1].split(':')[0] : 'null') === origPlayerRaw ? 
                  <Rack board={createRack(moveSet, currentMoveRef.current)} tiles={tiles} color={color.current}/> : null}
              </Box> 
              <Box>
                {player1points} points
              </Box>
              <Box className={styles.playerPanel}>
                {mode === "VIEWER" ? name2 : revealedName2}{revealedElo2 ? ", " + revealedElo2 : ''}
                <Box className={styles.Rack}>
                  {(moveSet[currentMoveRef.current + 1] ? moveSet[currentMoveRef.current + 1].split(':')[0] : 'null') !== origPlayerRaw ? 
                    <Rack board={createRack(moveSet, currentMoveRef.current)} tiles={tiles} color={color.current}/> : null}
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
