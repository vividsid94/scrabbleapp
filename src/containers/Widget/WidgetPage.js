import React from 'react';
import { Box } from '@mui/material';
import Widget from './Widget';
import './Widget.module.css';

const WidgetPage = () => {
  return (
    <Box className="widget-page">
      <Box className="widget-wrapper">
        <Widget />
      </Box>
    </Box>
  );
};

export default WidgetPage; 