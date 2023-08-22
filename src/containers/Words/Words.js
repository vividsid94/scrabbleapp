import React, { useState, useMemo } from 'react';
import data from '../../components/AppContent/References/nwl20bings.json';
import { useMediaQuery, Autocomplete, Box, TextField, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import styles from './Words.module.css';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';

const WordTable = () => {
  const [probabilityFilter, setProbabilityFilter] = useState('');
  const [wordLength, setWordLength] = useState(7);

  const maxProbValue = useMemo(() => Math.max(...data.map(item => item.PROB)), []);

  const probabilityOptions = useMemo(() => (
    Array.from({ length: Math.ceil(maxProbValue / 100) }, (_, index) => `${index * 100 + 1}-${(index + 1) * 100}`)
  ), [maxProbValue]);

  // Memoize the filtered data to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    return data.filter(
      item => item.PROB >= parseInt(probabilityFilter.split('-')[0]) && 
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
        <Box sx={{'& .MuiSelect-outlined': {color: 'white', border: "1px solid white", borderRadius: "none"}, '& .MuiSvgIcon-root': {color: 'white'}, '& .MuiInputBase-root': {color: 'white'}}} className={styles.container}>
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
                    <TableCell>{useMediaQuery('(min-width:500px)') ? "Word" : "W"}</TableCell>
                    <TableCell>{useMediaQuery('(min-width:500px)') ? "Front Hook" : "FH"}</TableCell>
                    <TableCell>{useMediaQuery('(min-width:500px)') ? "Back Hook" : "BH"}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{useMediaQuery('(min-width:500px)') ? "Definition" : "D"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.PROB}</TableCell>
                      <TableCell>{item.WORD}</TableCell>
                      <TableCell>{item.FH}</TableCell>
                      <TableCell>{item.BH}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }} align="right">{item.DEF}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WordTable;
