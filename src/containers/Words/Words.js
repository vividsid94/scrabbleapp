import React, { useState, useMemo, useEffect } from 'react';
import data from '../../components/AppContent/References/nwl20bings.json';
import { useMediaQuery, Autocomplete, Box, TextField, Select, MenuItem, Modal, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button} from '@mui/material';
import styles from './Words.module.css';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

const WordTable = () => {
  const [probabilityFilter, setProbabilityFilter] = useState('');
  const [wordLength, setWordLength] = useState(7);
  const [isMediaQueryMet, setIsMediaQueryMet] = useState(false);
  const maxProbValue = useMemo(() => Math.max(...data.map(item => item.PROB)), []);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const updateMediaQueryState = () => {
    setIsMediaQueryMet(window.innerWidth >= 500);
  };

  useEffect(() => {
    updateMediaQueryState();
    window.addEventListener('resize', updateMediaQueryState);
  
    return () => {
      window.removeEventListener('resize', updateMediaQueryState);
    };
  }, []);

  const handleModalOpen = (content) => {
    setModalContent(content);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const probabilityOptions = useMemo(() => (
    Array.from({ length: Math.ceil(maxProbValue / 100) }, (_, index) => `${index * 100 + 1}-${(index + 1) * 100}`)
  ), [maxProbValue]);

  // Memoize the filtered data to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    if (!probabilityFilter) {
      return [];
    }
  
    return data.filter(
      item =>
        item.PROB >= parseInt(probabilityFilter.split('-')[0]) &&
        item.PROB <= parseInt(probabilityFilter.split('-')[1]) &&
        item.WORD.length === wordLength
    );
  }, [probabilityFilter, wordLength]);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidenav */}
      <Sidenav />
      {/* Content area */}
      <Box sx={{ flexGrow: 1}}>
        <Box sx={{'& .MuiSelect-outlined': {color: 'white', border: "1px solid white", borderRadius: "none"}, '& .MuiSvgIcon-root': {color: 'black'}, '& .MuiTableCell-root': {padding: '8px'}, '& .MuiInputBase-root': {color: 'white'}}} className={styles.container}>
          <Box className={styles.title}>
            {"Bingos"}
          </Box>
          <Box className={`${styles.box} ${styles.filterBox}`}>
            <InputLabel className={styles.autocompleteLabel}>Probability Filter</InputLabel>
            <Autocomplete
              id="probabilityFilter"
              options={probabilityOptions}
              value={probabilityFilter}
              onChange={(_, newValue) => setProbabilityFilter(newValue)}
              className={`${styles.autocompleteInput} ${styles.filterInput}`}
              renderInput={params => <TextField {...params} />}
            />
          </Box>
          <Box className={`${styles.box} ${styles.filterBox}`}>
            <InputLabel className={styles.autocompleteLabel}>Word Length</InputLabel>
            <Select
              id="wordLength"
              value={wordLength}
              onChange={e => setWordLength(e.target.value)}
              className={styles.filterInput}
            >
              <MenuItem value={7}>7</MenuItem>
              <MenuItem value={8}>8</MenuItem>
              {/* Add more options as needed */}
            </Select>
          </Box>
          <Box className={`${styles.box} ${styles.tableBox}`}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{useMediaQuery('(min-width:500px)') ? "Probability" : "P"}</TableCell>
                    <TableCell>{useMediaQuery('(min-width:500px)') ? "Front Hook" : "FH"}</TableCell>
                    <TableCell>{useMediaQuery('(min-width:500px)') ? "Word" : "W"}</TableCell>
                    <TableCell>{useMediaQuery('(min-width:500px)') ? "Back Hook" : "BH"}</TableCell>
                    <TableCell>{useMediaQuery('(min-width:500px)') ? "Definition" : "D"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.PROB}</TableCell>
                      <TableCell>{item.FH}</TableCell>
                      <TableCell>{item.WORD}</TableCell>
                      <TableCell>{item.BH}</TableCell>
                      <TableCell>
                        {isMediaQueryMet ? (
                          item.DEF
                        ) : (
                          <Box className={styles.flexCell}>
                            <VisibilityOutlinedIcon onClick={() => handleModalOpen(item.DEF)}/>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

                {!isMediaQueryMet && (
                  <Modal open={isModalOpen} onClose={handleModalClose}>
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'white', padding: 2 }}>
                      <p>{modalContent}</p>
                    </Box>
                  </Modal>
                )}
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WordTable;
