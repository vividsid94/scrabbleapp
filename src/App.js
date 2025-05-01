import React, { useState, useContext } from "react";
import {
  BrowserRouter as Router, Route, Routes
} from "react-router-dom";
import "./App.css";
import Viewer from "./containers/Viewer/Viewer";
import Home from "./containers/Home/Home";
import Memory from "./containers/Memory/Memory";
import Footer from "./components/AppContent/Footer/Footer";
import WordTable from "./containers/Words/Words";
import Series from "./containers/Series/Series";
import Play from "./containers/Play/Play";

export const ThemeContext = React.createContext();

function App() {
  const [appState, setAppState] = useState('VIEWER');
  const [lightMode, setLightMode] = useState('dark');

  const getHeaderBackgroundColor = () => {
    if (appState === 'VIEWER') {
      return lightMode === 'dark' ? '#000003' : '#e0e0e0';
    }
    return lightMode === 'dark' ? '#6C695A' : '#b8b6a9';
  };

  return (
    <ThemeContext.Provider value={{ lightMode, setLightMode }}>
      <div className="App">
        <header className="App-header" style={{backgroundColor: getHeaderBackgroundColor()}}>
          <Router>
            <Routes>
              <Route path="/viewer" element={<Viewer onChange={setAppState}/>} />
              <Route path="/" element={<Home/>} />
              <Route path="/memory" element={<Memory/>} />
              <Route path="/words" element={<WordTable/>}/>
              <Route path="/series" element={<Series/>}/>
              <Route path="/play" element={<Play/>}/>
            </Routes>
          </Router>
        </header>
        <Footer></Footer>
      </div>
    </ThemeContext.Provider>
  )
}

export default App;
