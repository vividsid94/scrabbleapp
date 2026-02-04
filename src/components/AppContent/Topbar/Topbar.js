import React, { useState, useContext } from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { ThemeContext } from '../../../App';
import AuthModal from '../../Auth/AuthModal';
import { Link, useLocation } from 'react-router-dom';
import styles from './Topbar.module.css';
import homeStyles from '../../../containers/Home/Home.module.css';

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
                className={homeStyles.secondaryButton}
                style={{ width: 'auto', whiteSpace: 'nowrap', padding: '10px 20px' }}
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
              <Link to="/profile" style={{ textDecoration: 'none' }}>
                <button
                  className={homeStyles.secondaryButton}
                  style={{ width: 'auto', whiteSpace: 'nowrap', padding: '10px 20px' }}
                >
                  {profile?.display_name || profile?.username || 'Profile'}
                </button>
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                }}
                className={homeStyles.secondaryButton}
                style={{ width: 'auto', whiteSpace: 'nowrap', padding: '10px 20px' }}
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

