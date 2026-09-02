import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ThemeContext } from '../../App';
import styles from './Home.module.css';

export default function SiteClosed() {
  const { lightMode } = useContext(ThemeContext);
  const isDark = lightMode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box className={styles.title} style={{ color: isDark ? '#fff' : '#1F2937', marginBottom: 16 }}>
        Tile Turnover™
      </Box>
      <Typography
        variant="h5"
        component="h1"
        sx={{
          fontWeight: 700,
          color: isDark ? '#F9FAFB' : '#1F2937',
          mb: 1.5,
          maxWidth: 420,
        }}
      >
        Reboot coming soon
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: isDark ? 'rgba(209, 213, 219, 0.9)' : '#6B7280',
          maxWidth: 360,
          lineHeight: 1.6,
          fontSize: { xs: 16, sm: 17 },
        }}
      >
        Thanks for playing.
      </Typography>
    </Box>
  );
}
