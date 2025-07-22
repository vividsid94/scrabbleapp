import React, { useState } from "react";
import styles from "./About.module.css";
import Sidenav from "../../components/AppContent/Sidenav/Sidenav";
// import Footer from "../../components/AppContent/Footer/Footer";
import Box from '@mui/material/Box';
import AnimatedMascot from '../../components/AppContent/AnimatedMascot';
import Modal from '@mui/material/Modal';

export default function About() {
  const [showPhotoshoot, setShowPhotoshoot] = useState(false);
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidenav />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 5, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {/* Left column: Sid and Tess stacked */}
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Sid Profile */}
            <Box style={{
              minWidth: 320,
              maxWidth: 380,
              width: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.10) inset',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 0,
              animation: 'none',
            }}>
              <img
                src="/images/me.jpg"
                alt="Sid Murali"
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', background: '#eee', marginBottom: 12, boxShadow: '0 0 0 3px #60A5FA', transition: 'box-shadow 0.2s' }}
              />
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1F2937', marginBottom: 2, textAlign: 'center' }}>Sid Murali</div>
              <div style={{ fontSize: 13, color: '#374151', opacity: 0.8, textAlign: 'center', minHeight: 44, maxHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 }}>
                Creator, developer, and Scrabble enthusiast. Building Tile Turnover™ to make word games more fun for everyone!
              </div>
              <button
                style={{
                  marginTop: 10,
                  background: 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                  color: '#fff',
                  border: 0,
                  borderRadius: 8,
                  padding: '7px 20px',
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  fontSize: 15,
                  boxShadow: '6px 0px 0px #374151',
                  outline: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  opacity: 0.95
                }}
                onClick={() => window.open('https://github.com/sidmurali', '_blank')}
              >
                View GitHub
              </button>
            </Box>
            {/* Tess Profile */}
            <Box style={{
              minWidth: 320,
              maxWidth: 380,
              width: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.10) inset',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 0,
              animation: 'none',
            }}>
              <img
                src="/images/tessmascot.png"
                alt="Tess Taylor Mascot"
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', background: '#eee', marginBottom: 12, boxShadow: '0 0 0 3px #60A5FA', transition: 'box-shadow 0.2s' }}
              />
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1F2937', marginBottom: 2, textAlign: 'center' }}>Tess Taylor</div>
              <div style={{ fontSize: 13, color: '#374151', opacity: 0.8, textAlign: 'center', minHeight: 44, maxHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 }}>
                Calm, clever, and encouraging, I love strategy and help others discover the joy of smart play. I’m your friendly fox for thoughtful games and positive vibes!
              </div>
              <button
                style={{
                  marginTop: 10,
                  background: 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)',
                  color: '#fff',
                  border: 0,
                  borderRadius: 8,
                  padding: '7px 20px',
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  fontSize: 15,
                  boxShadow: '6px 0px 0px #60A5FA',
                  outline: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  opacity: 0.95
                }}
                onClick={() => setShowPhotoshoot('tess')}
              >
                Photoshoot
              </button>
            </Box>
          </Box>
          {/* Theo Profile */}
          <Box style={{
            minWidth: 320,
            maxWidth: 380,
            width: '100%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
            border: 'none',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.10) inset',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 24,
            animation: 'none',
          }}>
            <img
              src="/images/theomascot.png"
              alt="Theo Townsend Mascot"
              style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', background: '#eee', marginBottom: 12, boxShadow: '0 0 0 3px #60A5FA', transition: 'box-shadow 0.2s' }}
            />
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1F2937', marginBottom: 2, textAlign: 'center' }}>Theo Townsend</div>
            <div style={{ fontSize: 13, color: '#374151', opacity: 0.8, textAlign: 'center', minHeight: 44, maxHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 }}>
              Your friendly Scrabble fox! Here to help you outfox the board and have a blast with every tile. Ask me for tips or just enjoy my winning smile!
            </div>
            <button
              style={{
                marginTop: 10,
                background: 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                padding: '7px 20px',
                fontWeight: 'bold',
                letterSpacing: 1,
                fontSize: 15,
                boxShadow: '6px 0px 0px #60A5FA',
                outline: 'transparent',
                cursor: 'pointer',
                userSelect: 'none',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                opacity: 0.95
              }}
              onClick={() => setShowPhotoshoot(true)}
            >
              Photoshoot
            </button>
          </Box>
          {/* Photoshoot Modal (Theo or Tess) */}
          <Modal
            open={!!showPhotoshoot}
            onClose={() => setShowPhotoshoot(false)}
            aria-labelledby="photoshoot-modal-title"
            aria-describedby="photoshoot-modal-description"
          >
            <Box style={{
              minWidth: 320,
              maxWidth: 600,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.10) inset',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'none',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
              <div style={{ marginBottom: 24, fontWeight: 700, fontSize: 22, color: '#1F2937', textAlign: 'center' }}>{showPhotoshoot === 'tess' ? "Tess's Photoshoot" : "Theo's Photoshoot"}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 512, height: 512, overflow: 'hidden' }}>
                <div style={{ transform: 'scale(2)', transformOrigin: 'center' }}>
                  <AnimatedMascot about={showPhotoshoot === 'tess' ? 'tess' : 'theo'} />
                </div>
              </div>
              <button
                style={{
                  marginTop: 24,
                  background: 'linear-gradient(45deg, transparent 5%, #3D5A80 5%)',
                  color: '#fff',
                  border: 0,
                  borderRadius: 8,
                  padding: '7px 20px',
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  fontSize: 15,
                  boxShadow: '6px 0px 0px #60A5FA',
                  outline: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  opacity: 0.95
                }}
                onClick={() => setShowPhotoshoot(false)}
              >
                Close
              </button>
            </Box>
          </Modal>
        </Box>
      </Box>
    </div>
  );
} 