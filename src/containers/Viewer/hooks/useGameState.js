import { useState, useRef, useCallback } from 'react';
import { getRandomNumber } from '../../../utils/gameUtils';
import { origPool, origBoard } from '../../../components/AppContent/References/staticData';
import { getMoveSet, getRecentGameInfo, getGameInfo, getCustomPlayerGameInfo } from '../../../axios/api';

export const useGameState = (onChange) => {
  // Game state
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
  const [boardMode, setBoardMode] = useState("STANDARD");
  const [tiles, setTiles] = useState("PROTILES");
  const [dictionary, setDictionary] = useState("ANY");
  const [ELOCommentary, setELOCommentary] = useState("NO");
  const [open, setOpen] = useState(false);
  const [gameDictionary, setGameDictionary] = useState("Loading...");
  const currentMoveRef = useRef(-1);
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [revealedName1, setRevealedName1] = useState('Player 1');
  const [revealedName2, setRevealedName2] = useState('Player 2');
  const [revealedElo, setRevealedElo] = useState("");
  const [revealedElo2, setRevealedElo2] = useState("");
  const [tourneyNum, setTourneyNum] = useState(0);
  const [unlockEloMode, setUnlockEloMode] = useState(false);
  const color = useRef('#6D84A2');
  const complementaryColor = useRef('#E07A5F');
  const customPlayerMode = useRef("");
  const [showUnlockText, setShowUnlockText] = useState(false);
  const [origPlayerRaw, setOrigPlayerRaw] = useState(""); 
  const [notes, setNote] = useState([]);
  const [gamesViewed, setGamesViewed] = useState([]);
  const [recentNames, setRecentNames] = useState([]);
  const [recentDictionaries, setRecentDictionaries] = useState([]);
  const [recentGameNums, setRecentGameNums] = useState([]);
  const [loadingMsg, setLoadingMsg] = useState("Loading...");
  const [modalContent, setModalContent] = useState("dictionaryTiles");

  const handleClose = () => setOpen(false);

  const switchValue = () => {
    setDictionary("ANY");
  };

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

  const handleBoardClick = () => {
    setBoardClickCount(prevCount => prevCount + 1);
    if (boardClickCount >= 5) {
      setUnlockEloMode(true);
    }
  };

  const switchMode = () => {
    let newMode = mode === "GUESSELO" ? "VIEWER" : "GUESSELO";
    if (mode !== newMode) {
      randomizeGame();
      setMode(newMode);
      onChange(newMode);
    }
  };

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
      setMoveSet(moveRes[0]);
      setOrigPlayerRaw(moveRes[1]);
      setNote(moveRes[2]);

      const infoRes = await getRecentGameInfo('https://www.cross-tables.com/annolistself.php');
      if (!infoRes) {
        console.error('Failed to load recent game info');
        return;
      }
      setRecentNames(infoRes[0]);
      setRecentDictionaries(infoRes[1]);
      setRecentGameNums(infoRes[2]);

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
            setLoadingMsg("Loading the game...");
            setTimeout(() => {
              setOpen(false);
            }, "1000");
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

  return {
    // State
    gameNum, setGameNum,
    boardClickCount, setBoardClickCount,
    moveSet, setMoveSet,
    currentMoveCoords, setCurrentMoveCoords,
    boardCoords, setBoardCoords,
    player1points, setPlayer1points,
    player2points, setPlayer2points,
    pointsScored, setPointsScored,
    pool, setPool,
    mode, setMode,
    resetCount, setResetCount,
    moveDirection, setMoveDirection,
    boardMode, setBoardMode,
    tiles, setTiles,
    dictionary, setDictionary,
    ELOCommentary, setELOCommentary,
    open, setOpen,
    gameDictionary, setGameDictionary,
    currentMoveRef,
    name1, setName1,
    name2, setName2,
    revealedName1, setRevealedName1,
    revealedName2, setRevealedName2,
    revealedElo, setRevealedElo,
    revealedElo2, setRevealedElo2,
    tourneyNum, setTourneyNum,
    unlockEloMode, setUnlockEloMode,
    color,
    complementaryColor,
    customPlayerMode,
    showUnlockText, setShowUnlockText,
    origPlayerRaw, setOrigPlayerRaw,
    notes, setNote,
    gamesViewed, setGamesViewed,
    recentNames, setRecentNames,
    recentDictionaries, setRecentDictionaries,
    recentGameNums, setRecentGameNums,
    loadingMsg, setLoadingMsg,
    modalContent, setModalContent,
    handleClose,
    // Functions
    switchValue,
    handleCustomPlayerMode,
    handleDictionaryChange,
    handleELOCommentaryChange,
    handleTileChange,
    handleBoardClick,
    switchMode,
    randomizeGame,
    loadGameData
  };
}; 