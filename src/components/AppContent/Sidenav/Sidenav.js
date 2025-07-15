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
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../../App';

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Tooltip } from "@mui/material";

import CastleIcon from '@mui/icons-material/Castle';
import EyeIcon from '@mui/icons-material/Search';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SendIcon from '@mui/icons-material/Send';

import styles from './Sidenav.module.css';

export default function MiniDrawer() {
  const { lightMode, setLightMode } = React.useContext(ThemeContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const location = useLocation();

  const getBackgroundColor = () => {
    return lightMode === 'dark' ? '#000000' : '#5a5a7a';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#f5f5f5';
  };

  const drawerMixin = () => ({
    width: `55px`,
    overflowX: 'hidden',
    background: getBackgroundColor(),
    backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
    transition: '0.3s ease',
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
                  <CastleIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
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
                  <EyeIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
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
                  <SendIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
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
                  <RocketLaunchIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                </Tooltip>
              </ListItemIcon>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={toggleLightMode} sx={{ ...listItemStyle, cursor: 'pointer' }}>
            <ListItemIcon sx={iconStyle}>
              <Tooltip title={lightMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="right">
                {lightMode === 'dark' ? (
                  <LightModeIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                ) : (
                  <DarkModeIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                )}
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}
