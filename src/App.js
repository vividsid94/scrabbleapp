import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import {
  BrowserRouter as Router, Route, Routes
} from "react-router-dom";
import "./App.css";
import Home from "./containers/Home/Home";

function App() {
  return (
    <div className="App">
      <header className="App-header">
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
            </Router>
      </header>
    </div>
  )
}

export default App;
