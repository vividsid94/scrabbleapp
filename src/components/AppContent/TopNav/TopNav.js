import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../../App';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CastleIcon from '@mui/icons-material/Castle';
import EyeIcon from '@mui/icons-material/Search';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SendIcon from '@mui/icons-material/Send';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import styles from './TopNav.module.css';

export default function TopNav() {
  const { lightMode, setLightMode } = useContext(ThemeContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getBackgroundColor = () => {
    return lightMode === 'dark' ? '#000000' : '#5a5a7a';
  };

  const getTextColor = () => {
    return lightMode === 'dark' ? '#fff' : '#f5f5f5';
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleLightMode = () => {
    setLightMode(lightMode === 'dark' ? 'light' : 'dark');
  };

  const isCurrentPage = (pagePath) => {
    const path = location.pathname;
    if (pagePath === '/' && path === '/') return true;
    if (pagePath === '/viewer' && path === '/viewer') return true;
    if (pagePath === '/changelog' && path === '/changelog') return true;
    if (pagePath === '/submit-game' && path === '/submit-game') return true;
    return false;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <CastleIcon /> },
    { path: '/viewer', label: 'Viewer', icon: <EyeIcon /> },
    { path: '/changelog', label: 'Changelog', icon: <RocketLaunchIcon /> },
    { path: '/submit-game', label: 'Submit Game', icon: <SendIcon /> },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.path} 
            component={Link} 
            to={item.path}
            sx={{
              backgroundColor: isCurrentPage(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: getTextColor(),
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: getTextColor() }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        <ListItem 
          onClick={toggleLightMode}
          sx={{
            color: getTextColor(),
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          <ListItemIcon sx={{ color: getTextColor() }}>
            {lightMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </ListItemIcon>
          <ListItemText primary={lightMode === 'dark' ? 'Light Mode' : 'Dark Mode'} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{
          backgroundColor: getBackgroundColor(),
          backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '48px', padding: '0 16px' }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/images/favicon.png" 
              alt="Logo" 
              style={{ width: 32, height: 32, marginRight: 8 }}
            />
                          <Typography 
                variant="subtitle1" 
                component="div" 
                sx={{ 
                  color: getTextColor(),
                  fontWeight: 600,
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '1rem'
                }}
              >
                Tile Turnover
              </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  color: getTextColor(),
                  backgroundColor: isCurrentPage(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  textTransform: 'none',
                  fontWeight: isCurrentPage(item.path) ? 600 : 400,
                  padding: '4px 12px',
                  minHeight: '32px',
                  fontSize: '0.875rem'
                }}
              >
                {item.label}
              </Button>
            ))}
            <IconButton
              onClick={toggleLightMode}
              sx={{ color: getTextColor() }}
            >
              {lightMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              color: getTextColor(),
              display: { md: 'none' }
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            backgroundColor: getBackgroundColor(),
            backgroundImage: "url('https://www.transparenttextures.com/patterns/diagonal-noise.png')",
            width: 240,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Toolbar spacer to prevent content from being hidden behind the app bar */}
      <Toolbar />
    </>
  );
} 