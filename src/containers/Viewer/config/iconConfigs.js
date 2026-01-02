import { 
  CaretLeft, 
  CaretRight,
  SkipBack,
  ChartLine,
  Clock,
  Gear,
  Users,
  ArrowSquareOut,
  GameController,
  MagnifyingGlass,
  Books
} from '@phosphor-icons/react';
import Typography from '@mui/material/Typography';

export const createIconList = (
  beginningOfGame,
  currentMoveRef,
  setMoveDirection,
  handleMoveWrapper,
  parsedMoves,
  randomizeGame,
  unlockEloMode,
  showUnlockText,
  switchMode,
  mode,
  onChange,
  setBoardCoords,
  setPool,
  origBoard,
  origPool,
  setShowUnlockText,
  setMode,
  wooglesMode,
  randomizeWooglesGame,
  lightMode = 'dark'
) => [
  {
    icon: SkipBack,
    toolTip: "Beginning of game",
    onClick: () => beginningOfGame(),
    size: 20,
    color: lightMode === 'dark' ? '#fff' : '#1F2937'
  },
  {
    icon: CaretLeft,
    toolTip: "Move back",
    onClick: () => {
      if (currentMoveRef.current > -1) {
        currentMoveRef.current -= 1;
        setMoveDirection("backward");
        handleMoveWrapper(currentMoveRef.current - 2, currentMoveRef.current - 1, currentMoveRef.current, currentMoveRef.current + 1, "previous");
      }
    },
    size: 20,
    color: lightMode === 'dark' ? '#fff' : '#1F2937'
  },
  {
    icon: CaretRight,
    toolTip: "Move forward",
    onClick: () => {
      if (currentMoveRef.current + 1 < parsedMoves.length) {
        currentMoveRef.current += 1;
        setMoveDirection("forward");
        handleMoveWrapper(currentMoveRef.current - 2, currentMoveRef.current - 1, currentMoveRef.current, currentMoveRef.current + 1, "next");
      }
    },
    size: 20,
    color: lightMode === 'dark' ? '#fff' : '#1F2937'
  },


];

export const createGroupedIcons = (
  handleGamesHistoryOpen,
  handleRecentGamesOpen,
  handleDictionaryTilesOpen,
  setModalContent,
  setOpen,
  name1,
  name2,
  setRevealedName1,
  setRevealedName2,
  tourneyNum,
  setRevealedElo,
  setRevealedElo2,
  mode,
  gameNum,
  revealPlayers,
  revealElo,
  toggleWooglesMode,
  wooglesMode,
  currentWooglesGame,
  handleOpenPlayersModal,
  handleRevealElo,
  handleOpenSubmittedGamesModal,
  lightMode = 'dark'
) => [
  {
    icon1: {
      icon: ChartLine,
      toolTip: "Games History",
      onClick: () => handleGamesHistoryOpen(setModalContent, setOpen),
      size: 20,
      color: lightMode === 'dark' ? '#fff' : '#1F2937'
    },
    icon2: {
      icon: Clock,
      toolTip: "Recent Games",
      onClick: () => handleRecentGamesOpen(setModalContent, setOpen),
      size: 20,
      color: lightMode === 'dark' ? '#fff' : '#1F2937'
    },
    icon3: {
      icon: Gear,
      toolTip: "Settings",
      onClick: () => handleDictionaryTilesOpen(setModalContent, setOpen),
      size: 20,
      color: lightMode === 'dark' ? '#fff' : '#1F2937'
    },

    icon5: {
      icon: MagnifyingGlass,
      toolTip: "Browse Players",
      onClick: () => handleOpenPlayersModal(),
      size: 20,
      color: lightMode === 'dark' ? '#fff' : '#1F2937'
    },
    icon6: {
      icon: Books,
      toolTip: "Submitted Games",
      onClick: () => handleOpenSubmittedGamesModal(),
      condition: { display: mode !== "VIEWER" ? 'flex' : 'none' },
      size: 20,
      color: lightMode === 'dark' ? '#fff' : '#1F2937'
    }
  },
  {
    icon1: {
      icon: Users,
      toolTip: "Reveal Players",
      onClick: () => revealPlayers(name1, name2, setRevealedName1, setRevealedName2),
      condition: { display: mode !== "VIEWER" ? 'flex' : 'none' },
      size: 20,
      color: lightMode === 'dark' ? '#fff' : '#1F2937'
    },
    icon2: {
      icon: Typography,
      toolTip: "Reveal ELO",
      onClick: handleRevealElo,
      text: 'Elo',
      condition: { display: mode !== "VIEWER" ? 'flex' : 'none' },
      size: 20,
      color: lightMode === 'dark' ? '#fff' : '#1F2937'
    },
    icon3: {
      icon: ArrowSquareOut,
      toolTip: wooglesMode ? "View on Woogles" : "View on XT",
      onClick: () => {
        if (wooglesMode && currentWooglesGame) {
          window.open('https://woogles.io/game/' + currentWooglesGame.gameId, '_blank');
        } else {
          window.open('https://www.cross-tables.com/annotated.php?u=' + gameNum, '_blank');
        }
      },
      size: 20,
      color: lightMode === 'dark' ? '#fff' : '#1F2937'
    },

  }
]; 