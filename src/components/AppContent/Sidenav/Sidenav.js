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

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import styles from './Sidenav.module.css';

export default function MiniDrawer() {
  const { lightMode } = React.useContext(ThemeContext);
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const getBackgroundColor = () => {
    return lightMode === 'dark' ? '#110113' : '#d0d0d0';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#000';
  };

  const openedMixin = () => ({
    width: `180px`,
    overflowX: 'hidden',
    background: getBackgroundColor(),
    backgroundImage: lightMode === 'dark' ? "url('https://www.transparenttextures.com/patterns/maze-black.png')" : "url('https://www.transparenttextures.com/patterns/maze-white.png')",
    transition: '0.5s ease',
  });

  const closedMixin = () => ({
    width: `65px`,
    overflowX: 'hidden',
    background: getBackgroundColor(),
    backgroundImage: lightMode === 'dark' ? "url('https://www.transparenttextures.com/patterns/maze-black.png')" : "url('https://www.transparenttextures.com/patterns/maze-white.png')",
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
    backgroundImage: lightMode === 'dark' ? "url('https://www.transparenttextures.com/patterns/maze-black.png')" : "url('https://www.transparenttextures.com/patterns/maze-white.png')",
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
          </Menu>
          <img src={'/images/ssLogo.png'} className={styles.cfLogo} id="logo" width="50" height="50"/>
        </MyToolbar>
      </MyAppBar>
      <Drawer className={styles.myDrawer} variant="permanent" open={open}>
        <DrawerHeader className={styles.cfLogoContainer}>
          <img onClick={handleDrawer} src={'/images/ssLogo.png'} className={styles.cfLogo} id="logo" width="50" height="50"/>
        </DrawerHeader>
        <List className={styles.btnContainer}>
          <a id="homeBtn" className={styles.link} href="/">
            <ListItem className={styles.listItem}>
              <ListItemIcon>
                <Tooltip title="Home">
                  <HomeOutlinedIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
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
                  <VisibilityOutlinedIcon className={styles.homeLogo} sx={{ color: getTextColor() }}/>
                </Tooltip>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Viewer"} sx={{ color: getTextColor() }}/>
            </ListItem>
          </a>
        </List>
      </Drawer>
    </Box>
  );
}
