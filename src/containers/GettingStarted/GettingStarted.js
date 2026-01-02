import React, { useContext } from "react";
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import Box from '@mui/material/Box';
import styles from './GettingStarted.module.css';
import { ThemeContext } from '../../App';
import { Link } from 'react-router-dom';
import { 
  GameController, 
  PuzzlePiece, 
  Eye, 
  Cube, 
  User, 
  Trophy, 
  Users, 
  GridFour, 
  Code, 
  BookOpen, 
  Rocket 
} from '@phosphor-icons/react';

export default function GettingStarted() {
  const { lightMode } = useContext(ThemeContext);

  return (
    <Box sx={{ display: 'flex'}}>
      <Sidenav/>
      <Box className={styles.page}>
        <Box 
          className={styles.content}
          style={{ 
            backgroundColor: lightMode === 'dark' ? '#374151' : '#f9fafb',
            color: lightMode === 'dark' ? '#fff' : '#1F2937',
            border: lightMode === 'dark' ? 'none' : '1px solid #e5e7eb',
            boxShadow: lightMode === 'dark' ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <h1 style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', marginTop: 0 }}>Getting Started with Tile Turnover™ (AI generated draft)</h1>
          
          <p style={{ fontSize: '0.95em', lineHeight: '1.4', marginBottom: '15px' }}>
            Welcome! A comprehensive Scrabble platform to improve your game, analyze plays, and have fun.
          </p>

          <h2 style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GameController size={20} weight="fill" />
            Core Game Modes
          </h2>
          
          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GameController size={18} weight="fill" />
              <Link to="/play" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>
                Play Mode
              </Link>
            </h3>
            <p>Challenge Theo, our intelligent AI opponent, in full Scrabble games. Practice your strategy, experiment with different approaches, and watch your skills improve. Create an account to automatically track your win/loss record, average scores, and game history over time.</p>
          </div>

          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PuzzlePiece size={18} weight="fill" />
              <Link to="/puzzle" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>
                Puzzle Mode
              </Link>
            </h3>
            <p>Master tactical decision-making with curated Scrabble puzzles. Each puzzle presents a challenging board position where you must find the optimal play. Perfect for learning bingo opportunities, defensive positioning, and maximizing point potential. Multiple puzzle types keep training fresh and engaging.</p>
          </div>

          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} weight="fill" />
              <Link to="/viewer" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>
                Game Viewer
              </Link>
            </h3>
            <p>Dive deep into real tournament games with our comprehensive analysis tool. Navigate through moves step-by-step, see top play suggestions at each turn, and understand why experts made their choices. Browse thousands of games from major tournaments, filter by players or events, and study the strategies that win championships.</p>
          </div>

          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cube size={18} weight="fill" />
              <Link to="/3dviewer" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>
                3D Viewer
              </Link>
            </h3>
            <p>Experience Scrabble like never before with immersive 3D visualization. Rotate the board, zoom in on critical plays, and gain spatial understanding of board positions. Perfect for visual learners who want to see the game from a new perspective and understand tile placement patterns.</p>
          </div>

          <h2 style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} weight="fill" />
            User Accounts & Profiles
          </h2>
          
          <div className={styles.featureSection}>
            <p>
              <strong>Create your account</strong> to unlock personalized features and track your progress. Your profile automatically records games played, win/loss records, average scores, best games, and complete game history. All statistics update in real-time as you play. Click the user icon in the sidebar to sign up - it only takes a minute!
            </p>
          </div>

          <h2 style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} weight="fill" />
            Tournament & Player Features
          </h2>
          
          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} weight="fill" />
              <Link to="/tournaments" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>
                Tournaments
              </Link>
            </h3>
            <p>Stay connected with the competitive Scrabble scene. Browse upcoming tournaments to plan your attendance, explore recent events to see the latest action, and dive into games from major competitions. Each tournament includes location details, dates, and direct links to view games.</p>
          </div>

          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} weight="fill" />
              Player Profiles
            </h3>
            <p>Discover detailed player profiles featuring ratings, tournament records, game statistics, and complete game histories. Search for any player to see their performance metrics, study their games, and learn from their strategies. Perfect for researching opponents or following your favorite players.</p>
          </div>

          <h2 style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PuzzlePiece size={20} weight="fill" />
            Additional Features
          </h2>
          
          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GridFour size={18} weight="fill" />
              <Link to="/boggle" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>
                Boggle Game
              </Link>
            </h3>
            <p>Test your word-finding speed with the classic Boggle challenge. Race against the clock to find as many words as possible in the letter grid. Great for improving pattern recognition and quick thinking - skills that translate directly to competitive Scrabble play.</p>
          </div>

          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GameController size={18} weight="fill" />
              <Link to="/submit-game" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>
                Minigames
              </Link>
            </h3>
            <p>Enjoy a variety of word game challenges and minigames designed to sharpen different aspects of your Scrabble skills. From anagram puzzles to word-building challenges, these quick games provide focused practice in bite-sized sessions.</p>
          </div>

          <div className={styles.featureSection}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={18} weight="fill" />
              <Link to="/widget" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>
                Widget System
              </Link>
            </h3>
            <p>Integrate Tile Turnover's powerful tools into your own website or blog. Our embeddable widgets let you add game viewers, analyzers, and interactive Scrabble boards to any page. Perfect for tournament websites, blogs, or educational platforms.</p>
          </div>

          <h2 style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} weight="fill" />
            Learning Resources
          </h2>
          
          <div className={styles.featureSection}>
            <p>
              Transform your game with our comprehensive learning tools. The <strong>Game Viewer</strong> provides move-by-move analysis showing top play alternatives, score tracking, board position evaluation, and player insights. Study games from world champions to understand advanced strategies, defensive techniques, and endgame mastery. Combine this with Puzzle Mode for targeted tactical training.
            </p>
          </div>

          <h2 style={{ color: lightMode === 'dark' ? '#fff' : '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket size={20} weight="fill" />
            Quick Start Guide
          </h2>
          
          <div className={styles.featureSection}>
            <ol style={{ lineHeight: '1.5', margin: '5px 0', paddingLeft: '20px' }}>
              <li><strong>Create an account</strong> - Click the user icon in the sidebar to sign up and start tracking your progress</li>
              <li><strong>Try Play Mode</strong> - Jump into a game against Theo to get familiar with the interface</li>
              <li><strong>Explore the Viewer</strong> - Browse recent tournament games and study expert play</li>
              <li><strong>Solve Puzzles</strong> - Challenge yourself with tactical puzzles to improve decision-making</li>
              <li><strong>Check your Profile</strong> - Review your statistics and game history to track improvement</li>
            </ol>
          </div>

          <div className={styles.footer}>
            <p>
              Need help? Check out the <Link to="/changelog" style={{ color: lightMode === 'dark' ? '#60A5FA' : '#3D5A80', textDecoration: 'none' }}>changelog</Link> for recent updates and features.
            </p>
          </div>
        </Box>
      </Box>   
    </Box>
  );
}

