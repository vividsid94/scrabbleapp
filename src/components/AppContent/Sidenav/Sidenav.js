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
import ListItemButton from "@mui/material/ListItemButton";
import Collapse from "@mui/material/Collapse";
import { Tooltip, Select, FormControl, Divider } from "@mui/material";

import { 
  House, 
  Binoculars, 
  Upload, 
  Palette, 
  Star,
  Sun,
  Moon,
  Cube,
  PuzzlePiece,
  User,
  SignOut,
  SpeakerHigh,
  CaretRight,
  CaretDown,
  GameController,
  Gear
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
  const [isModesExpanded, setIsModesExpanded] = React.useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = React.useState(false);
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);
  const [mobileModesExpanded, setMobileModesExpanded] = React.useState(false);
  const [mobileSettingsExpanded, setMobileSettingsExpanded] = React.useState(false);
  const [hoveredIcon, setHoveredIcon] = React.useState(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('signin');
  const drawerRef = React.useRef(null);
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
    // Dark mode: deep gray; Light mode: slightly lighter gray
    return lightMode === 'dark' ? '#1F2937' : '#9CA3AF';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#f5f5f5';
  };

  const drawerMixin = () => ({
    width: (sidebarExpanded || isColorSectionExpanded || isDecorationSectionExpanded || isSoundSectionExpanded || isModesExpanded || isSettingsExpanded) ? '160px' : '52px',
    overflowX: 'hidden',
    background: getBackgroundColor(),
    transition: 'width 0.3s ease',
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
    setSidebarExpanded(true);
  };

  const toggleDecorations = () => {
    setIsDecorationSectionExpanded(!isDecorationSectionExpanded);
    setShowDecorations(!showDecorations);
    setSidebarExpanded(true);
  };

  const toggleSoundOptions = () => {
    setIsSoundSectionExpanded(!isSoundSectionExpanded);
    setSidebarExpanded(true);
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
    if (path === '/3dplay') return '3D Play';
    if (path === '/playground' || path === '/play') return 'Play';
    if (path === '/puzzle') return 'Puzzle';
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
    if (pagePath === '/3dplay' && path === '/3dplay') return true;
    if ((pagePath === '/playground' || pagePath === '/play') && (path === '/playground' || path === '/play')) return true;
    if (pagePath === '/puzzle' && path === '/puzzle') return true;
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
    minHeight: '40px',
    width: '100%'
  };

  React.useEffect(() => {
    const handleHoverOutside = (event) => {
      if (window.innerWidth <= 992) return; // ignore on mobile
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setSidebarExpanded(false);
        setIsModesExpanded(false);
        setIsSettingsExpanded(false);
        setIsColorSectionExpanded(false);
        setIsDecorationSectionExpanded(false);
        setIsSoundSectionExpanded(false);
      }
    };

    document.addEventListener('mousemove', handleHoverOutside);
    return () => {
      document.removeEventListener('mousemove', handleHoverOutside);
    };
  }, []);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <IconButton color="inherit" onClick={handleClick}>
              <MenuIcon sx={{ color: getTextColor() }}/>
            </IconButton>
            {!user ? (
              <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  disabled
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
                    cursor: 'not-allowed',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: 0.5
                  }}
                >
                  Log In
                </button>
                <button
                  disabled
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
                    cursor: 'not-allowed',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: 0.5
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
            PaperProps={{
              sx: {
                backgroundColor: getBackgroundColor(),
                color: getTextColor(),
                minWidth: '240px',
                maxWidth: '280px'
              }
            }}
          >
            {/* Home */}
            <MenuItem 
              onClick={handleClose} 
              component={Link} 
              to="/" 
              sx={{ 
                backgroundColor: isCurrentPage('/') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                fontWeight: isCurrentPage('/') ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <House size={20} weight={isCurrentPage('/') ? "fill" : "regular"} />
              Home {isCurrentPage('/') && '✓'}
            </MenuItem>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
            
            {/* Modes Section */}
            <ListItemButton
              onClick={() => setMobileModesExpanded(!mobileModesExpanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <GameController size={20} weight={mobileModesExpanded ? "fill" : "regular"} />
              <Box sx={{ flex: 1, fontWeight: mobileModesExpanded ? '600' : '400' }}>
                Modes
              </Box>
              {mobileModesExpanded ? (
                <CaretDown size={16} />
              ) : (
                <CaretRight size={16} />
              )}
            </ListItemButton>
            
            <Collapse in={mobileModesExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ paddingLeft: '32px', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                <MenuItem 
                  onClick={handleClose} 
                  component={Link} 
                  to="/play" 
                  sx={{ 
                    backgroundColor: isCurrentPage('/play') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    fontWeight: isCurrentPage('/play') ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 18 }} />
                  Play {isCurrentPage('/play') && '✓'}
                </MenuItem>
                <MenuItem 
                  onClick={handleClose} 
                  component={Link} 
                  to="/puzzle" 
                  sx={{ 
                    backgroundColor: isCurrentPage('/puzzle') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    fontWeight: isCurrentPage('/puzzle') ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <PuzzlePiece size={18} weight={isCurrentPage('/puzzle') ? "fill" : "regular"} />
                  Puzzle {isCurrentPage('/puzzle') && '✓'}
                </MenuItem>
                <MenuItem 
                  onClick={handleClose} 
                  component={Link} 
                  to="/viewer" 
                  sx={{ 
                    backgroundColor: isCurrentPage('/viewer') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    fontWeight: isCurrentPage('/viewer') ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <Binoculars size={18} weight={isCurrentPage('/viewer') ? "fill" : "regular"} />
                  Viewer {isCurrentPage('/viewer') && '✓'}
                </MenuItem>
                <MenuItem 
                  onClick={handleClose} 
                  component={Link} 
                  to="/3dviewer" 
                  sx={{ 
                    backgroundColor: isCurrentPage('/3dviewer') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    fontWeight: isCurrentPage('/3dviewer') ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <Cube size={18} weight={isCurrentPage('/3dviewer') ? "fill" : "regular"} />
                  3D Viewer {isCurrentPage('/3dviewer') && '✓'}
                </MenuItem>
                <MenuItem 
                  onClick={handleClose} 
                  component={Link} 
                  to="/3dplay" 
                  sx={{ 
                    backgroundColor: isCurrentPage('/3dplay') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    fontWeight: isCurrentPage('/3dplay') ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <GameController size={18} weight={isCurrentPage('/3dplay') ? "fill" : "regular"} />
                  3D Play {isCurrentPage('/3dplay') && '✓'}
                </MenuItem>
                <MenuItem 
                  onClick={handleClose} 
                  component={Link} 
                  to="/submit-game" 
                  sx={{ 
                    backgroundColor: isCurrentPage('/submit-game') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    fontWeight: isCurrentPage('/submit-game') ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <Upload size={18} weight={isCurrentPage('/submit-game') ? "fill" : "regular"} />
                  Submit Game {isCurrentPage('/submit-game') && '✓'}
                </MenuItem>
              </Box>
            </Collapse>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
            
            {/* Settings Section */}
            <ListItemButton
              onClick={() => setMobileSettingsExpanded(!mobileSettingsExpanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <Gear size={20} weight={mobileSettingsExpanded ? "fill" : "regular"} />
              <Box sx={{ flex: 1, fontWeight: mobileSettingsExpanded ? '600' : '400' }}>
                Settings
              </Box>
              {mobileSettingsExpanded ? (
                <CaretDown size={16} />
              ) : (
                <CaretRight size={16} />
              )}
            </ListItemButton>
            
            <Collapse in={mobileSettingsExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ paddingLeft: '32px', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                <MenuItem 
                  onClick={() => {
                    handleClose();
                    toggleColorPicker();
                  }} 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <Palette size={18} weight={isColorSectionExpanded ? "fill" : "regular"} />
                  Colors
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    handleClose();
                    toggleDecorations();
                  }} 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <Star size={18} weight={isDecorationSectionExpanded ? "fill" : "regular"} />
                  Decorations
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    handleClose();
                    toggleSoundOptions();
                  }} 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '40px'
                  }}
                >
                  <SpeakerHigh size={18} weight={isSoundSectionExpanded ? "fill" : "regular"} />
                  Sound
                </MenuItem>
              </Box>
            </Collapse>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
            
            {/* About */}
            <MenuItem 
              onClick={handleClose} 
              component={Link} 
              to="/about" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <CircleIcon sx={{ fontSize: 20 }} />
              About
            </MenuItem>
            
            {/* Light/Dark Mode */}
            <MenuItem 
              onClick={() => {
                handleClose();
                toggleLightMode();
              }} 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {lightMode === 'dark' ? (
                <Sun size={20} weight="fill" />
              ) : (
                <Moon size={20} weight="fill" />
              )}
              {lightMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </MenuItem>
          </Menu>
          <img src={'/images/fox-icon.svg'} className={styles.sidenavFoxStencil} id="logo" width="50" height="50"/>
        </MyToolbar>
      </MyAppBar>
      <Drawer 
        className={styles.myDrawer} 
        variant="permanent"
        ref={drawerRef}
      >
        <DrawerHeader className={styles.cfLogoContainer}>
          <img src={'/images/fox-icon.svg'} className={styles.sidenavFoxStencil} id="logo" width="44" height="44"/>
        </DrawerHeader>
        
        {/* Home - Always visible */}
        <List className={styles.btnContainer}>
          <a id="homeBtn" className={styles.link} href="/">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="Home" placement="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '12px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '12px' : '0' }}>
                    <House 
                      className={styles.homeLogo} 
                      style={{ 
                        color: isCurrentPage('/') ? '#60A5FA' : getTextColor(),
                        fontSize: isCurrentPage('/') ? '24px' : '20px'
                      }} 
                      weight={isCurrentPage('/') ? "fill" : (hoveredIcon === 'home' ? "fill" : "regular")}
                      onMouseEnter={() => setHoveredIcon('home')}
                      onMouseLeave={() => setHoveredIcon(null)}
                    />
                    {sidebarExpanded && (
                      <Box sx={{ color: getTextColor(), fontSize: '14px', fontWeight: isCurrentPage('/') ? '600' : '400', whiteSpace: 'nowrap' }}>
                        Home
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>

        {/* Modes Section - Expandable (combines Games and Tools) */}
        <List className={styles.btnContainer}>
          <ListItem 
            className={styles.listItem} 
            onClick={() => {
              setIsModesExpanded(!isModesExpanded);
              setSidebarExpanded(true);
            }} 
            sx={{ ...listItemStyle, cursor: 'pointer' }}
          >
            <ListItemIcon sx={iconStyle}>
              <Tooltip title="Modes" placement="right">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '12px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '12px' : '0' }}>
                  <GameController 
                    style={{ 
                      color: isModesExpanded ? '#8B5CF6' : getTextColor(),
                      fontSize: isModesExpanded ? '24px' : '20px'
                    }} 
                    weight={isModesExpanded ? "fill" : "regular"}
                  />
                  {sidebarExpanded && (
                    <Box sx={{ color: getTextColor(), fontSize: '14px', fontWeight: isModesExpanded ? '600' : '400', flex: 1 }}>
                      Modes
                    </Box>
                  )}
                </Box>
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>
        
        {/* Modes Submenu */}
        {isModesExpanded && (
          <Box sx={{ paddingLeft: sidebarExpanded ? '6px' : '0', borderLeft: sidebarExpanded ? '1px solid rgba(255,255,255,0.12)' : 'none', marginLeft: sidebarExpanded ? '4px' : '0' }}>
            <List className={styles.btnContainer}>
              <a id="playBtn" className={styles.link} href="/play">
                <ListItem className={`${styles.listItem} ${isCurrentPage('/play') ? styles.activePage : ''}`} sx={{ ...listItemStyle, minHeight: '34px' }}>
                  <ListItemIcon sx={iconStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                      <SmartToyIcon 
                        style={{ 
                          color: isCurrentPage('/play') ? '#EF4444' : getTextColor(),
                          fontSize: '18px'
                        }} 
                      />
                      {sidebarExpanded && (
                        <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isCurrentPage('/play') ? '600' : '400' }}>
                          Play
                        </Box>
                      )}
                    </Box>
                  </ListItemIcon>
                </ListItem>
              </a>
            </List>
            <List className={styles.btnContainer}>
              <a id="puzzleBtn" className={styles.link} href="/puzzle">
                <ListItem className={`${styles.listItem} ${isCurrentPage('/puzzle') ? styles.activePage : ''}`} sx={{ ...listItemStyle, minHeight: '34px' }}>
                  <ListItemIcon sx={iconStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                      <PuzzlePiece 
                        style={{ 
                          color: isCurrentPage('/puzzle') ? '#10B981' : getTextColor(),
                          fontSize: '18px'
                        }} 
                        weight={isCurrentPage('/puzzle') ? "fill" : "regular"}
                      />
                      {sidebarExpanded && (
                        <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isCurrentPage('/puzzle') ? '600' : '400' }}>
                          Puzzle
                        </Box>
                      )}
                    </Box>
                  </ListItemIcon>
                </ListItem>
              </a>
            </List>
            <List className={styles.btnContainer}>
              <a id="viewerBtn" className={styles.link} href="/viewer">
                <ListItem className={`${styles.listItem} ${isCurrentPage('/viewer') ? styles.activePage : ''}`} sx={{ ...listItemStyle, minHeight: '34px' }}>
                  <ListItemIcon sx={iconStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                      <Binoculars 
                        style={{ 
                          color: isCurrentPage('/viewer') ? '#34D399' : getTextColor(),
                          fontSize: '18px'
                        }} 
                        weight={isCurrentPage('/viewer') ? "fill" : "regular"}
                      />
                      {sidebarExpanded && (
                        <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isCurrentPage('/viewer') ? '600' : '400' }}>
                          Viewer
                        </Box>
                      )}
                    </Box>
                  </ListItemIcon>
                </ListItem>
              </a>
            </List>
            <List className={styles.btnContainer}>
              <a id="3dViewerBtn" className={styles.link} href="/3dviewer">
                <ListItem className={`${styles.listItem} ${isCurrentPage('/3dviewer') ? styles.activePage : ''}`} sx={{ ...listItemStyle, minHeight: '34px' }}>
                  <ListItemIcon sx={iconStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                      <Cube 
                        style={{ 
                          color: isCurrentPage('/3dviewer') ? '#8B5CF6' : getTextColor(),
                          fontSize: '18px'
                        }} 
                        weight={isCurrentPage('/3dviewer') ? "fill" : "regular"}
                      />
                      {sidebarExpanded && (
                        <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isCurrentPage('/3dviewer') ? '600' : '400' }}>
                          3D Viewer
                        </Box>
                      )}
                    </Box>
                  </ListItemIcon>
                </ListItem>
              </a>
              <a id="3dPlayBtn" className={styles.link} href="/3dplay">
                <ListItem className={`${styles.listItem} ${isCurrentPage('/3dplay') ? styles.activePage : ''}`} sx={{ ...listItemStyle, minHeight: '34px' }}>
                  <ListItemIcon sx={iconStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                      <GameController 
                        style={{ 
                          color: isCurrentPage('/3dplay') ? '#8B5CF6' : getTextColor(),
                          fontSize: '18px'
                        }} 
                        weight={isCurrentPage('/3dplay') ? "fill" : "regular"}
                      />
                      {sidebarExpanded && (
                        <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isCurrentPage('/3dplay') ? '600' : '400' }}>
                          3D Play
                        </Box>
                      )}
                    </Box>
                  </ListItemIcon>
                </ListItem>
              </a>
            </List>
            <List className={styles.btnContainer}>
              <a id="submitGameBtn" className={styles.link} href="/submit-game">
                <ListItem className={`${styles.listItem} ${isCurrentPage('/submit-game') ? styles.activePage : ''}`} sx={{ ...listItemStyle, minHeight: '34px' }}>
                  <ListItemIcon sx={iconStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                      <Upload
                        style={{
                          color: isCurrentPage('/submit-game') ? '#F59E0B' : getTextColor(),
                          fontSize: '18px'
                        }}
                        weight={isCurrentPage('/submit-game') ? "fill" : "regular"}
                      />
                      {sidebarExpanded && (
                        <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isCurrentPage('/submit-game') ? '600' : '400' }}>
                          Submit Game
                        </Box>
                      )}
                    </Box>
                  </ListItemIcon>
                </ListItem>
              </a>
            </List>
          </Box>
        )}
        {/* Settings Section - Expandable */}
        <List className={styles.btnContainer}>
          <ListItem 
            className={styles.listItem} 
            onClick={() => {
              setIsSettingsExpanded(!isSettingsExpanded);
              setSidebarExpanded(true);
            }} 
            sx={{ ...listItemStyle, cursor: 'pointer' }}
          >
            <ListItemIcon sx={iconStyle}>
              <Tooltip title="Settings" placement="right">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '12px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '12px' : '0' }}>
                  <Gear 
                    style={{ 
                      color: isSettingsExpanded ? '#10B981' : getTextColor(),
                      fontSize: isSettingsExpanded ? '24px' : '20px'
                    }} 
                    weight={isSettingsExpanded ? "fill" : "regular"}
                  />
                  {sidebarExpanded && (
                    <Box sx={{ color: getTextColor(), fontSize: '14px', fontWeight: isSettingsExpanded ? '600' : '400', flex: 1 }}>
                      Settings
                    </Box>
                  )}
                </Box>
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>
        
        {/* Settings Submenu */}
        {isSettingsExpanded && (
          <Box sx={{ paddingLeft: sidebarExpanded ? '6px' : '0', borderLeft: sidebarExpanded ? '1px solid rgba(255,255,255,0.12)' : 'none', marginLeft: sidebarExpanded ? '4px' : '0' }}>
            <List className={styles.btnContainer}>
              <ListItem className={styles.listItem} onClick={toggleColorPicker} sx={{ ...listItemStyle, cursor: 'pointer' }}>
                <ListItemIcon sx={iconStyle}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                    <Palette 
                      style={{ 
                        color: isColorSectionExpanded ? '#8B5CF6' : getTextColor(),
                        fontSize: '18px'
                      }} 
                      weight={isColorSectionExpanded ? "fill" : "regular"}
                    />
                    {sidebarExpanded && (
                      <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isColorSectionExpanded ? '600' : '400' }}>
                        Colors
                      </Box>
                    )}
                  </Box>
                </ListItemIcon>
              </ListItem>
            </List>
            <List className={styles.btnContainer}>
              <ListItem className={styles.listItem} onClick={toggleDecorations} sx={{ ...listItemStyle, cursor: 'pointer' }}>
                <ListItemIcon sx={iconStyle}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                    <Star 
                      style={{ 
                        color: isDecorationSectionExpanded ? '#F97316' : 
                               (showWoodenCircle.current || showApplePolygon.current) ? '#8B4513' : getTextColor(),
                        fontSize: '18px',
                        opacity: (showWoodenCircle.current || showApplePolygon.current) ? 1 : 0.6
                      }} 
                      weight={isDecorationSectionExpanded ? "fill" : "regular"}
                    />
                    {sidebarExpanded && (
                      <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isDecorationSectionExpanded ? '600' : '400' }}>
                        Decorations
                      </Box>
                    )}
                  </Box>
                </ListItemIcon>
              </ListItem>
            </List>
            <List className={styles.btnContainer}>
              <ListItem className={styles.listItem} onClick={toggleSoundOptions} sx={{ ...listItemStyle, cursor: 'pointer' }}>
                <ListItemIcon sx={iconStyle}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                    <SpeakerHigh 
                      style={{ 
                        color: isSoundSectionExpanded ? '#10B981' : getTextColor(),
                        fontSize: '18px'
                      }} 
                      weight={isSoundSectionExpanded ? "fill" : "regular"}
                    />
                    {sidebarExpanded && (
                      <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isSoundSectionExpanded ? '600' : '400' }}>
                        Sound
                      </Box>
                    )}
                  </Box>
                </ListItemIcon>
              </ListItem>
            </List>
          </Box>
        )}
        
        {/* Color Picker Section - Slides out when expanded */}
        {isColorSectionExpanded && (
          <Box
            sx={{
              padding: sidebarExpanded ? '16px' : '12px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '120px',
              justifyContent: 'center',
              marginLeft: sidebarExpanded ? '20px' : '0',
              borderLeft: sidebarExpanded ? '2px solid rgba(255,255,255,0.1)' : 'none'
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
              padding: sidebarExpanded ? '16px' : '12px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '120px',
              justifyContent: 'center',
              marginLeft: sidebarExpanded ? '20px' : '0',
              borderLeft: sidebarExpanded ? '2px solid rgba(255,255,255,0.1)' : 'none'
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
              padding: sidebarExpanded ? '16px' : '12px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '120px',
              justifyContent: 'center',
              marginLeft: sidebarExpanded ? '20px' : '0',
              borderLeft: sidebarExpanded ? '2px solid rgba(255,255,255,0.1)' : 'none'
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
        
        {/* About - At bottom */}
        <List className={`${styles.btnContainer} ${styles.changelogContainer}`}>
          <a id="aboutBtn" className={styles.link} href="/about">
            <ListItem className={styles.listItem}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="About" placement="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '12px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '12px' : '0' }}>
                    <CircleIcon style={{ color: '#f59e0b', fontSize: '20px' }} />
                    {sidebarExpanded && (
                      <Box sx={{ color: getTextColor(), fontSize: '14px' }}>
                        About
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>

        {/* Light/Dark Mode Toggle - At bottom, separate from Settings */}
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={toggleLightMode} sx={{ ...listItemStyle, cursor: 'pointer' }}>
            <ListItemIcon sx={iconStyle}>
              <Tooltip title={lightMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} placement="right">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '12px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '12px' : '0' }}>
                  {lightMode === 'dark' ? (
                    <Sun 
                      style={{ 
                        color: '#F59E0B', 
                        fontSize: '20px'
                      }} 
                      weight="fill" 
                    />
                  ) : (
                    <Moon 
                      style={{ 
                        color: '#6366F1', 
                        fontSize: '20px'
                      }} 
                      weight="fill" 
                    />
                  )}
                  {sidebarExpanded && (
                    <Box sx={{ color: getTextColor(), fontSize: '14px' }}>
                      {lightMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            </ListItemIcon>
          </ListItem>
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
