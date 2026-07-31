import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../../App';
import { useConsoleLogStore } from '../../../stores/consoleLogStore';
import { useAuth } from '../../../contexts/AuthContext';
import AuthModal from '../../Auth/AuthModal';
import LoggedOutVisualSettings from '../../Modals/LoggedOutVisualSettings';
import { Link as RouterLink } from 'react-router-dom';

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Tooltip, Divider } from "@mui/material";

import {
  House,
  Binoculars,
  Upload,
  Palette,
  Sun,
  Moon,
  Cube,
  PuzzlePiece,
  Flask,
  User,
  SignOut,
  GameController,
  Terminal,
  X,
  Check
} from '@phosphor-icons/react';
import CircleIcon from '@mui/icons-material/Circle';
import AppleIcon from '@mui/icons-material/Apple';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import styles from './Sidenav.module.css';

// A route row in the mobile slide-in menu. Icons render via currentColor
// (Phosphor icons default to it; MUI icons pick it up too without an
// explicit color), so setting color once on the MenuItem colors both the
// icon and label consistently.
const MobileMenuItem = ({ to, label, active, onClick, colors, children }) => (
  <MenuItem
    component={Link}
    to={to}
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      backgroundColor: active ? colors.activeBg : 'transparent',
      color: active ? colors.accent : colors.text,
      fontWeight: active ? 600 : 400,
      '&:hover': { backgroundColor: active ? colors.activeBg : colors.hover }
    }}
  >
    {children}
    <Box sx={{ flex: 1 }}>{label}</Box>
    {active && <Check size={16} weight="bold" />}
  </MenuItem>
);

// Same row styling as MobileMenuItem but for actions that aren't a route
// link (Colors/Decorations/Sound/Light-Dark toggle) - label is passed as a
// child alongside the icon instead of a separate prop, since these don't
// have a single fixed label (e.g. the light/dark toggle's text changes).
const MobileMenuAction = ({ onClick, colors, children }) => (
  <MenuItem
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      color: colors.text,
      '&:hover': { backgroundColor: colors.hover }
    }}
  >
    {children}
  </MenuItem>
);

export default function MiniDrawer() {
  const { lightMode, setLightMode } = React.useContext(ThemeContext);
  const { user, profile, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isModesExpanded, setIsModesExpanded] = React.useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = React.useState(false);
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);
  const [hoveredIcon, setHoveredIcon] = React.useState(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('signin');
  const [showVisualSettings, setShowVisualSettings] = React.useState(false);
  const drawerRef = React.useRef(null);
  const location = useLocation();
  const toggleDevConsole = useConsoleLogStore(state => state.toggleOpen);

  const getBackgroundColor = () => {
    // Sidebar stays dark in both themes — its text/hover states are white-on-dark.
    // Dark mode keeps the app's cool charcoal (#1F2937). Light mode used to start
    // that same cool charcoal at the top of its gradient, which fought the warm
    // stone palette everywhere else — it's now a fully warm dark tone instead.
    return lightMode === 'dark'
      ? '#1F2937'
      : 'linear-gradient(180deg, #332E28 0%, #201C17 100%)';
  };

  const getTextColor = () => {
    return '#fff';
  };

  // Mobile topbar + its slide-in menu, redesigned to be independent of the
  // desktop sidebar's getBackgroundColor/getTextColor (which are deliberately
  // dark-always) - this should actually flip light/dark like the rest of the
  // app, not stay permanently dark.
  const mobileMenuBg = lightMode === 'dark' ? '#1F2937' : '#FFFFFF';
  const mobileMenuText = lightMode === 'dark' ? '#FFFFFF' : '#1F2937';
  const mobileMenuMuted = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.55)' : 'rgba(31, 41, 55, 0.55)';
  const mobileMenuBorder = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const mobileMenuHover = lightMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const mobileMenuAccent = lightMode === 'dark' ? '#10B981' : '#059669';
  const mobileMenuActiveBg = lightMode === 'dark' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(5, 150, 105, 0.12)';

  const mobileMenuColors = {
    text: mobileMenuText,
    hover: mobileMenuHover,
    accent: mobileMenuAccent,
    activeBg: mobileMenuActiveBg,
  };

  const mobileMenuSectionLabelSx = {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: mobileMenuMuted,
    padding: '10px 16px 4px'
  };

  const drawerMixin = () => ({
    width: (sidebarExpanded || isModesExpanded || isSettingsExpanded) ? '160px' : '52px',
    overflowX: 'hidden',
    background: getBackgroundColor(),
    borderRight: lightMode === 'dark' ? 'none' : '1px solid rgba(140, 130, 110, 0.35)',
    boxShadow: lightMode === 'dark' ? 'none' : '2px 0 16px rgba(0, 0, 0, 0.18)',
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
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: "48px",
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
    if (path === '/3dviewer') return '3D Viewer';
    if (path === '/3dplay') return '3D Play';
    if (path === '/playground' || path === '/play') return 'Play';
    if (path === '/puzzle') return 'Puzzle';
    if (path === '/sandbox') return 'Sandbox';
    if (path === '/submit-game') return 'Submit Game';
    if (path === '/memory') return 'Memory';
    if (path === '/words') return 'Words';
    if (path === '/series') return 'Series';
    if (path === '/snakes') return 'Snakes';
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
    if (pagePath === '/sandbox' && path === '/sandbox') return true;
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
      }
    };

    document.addEventListener('mousemove', handleHoverOutside);
    return () => {
      document.removeEventListener('mousemove', handleHoverOutside);
    };
  }, []);

  const navigate = useNavigate();

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
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className={styles.navAuthButton}
                >
                  Account
                </button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Link to="/profile" className={styles.navAuthLink}>
                  <button className={styles.navAuthButton}>
                    {profile?.display_name || profile?.username || 'Profile'}
                  </button>
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className={styles.navAuthButton}
                >
                  Sign Out
                </button>
              </Box>
            )}
          </Box>
          <img src={'/images/fox-icon.svg'} className={styles.sidenavFoxStencil} id="logo" width="50" height="50"/>
        </MyToolbar>
      </MyAppBar>

      <MuiDrawer
        anchor="right"
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 'min(85vw, 300px)',
            backgroundColor: mobileMenuBg,
            color: mobileMenuText,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: `1px solid ${mobileMenuBorder}`, flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={'/images/fox-icon.svg'} width="28" height="28" alt="" />
            <Box sx={{ fontWeight: 700, fontSize: '15px', fontFamily: 'Syne, sans-serif' }}>Tile Turnover</Box>
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <X size={20} color={mobileMenuText} />
          </IconButton>
        </Box>

        {/* Auth */}
        <Box sx={{ padding: '12px 16px', borderBottom: `1px solid ${mobileMenuBorder}`, flexShrink: 0 }}>
          {!user ? (
            <button
              onClick={() => { handleClose(); setAuthMode('signin'); setShowAuthModal(true); }}
              className={styles.navAuthButton}
              style={{ width: '100%' }}
            >
              Sign In
            </button>
          ) : (
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <Link to="/profile" className={styles.navAuthLink} style={{ flex: 1 }} onClick={handleClose}>
                <button className={styles.navAuthButton} style={{ width: '100%' }}>
                  {profile?.display_name || profile?.username || 'Profile'}
                </button>
              </Link>
              <button
                onClick={async () => { handleClose(); await signOut(); navigate('/'); }}
                className={styles.navAuthButton}
                style={{ flex: 1 }}
              >
                Sign Out
              </button>
            </Box>
          )}
        </Box>

        {/* Nav */}
        <Box sx={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          <MobileMenuItem to="/" label="Home" active={isCurrentPage('/')} onClick={handleClose} colors={mobileMenuColors}>
            <House size={20} weight={isCurrentPage('/') ? 'fill' : 'regular'} />
          </MobileMenuItem>

          <Box sx={mobileMenuSectionLabelSx}>Play</Box>
          <MobileMenuItem to="/play" label="Play" active={isCurrentPage('/play')} onClick={handleClose} colors={mobileMenuColors}>
            <SmartToyIcon sx={{ fontSize: 20 }} />
          </MobileMenuItem>
          <MobileMenuItem to="/puzzle" label="Puzzle" active={isCurrentPage('/puzzle')} onClick={handleClose} colors={mobileMenuColors}>
            <PuzzlePiece size={20} weight={isCurrentPage('/puzzle') ? 'fill' : 'regular'} />
          </MobileMenuItem>
          <MobileMenuItem to="/sandbox" label="Sandbox" active={isCurrentPage('/sandbox')} onClick={handleClose} colors={mobileMenuColors}>
            <Flask size={20} weight={isCurrentPage('/sandbox') ? 'fill' : 'regular'} />
          </MobileMenuItem>
          <MobileMenuItem to="/viewer" label="Viewer" active={isCurrentPage('/viewer')} onClick={handleClose} colors={mobileMenuColors}>
            <Binoculars size={20} weight={isCurrentPage('/viewer') ? 'fill' : 'regular'} />
          </MobileMenuItem>
          <MobileMenuItem to="/3dviewer" label="3D Viewer" active={isCurrentPage('/3dviewer')} onClick={handleClose} colors={mobileMenuColors}>
            <Cube size={20} weight={isCurrentPage('/3dviewer') ? 'fill' : 'regular'} />
          </MobileMenuItem>
          <MobileMenuItem to="/3dplay" label="3D Play" active={isCurrentPage('/3dplay')} onClick={handleClose} colors={mobileMenuColors}>
            <GameController size={20} weight={isCurrentPage('/3dplay') ? 'fill' : 'regular'} />
          </MobileMenuItem>
          <MobileMenuItem to="/submit-game" label="Submit Game" active={isCurrentPage('/submit-game')} onClick={handleClose} colors={mobileMenuColors}>
            <Upload size={20} weight={isCurrentPage('/submit-game') ? 'fill' : 'regular'} />
          </MobileMenuItem>

          <Divider sx={{ borderColor: mobileMenuBorder, margin: '8px 0' }} />

          <Box sx={mobileMenuSectionLabelSx}>Settings</Box>
          <MobileMenuAction onClick={() => { handleClose(); setShowVisualSettings(true); }} colors={mobileMenuColors}>
            <Palette size={20} />
            <Box sx={{ flex: 1 }}>Visual Settings</Box>
          </MobileMenuAction>
          <MobileMenuAction onClick={() => { handleClose(); toggleDevConsole(); }} colors={mobileMenuColors}>
            <Terminal size={20} />
            <Box sx={{ flex: 1 }}>Dev Console</Box>
          </MobileMenuAction>
          <MobileMenuItem to="/about" label="About" active={isCurrentPage('/about')} onClick={handleClose} colors={mobileMenuColors}>
            <CircleIcon sx={{ fontSize: 20 }} />
          </MobileMenuItem>
          {!user && (
            <MobileMenuAction onClick={() => { handleClose(); toggleLightMode(); }} colors={mobileMenuColors}>
              {lightMode === 'dark' ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
              <Box sx={{ flex: 1 }}>{lightMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Box>
            </MobileMenuAction>
          )}
        </Box>
      </MuiDrawer>
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
              <a id="sandboxBtn" className={styles.link} href="/sandbox">
                <ListItem className={`${styles.listItem} ${isCurrentPage('/sandbox') ? styles.activePage : ''}`} sx={{ ...listItemStyle, minHeight: '34px' }}>
                  <ListItemIcon sx={iconStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '8px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '2px' : '0' }}>
                      <Flask
                        style={{
                          color: isCurrentPage('/sandbox') ? '#10B981' : getTextColor(),
                          fontSize: '18px'
                        }}
                        weight={isCurrentPage('/sandbox') ? "fill" : "regular"}
                      />
                      {sidebarExpanded && (
                        <Box sx={{ color: getTextColor(), fontSize: '11px', fontWeight: isCurrentPage('/sandbox') ? '600' : '400' }}>
                          Sandbox
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
        {/* Visual Settings - board color, tile color, decorations, sound */}
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={() => setShowVisualSettings(true)} sx={{ ...listItemStyle, cursor: 'pointer' }}>
            <ListItemIcon sx={iconStyle}>
              <Tooltip title="Visual Settings" placement="right">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '12px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '12px' : '0' }}>
                  <Palette style={{ color: getTextColor(), fontSize: '20px' }} />
                  {sidebarExpanded && (
                    <Box sx={{ color: getTextColor(), fontSize: '14px' }}>
                      Visual Settings
                    </Box>
                  )}
                </Box>
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>

        {/* Dev Console toggle - At bottom */}
        <List className={styles.btnContainer}>
          <ListItem className={styles.listItem} onClick={toggleDevConsole} sx={{ ...listItemStyle, cursor: 'pointer' }}>
            <ListItemIcon sx={iconStyle}>
              <Tooltip title="Dev Console" placement="right">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarExpanded ? '12px' : '0', width: '100%', justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? '12px' : '0' }}>
                  <Terminal style={{ color: getTextColor(), fontSize: '20px' }} />
                  {sidebarExpanded && (
                    <Box sx={{ color: getTextColor(), fontSize: '14px' }}>
                      Dev Console
                    </Box>
                  )}
                </Box>
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        </List>

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

        {/* Light/Dark Mode Toggle - At bottom, separate from Settings (hidden when signed in) */}
        {!user && (
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
        )}
        
      </Drawer>

      <LoggedOutVisualSettings
        open={showVisualSettings}
        onClose={() => setShowVisualSettings(false)}
      />

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

    </Box>
  );
}
