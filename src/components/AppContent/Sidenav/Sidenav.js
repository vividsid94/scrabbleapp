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
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const location = useLocation();

  const getBackgroundColor = () => {
    return lightMode === 'dark' ? '#000000' : '#5a5a7a';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#f5f5f5';
  };

  const openedMixin = () => ({
    width: `120px`,
    overflowX: 'hidden',
    background: getBackgroundColor(),
    backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
    transition: '0.5s ease',
  });

  const closedMixin = () => ({
    width: `45px`,
    overflowX: 'hidden',
    background: getBackgroundColor(),
    backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
    transition: '0.5s ease',
  });

  const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
  }));

  const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
      ...(open && {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      }),
      ...(!open && {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      }),
    }),
  );

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

  const handleDrawer = () => {
    if (open){
      setOpen(false);
    }
    else{
      setOpen(true);
    }
  };

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

  return (
    <Box>
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
      <Drawer className={styles.myDrawer} variant="permanent" open={open}>
        <DrawerHeader className={styles.cfLogoContainer}>
          <img onClick={handleDrawer} src={'/images/favicon.png'} className={styles.cfLogo} id="logo" width="50" height="50"/>
        </DrawerHeader>
        
        {/* Current Page Indicator */}
        {open && (
          <Box sx={{ 
            padding: '8px 16px', 
            borderBottom: `1px solid ${getTextColor()}20`,
            marginBottom: '8px'
          }}>
            <Box sx={{ 
              fontSize: '12px', 
              color: `${getTextColor()}80`, 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Current Page
            </Box>
            <Box sx={{ 
              fontSize: '14px', 
              color: getTextColor(), 
              fontWeight: '600',
              marginTop: '2px'
            }}>
              {getCurrentPage()}
            </Box>
          </Box>
        )}
        
        <List className={styles.btnContainer}>
          <a id="homeBtn" className={styles.link} href="/">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/') ? styles.activePage : ''}`}>
              <ListItemIcon>
                <Tooltip title="Home">
                  <CastleIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                </Tooltip>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Home"} sx={{ color: getTextColor() }}/>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="viewerBtn" className={styles.link} href="/viewer">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/viewer') ? styles.activePage : ''}`}>
              <ListItemIcon>
                <Tooltip title="Game Viewer">
                  <EyeIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                </Tooltip>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Viewer"} sx={{ color: getTextColor() }}/>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="changelogBtn" className={styles.link} href="/changelog">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/changelog') ? styles.activePage : ''}`}>
              <ListItemIcon>
                <Tooltip title="Changelog">
                  <RocketLaunchIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                </Tooltip>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Changelog"} sx={{ color: getTextColor() }}/>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="submitGameBtn" className={styles.link} href="/submit-game">
            <ListItem className={`${styles.listItem} ${isCurrentPage('/submit-game') ? styles.activePage : ''}`}>
              <ListItemIcon>
                <Tooltip title="Submit Game">
                  <SendIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                </Tooltip>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Submit Game"} sx={{ color: getTextColor() }}/>
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={toggleLightMode} sx={{ cursor: 'pointer' }}>
            <ListItemIcon>
              <Tooltip title={lightMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                {lightMode === 'dark' ? (
                  <LightModeIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                ) : (
                  <DarkModeIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                )}
              </Tooltip>
            </ListItemIcon>
            <ListItemText className={styles.listItemText} primary={lightMode === 'dark' ? 'Light' : 'Dark'} sx={{ color: getTextColor() }}/>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}
