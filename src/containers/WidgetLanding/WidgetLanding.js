import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import { 
  Download, 
  GetApp, 
  Computer, 
  Language, 
  CheckCircle,
  Info,
  Close
} from '@mui/icons-material';

const WidgetLanding = () => {
  const [showPWAInfo, setShowPWAInfo] = useState(false);
  const [showElectronInfo, setShowElectronInfo] = useState(false);

  const handlePWAInstall = () => {
    // This will trigger the browser's install prompt
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
    } else {
      setShowPWAInfo(true);
    }
  };

  const handleElectronDownload = () => {
    // This would link to your downloadable .exe file
    alert('Electron version coming soon! For now, try the web version.');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h3" sx={{ mb: 2, textAlign: 'center', color: '#6c6a62' }}>
        Scrabble Desktop Widget
      </Typography>
      
      <Typography variant="h6" sx={{ mb: 4, textAlign: 'center', color: '#666' }}>
        Get your Scrabble game on your desktop with our widget!
      </Typography>

      <Grid container spacing={3}>
        {/* PWA Option */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Language sx={{ mr: 1, color: '#2196f3' }} />
                <Typography variant="h5" sx={{ color: '#2196f3' }}>
                  Web Widget
                </Typography>
                <Chip 
                  label="Recommended" 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                Install directly from your browser - no download required!
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✅ No download required
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✅ Automatic updates
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✅ Works on all devices
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ⚠️ Requires internet connection
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<GetApp />}
                onClick={handlePWAInstall}
                sx={{ 
                  width: '100%', 
                  background: '#2196f3',
                  '&:hover': { background: '#1976d2' }
                }}
              >
                Install Web Widget
              </Button>

              {showPWAInfo && (
                <Alert 
                  severity="info" 
                  sx={{ mt: 2 }}
                  action={
                    <IconButton
                      size="small"
                      onClick={() => setShowPWAInfo(false)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  }
                >
                  Look for the "Install" button in your browser's address bar or menu!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Electron Option */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Computer sx={{ mr: 1, color: '#6c6a62' }} />
                <Typography variant="h5" sx={{ color: '#6c6a62' }}>
                  Desktop App
                </Typography>
                <Chip 
                  label="Coming Soon" 
                  size="small" 
                  color="secondary" 
                  sx={{ ml: 1 }}
                />
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                Full desktop application with advanced features.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✅ Works completely offline
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✅ Full desktop integration
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ✅ Better performance
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ⚠️ 100-150MB download
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleElectronDownload}
                disabled
                sx={{ 
                  width: '100%',
                  borderColor: '#6c6a62',
                  color: '#6c6a62',
                  '&:hover': { 
                    borderColor: '#808080',
                    background: 'rgba(108, 106, 98, 0.04)'
                  }
                }}
              >
                Download Desktop App
              </Button>

              {showElectronInfo && (
                <Alert 
                  severity="info" 
                  sx={{ mt: 2 }}
                  action={
                    <IconButton
                      size="small"
                      onClick={() => setShowElectronInfo(false)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  }
                >
                  Desktop version will be available soon!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* How to Use */}
      <Typography variant="h5" sx={{ mb: 2, color: '#6c6a62' }}>
        Widget Features
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#6c6a62', mb: 1 }}>🕐</Typography>
            <Typography variant="h6">Real-time Clock</Typography>
            <Typography variant="body2">
              Always know the current time and date
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#6c6a62', mb: 1 }}>🔍</Typography>
            <Typography variant="h6">Word Search</Typography>
            <Typography variant="body2">
              Quick search through Scrabble words
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#6c6a62', mb: 1 }}>📊</Typography>
            <Typography variant="h6">Game Stats</Typography>
            <Typography variant="body2">
              Track tiles left and current score
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 2, background: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ textAlign: 'center', color: '#666' }}>
          💡 <strong>Pro Tip:</strong> The web widget is perfect for trying out the feature. 
          The desktop app will be available soon for the full experience!
        </Typography>
      </Box>
    </Box>
  );
};

export default WidgetLanding; 