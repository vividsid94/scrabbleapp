import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import styles from '../Viewer.module.css';

const SettingsModal = ({
  dictionary,
  ELOCommentary,
  handleDictionaryChange,
  handleELOCommentaryChange,
  customPlayerMode,
  handleCustomPlayerMode,
  switchValue,
  theme,
  handleThemeChange
}) => {
  const [showWhy, setShowWhy] = useState(false);

  const handleWhyClick = () => {
    setShowWhy(!showWhy);
  }

  return (
    <>
      {!showWhy && (
        <div>
          <Box className={styles.modalContainer__dictionary}>
            Theme
            {<select className={styles.styleSelection} value={theme} onChange={handleThemeChange}>
              <option value="STANDARD">Standard</option>
              <option value="FULLBOARD">Full Board</option>
            </select>}
          </Box>
          <Box className={styles.modalContainer__dictionary}>
            Dictionary
            {<select className={styles.styleSelection} value={dictionary} onChange={handleDictionaryChange}>
              <option value="ANY">Any</option>
              <option value="TWL">TWL/NWL</option>
              <option value="CSW">CSW</option>
            </select>}
          </Box>
          <Box className={styles.modalContainer__dictionary}>
            Commentary always on?
            {<select className={styles.styleSelection} value={ELOCommentary} onChange={handleELOCommentaryChange}>
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>}
          </Box>
          <Box className={styles.modalContainer__tiles}>
            Favorite player? <br></br>Only generate his/her games.
            <Typography sx={{fontSize: '12px'}}>(Note: cannot also filter by dictionary. <br></br><u className={styles.underlinedText} onClick={handleWhyClick}>Click to see why.</u>)</Typography>
            <TextField autoComplete="off" placeholder={customPlayerMode.current} onFocus={(event) => switchValue(event)} onChange={(event) => handleCustomPlayerMode(event)} />
          </Box>
        </div>
      )}
      {showWhy && (
        <Box sx={{width: '350px'}}>
          <Typography sx={{fontSize: '11px'}}>
            This is a front-end-only project and doesn't track which games use which dictionaries. It generates a game and checks the dictionary in real-time, which means filtering by a specific player and dictionary may result in a never-ending loop. 
          </Typography>
          <br></br>
          <Typography sx={{fontSize: '11px'}}>
            One workaround is used on the XT recents page, where dictionaries can be easily obtained through scraping methods and limited to the first X results. However, player profile pages pose a greater challenge for scraping and ensuring high site performance - many players have hundreds or even thousands of games, some of which do not have listed dictionaries.
          </Typography>
          <br></br>
          <Typography sx={{fontSize: '11px'}}>
            In the meantime, you can keep generating a new game with a specific player in the hope of getting a game using your desired dictionary.
          </Typography>
          <br></br>
          <Button onClick={handleWhyClick}>Back</Button>
        </Box>
      )}
    </>
  );
};

export default SettingsModal; 