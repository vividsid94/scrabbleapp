import React, { useState } from "react";

const mascotStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
};
const imgBase = {
  width: '400px',
  height: '400px',
  objectFit: 'contain',
  transition: 'all 0.4s cubic-bezier(.4,2,.6,1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  borderRadius: '24px',
  background: '#fff',
  marginBottom: '32px',
  position: 'relative',
  zIndex: 1,
};
const stencilImg = {
  width: '100px',
  height: '100px',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%) scale(8)',
  zIndex: 10,
  opacity: 0.5, // slightly more vivid than homepage max
  filter: 'grayscale(1) contrast(2) brightness(0.5)',
  pointerEvents: 'auto',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  borderRadius: '24px',
  background: '#fff',
};

export default function MascotStencil() {
  const [stencil, setStencil] = useState(false);
  return (
    <div style={mascotStyles}>
      {stencil ? (
        <img
          src="/images/theomascot.png"
          alt="Theo Mascot"
          style={stencilImg}
        />
      ) : (
        <img
          src="/images/theomascot.png"
          alt="Theo Mascot"
          style={imgBase}
        />
      )}
      {stencil ? (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          zIndex: 1000,
        }}>
          <button
            style={{
              padding: '12px 32px',
              fontSize: '1.2em',
              borderRadius: '8px',
              border: 'none',
              background: '#374151',
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'background 0.2s',
              zIndex: 1000,
            }}
            onClick={() => setStencil(false)}
          >
            Show Full Color
          </button>
          <button
            style={{
              padding: '10px 28px',
              fontSize: '1em',
              borderRadius: '8px',
              border: 'none',
              background: '#f59e0b',
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              marginBottom: '0',
              transition: 'background 0.2s',
              zIndex: 1000,
            }}
            onClick={() => window.location.href = '/about'}
          >
            Back to About
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          marginTop: '0',
          zIndex: 100,
        }}>
          <button
            style={{
              padding: '12px 32px',
              fontSize: '1.2em',
              borderRadius: '8px',
              border: 'none',
              background: '#f59e0b',
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              marginTop: '12px',
              marginBottom: '12px',
              transition: 'background 0.2s',
              zIndex: 100,
            }}
            onClick={() => setStencil(true)}
          >
            Show Stencil Effect
          </button>
          <button
            style={{
              padding: '10px 28px',
              fontSize: '1em',
              borderRadius: '8px',
              border: 'none',
              background: '#374151',
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              marginBottom: '0',
              transition: 'background 0.2s',
              zIndex: 100,
            }}
            onClick={() => window.location.href = '/about'}
          >
            Back to About
          </button>
        </div>
      )}
    </div>
  );
} 