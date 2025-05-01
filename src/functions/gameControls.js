import { getRandomNumber } from '../utils/gameUtils';

export const switchMode = (mode, setMode, onChange, randomizeGame) => {
  let newMode = mode === "GUESSELO" ? "VIEWER" : "GUESSELO";
  if (mode !== newMode) {
    randomizeGame();
    setMode(newMode);
    onChange(newMode);
  }
};

export const beginningOfGame = (setBoardCoords, currentMoveRef, setPool, origBoard, origPool) => {
  let parsedOrigBoardCoords = JSON.parse(origBoard).map(row => row.map(Number));
  setBoardCoords(parsedOrigBoardCoords); 
  currentMoveRef.current = -1;
  setPool(origPool);
};

export const chooseGame = (gameNum, currentMoveRef, setResetCount, setGameNum, resetCount) => {
  currentMoveRef.current = -1;
  setResetCount(resetCount + 1);
  setGameNum(gameNum);
}; 