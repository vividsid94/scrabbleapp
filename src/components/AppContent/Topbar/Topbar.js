import React, { useState, useContext } from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { ThemeContext } from '../../../App';
import AuthModal from '../../Auth/AuthModal';
import { Link, useLocation } from 'react-router-dom';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { lightMode } = useContext(ThemeContext);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  return (
    <>
      <Box className={styles.topbar} data-light-mode={lightMode}>
        <Box className={styles.topbarContent}>
          {!user ? (
            <>
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                style={{
                  background: 'transparent',
                  color: '#D97706',
                  border: '2px solid #D97706',
                  borderRadius: 8,
                  padding: '5px 20px',
                  fontWeight: 'normal',
                  letterSpacing: 1,
                  fontSize: 15,
                  boxShadow: 'none',
                  outline: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  opacity: 0.95
                }}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                style={{
                  background: 'linear-gradient(45deg, transparent 5%, #D97706 5%)',
                  color: '#fff',
                  border: 0,
                  borderRadius: 8,
                  padding: '7px 20px',
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  fontSize: 15,
                  boxShadow: '6px 0px 0px #B45309',
                  outline: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  opacity: 0.95
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              <Link to="/profile" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'transparent',
                    color: '#D97706',
                    border: '2px solid #D97706',
                    borderRadius: 8,
                    padding: '5px 20px',
                    fontWeight: 'normal',
                    letterSpacing: 1,
                    fontSize: 15,
                    boxShadow: 'none',
                    outline: 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    opacity: 0.95
                  }}
                >
                  {profile?.display_name || profile?.username || 'Profile'}
                </button>
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                }}
                style={{
                  background: 'transparent',
                  color: '#D97706',
                  border: '2px solid #D97706',
                  borderRadius: 8,
                  padding: '5px 20px',
                  fontWeight: 'normal',
                  letterSpacing: 1,
                  fontSize: 15,
                  boxShadow: 'none',
                  outline: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  opacity: 0.95
                }}
              >
                Sign Out
              </button>
            </>
          )}
        </Box>
      </Box>
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}

