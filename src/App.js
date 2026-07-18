import React, { useState, useContext, useEffect } from "react";
import {
  BrowserRouter as Router, Route, Routes, useLocation, Navigate
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
import Boggle from "./containers/Boggle/Boggle";
import Puzzle from "./containers/Puzzle/Puzzle";
import Sandbox from "./containers/Sandbox/Sandbox";
import Scrabble3D from "./containers/Scrabble3D/Scrabble3D";
import Scrabble3DPlay from "./containers/Scrabble3D/Scrabble3DPlay";
import WidgetPage from "./containers/Widget/WidgetPage";
import WidgetLanding from "./containers/WidgetLanding/WidgetLanding";
import SubmitGame from "./containers/SubmitGame/SubmitGame";
import AdminSubmissions from "./containers/AdminSubmissions/AdminSubmissions";
import About from "./containers/About/About";
import TestTheoShake from "./containers/Home/TestTheoShake";
import TestMindBlow from "./containers/Home/TestMindBlow";
import Jigsaw from "./containers/Home/Jigsaw";
import Minigames from "./containers/Minigames/Minigames";
import PlayerProfile from "./containers/PlayerProfile/PlayerProfile";
import Tournament from "./containers/Tournament/Tournament";
import Tournaments from "./containers/Tournaments/Tournaments";
import Profile from "./containers/Profile/Profile";
import CameraScan from "./containers/CameraScan/CameraScan";
import MultiplayerLobby from "./containers/Multiplayer/MultiplayerLobby";
import MultiplayerGame from "./containers/Multiplayer/MultiplayerGame";
import EscapeRoom from "./containers/EscapeRoom/EscapeRoom";
import { useColorSchemeStore, getDefaultTileColor, LEGACY_TILE_DEFAULTS } from "./stores/colorSchemeStore";
import { useGameStore } from "./stores/gameStore";
import { AuthProvider } from "./contexts/AuthContext";
import Topbar from "./components/AppContent/Topbar/Topbar";
import { supabase } from "./utils/supabase";

export const ThemeContext = React.createContext();

// Component to conditionally render footer
const AppContent = ({ appState, setAppState, lightMode, setLightMode }) => {
  const location = useLocation();
  const isWidgetRoute = location.pathname === '/widget' || location.pathname === '/widget-landing';
  const is3DViewerRoute = location.pathname === '/3dviewer' || location.pathname === '/3dplay';
  // const { user } = useAuth(); // not currently needed here

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
      // Light mode: "Warm Stone" — mostly neutral greige with a whisper of amber in the
      // shadow, so the brand accent pops by contrast instead of blending into the page
      return `
        radial-gradient(circle at 15% 15%, rgba(180, 170, 150, 0.2) 0%, transparent 45%),
        radial-gradient(circle at 85% 10%, rgba(200, 190, 165, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 12% 82%, rgba(190, 180, 160, 0.22) 0%, transparent 50%),
        radial-gradient(circle at 50% 45%, rgba(252, 251, 248, 0.85) 0%, transparent 60%),
        #FAF9F6
      `;
    }
  };

  return (
    <div className="App">
      {!is3DViewerRoute && <Topbar />}
      {!is3DViewerRoute ? (
        <header className="App-header" style={{
          background: getHeaderBackground(),
          color: lightMode === 'dark' ? '#fff' : '#1F2937',
          marginTop: '20px'
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
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            <Route path="/tournament/:tournamentId" element={<Tournament />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/players" element={<Navigate to="/tournaments?view=players" replace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/camera-scan" element={<CameraScan />} />
            <Route path="/multiplayer" element={<MultiplayerLobby />} />
            <Route path="/multiplayer/:gameCode" element={<MultiplayerGame />} />
            <Route path="/escape-room" element={<EscapeRoom />} />
          </Routes>
        </header>
      ) : (
        <Routes>
          <Route path="/3dviewer" element={<Scrabble3D/>}/>
          <Route path="/3dplay" element={<Scrabble3DPlay/>}/>
        </Routes>
      )}
      {!isWidgetRoute && <Footer></Footer>}
    </div>
  );
};

function App() {
  const [appState, setAppState] = useState('VIEWER');
  const [lightMode, setLightMode] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('lightMode');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });
  
  // Get the colors and settings from the stores
  const boardColor = useColorSchemeStore(state => state.boardColor);
  const tileColor = useColorSchemeStore(state => state.color);
  const updateColor = useColorSchemeStore(state => state.updateColor);
  const updateBoardColor = useColorSchemeStore(state => state.updateBoardColor);
  const updateShowWoodenCircle = useColorSchemeStore(state => state.updateShowWoodenCircle);
  const updateShowApplePolygon = useColorSchemeStore(state => state.updateShowApplePolygon);
  const setPlayerMoveSoundType = useGameStore(state => state.setPlayerMoveSoundType);
  const setBotMoveSoundType = useGameStore(state => state.setBotMoveSoundType);

  // Hydrate visual settings once from Supabase profile on app start
  useEffect(() => {
    const hydrate = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('SettingsHydrate: error getting session', sessionError);
          return;
        }

        const userId = session?.user?.id;
        if (!userId) {
          return;
        }

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error || !profile) {
          console.error('SettingsHydrate: error fetching profile', error);
          return;
        }

        // Theme preference
        if (profile.theme_preference === 'dark' || profile.theme_preference === 'light') {
          setLightMode(profile.theme_preference);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('lightMode', profile.theme_preference);
          }
        }

        // Tile color
        if (profile.tile_color) {
          updateColor(profile.tile_color);
        } else {
          const effectiveTheme =
            profile.theme_preference === 'dark' || profile.theme_preference === 'light'
              ? profile.theme_preference
              : lightMode;
          updateColor(getDefaultTileColor(effectiveTheme));
        }

        // Board color
        if (profile.board_color) {
          updateBoardColor(profile.board_color);
          document.documentElement.style.setProperty('--board-color', profile.board_color);
        }

        // Decorations
        if (profile.board_decoration) {
          if (profile.board_decoration === 'wood') {
            updateShowWoodenCircle(true);
            updateShowApplePolygon(false);
          } else if (profile.board_decoration === 'circle') {
            updateShowWoodenCircle(false);
            updateShowApplePolygon(true);
          } else {
            updateShowWoodenCircle(false);
            updateShowApplePolygon(false);
          }
        }

        // Sounds
        if (profile.player_move_sound_type) {
          setPlayerMoveSoundType(profile.player_move_sound_type);
        }
        if (profile.bot_move_sound_type) {
          setBotMoveSoundType(profile.bot_move_sound_type);
        }
      } catch (e) {
        console.error('SettingsHydrate: unexpected error', e);
      }
    };

    hydrate();
  }, [
    lightMode,
    setLightMode,
    updateColor,
    updateBoardColor,
    updateShowWoodenCircle,
    updateShowApplePolygon,
    setPlayerMoveSoundType,
    setBotMoveSoundType,
  ]);

  // Guests without a saved tile color: match protile tint to light/dark theme
  useEffect(() => {
    let cancelled = false;
    const syncGuestTileColor = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || session?.user) return;

      const { color, updateColor: setTileColor } = useColorSchemeStore.getState();
      const defaultForTheme = getDefaultTileColor(lightMode);
      const otherThemeDefault = getDefaultTileColor(lightMode === 'dark' ? 'light' : 'dark');
      // Only reset when still on a theme default (not a custom pick from the color picker)
      if (
        color.current === defaultForTheme ||
        color.current === otherThemeDefault ||
        LEGACY_TILE_DEFAULTS.includes(color.current)
      ) {
        setTileColor(defaultForTheme);
      }
    };
    syncGuestTileColor();
    return () => { cancelled = true; };
  }, [lightMode]);
  
  // Keep CSS custom properties in sync with store
  useEffect(() => {
    document.documentElement.style.setProperty('--board-color', boardColor.current);
    document.documentElement.style.setProperty('--tile-color', tileColor.current);
  }, [boardColor.current, tileColor.current]);

  // Match body background to the active theme so macOS overscroll bounce
  // reveals the correct color instead of the browser's default white
  useEffect(() => {
    document.body.style.backgroundColor = lightMode === 'dark' ? '#1F2937' : '#ffffff';
  }, [lightMode]);

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
