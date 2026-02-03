import React, { useState, useContext, useEffect } from "react";
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
import Sandbox from "./containers/Sandbox/Sandbox";
import Scrabble3D from "./containers/Scrabble3D/Scrabble3D";
import WidgetPage from "./containers/Widget/WidgetPage";
import WidgetLanding from "./containers/WidgetLanding/WidgetLanding";
import SubmitGame from "./containers/SubmitGame/SubmitGame";
import AdminSubmissions from "./containers/AdminSubmissions/AdminSubmissions";
import About from "./containers/About/About";
import TestTheoShake from "./containers/Home/TestTheoShake";
import TestMindBlow from "./containers/Home/TestMindBlow";
import Jigsaw from "./containers/Home/Jigsaw";
import Minigames from "./containers/Minigames/Minigames";
import Snakes from "./containers/Snakes/Snakes";
import PlayerProfile from "./containers/PlayerProfile/PlayerProfile";
import Tournament from "./containers/Tournament/Tournament";
import Tournaments from "./containers/Tournaments/Tournaments";
import Profile from "./containers/Profile/Profile";
import CameraScan from "./containers/CameraScan/CameraScan";
import MultiplayerLobby from "./containers/Multiplayer/MultiplayerLobby";
import MultiplayerGame from "./containers/Multiplayer/MultiplayerGame";
import EscapeRoom from "./containers/EscapeRoom/EscapeRoom";
import WordStorm from "./containers/WordStorm/WordStorm";
import { useColorSchemeStore } from "./stores/colorSchemeStore";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Topbar from "./components/AppContent/Topbar/Topbar";

export const ThemeContext = React.createContext();

// Component to conditionally render footer
const AppContent = ({ appState, setAppState, lightMode, setLightMode }) => {
  const location = useLocation();
  const isWidgetRoute = location.pathname === '/widget' || location.pathname === '/widget-landing';
  const is3DViewerRoute = location.pathname === '/3dviewer';
  const { user } = useAuth();

  const getHeaderBackground = () => {
    if (lightMode === 'dark') {
      return `
        radial-gradient(circle at 20% 30%, rgba(55, 65, 81, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(17, 24, 39, 0.4) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(31, 41, 55, 0.2) 0%, transparent 60%),
        radial-gradient(circle at 70% 20%, rgba(55, 65, 81, 0.25) 0%, transparent 45%),
        radial-gradient(circle at 30% 80%, rgba(17, 24, 39, 0.3) 0%, transparent 50%),
        #1F2937
      `;
    } else {
      // Light mode: transparent so main page background shows through
      return 'transparent';
    }
  };

  return (
    <div className="App">
      {!is3DViewerRoute && <Topbar />}
      {!is3DViewerRoute ? (
        <header className="App-header" style={{
          background: getHeaderBackground(),
          color: lightMode === 'dark' ? '#fff' : '#1F2937',
          marginTop: '36px'
        }}>
          <Routes>
            <Route path="/minigames" element={<Minigames/>} />
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
            <Route path="/sandbox" element={<Sandbox/>}/>
            <Route path="/widget" element={<WidgetPage/>}/>
            <Route path="/widget-landing" element={<WidgetLanding/>}/>
            <Route path="/submit-game" element={<SubmitGame/>}/>
            <Route path="/admin-submissions" element={<AdminSubmissions/>}/>
            <Route path="/about" element={<About/>} />
            <Route path="/test-theo-shake" element={<TestTheoShake/>} />
            <Route path="/test-mind-blow" element={<TestMindBlow />} />
            <Route path="/jigsaw" element={<Jigsaw />} />
            <Route path="/test-jigsaw" element={<Jigsaw />} />
            <Route path="/snakes" element={<Snakes />} />
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            <Route path="/tournament/:tournamentId" element={<Tournament />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/camera-scan" element={<CameraScan />} />
            <Route path="/multiplayer" element={<MultiplayerLobby />} />
            <Route path="/multiplayer/:gameCode" element={<MultiplayerGame />} />
            <Route path="/escape-room" element={<EscapeRoom />} />
            <Route path="/word-storm" element={<WordStorm />} />
          </Routes>
        </header>
      ) : (
        <Routes>
          <Route path="/3dviewer" element={<Scrabble3D/>}/>
        </Routes>
      )}
      {!isWidgetRoute && <Footer></Footer>}
    </div>
  );
};

function App() {
  const [appState, setAppState] = useState('VIEWER');
  const [lightMode, setLightMode] = useState('dark');
  
  // Get the colors from the store
  const boardColor = useColorSchemeStore(state => state.boardColor);
  const tileColor = useColorSchemeStore(state => state.color);
  const updateColor = useColorSchemeStore(state => state.updateColor);
  
  // Update protiles color - slightly lighter in light mode, richer in dark mode
  useEffect(() => {
    const protilesColor = lightMode === 'dark' ? '#92400E' : '#C47F36';
    updateColor(protilesColor);
  }, [lightMode, updateColor]);
  
  // Initialize CSS custom properties when the app starts
  useEffect(() => {
    document.documentElement.style.setProperty('--board-color', boardColor.current);
    document.documentElement.style.setProperty('--tile-color', tileColor.current);
  }, [boardColor.current, tileColor.current]);

  return (
    <ThemeContext.Provider value={{ lightMode, setLightMode }}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent 
            appState={appState} 
            setAppState={setAppState} 
            lightMode={lightMode} 
            setLightMode={setLightMode} 
          />
        </Router>
      </AuthProvider>
    </ThemeContext.Provider>
  )
}

export default App;
