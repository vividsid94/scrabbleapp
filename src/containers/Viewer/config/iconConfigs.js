import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';


import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import TuneIcon from '@mui/icons-material/Tune';
import PeopleIcon from '@mui/icons-material/People';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SearchIcon from '@mui/icons-material/Search';
import Typography from '@mui/material/Typography';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

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
  setMode,
  wooglesMode,
  randomizeWooglesGame
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
  handleOpenSubmittedGamesModal
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

    icon5: {
      icon: SearchIcon,
      toolTip: "Browse Players",
      onClick: () => handleOpenPlayersModal()
    },
    icon6: {
      icon: LibraryBooksIcon,
      toolTip: "Submitted Games",
      onClick: () => handleOpenSubmittedGamesModal(),
      condition: { display: mode !== "VIEWER" ? 'flex' : 'none' }
    }
  },
  {
    icon1: {
      icon: PeopleIcon,
      toolTip: "Reveal Players",
      onClick: () => revealPlayers(name1, name2, setRevealedName1, setRevealedName2),
      condition: { display: mode !== "VIEWER" ? 'flex' : 'none' }
    },
    icon2: {
      icon: Typography,
      toolTip: "Reveal ELO",
      onClick: handleRevealElo,
      text: 'Elo',
      condition: { display: mode !== "VIEWER" ? 'flex' : 'none' }
    },
    icon3: {
      icon: OpenInNewIcon,
      toolTip: wooglesMode ? "View on Woogles" : "View on XT",
      onClick: () => {
        if (wooglesMode && currentWooglesGame) {
          window.open('https://woogles.io/game/' + currentWooglesGame.gameId, '_blank');
        } else {
          window.open('https://www.cross-tables.com/annotated.php?u=' + gameNum, '_blank');
        }
      }
    },

  }
]; 