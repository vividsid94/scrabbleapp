import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router, Route, Routes
} from "react-router-dom";
import "./App.css";
import Viewer from "./containers/Viewer/Viewer";
import Home from "./containers/Home/Home";
import Memory from "./containers/Memory/Memory";
import Footer from "./components/AppContent/Footer/Footer";
import Bot from "./containers/Bot/Bot";
import WordTable from "./containers/Words/Words";
import Series from "./containers/Series/Series";


function App() {
  const [appState, setAppState] = useState('VIEWER');
  return (
    <div className="App">
      <header className="App-header" style={{backgroundColor: appState === 'VIEWER' ? '#000003' : '#6C695A'}}>
        <Router>
          <Routes>
            <Route path="/viewer" element={<Viewer onChange={setAppState}/>} />
            <Route path="/" element={<Home/>} />
            <Route path="/memory" element={<Memory/>} />
            <Route path="/bot" element={<Bot/>}/>
            <Route path="/words" element={<WordTable/>}/>
            <Route path="/series" element={<Series/>}/>
          </Routes>
        </Router>
      </header>
      <Footer></Footer>
    </div>
  )
}

export default App;
