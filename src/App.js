import React, { useState, useContext } from "react";
import {
  BrowserRouter as Router, Route, Routes, useLocation
} from "react-router-dom";
import "./App.css";
import Viewer from "./containers/Viewer/Viewer";
import Home from "./containers/Home/Home";
import Memory from "./containers/Memory/Memory";
import Footer from "./components/AppContent/Footer/Footer";
import WordTable from "./containers/Words/Words";
import Series from "./containers/Series/Series";
import Play from "./containers/Play/Play";
import Changelog from "./containers/Changelog/Changelog";
import Study from "./containers/Study/Study";
import Boggle from "./containers/Boggle/Boggle";
import Puzzle from "./containers/Puzzle/Puzzle";
import WidgetPage from "./containers/Widget/WidgetPage";
import WidgetLanding from "./containers/WidgetLanding/WidgetLanding";

export const ThemeContext = React.createContext();

// Component to conditionally render footer
const AppContent = ({ appState, setAppState, lightMode, setLightMode }) => {
  const location = useLocation();
  const isWidgetRoute = location.pathname === '/widget' || location.pathname === '/widget-landing';

  const getHeaderBackgroundColor = () => {
    if (appState === 'VIEWER') {
      return lightMode === 'dark' ? '#000003' : '#808080';
    }
    return lightMode === 'dark' ? '#6C695A' : '#6c6a62';
  };

  return (
    <div className="App">
      <header className="App-header" style={{
        backgroundColor: getHeaderBackgroundColor(),
        color: lightMode === 'dark' ? '#fff' : '#000'
      }}>
        <Routes>
          <Route path="/viewer" element={<Viewer onChange={setAppState}/>} />
          <Route path="/" element={<Home/>} />
          <Route path="/memory" element={<Memory/>} />
          <Route path="/words" element={<WordTable/>}/>
          <Route path="/series" element={<Series/>}/>
          <Route path="/playground" element={<Play/>}/>
          <Route path="/play" element={<Play/>}/>
          <Route path="/changelog" element={<Changelog/>}/>
          <Route path="/study" element={<Study/>}/>
          <Route path="/boggle" element={<Boggle/>}/>
          <Route path="/puzzle" element={<Puzzle/>}/>
          <Route path="/widget" element={<WidgetPage/>}/>
          <Route path="/widget-landing" element={<WidgetLanding/>}/>
        </Routes>
      </header>
      {!isWidgetRoute && <Footer></Footer>}
    </div>
  );
};

function App() {
  const [appState, setAppState] = useState('VIEWER');
  const [lightMode, setLightMode] = useState('light');

  return (
    <ThemeContext.Provider value={{ lightMode, setLightMode }}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent 
          appState={appState} 
          setAppState={setAppState} 
          lightMode={lightMode} 
          setLightMode={setLightMode} 
        />
      </Router>
    </ThemeContext.Provider>
  )
}

export default App;
