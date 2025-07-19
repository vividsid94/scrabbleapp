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

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Tooltip } from "@mui/material";

import { 
  House, 
  Binoculars, 
  Upload, 
  Clock, 
  Palette, 
  Star,
  Sun,
  Moon
} from '@phosphor-icons/react';
import CircleIcon from '@mui/icons-material/Circle';
import AppleIcon from '@mui/icons-material/Apple';

import styles from './Sidenav.module.css';

export default function MiniDrawer() {
  const { lightMode, setLightMode } = React.useContext(ThemeContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [isColorSectionExpanded, setIsColorSectionExpanded] = React.useState(false);
  const [showDecorations, setShowDecorations] = React.useState(false);
  const [isDecorationSectionExpanded, setIsDecorationSectionExpanded] = React.useState(false);
  const location = useLocation();
  const color = useColorSchemeStore(state => state.color);
  const boardColor = useColorSchemeStore(state => state.boardColor);
  const showWoodenCircle = useColorSchemeStore(state => state.showWoodenCircle);
  const showApplePolygon = useColorSchemeStore(state => state.showApplePolygon);
  const updateColor = useColorSchemeStore(state => state.updateColor);
  const updateBoardColor = useColorSchemeStore(state => state.updateBoardColor);
  const updateShowWoodenCircle = useColorSchemeStore(state => state.updateShowWoodenCircle);
  const updateShowApplePolygon = useColorSchemeStore(state => state.updateShowApplePolygon);

  const getBackgroundColor = () => {
    return '#1F2937';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#f5f5f5';
  };

  const drawerMixin = () => ({
    width: (isColorSectionExpanded || isDecorationSectionExpanded) ? '200px' : '55px',
    overflowX: 'hidden',
    background: getBackgroundColor(),
    backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
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
    backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
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
          <IconButton color="inherit" onClick={handleClick}>
            <MenuIcon sx={{ color: getTextColor() }}/>
          </IconButton>
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
          <img src={'/images/favicon.png'} className={styles.cfLogo} id="logo" width="50" height="50"/>
        </MyToolbar>
      </MyAppBar>
      <Drawer className={styles.myDrawer} variant="permanent">
        <DrawerHeader className={styles.cfLogoContainer}>
          <img src={'/images/favicon.png'} className={styles.cfLogo} id="logo" width="40" height="40"/>
        </DrawerHeader>
        
        <List className={styles.btnContainer}>
          <a id="homeBtn" className={styles.link} href="/">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/') ? styles.activePage : ''}`} sx={listItemStyle}>
              <ListItemIcon sx={iconStyle}>
                <Tooltip title="Home" placement="right">
                  <House 
                    className={styles.homeLogo} 
                    style={{ 
                      color: isCurrentPage('/') ? '#60A5FA' : getTextColor(),
                      fontSize: isCurrentPage('/') ? '24px' : '20px'
                    }} 
                    weight={isCurrentPage('/') ? "fill" : "regular"} 
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
                    weight={isCurrentPage('/viewer') ? "fill" : "regular"} 
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
                    weight={isCurrentPage('/submit-game') ? "fill" : "regular"} 
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
                    weight={isCurrentPage('/changelog') ? "fill" : "regular"} 
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
                    weight={isColorSectionExpanded ? "fill" : "regular"} 
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
                    weight={isDecorationSectionExpanded ? "fill" : "regular"} 
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
            backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
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
            backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
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
      
    </Box>
  );
}
