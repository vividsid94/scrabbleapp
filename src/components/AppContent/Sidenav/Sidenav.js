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
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../../App';

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Tooltip } from "@mui/material";

import CastleIcon from '@mui/icons-material/Castle';
import EyeIcon from '@mui/icons-material/Search';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

import styles from './Sidenav.module.css';

export default function MiniDrawer() {
  const { lightMode } = React.useContext(ThemeContext);
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const getBackgroundColor = () => {
    return lightMode === 'dark' ? '#000000' : '#5a5a7a';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#f5f5f5';
  };

  const openedMixin = () => ({
    width: `180px`,
    overflowX: 'hidden',
    background: getBackgroundColor(),
    backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
    transition: '0.5s ease',
  });

  const closedMixin = () => ({
    width: `65px`,
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
            <MenuItem onClick={handleClose} component={Link} to="/">
              Home
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/viewer">
              Annotated Game Viewer
            </MenuItem>
            <MenuItem onClick={handleClose} component={Link} to="/changelog">
              Changelog
            </MenuItem>
          </Menu>
          <img src={'/images/favicon.png'} className={styles.cfLogo} id="logo" width="50" height="50"/>
        </MyToolbar>
      </MyAppBar>
      <Drawer className={styles.myDrawer} variant="permanent" open={open}>
        <DrawerHeader className={styles.cfLogoContainer}>
          <img onClick={handleDrawer} src={'/images/favicon.png'} className={styles.cfLogo} id="logo" width="50" height="50"/>
        </DrawerHeader>
        <List className={styles.btnContainer}>
          <a id="homeBtn" className={styles.link} href="/">
            <ListItem className={styles.listItem}>
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
            <ListItem className={styles.listItem}>
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
            <ListItem className={styles.listItem}>
              <ListItemIcon>
                <Tooltip title="Changelog">
                  <RocketLaunchIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                </Tooltip>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Changelog"} sx={{ color: getTextColor() }}/>
            </ListItem>
          </a>
        </List>
      </Drawer>
    </Box>
  );
}
