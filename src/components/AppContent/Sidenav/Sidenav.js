import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Modal from '@mui/material/Modal';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../../App';
import { useColorSchemeStore } from '../../../stores/colorSchemeStore';
import { useGameStore } from '../../../stores/gameStore';
import { useAuth } from '../../../contexts/AuthContext';
import AuthModal from '../../Auth/AuthModal';
import { Link as RouterLink } from 'react-router-dom';

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Tooltip, Select, FormControl } from "@mui/material";

import { 
  House, 
  Binoculars, 
  Upload, 
  Clock, 
  Palette, 
  Star,
  Sun,
  Moon,
  Cube,
  PuzzlePiece,
  User,
  SignOut,
  SpeakerHigh
} from '@phosphor-icons/react';
import CircleIcon from '@mui/icons-material/Circle';
import AppleIcon from '@mui/icons-material/Apple';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import styles from './Sidenav.module.css';

export default function MiniDrawer() {
  const { lightMode, setLightMode } = React.useContext(ThemeContext);
  const { user, profile, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [isColorSectionExpanded, setIsColorSectionExpanded] = React.useState(false);
  const [showDecorations, setShowDecorations] = React.useState(false);
  const [isDecorationSectionExpanded, setIsDecorationSectionExpanded] = React.useState(false);
  const [isSoundSectionExpanded, setIsSoundSectionExpanded] = React.useState(false);
  const [hoveredIcon, setHoveredIcon] = React.useState(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('signin');
  const location = useLocation();
  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);
  const showWoodenCircle = useColorSchemeStore(state => state.showWoodenCircle);
  const showApplePolygon = useColorSchemeStore(state => state.showApplePolygon);
  const updateColor = useColorSchemeStore(state => state.updateColor);
  const updateBoardColor = useColorSchemeStore(state => state.updateBoardColor);
  const updateShowWoodenCircle = useColorSchemeStore(state => state.updateShowWoodenCircle);
  const updateShowApplePolygon = useColorSchemeStore(state => state.updateShowApplePolygon);
  const playerMoveSoundType = useGameStore(state => state.playerMoveSoundType);
  const botMoveSoundType = useGameStore(state => state.botMoveSoundType);
  const setPlayerMoveSoundType = useGameStore(state => state.setPlayerMoveSoundType);
  const setBotMoveSoundType = useGameStore(state => state.setBotMoveSoundType);

  const getBackgroundColor = () => {
    // Use deep navy for light mode instead of pure charcoal
    return lightMode === 'dark' ? '#1F2937' : '#1e3a5f';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#f5f5f5';
  };

  const drawerMixin = () => ({
    width: (isColorSectionExpanded || isDecorationSectionExpanded || isSoundSectionExpanded) ? '200px' : '55px',
    overflowX: 'hidden',
    background: getBackgroundColor(),
    transition: '0.3s ease',
    '@media (max-width: 992px)': {
      width: '100%',
      height: 'auto',
    },
  });

  const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2, 1),
    ...theme.mixins.toolbar,
  }));

  const Drawer = styled(MuiDrawer)(({ theme }) => ({
    ...drawerMixin(theme),
    '& .MuiDrawer-paper': drawerMixin(theme),
  }));

  const MyAppBar = styled(AppBar)({
    position: 'fixed',
    background: getBackgroundColor(),
    display: "flex",
    justifyContent: "space-between"
  });

  const MyToolbar = styled(Toolbar)({
    display: "flex",
    justifyContent: "space-between"
  });

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleLightMode = () => {
    setLightMode(lightMode === 'dark' ? 'light' : 'dark');
  };

  const toggleColorPicker = () => {
    setIsColorSectionExpanded(!isColorSectionExpanded);
    setShowColorPicker(!showColorPicker);
  };

  const toggleDecorations = () => {
    setIsDecorationSectionExpanded(!isDecorationSectionExpanded);
    setShowDecorations(!showDecorations);
  };

  const toggleSoundOptions = () => {
    setIsSoundSectionExpanded(!isSoundSectionExpanded);
  };

  const handleColorChange = (event) => {
    updateColor(event.target.value);
  };

  const handleBoardColorChange = (event) => {
    updateBoardColor(event.target.value);
    document.documentElement.style.setProperty('--board-color', event.target.value);
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path === '/viewer') return 'Viewer';
    if (path === '/3dviewer') return '3D Viewer';
    if (path === '/playground' || path === '/play') return 'Play';
    if (path === '/puzzle') return 'Puzzle';
    if (path === '/changelog') return 'Changelog';
    if (path === '/submit-game') return 'Submit Game';
    if (path === '/memory') return 'Memory';
    if (path === '/words') return 'Words';
    if (path === '/series') return 'Series';
    if (path === '/study') return 'Study';
    if (path === '/boggle') return 'Boggle';
    return 'Home';
  };

  const isCurrentPage = (pagePath) => {
    const path = location.pathname;
    if (pagePath === '/' && path === '/') return true;
    if (pagePath === '/viewer' && path === '/viewer') return true;
    if (pagePath === '/3dviewer' && path === '/3dviewer') return true;
    if ((pagePath === '/playground' || pagePath === '/play') && (path === '/playground' || path === '/play')) return true;
    if (pagePath === '/puzzle' && path === '/puzzle') return true;
    if (pagePath === '/changelog' && path === '/changelog') return true;
    if (pagePath === '/submit-game' && path === '/submit-game') return true;
    return false;
  };

  // Aggressive centering styles
  const iconStyle = {
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
    padding: 0,
    width: '100%'
  };

  const listItemStyle = {
    padding: 0,
    margin: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '48px',
    width: '100%'
  };

  return (
    <Box>
      {/* Force override Material-UI styles */}
      <style>
        {`
          .myDrawer .MuiListItemIcon-root {
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
          }
          .myDrawer .MuiListItem-root {
            padding: 0 !important;
            margin: 0 !important;
            justify-content: center !important;
          }
        `}
      </style>
      
      <MyAppBar className={styles.myAppBar}>
        <MyToolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconButton color="inherit" onClick={handleClick}>
              <MenuIcon sx={{ color: getTextColor() }}/>
            </IconButton>
            {!user ? (
              <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#D97706',
                    border: '2px solid #D97706',
                    borderRadius: 8,
                    padding: '5px 16px',
                    fontWeight: 'normal',
                    letterSpacing: 1,
                    fontSize: 14,
                    boxShadow: 'none',
                    outline: 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: 0.95
                  }}
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(45deg, transparent 5%, #D97706 5%)',
                    color: '#fff',
                    border: 0,
                    borderRadius: 8,
                    padding: '7px 16px',
                    fontWeight: 'bold',
                    letterSpacing: 1,
                    fontSize: 14,
                    boxShadow: '6px 0px 0px #B45309',
                    outline: 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: 0.95
                  }}
                >
                  Sign Up
                </button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      background: 'transparent',
                      color: '#D97706',
                      border: '2px solid #D97706',
                      borderRadius: 8,
                      padding: '5px 16px',
                      fontWeight: 'normal',
                      letterSpacing: 1,
                      fontSize: 14,
                      boxShadow: 'none',
                      outline: 'transparent',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      opacity: 0.95
                    }}
                  >
                    {profile?.display_name || profile?.username || 'Profile'}
                  </button>
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                  }}
                  style={{
                    background: 'transparent',
                    color: '#D97706',
                    border: '2px solid #D97706',
                    borderRadius: 8,
                    padding: '5px 16px',
                    fontWeight: 'normal',
                    letterSpacing: 1,
                    fontSize: 14,
                    boxShadow: 'none',
                    outline: 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: 0.95
                  }}
                >
                  Sign Out
                </button>
              </Box>
            )}
          </Box>
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose} component={Link} to="/" sx={{ 
              backgroundColor: isCurrentPage('/') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              fontWeight: isCurrentPage('/') ? '600' : '400'
            }}>
              Home {isCurrentPage('/') && '✓'}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/viewer" sx={{ 
              backgroundColor: isCurrentPage('/viewer') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              fontWeight: isCurrentPage('/viewer') ? '600' : '400'
            }}>
              Annotated Game Viewer {isCurrentPage('/viewer') && '✓'}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/3dviewer" sx={{ 
              backgroundColor: isCurrentPage('/3dviewer') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              fontWeight: isCurrentPage('/3dviewer') ? '600' : '400'
            }}>
              3D Viewer (Beta) {isCurrentPage('/3dviewer') && '✓'}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/play" sx={{ 
              backgroundColor: isCurrentPage('/play') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              fontWeight: isCurrentPage('/play') ? '600' : '400'
            }}>
              Play (Beta) {isCurrentPage('/play') && '✓'}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/puzzle" sx={{ 
              backgroundColor: isCurrentPage('/puzzle') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              fontWeight: isCurrentPage('/puzzle') ? '600' : '400'
            }}>
              Puzzle (Beta) {isCurrentPage('/puzzle') && '✓'}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/camera-scan" sx={{ 
              backgroundColor: isCurrentPage('/camera-scan') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              fontWeight: isCurrentPage('/camera-scan') ? '600' : '400'
            }}>
              📷 Camera Scanner {isCurrentPage('/camera-scan') && '✓'}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/changelog" sx={{ 
              backgroundColor: isCurrentPage('/changelog') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              fontWeight: isCurrentPage('/changelog') ? '600' : '400'
            }}>
              Changelog {isCurrentPage('/changelog') && '✓'}
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/submit-game" sx={{ 
              backgroundColor: isCurrentPage('/submit-game') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              fontWeight: isCurrentPage('/submit-game') ? '600' : '400'
            }}>
              Submit Game {isCurrentPage('/submit-game') && '✓'}
            </MenuItem>
            <MenuItem onClick={() => {
              handleClose();
              toggleColorPicker();
            }} sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Palette style={{ fontSize: 18 }} />
              Color Scheme
            </MenuItem>
          </Menu>
          <img src={'/images/theomascot.png'} className={styles.sidenavFoxStencil} id="logo" width="58" height="58"/>
        </MyToolbar>
      </MyAppBar>
      <Drawer className={styles.myDrawer} variant="permanent">
        <DrawerHeader className={styles.cfLogoContainer}>
          <img src={'/images/theomascot.png'} className={styles.sidenavFoxStencil} id="logo" width="48" height="48"/>
        </DrawerHeader>
        
        <List className={styles.btnContainer}>
          <a id="homeBtn" className={styles.link} href="/">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="Home" placement="right">
                  <House 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isCurrentPage('/') ? '#F59E0B' : getTextColor(),
                      fontSize: isCurrentPage('/') ? '24px' : '20px',
                      transition: 'all 0.2s ease',
                      filter: isCurrentPage('/') ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))' : 'none'
                    }} 
                    weight={isCurrentPage('/') ? "fill" : (hoveredIcon === 'home' ? "fill" : "regular")}
                    onMouseEnter={() => setHoveredIcon('home')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="viewerBtn" className={styles.link} href="/viewer">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/viewer') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="Game Viewer" placement="right">
                  <Binoculars 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isCurrentPage('/viewer') ? '#34D399' : getTextColor(),
                      fontSize: isCurrentPage('/viewer') ? '24px' : '20px'
                    }} 
                    weight={isCurrentPage('/viewer') ? "fill" : (hoveredIcon === 'viewer' ? "fill" : "regular")}
                    onMouseEnter={() => setHoveredIcon('viewer')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="3dViewerBtn" className={styles.link} href="/3dviewer">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/3dviewer') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="3D Viewer (Beta)" placement="right">
                  <Cube 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isCurrentPage('/3dviewer') ? '#8B5CF6' : getTextColor(),
                      fontSize: isCurrentPage('/3dviewer') ? '24px' : '20px'
                    }} 
                    weight={isCurrentPage('/3dviewer') ? "fill" : (hoveredIcon === '3d-viewer' ? "fill" : "regular")}
                    onMouseEnter={() => setHoveredIcon('3d-viewer')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="playBtn" className={styles.link} href="/play">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/play') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="Play (Beta)" placement="right">
                  <SmartToyIcon 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isCurrentPage('/play') ? '#EF4444' : (hoveredIcon === 'play' ? '#EF4444' : getTextColor()),
                      fontSize: isCurrentPage('/play') ? '24px' : '20px'
                    }} 
                    onMouseEnter={() => setHoveredIcon('play')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="puzzleBtn" className={styles.link} href="/puzzle">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/puzzle') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="Puzzle (Beta)" placement="right">
                  <PuzzlePiece 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isCurrentPage('/puzzle') ? '#10B981' : getTextColor(),
                      fontSize: isCurrentPage('/puzzle') ? '24px' : '20px'
                    }} 
                    weight={isCurrentPage('/puzzle') ? "fill" : (hoveredIcon === 'puzzle' ? "fill" : "regular")}
                    onMouseEnter={() => setHoveredIcon('puzzle')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="submitGameBtn" className={styles.link} href="/submit-game">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/submit-game') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="Submit Game" placement="right">
                  <Upload 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isCurrentPage('/submit-game') ? '#F59E0B' : getTextColor(),
                      fontSize: isCurrentPage('/submit-game') ? '24px' : '20px'
                    }} 
                    weight={isCurrentPage('/submit-game') ? "fill" : (hoveredIcon === 'submit-game' ? "fill" : "regular")}
                    onMouseEnter={() => setHoveredIcon('submit-game')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        <List className={`${styles.btnContainer} ${styles.changelogContainer}`}>
          <a id="changelogBtn" className={styles.link} href="/changelog">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/changelog') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="Changelog" placement="right">
                  <Clock 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isCurrentPage('/changelog') ? '#EC4899' : getTextColor(),
                      fontSize: isCurrentPage('/changelog') ? '24px' : '20px'
                    }} 
                    weight={isCurrentPage('/changelog') ? "fill" : (hoveredIcon === 'changelog' ? "fill" : "regular")}
                    onMouseEnter={() => setHoveredIcon('changelog')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={toggleColorPicker} sx={{ ...listItemStyle, cursor: 'pointer' }}>
            <ListItemIcon sx={iconStyle}>
              <Tooltip title="Color Scheme" placement="right">
                                  <Palette 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isColorSectionExpanded ? '#8B5CF6' : getTextColor(),
                      fontSize: isColorSectionExpanded ? '24px' : '20px'
                    }} 
                    weight={isColorSectionExpanded ? "fill" : (hoveredIcon === 'color-scheme' ? "fill" : "regular")}
                    onMouseEnter={() => setHoveredIcon('color-scheme')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={toggleDecorations} sx={{ ...listItemStyle, cursor: 'pointer' }}>
            <ListItemIcon sx={iconStyle}>
                              <Tooltip title="Board Decorations" placement="right">
                  <Star 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isDecorationSectionExpanded ? '#F97316' : 
                             (showWoodenCircle.current || showApplePolygon.current) ? '#8B4513' : getTextColor(),
                      fontSize: isDecorationSectionExpanded ? '24px' : '20px',
                      opacity: (showWoodenCircle.current || showApplePolygon.current) ? 1 : 0.6
                    }} 
                    weight={isDecorationSectionExpanded ? "fill" : (hoveredIcon === 'decorations' ? "fill" : "regular")}
                    onMouseEnter={() => setHoveredIcon('decorations')}
                    onMouseLeave={() => setHoveredIcon(null)}
                  />
                </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={toggleSoundOptions} sx={{ ...listItemStyle, cursor: 'pointer' }}>
            <ListItemIcon sx={iconStyle}>
              <Tooltip title="Sound Options" placement="right">
                <SpeakerHigh 
                  className={styles.homeLogo} 
                  style={{ 
                    color: isSoundSectionExpanded ? '#10B981' : getTextColor(),
                    fontSize: isSoundSectionExpanded ? '24px' : '20px'
                  }} 
                  weight={isSoundSectionExpanded ? "fill" : (hoveredIcon === 'sound' ? "fill" : "regular")}
                  onMouseEnter={() => setHoveredIcon('sound')}
                  onMouseLeave={() => setHoveredIcon(null)}
                />
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>
        
        {/* Color Picker Section - Slides out when expanded */}
        {isColorSectionExpanded && (
          <Box
            sx={{
              padding: '16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '120px',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Box sx={{ color: '#fff', fontSize: '11px', opacity: 0.8 }}>Tile</Box>
                <input
                  type="color"
                  value={color.current}
                  onChange={handleColorChange}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Box sx={{ color: '#fff', fontSize: '11px', opacity: 0.8 }}>Board</Box>
                <input
                  type="color"
                  value={boardColor.current}
                  onChange={handleBoardColorChange}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent'
                  }}
                />
              </Box>
            </Box>
            <Box 
              sx={{ 
                color: '#fff', 
                fontSize: '10px', 
                textAlign: 'center',
                opacity: 0.7,
                cursor: 'pointer',
                '&:hover': { opacity: 1 }
              }}
              onClick={() => {
                setIsColorSectionExpanded(false);
                setShowColorPicker(false);
              }}
            >
              Click to close
            </Box>
          </Box>
        )}
        
        {/* Decorations Section - Slides out when expanded */}
        {isDecorationSectionExpanded && (
          <Box
            sx={{
              padding: '16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '120px',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color: '#fff', fontSize: '12px', textAlign: 'center', opacity: 0.8, marginBottom: '8px' }}>
              Board Decoration
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: showWoodenCircle.current ? 'rgba(139, 69, 19, 0.3)' : 'transparent',
                  border: showWoodenCircle.current ? '1px solid rgba(139, 69, 19, 0.5)' : '1px solid transparent',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
                onClick={() => {
                  updateShowWoodenCircle(true);
                  updateShowApplePolygon(false);
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #8B4513, #A0522D, #CD853F)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }} />
                <Box sx={{ color: '#fff', fontSize: '11px' }}>Wooden Circle</Box>
              </Box>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: showApplePolygon.current ? 'rgba(139, 0, 0, 0.3)' : 'transparent',
                  border: showApplePolygon.current ? '1px solid rgba(139, 0, 0, 0.5)' : '1px solid transparent',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
                onClick={() => {
                  updateShowWoodenCircle(false);
                  updateShowApplePolygon(true);
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #FF6B6B, #E53E3E, #C53030)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }} />
                <Box sx={{ color: '#fff', fontSize: '11px' }}>Polygon</Box>
              </Box>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: (!showWoodenCircle.current && !showApplePolygon.current) ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: (!showWoodenCircle.current && !showApplePolygon.current) ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
                onClick={() => {
                  updateShowWoodenCircle(false);
                  updateShowApplePolygon(false);
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.5)'
                }} />
                <Box sx={{ color: '#fff', fontSize: '11px' }}>None</Box>
              </Box>
            </Box>
            <Box 
              sx={{ 
                color: '#fff', 
                fontSize: '10px', 
                textAlign: 'center',
                opacity: 0.7,
                cursor: 'pointer',
                '&:hover': { opacity: 1 }
              }}
              onClick={() => {
                setIsDecorationSectionExpanded(false);
                setShowDecorations(false);
              }}
            >
              Click to close
            </Box>
          </Box>
        )}
        
        {/* Sound Options Section - Slides out when expanded */}
        {isSoundSectionExpanded && (
          <Box
            sx={{
              padding: '16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '120px',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color: '#fff', fontSize: '12px', textAlign: 'center', opacity: 0.8, marginBottom: '8px' }}>
              Sound Options
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FormControl fullWidth size="small">
                <Box sx={{ color: '#fff', fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Player Move Sound</Box>
                <Select
                  value={playerMoveSoundType}
                  onChange={(e) => setPlayerMoveSoundType(e.target.value)}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981'
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#fff'
                    }
                  }}
                >
                  <MenuItem value="classic" sx={{ fontSize: '12px', color: '#1F2937' }}>Classic</MenuItem>
                  <MenuItem value="sword" sx={{ fontSize: '12px', color: '#1F2937' }}>Sword</MenuItem>
                  <MenuItem value="puzzle" sx={{ fontSize: '12px', color: '#1F2937' }}>Puzzle</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <Box sx={{ color: '#fff', fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Bot Move Sound</Box>
                <Select
                  value={botMoveSoundType}
                  onChange={(e) => setBotMoveSoundType(e.target.value)}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981'
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#fff'
                    }
                  }}
                >
                  <MenuItem value="classic" sx={{ fontSize: '12px', color: '#1F2937' }}>Classic</MenuItem>
                  <MenuItem value="sword" sx={{ fontSize: '12px', color: '#1F2937' }}>Sword</MenuItem>
                  <MenuItem value="puzzle" sx={{ fontSize: '12px', color: '#1F2937' }}>Puzzle</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box 
              sx={{ 
                color: '#fff', 
                fontSize: '10px', 
                textAlign: 'center',
                opacity: 0.7,
                cursor: 'pointer',
                '&:hover': { opacity: 1 }
              }}
              onClick={() => {
                setIsSoundSectionExpanded(false);
              }}
            >
              Click to close
            </Box>
          </Box>
        )}
        
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={toggleLightMode} sx={{ ...listItemStyle, cursor: 'pointer' }}>
            <ListItemIcon sx={iconStyle}>
              <Tooltip title={lightMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="right">
                {lightMode === 'dark' ? (
                  <Sun 
                    className={styles.homeLogo} 
                    style={{ 
                      color: '#F59E0B', 
                      fontSize: '22px'
                    }} 
                    weight="fill" 
                  />
                ) : (
                  <Moon 
                    className={styles.homeLogo} 
                    style={{ 
                      color: '#6366F1', 
                      fontSize: '22px'
                    }} 
                    weight="fill" 
                  />
                )}
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>
        <List className={styles.btnContainer}>
          <a id="aboutBtn" className={styles.link} href="/about">
            <ListItem className={styles.listItem}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="About" placement="right">
                  <CircleIcon style={{ color: '#f59e0b', fontSize: '20px' }} />
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        
      </Drawer>
      
      {/* Mobile Color Picker Modal */}
      <Modal
        open={showColorPicker && window.innerWidth <= 992}
        onClose={() => {
          setShowColorPicker(false);
          setIsColorSectionExpanded(false);
        }}
        aria-labelledby="mobile-color-picker-modal"
        aria-describedby="mobile-color-picker-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#1F2937',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minWidth: '280px',
            maxWidth: '90vw'
          }}
        >
          <Box sx={{ 
            color: '#fff', 
            fontSize: '18px', 
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            Color Scheme
          </Box>
          
          <Box sx={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Box sx={{ color: '#fff', fontSize: '14px', opacity: 0.9 }}>Tile Color</Box>
              <input
                type="color"
                value={color.current}
                onChange={handleColorChange}
                style={{
                  width: '60px',
                  height: '60px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Box sx={{ color: '#fff', fontSize: '14px', opacity: 0.9 }}>Board Color</Box>
              <input
                type="color"
                value={boardColor.current}
                onChange={handleBoardColorChange}
                style={{
                  width: '60px',
                  height: '60px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                }}
              />
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              color: '#fff', 
              fontSize: '14px', 
              textAlign: 'center',
              opacity: 0.8,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { 
                opacity: 1,
                backgroundColor: 'rgba(255,255,255,0.15)'
              }
            }}
            onClick={() => {
              setShowColorPicker(false);
              setIsColorSectionExpanded(false);
            }}
          >
            Close
          </Box>
        </Box>
      </Modal>
      
      {/* Mobile Decorations Modal */}
      <Modal
        open={showDecorations && window.innerWidth <= 992}
        onClose={() => {
          setShowDecorations(false);
          setIsDecorationSectionExpanded(false);
        }}
        aria-labelledby="mobile-decorations-modal"
        aria-describedby="mobile-decorations-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#1F2937',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minWidth: '280px'
          }}
        >
          <Box sx={{ color: '#fff', fontSize: '16px', textAlign: 'center', fontWeight: 'bold' }}>
            Board Decoration
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px', 
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: showWoodenCircle.current ? 'rgba(139, 69, 19, 0.3)' : 'transparent',
                border: showWoodenCircle.current ? '1px solid rgba(139, 69, 19, 0.5)' : '1px solid transparent',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => {
                updateShowWoodenCircle(true);
                updateShowApplePolygon(false);
                setShowDecorations(false);
                setIsDecorationSectionExpanded(false);
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #8B4513, #A0522D, #CD853F)',
                border: '1px solid rgba(255,255,255,0.3)'
              }} />
              <Box sx={{ color: '#fff', fontSize: '14px' }}>Wood</Box>
            </Box>
            
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px', 
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: showApplePolygon.current ? 'rgba(139, 0, 0, 0.3)' : 'transparent',
                border: showApplePolygon.current ? '1px solid rgba(139, 0, 0, 0.5)' : '1px solid transparent',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => {
                updateShowWoodenCircle(false);
                updateShowApplePolygon(true);
                setShowDecorations(false);
                setIsDecorationSectionExpanded(false);
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #FF6B6B, #E53E3E, #C53030)',
                border: '1px solid rgba(255,255,255,0.3)'
              }} />
              <Box sx={{ color: '#fff', fontSize: '14px' }}>Red Circle</Box>
            </Box>
            
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px', 
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: (!showWoodenCircle.current && !showApplePolygon.current) ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: (!showWoodenCircle.current && !showApplePolygon.current) ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => {
                updateShowWoodenCircle(false);
                updateShowApplePolygon(false);
                setShowDecorations(false);
                setIsDecorationSectionExpanded(false);
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.5)'
              }} />
              <Box sx={{ color: '#fff', fontSize: '14px' }}>None</Box>
            </Box>
          </Box>
        </Box>
      </Modal>

      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode}
      />
      
    </Box>
  );
}
