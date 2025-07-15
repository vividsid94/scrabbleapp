import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import { getApprovedSubmissions } from '../../../axios/api';
import { useViewerStore } from '../../../stores/viewerStore';
import styles from '../Viewer.module.css';

const SubmittedGamesModal = ({ open, onClose }) => {
  const [submittedGames, setSubmittedGames] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(null);

  const loadSubmittedGames = async () => {
    setLoadingSubmissions(true);
    setSubmissionsError(null);
    try {
      const submissions = await getApprovedSubmissions();
      setSubmittedGames(submissions);
    } catch (err) {
      setSubmissionsError('Failed to load submitted games');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleLoadSubmittedGame = async (gameUrl) => {
    onClose();
    // Use the loadSubmittedGameData function from the store
    const { loadSubmittedGameData } = useViewerStore.getState();
    await loadSubmittedGameData(gameUrl);
  };

  const handleCloseModal = () => {
    onClose();
    setSubmittedGames([]);
    setSubmissionsError(null);
  };

  // Load submitted games when modal opens
  useEffect(() => {
    if (open && submittedGames.length === 0) {
      loadSubmittedGames();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={handleCloseModal}
      aria-labelledby="submitted-games-modal-title"
      aria-describedby="submitted-games-modal-description"
    >
      <Box className={styles.modalContainer} sx={{ borderRadius: '0 !important', maxWidth: '500px', width: '90vw', padding: '8px 8px 0 8px', minWidth: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '6px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          paddingBottom: '2px',
          minHeight: 0
        }}>
          <Typography sx={{ 
            fontFamily: 'Syne', 
            fontWeight: 600,
            fontSize: '14px',
            color: '#333'
          }}>
            Submitted Games
          </Typography>
          <Button 
            onClick={handleCloseModal}
            sx={{ 
              minWidth: 'auto',
              padding: '2px 8px',
              color: '#666',
              fontSize: '16px',
              lineHeight: 1,
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
            }}
          >
            ✕
          </Button>
        </Box>
        <Box sx={{ maxHeight: '65vh', overflowY: 'auto', padding: '8px' }}>
          {loadingSubmissions && (
            <Box sx={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '13px' }}>
              Loading submitted games...
            </Box>
          )}
          {submissionsError && (
            <Box sx={{ textAlign: 'center', padding: '20px', color: 'red', fontSize: '13px' }}>
              {submissionsError}
            </Box>
          )}
          {!loadingSubmissions && !submissionsError && submittedGames.length === 0 && (
            <Box sx={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '13px' }}>
              No submitted games available.
            </Box>
          )}
          {!loadingSubmissions && !submissionsError && submittedGames.length > 0 && (
            <>
              <Typography sx={{ 
                fontFamily: 'Syne',
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                {submittedGames.length} approved game{submittedGames.length !== 1 ? 's' : ''} available
              </Typography>
              <List sx={{ padding: 0 }}>
                {submittedGames.map((submission, idx) => (
                  <ListItem 
                    button 
                    key={submission.id || idx} 
                    onClick={() => handleLoadSubmittedGame(submission.game_url)}
                    sx={{ 
                      padding: '12px',
                      margin: '4px 0',
                      borderRadius: '6px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      '&:hover': { 
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        borderColor: '#4CAF50'
                      }
                    }}
                  >
                    <ListItemText 
                      primary={submission.game_url}
                      secondary={`Submitted by: ${submission.submitter_name} • ${submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Unknown date'}`}
                      primaryTypographyProps={{ 
                        sx: { 
                          fontFamily: 'Syne',
                          fontSize: '13px',
                          color: '#333',
                          lineHeight: 1.3,
                          wordBreak: 'break-all',
                          marginBottom: '4px'
                        } 
                      }}
                      secondaryTypographyProps={{ 
                        sx: { 
                          fontFamily: 'Syne',
                          fontSize: '11px',
                          color: '#666',
                          lineHeight: 1.2
                        } 
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default SubmittedGamesModal; 