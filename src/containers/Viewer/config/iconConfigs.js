import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import YoutubeSearchedForIcon from '@mui/icons-material/YoutubeSearchedFor';
import HistoryIcon from '@mui/icons-material/History';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ColorizeIcon from '@mui/icons-material/Colorize';
import GroupIcon from '@mui/icons-material/Group';
import LaunchIcon from '@mui/icons-material/Launch';
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
    icon: KeyboardDoubleArrowLeftIcon,
    toolTip: "Beginning of game",
    onClick: () => beginningOfGame(setBoardCoords, currentMoveRef, setPool, origBoard, origPool)
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
    onClick: () => (!unlockEloMode ? setShowUnlockText(true) : switchMode(mode, setMode, onChange, randomizeGame)),
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
      icon: YoutubeSearchedForIcon,
      onClick: () => handleGamesHistoryOpen(setModalContent, setOpen)
    },
    icon2: {
      icon: HistoryIcon,
      onClick: () => handleRecentGamesOpen(setModalContent, setOpen)
    },
    icon3: {
      icon: SettingsOutlinedIcon,
      onClick: () => handleDictionaryTilesOpen(setModalContent, setOpen)
    },
    icon4: {
      icon: ColorizeIcon,
      onClick: () => handleColorSchemeOpen(setModalContent, setOpen)
    }
  },
  {
    icon1: {
      icon: GroupIcon,
      onClick: () => revealPlayers(name1, name2, setRevealedName1, setRevealedName2),
      condition: { display: mode === "GUESSELO" ? 'flex' : 'none' }
    },
    icon2: {
      icon: Typography,
      onClick: () => revealElo(tourneyNum, name1, name2, setRevealedElo, setRevealedElo2),
      text: 'Elo',
      condition: { display: mode === "GUESSELO" ? 'flex' : 'none' }
    },
    icon3: {
      icon: LaunchIcon,
      onClick: () => window.open('https://www.cross-tables.com/annotated.php?u=' + gameNum, '_blank')
    }
  }
]; 