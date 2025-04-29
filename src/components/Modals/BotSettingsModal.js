import React from 'react';
import { Modal, Box, Button, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import styles from './Modals.module.css';

export default function BotSettingsModal({ 
  open, 
  onClose, 
  botGoesFirst, 
  setBotGoesFirst, 
  onStartGame 
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="bot-settings-modal"
    >
      <Box className={styles.modalContainer}>
        <Box className={styles.modalTitle}>Play Against SidBot</Box>
        <Box className={styles.botSettingsContent}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Who goes first?</FormLabel>
            <RadioGroup
              value={botGoesFirst}
              onChange={(e) => setBotGoesFirst(e.target.value === 'true')}
            >
              <FormControlLabel value={false} control={<Radio />} label="You go first" />
              <FormControlLabel value={true} control={<Radio />} label="SidBot goes first" />
            </RadioGroup>
          </FormControl>
          <Box className={styles.botSettingsButtons}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onStartGame}
              sx={{ marginRight: 2 }}
            >
              Start Game
            </Button>
            <Button 
              variant="outlined" 
              onClick={onClose}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
} 