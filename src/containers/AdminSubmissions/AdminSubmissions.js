import React, { useState, useEffect } from 'react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
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
            <Paper className={styles.loginCard}>
              <Typography variant="h4" gutterBottom>
                Admin Login
              </Typography>
              <TextField
                fullWidth
                label="Admin Token"
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                margin="normal"
              />
              <Button
                variant="contained"
                onClick={handleLogin}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Login'}
              </Button>
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>
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
          <Typography variant="h4" gutterBottom>
            Game Submissions
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Game URL</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <a 
                          href={submission.game_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#1976d2', textDecoration: 'none' }}
                        >
                          {submission.game_url}
                        </a>
                      </TableCell>
                      <TableCell>{submission.game_type}</TableCell>
                      <TableCell>{submission.submitted_by}</TableCell>
                      <TableCell>{formatDate(submission.submitted_at)}</TableCell>
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
                          onClick={() => handleReview(submission)}
                          disabled={submission.status !== 'pending'}
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
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Submission</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Game URL:</strong> {selectedSubmission.game_url}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {selectedSubmission.game_type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Submitted By:</strong> {selectedSubmission.submitted_by}
              </Typography>
              <Typography variant="body1" gutterBottom>
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