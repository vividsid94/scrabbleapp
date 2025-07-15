import React, { useState, useEffect } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeContext } from '../../App';
import styles from './AdminSubmissions.module.css';

export default function AdminSubmissions() {
  const { lightMode } = React.useContext(ThemeContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [adminToken, setAdminToken] = useState('');

  useEffect(() => {
    // Check if admin token is stored
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAdminToken(token);
      fetchSubmissions(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Add a separate state for the input field
  const [inputToken, setInputToken] = useState('');

  const fetchSubmissions = async (token) => {
    try {
      const response = await fetch('/.netlify/functions/getSubmissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (error) {
      setError('Failed to load submissions');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!inputToken.trim()) {
      setError('Please enter admin token');
      return;
    }

    setLoading(true);
    setError('');

    console.log('Attempting login with token:', inputToken);

    try {
      const response = await fetch('/.netlify/functions/getSubmissions', {
        headers: {
          'Authorization': `Bearer ${inputToken}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error('Invalid admin token');
      }

      localStorage.setItem('adminToken', inputToken);
      setAdminToken(inputToken);
      await fetchSubmissions(inputToken);
    } catch (error) {
      console.log('Login error:', error);
      setError('Invalid admin token');
      setLoading(false);
    }
  };

  const handleReview = (submission) => {
    setSelectedSubmission(submission);
    setReviewNotes(submission.notes || '');
    setReviewDialog(true);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedSubmission) return;

    setUpdating(true);
    try {
      const response = await fetch('/.netlify/functions/updateSubmission', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          status,
          notes: reviewNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update submission');
      }

      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, status, notes: reviewNotes, reviewed_at: new Date().toISOString() }
          : sub
      ));

      setReviewDialog(false);
      setSelectedSubmission(null);
      setReviewNotes('');
    } catch (error) {
      setError('Failed to update submission');
      console.error('Error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  if (!adminToken) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Sidenav />
        <Box className={styles.page}>
          <Box className={styles.mainPanel}>
            <Box className={styles.leftContainer}>
              <Box className={`${styles.mainBox} ${styles.mainBoxContent}`} component="main">
                <Box className={styles.loginContainer}>
                  <Typography variant="h4" className={styles.title}>
                    Admin Login
                  </Typography>
                  <Typography variant="body1" className={styles.description}>
                    Enter your admin token to access game submissions
                  </Typography>
                  <TextField
                    fullWidth
                    label="Admin Token"
                    type="text"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    margin="normal"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: lightMode ? '#ccc' : '#555',
                        },
                        '&:hover fieldset': {
                          borderColor: lightMode ? '#999' : '#777',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleLogin}
                    disabled={loading}
                    className={styles.submitButton}
                    sx={{
                      backgroundColor: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      },
                      '&:disabled': {
                        backgroundColor: '#ccc',
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Login'}
                  </Button>
                  {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </Box>
              </Box>
            </Box>
            
            <Box className={styles.rightPanel}>
              <Box className={styles.playerPanel}>
                <Box className={styles.poolBox}>
                  <Typography variant="h6" sx={{ color: '#fff', textAlign: 'center', mb: 2 }}>
                    Admin Access
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff', opacity: 0.8, textAlign: 'center' }}>
                    Review and manage game submissions
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page}>
        <Box className={styles.mainPanel}>
          <Box className={styles.leftContainer}>
            <Box className={`${styles.mainBox} ${styles.mainBoxContent}`} component="main">
              <Box className={styles.adminContainer}>
                <Typography variant="h4" className={styles.title}>
                  Game Submissions
                </Typography>
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer sx={{ 
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    '& .MuiTable-root': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: lightMode ? '#333' : '#fff' }}>Game URL</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: lightMode ? '#333' : '#fff' }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: lightMode ? '#333' : '#fff' }}>Submitted By</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: lightMode ? '#333' : '#fff' }}>Submitted At</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: lightMode ? '#333' : '#fff' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: lightMode ? '#333' : '#fff' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission._id} sx={{ 
                            '&:hover': { 
                              backgroundColor: lightMode ? 'rgba(25, 118, 210, 0.04)' : 'rgba(255, 255, 255, 0.05)' 
                            } 
                          }}>
                            <TableCell sx={{ color: lightMode ? '#333' : '#fff' }}>
                              <a 
                                href={submission.game_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  color: '#1976d2', 
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {submission.game_url}
                              </a>
                            </TableCell>
                            <TableCell sx={{ color: lightMode ? '#333' : '#fff' }}>{submission.game_type}</TableCell>
                            <TableCell sx={{ color: lightMode ? '#333' : '#fff' }}>{submission.submitted_by}</TableCell>
                            <TableCell sx={{ color: lightMode ? '#333' : '#fff' }}>{formatDate(submission.submitted_at)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={submission.status} 
                                color={getStatusColor(submission.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleReview(submission)}
                                disabled={submission.status !== 'pending'}
                                sx={{
                                  borderColor: '#1976d2',
                                  color: '#1976d2',
                                  '&:hover': {
                                    borderColor: '#1565c0',
                                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                  }
                                }}
                              >
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Box>
          </Box>
          
          <Box className={styles.rightPanel}>
            <Box className={styles.playerPanel}>
              <Box className={styles.poolBox}>
                <Typography variant="h6" sx={{ color: '#fff', textAlign: 'center', mb: 2 }}>
                  Admin Panel
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff', opacity: 0.8, textAlign: 'center' }}>
                  Manage game submissions and reviews
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialog} 
        onClose={() => setReviewDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(45, 45, 45, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: lightMode ? '#333' : '#fff' }}>Review Submission</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box>
              <Typography variant="body1" gutterBottom sx={{ color: lightMode ? '#333' : '#fff' }}>
                <strong>Game URL:</strong> {selectedSubmission.game_url}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ color: lightMode ? '#333' : '#fff' }}>
                <strong>Type:</strong> {selectedSubmission.game_type}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ color: lightMode ? '#333' : '#fff' }}>
                <strong>Submitted By:</strong> {selectedSubmission.submitted_by}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ color: lightMode ? '#333' : '#fff' }}>
                <strong>Submitted At:</strong> {formatDate(selectedSubmission.submitted_at)}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Review Notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: lightMode ? '#ccc' : '#555',
                    },
                    '&:hover fieldset': {
                      borderColor: lightMode ? '#999' : '#777',
                    },
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)} disabled={updating}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleUpdateStatus('rejected')} 
            color="error"
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
          <Button 
            onClick={() => handleUpdateStatus('approved')} 
            color="success"
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 