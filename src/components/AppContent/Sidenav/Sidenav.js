import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

//import { useMediaQuery } from '@material-ui/core';

import { IoHome } from "react-icons/io5";
import { IoEyeSharp } from "react-icons/io5";

import styles from './Sidenav.module.css';
const drawerWidth = 190;

const openedMixin = (theme) => ({
  width: drawerWidth,
  background: "#14000b",
  color: "white",
  backgroundImage: "url('https://www.transparenttextures.com/patterns/rough-cloth.png')",
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
  fontFamily: 'Josefin Sans',
  background: "#14000b",
  backgroundImage: "url('https://www.transparenttextures.com/patterns/rough-cloth.png')",
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'Josefin Sans',
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

export default function MiniDrawer() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawer = () => {
    if (open){
      setOpen(false);
    }
    else{
      setOpen(true);
    }
  };

  return (
    <Box>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader className={styles.cfLogoContainer}>
          <img onClick={handleDrawer} src={'/images/ssLogo.png'} className={styles.cfLogo} id="logo" width="50" height="50"/>
        </DrawerHeader>
        <List className={styles.btnContainer}>
          <a id="homeBtn" className={styles.link} href="/">
            <ListItem className={styles.listItem}>
              <ListItemIcon>
                <IoHome className={styles.homeLogo}/>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Home"} />
            </ListItem>
          </a>
        </List>
        <List className={styles.btnContainer}>
          <a id="viewerBtn" className={styles.link} href="/viewer">
            <ListItem className={styles.listItem}>
              <ListItemIcon>
                <IoEyeSharp className={styles.homeLogo}/>
              </ListItemIcon>
              <ListItemText className={styles.listItemText} primary={"Viewer"} />
            </ListItem>
          </a>
        </List>
      </Drawer>
    </Box>
  );
}
