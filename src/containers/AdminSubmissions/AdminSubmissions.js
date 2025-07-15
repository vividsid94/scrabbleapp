import React, { useState, useEffect } from 'react';
import TopNav from '../../components/AppContent/TopNav/TopNav.js';
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
      <Box>
        <TopNav />
        <Box className={styles.page}>
          <Box className={styles.content}>
            <p>Admin Login - Enter your admin token to access game submissions</p>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className={styles.form}>
              <TextField
                fullWidth
                label="Admin Token"
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                disabled={loading}
                sx={{
                  marginBottom: '16px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#ccc',
                    },
                    '&:hover fieldset': {
                      borderColor: '#999',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3D5A80',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                  },
                  '& .MuiInputBase-input': {
                    color: '#333',
                  },
                }}
              />

              {error && (
                <Alert 
                  severity="error" 
                  sx={{
                    marginBottom: '16px',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: '#c62828',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={loading || !inputToken.trim()}
                sx={{
                  backgroundColor: '#3D5A80',
                  '&:hover': {
                    backgroundColor: '#2c3e50',
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc',
                  },
                  marginBottom: '20px'
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    Logging in...
                  </Box>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <TopNav />
      <Box className={styles.page}>
        <Box className={styles.content}>
          <p>Game Submissions - Review and manage submitted games for GTE analysis</p>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{
                marginBottom: '16px',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                color: '#c62828',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '8px'
              }}
            >
              {error}
            </Alert>
          )}
          
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
                    <TableCell sx={{ fontWeight: 600, color: '#333' }}>Game URL</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#333' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#333' }}>Submitted By</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#333' }}>Submitted At</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#333' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#333' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission._id} sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(61, 90, 128, 0.04)'
                      } 
                    }}>
                      <TableCell sx={{ color: '#333' }}>
                        <a 
                          href={submission.game_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#3D5A80', 
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {submission.game_url}
                        </a>
                      </TableCell>
                      <TableCell sx={{ color: '#333' }}>{submission.game_type}</TableCell>
                      <TableCell sx={{ color: '#333' }}>{submission.submitted_by}</TableCell>
                      <TableCell sx={{ color: '#333' }}>{formatDate(submission.submitted_at)}</TableCell>
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
                            borderColor: '#3D5A80',
                            color: '#3D5A80',
                            '&:hover': {
                              borderColor: '#2c3e50',
                              backgroundColor: 'rgba(61, 90, 128, 0.04)'
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

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialog} 
        onClose={() => setReviewDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#333' }}>Review Submission</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box>
              <Typography variant="body1" gutterBottom sx={{ color: '#333' }}>
                <strong>Game URL:</strong> {selectedSubmission.game_url}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ color: '#333' }}>
                <strong>Type:</strong> {selectedSubmission.game_type}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ color: '#333' }}>
                <strong>Submitted By:</strong> {selectedSubmission.submitted_by}
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ color: '#333' }}>
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
                      borderColor: '#ccc',
                    },
                    '&:hover fieldset': {
                      borderColor: '#999',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3D5A80',
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