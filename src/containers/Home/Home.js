import React, { useState, useContext, useEffect } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import styles from './Home.module.css';
import { Trophy, X, CaretDown, GameController, PuzzlePiece, Eye, Sparkle, Cube, PaperPlaneTilt, MagnifyingGlass as SearchIcon } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../App';
import { loadActiveGameSnapshot } from '../../utils/activeGamePersistence';
import ModeSignChoice from './ModeSignChoice';

export default function Home(){
  const { lightMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [toolsMenuAnchor, setToolsMenuAnchor] = useState(null);
  const toolsMenuOpen = Boolean(toolsMenuAnchor);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const [hasActiveGame, setHasActiveGame] = useState(false);
  useEffect(() => {
    setHasActiveGame(!!loadActiveGameSnapshot());
  }, []);

  const handleToolsMenuClick = (event) => {
    setToolsMenuAnchor(event.currentTarget);
  };

  const handleToolsMenuClose = () => {
    setToolsMenuAnchor(null);
  };

  return (
    <>
      <Box sx={{ display: 'flex'}}>
        <Sidenav/>
        <Box className={styles.page}>
          <Box className={styles.heroContainer}>
            <Box className={styles.title}
              style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937' }}
            >
              Tile Turnover™
            </Box>
            <Box
              sx={{
                marginTop: '4px',
                fontSize: 13,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: lightMode === 'dark' ? 'rgba(209, 213, 219, 0.9)' : '#6B7280'
              }}
            >
              Lobby
            </Box>
          </Box>

          <Box className={styles.lobbySection}>
            <Box className={styles.continueSlot}>
              <div className={styles.continueLabel}>Continue</div>
              {hasActiveGame ? (
                <button
                  type="button"
                  className={styles.continueButton}
                  onClick={() => navigate('/play?continue=1')}
                >
                  <span className={styles.secondaryButtonContent}>
                    <GameController size={16} weight="fill" />
                    <span>Resume last game</span>
                  </span>
                </button>
              ) : (
                <div className={styles.continueEmpty}>No active game yet</div>
              )}
            </Box>
          </Box>

          {/* Equivalent play modes: Theo holding up two signs */}
          <ModeSignChoice />

          <Box
            className={styles.secondaryButtonsContainer}
            sx={{
              width: '100%',
              margin: '30px auto 0',
              padding: { xs: '0 16px', sm: '0 20px' },
              boxSizing: 'border-box'
            }}
          >
            <Box className={styles.modeButtonGrid}>
              <Link to="/puzzle" style={{ textDecoration: 'none' }}>
                <button className={styles.secondaryButton}>
                  <span className={styles.secondaryButtonContent}>
                    <PuzzlePiece size={18} weight="fill" />
                    <span>Puzzles</span>
                  </span>
                </button>
              </Link>
              <Link to="/viewer" style={{ textDecoration: 'none' }}>
                <button className={styles.secondaryButton}>
                  <span className={styles.secondaryButtonContent}>
                    <Eye size={18} weight="fill" />
                    <span>Viewer</span>
                  </span>
                </button>
              </Link>
              <Link to="/tournaments" style={{ textDecoration: 'none' }}>
                <button className={styles.secondaryButton}>
                  <span className={styles.secondaryButtonContent}>
                    <Trophy size={18} weight="fill" />
                    <span>Results & rankings</span>
                  </span>
                </button>
              </Link>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleToolsMenuClick}
                className={styles.moreLinkButton}
              >
                More modes
                <CaretDown
                  size={12}
                  weight="bold"
                  style={{ marginLeft: 6, transform: toolsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                />
              </button>
            </Box>
          </Box>

          <Box
            className={styles.welcomeBox}
            style={{
              backgroundColor: lightMode === 'dark' ? 'rgba(55, 65, 81, 0.6)' : 'rgba(249, 250, 251, 0.9)',
              border: lightMode === 'dark' ? '1px solid rgba(217, 119, 6, 0.15)' : '1px solid rgba(217, 119, 6, 0.25)',
            }}
            sx={{
              padding: { xs: '12px 14px', sm: '16px 20px' },
              margin: { xs: '24px auto 8px', sm: '30px auto 12px' },
              width: { xs: 'calc(100% - 40px)', sm: '450px' },
              maxWidth: { xs: 'calc(100% - 40px)', sm: '450px' },
              display: 'flex',
              justifyContent: 'center',
              boxSizing: 'border-box'
            }}
          >
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: '12px', sm: '16px' },
              width: '100%'
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                width: '100%'
              }}>
                <Box sx={{
                  fontSize: { xs: '14px', sm: '15px' },
                  color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#1F2937',
                  lineHeight: 1.5,
                  textAlign: { xs: 'center', sm: 'left' },
                  flex: 1
                }}>
                  Welcome to the Tile Turnover lobby. Pick a mode and Theo will handle the rest. (We&apos;re still in beta!)
                </Box>
              </Box>
              <button
                onClick={() => setHowItWorksOpen(true)}
                style={{
                  background: 'transparent',
                  color: '#D97706',
                  border: '1px solid #D97706',
                  borderRadius: 6,
                  padding: '6px 16px',
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  fontSize: 13,
                  boxShadow: 'none',
                  outline: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.18)';
                  e.target.style.borderColor = '#B45309';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = '#D97706';
                }}
              >
                How It Works
              </button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={toolsMenuAnchor}
        open={toolsMenuOpen}
        onClose={handleToolsMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        disableScrollLock={true}
        slotProps={{
          root: {
            style: {
              position: 'fixed'
            }
          }
        }}
        PaperProps={{
          sx: {
            backgroundColor: lightMode === 'dark' ? '#374151' : '#ffffff',
            border: '1px solid',
            borderColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.18)',
            borderRadius: '8px',
            boxShadow: lightMode === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '160px',
            mt: '4px'
          }
        }}
      >
        <MenuItem 
          onClick={() => { handleToolsMenuClose(); navigate('/3dviewer'); }}
          sx={{
            color: lightMode === 'dark' ? '#fff' : '#1F2937',
            fontSize: '14px',
            padding: '10px 16px',
            '&:hover': {
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          3D Viewer
        </MenuItem>
        <MenuItem 
          onClick={() => { handleToolsMenuClose(); navigate('/tournaments'); }}
          sx={{
            color: lightMode === 'dark' ? '#fff' : '#1F2937',
            fontSize: '14px',
            padding: '10px 16px',
            '&:hover': {
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          Results & rankings
        </MenuItem>
        <MenuItem 
          onClick={() => { handleToolsMenuClose(); navigate('/submit-game'); }}
          sx={{
            color: lightMode === 'dark' ? '#fff' : '#1F2937',
            fontSize: '14px',
            padding: '10px 16px',
            '&:hover': {
              backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          Submit Game
        </MenuItem>
      </Menu>

      <Modal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
        aria-labelledby="how-it-works-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: '16px', sm: '0' }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            backgroundColor: lightMode === 'dark' ? '#374151' : '#ffffff',
            borderRadius: '12px',
            padding: { xs: '20px', sm: '24px' },
            maxWidth: '480px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            outline: 'none',
            boxShadow: lightMode === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.2)',
            border: lightMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.18)'
          }}
        >
          <IconButton
            onClick={() => setHowItWorksOpen(false)}
            sx={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              color: lightMode === 'dark' ? '#9ca3af' : '#6b7280',
              '&:hover': {
                backgroundColor: lightMode === 'dark' ? '#4b5563' : '#f3f4f6'
              }
            }}
          >
            <X size={20} />
          </IconButton>
          
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 'bold',
              marginBottom: '16px',
              color: lightMode === 'dark' ? '#fff' : '#1F2937',
              fontSize: { xs: '18px', sm: '20px' }
            }}
          >
            How It Works
          </Typography>

          <Typography
            sx={{
              fontWeight: '600',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280',
              marginBottom: '12px',
              marginTop: '4px'
            }}
          >
            Main Features
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.25)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <GameController size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Play
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Play a live game against people or bots.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.25)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <PuzzlePiece size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Puzzles
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Solve curated positions to improve.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.25)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Eye size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Viewer
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Analyze games, explore boards, study words.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography
            sx={{
              fontWeight: '600',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#6B7280',
              marginBottom: '12px',
              marginTop: '4px'
            }}
          >
            Extra Features
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.18)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Sparkle size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Ask Theo
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Get move suggestions when you're stuck.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.18)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Cube size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  3D Viewer
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Explore boards in immersive 3D.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.18)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <PaperPlaneTilt size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Submit Game
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Share your games for analysis.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  backgroundColor: lightMode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.18)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <SearchIcon size={18} color="#D97706" weight="fill" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '2px',
                    color: lightMode === 'dark' ? '#fff' : '#1F2937'
                  }}
                >
                  Results
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6B7280',
                    lineHeight: '1.4'
                  }}
                >
                  Search players, rankings, and tournaments.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setHowItWorksOpen(false)}
              style={{
                background: 'linear-gradient(45deg, transparent 5%, #D97706 5%)',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                padding: '8px 24px',
                fontWeight: 'bold',
                letterSpacing: 0.5,
                fontSize: 13,
                boxShadow: '6px 0px 0px #B45309',
                outline: 'transparent',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                opacity: 0.95
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '8px 2px 0px #B45309';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '0.95';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '6px 0px 0px #B45309';
              }}
            >
              Got it — Let me play
            </button>
          </Box>
        </Box>
      </Modal>
    </>
  )
}
