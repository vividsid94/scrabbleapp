import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router, Route, Routes
} from "react-router-dom";
import "./App.css";
import Home from "./containers/Home/Home";

function App() {
  const [appState, setAppState] = useState('');
  return (
    <div className="App">
      <header className="App-header" style={{backgroundColor: appState === '' ? '#282c34' : '#E7AD7D'}}>
        <Router>
          <Routes>
            <Route path="/" element={<Home onChange={setAppState}/>} />
          </Routes>
        </Router>
      </header>
    </div>
  )
}

export default App;
