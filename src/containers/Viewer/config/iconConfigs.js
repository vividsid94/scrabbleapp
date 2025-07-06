import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import PeopleIcon from '@mui/icons-material/People';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Typography from '@mui/material/Typography';

export const createIconList = (
  beginningOfGame,
  currentMoveRef,
  setMoveDirection,
  handleMoveWrapper,
  moveSet,
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
  setMode
) => [
  {
    icon: SkipPreviousIcon,
    toolTip: "Beginning of game",
    onClick: () => beginningOfGame()
  },
  {
    icon: KeyboardArrowLeftIcon,
    toolTip: "Move back",
    onClick: () => {
      if (currentMoveRef.current > -1) {
        currentMoveRef.current -= 1;
        setMoveDirection("backward");
        handleMoveWrapper(moveSet[currentMoveRef.current - 2], moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "previous");
      }
    }
  },
  {
    icon: KeyboardArrowRightIcon,
    toolTip: "Move forward",
    onClick: () => {
      if (currentMoveRef.current + 1 < moveSet.length) {
        currentMoveRef.current += 1;
        setMoveDirection("forward");
        handleMoveWrapper(moveSet[currentMoveRef.current - 2], moveSet[currentMoveRef.current - 1], moveSet[currentMoveRef.current], moveSet[currentMoveRef.current + 1], "next");
      }
    }
  },
  {
    icon: FiberNewIcon,
    toolTip: "New game",
    onClick: randomizeGame
  },
  {
    icon: SwapHorizIcon,
    toolTip: "Switch mode",
    onClick: () => (!unlockEloMode ? setShowUnlockText(true) : switchMode(onChange)),
    condition: {
      color: !unlockEloMode ? 'transparent' : 'white',
      background: !unlockEloMode ? 'repeating-linear-gradient(45deg, #3D3B35, #3D3B35 5px, #767266 5px, #767266 10px)' : 'none'
    }
  }
];

export const createGroupedIcons = (
  handleGamesHistoryOpen,
  handleRecentGamesOpen,
  handleDictionaryTilesOpen,
  handleColorSchemeOpen,
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
  revealElo
) => [
  {
    icon1: {
      icon: TimelineIcon,
      toolTip: "Games History",
      onClick: () => handleGamesHistoryOpen(setModalContent, setOpen)
    },
    icon2: {
      icon: HistoryIcon,
      toolTip: "Recent Games",
      onClick: () => handleRecentGamesOpen(setModalContent, setOpen)
    },
    icon3: {
      icon: TuneIcon,
      toolTip: "Settings",
      onClick: () => handleDictionaryTilesOpen(setModalContent, setOpen)
    },
    icon4: {
      icon: PaletteIcon,
      toolTip: "Color Scheme",
      onClick: () => handleColorSchemeOpen(setModalContent, setOpen)
    }
  },
  {
    icon1: {
      icon: PeopleIcon,
      toolTip: "Reveal Players",
      onClick: () => revealPlayers(name1, name2, setRevealedName1, setRevealedName2),
      condition: { display: mode === "GUESSELO" ? 'flex' : 'none' }
    },
    icon2: {
      icon: Typography,
      toolTip: "Reveal ELO",
      onClick: () => revealElo(tourneyNum, name1, name2, setRevealedElo, setRevealedElo2),
      text: 'Elo',
      condition: { display: mode === "GUESSELO" ? 'flex' : 'none' }
    },
    icon3: {
      icon: OpenInNewIcon,
      toolTip: "View on XT",
      onClick: () => window.open('https://www.cross-tables.com/annotated.php?u=' + gameNum, '_blank')
    }
  }
]; 