import React, { useState, useContext } from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { ThemeContext } from '../../../App';
import AuthModal from '../../Auth/AuthModal';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { lightMode } = useContext(ThemeContext);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  return (
    <>
      <Box className={styles.topbar} data-light-mode={lightMode}>
        <Box className={styles.topbarContent}>
          {!user ? (
            <>
              <button
                className={styles.navAuthButton}
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
              >
                Account
              </button>
            </>
          ) : (
            <>
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

