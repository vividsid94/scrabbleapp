import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { TextField, Tooltip } from "@mui/material";


//import { useMediaQuery } from '@material-ui/core';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import styles from './Sidenav.module.css';
const drawerWidth = 190;
let texture = "maze-black";
let background = "#110113"

const openedMixin = (theme) => ({
  width: drawerWidth,
  background: background,
  color: "white",
  backgroundImage: "url('https://www.transparenttextures.com/patterns/" + texture + ".png')",
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  background: background,
  backgroundImage: "url('https://www.transparenttextures.com/patterns/" + texture + ".png')",
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
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
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
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
  background: background,
  backgroundImage: "url('https://www.transparenttextures.com/patterns/" + texture + ".png')",
  display: "flex",
  justifyContent: "space-between"
});

const MyToolbar = styled(Toolbar)({
  display: "flex",
  justifyContent: "space-between"
});

export default function MiniDrawer() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

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
          <IconButton
            color="inherit"
            aria-label="open menu"
            edge="start"
            onClick={handleClick}
          >
            <MenuIcon />
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
                  <HomeOutlinedIcon className={styles.homeLogo}/>
                </Tooltip>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Home"} />
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="viewerBtn" className={styles.link} href="/viewer">
            <ListItem className={styles.listItem}>
              <ListItemIcon>
                <Tooltip title="Game Viewer">
                  <VisibilityOutlinedIcon className={styles.homeLogo}/>
                </Tooltip>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Viewer"} />
            </ListItem>
          </a>
        </List>
      </Drawer>
    </Box>
  );
}
