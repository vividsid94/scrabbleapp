import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Button, Typography, Paper, CircularProgress, Alert
} from '@mui/material';
import { Camera, Repeat, X, Lightning } from '@phosphor-icons/react';
import { ThemeContext } from '../../App';
import styles from './CameraScan.module.css';

// Standard Scrabble board premium square layout (0=regular,1=DL,2=DW,3=TL,4=TW)
const BOARD_LAYOUT = [
  [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
  [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
  [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
  [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
  [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
  [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
  [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
  [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4],
  [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
  [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
  [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
  [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
  [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
  [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
  [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
];

const SQUARE_COLORS = {
  0: null,
  1: '#a8d8ea',  // DL
  2: '#9575cd',  // DW
  3: '#f48fb1',  // TL
  4: '#e53935',  // TW
};
const SQUARE_LABELS = { 1: 'DL', 2: 'DW', 3: 'TL', 4: 'TW' };

// Capture current video frame as a JPEG data-URL, resized to maxWidth
function captureFrame(video, maxWidth = 900) {
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const w = Math.round(video.videoWidth  * scale);
  const h = Math.round(video.videoHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.88);
}

export default function CameraScan() {
  const { lightMode } = React.useContext(ThemeContext);
  const isDark = lightMode === 'dark';

  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError,  setCameraError]  = useState(null);

  // Scan state
  const [isScanning,   setIsScanning]   = useState(false);
  const [scanError,    setScanError]    = useState(null);
  const [previewSrc,   setPreviewSrc]   = useState(null); // last captured image

  // Board: 15×15 of null | 'A'…'Z'
  const [boardLetters, setBoardLetters] = useState(
    () => Array(15).fill(null).map(() => Array(15).fill(null))
  );
  const [selectedCell, setSelectedCell] = useState(null);

  // Rack (raw string, max 7 chars)
  const [rack, setRack] = useState('');

  // Moves
  const [topMoves,       setTopMoves]       = useState([]);
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);
  const [moveError,      setMoveError]      = useState(null);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCameraError('Camera access was denied. Please allow camera permissions in your browser and try again.');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Capture & Scan ────────────────────────────────────────────────────────
  const captureAndScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setScanError('Camera is still loading, try again.');
      return;
    }

    setScanError(null);
    setIsScanning(true);

    // Grab frame and show preview immediately
    const dataUrl = captureFrame(video, 1000);
    setPreviewSrc(dataUrl);

    try {
      const res = await fetch('/.netlify/functions/scanBoard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      if (!data.board) throw new Error('No board data in response');

      setBoardLetters(
        data.board.map(row => row.map(cell =>
          typeof cell === 'string' && /^[A-Z]$/i.test(cell)
            ? cell.toUpperCase()
            : null
        ))
      );
      setSelectedCell(null);
      setTopMoves([]);
    } catch (e) {
      setScanError('Scan failed: ' + e.message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // ── Manual Board Editing ──────────────────────────────────────────────────
  const handleCellClick = useCallback((row, col) => {
    setSelectedCell({ row, col });
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const key = e.key.toUpperCase();

    if (/^[A-Z]$/.test(key)) {
      e.preventDefault();
      setBoardLetters(prev => {
        const n = prev.map(r => [...r]);
        n[row][col] = key;
        return n;
      });
      setSelectedCell({ row, col: col < 14 ? col + 1 : col });
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setBoardLetters(prev => { const n = prev.map(r => [...r]); n[row][col] = null; return n; });
    } else if (e.key === 'Escape')      setSelectedCell(null);
    else if (e.key === 'ArrowRight')    setSelectedCell({ row, col: Math.min(14, col + 1) });
    else if (e.key === 'ArrowLeft')     setSelectedCell({ row, col: Math.max(0,  col - 1) });
    else if (e.key === 'ArrowDown')     setSelectedCell({ row: Math.min(14, row + 1), col });
    else if (e.key === 'ArrowUp')       setSelectedCell({ row: Math.max(0,  row - 1), col });
  }, [selectedCell]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Move Calculation ──────────────────────────────────────────────────────
  const buildAPIBoard = () =>
    BOARD_LAYOUT.map((row, r) =>
      row.map((sq, c) => boardLetters[r][c] !== null ? boardLetters[r][c] : sq)
    );

  const calculateMoves = async () => {
    const letters = rack.replace(/\s/g, '').toUpperCase();
    if (!letters) { setMoveError('Enter your rack letters first.'); return; }
    setIsLoadingMoves(true);
    setMoveError(null);
    setTopMoves([]);
    try {
      const apiRack = letters.split('').map(t => t === '?' ? '*' : t);
      const res = await fetch('/.netlify/functions/getTopMoves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: buildAPIBoard(), letters: apiRack }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const moves = (data.moves || []).filter(m => m.word?.trim());
      setTopMoves(moves);
      if (moves.length === 0) setMoveError('No valid moves found.');
    } catch (e) {
      setMoveError('Failed to calculate moves: ' + e.message);
    } finally {
      setIsLoadingMoves(false);
    }
  };

  const formatLocation = (move) => {
    if (!move.tiles?.length) return '';
    const first = move.tiles[0];
    const isH = move.tiles.some(t => t.row === first.row && t.col !== first.col);
    const col = String.fromCharCode(65 + first.col);
    return isH ? `${first.row + 1}${col}` : `${col}${first.row + 1}`;
  };

  const clearBoard = () => {
    setBoardLetters(Array(15).fill(null).map(() => Array(15).fill(null)));
    setSelectedCell(null);
    setTopMoves([]);
    setPreviewSrc(null);
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
  const cardBg  = isDark ? 'rgba(28,32,44,0.95)' : '#fff';
  const text    = isDark ? '#e2e8f0' : '#1a202c';
  const sub     = isDark ? '#94a3b8'  : '#64748b';
  const border  = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const tileCount = boardLetters.flat().filter(Boolean).length;

  return (
    <Box className={styles.container} style={{ color: text }}>
      <Typography variant="h5" className={styles.pageTitle}>Live Board Scanner</Typography>
      <Typography variant="body2" className={styles.pageSubtitle} style={{ color: sub }}>
        Point your webcam at a Scrabble board and click <b>Scan Board</b>. Claude reads the tiles automatically — no corner setup needed.
      </Typography>

      <Box className={styles.layout}>

        {/* ── LEFT: Camera ── */}
        <Paper className={styles.cameraPanel} elevation={2} style={{ background: cardBg, borderColor: border }}>
          <Box className={styles.controls}>
            {!cameraActive ? (
              <Button variant="contained" startIcon={<Camera size={15} />} onClick={startCamera} size="small">
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={isScanning ? null : <Lightning size={15} />}
                  onClick={captureAndScan}
                  disabled={isScanning}
                  size="small"
                >
                  {isScanning ? (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CircularProgress size={13} color="inherit" />
                      Scanning…
                    </Box>
                  ) : 'Scan Board'}
                </Button>

                <Button variant="outlined" onClick={stopCamera} size="small"
                  style={{ color: sub, borderColor: border }}>
                  Stop
                </Button>
              </>
            )}
          </Box>

          {cameraError && <Alert severity="error" sx={{ mb: 1 }}>{cameraError}</Alert>}
          {scanError   && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setScanError(null)}>{scanError}</Alert>}

          {/* Live feed */}
          <Box className={styles.videoWrap}>
            <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
            {isScanning && (
              <Box className={styles.scanOverlay}>
                <CircularProgress size={32} style={{ color: '#00e676' }} />
                <Typography variant="caption" style={{ color: '#00e676', marginTop: 8, fontSize: 13 }}>
                  Claude is reading the board…
                </Typography>
              </Box>
            )}
            {!cameraActive && (
              <Box className={styles.cameraOff}>
                <Camera size={48} style={{ opacity: 0.2 }} />
                <Typography variant="body2" style={{ opacity: 0.3, marginTop: 10 }}>Camera off</Typography>
              </Box>
            )}
          </Box>

          {/* Captured preview (thumbnail + rescan) */}
          {previewSrc && !isScanning && (
            <Box className={styles.previewRow}>
              <img src={previewSrc} alt="Captured board" className={styles.previewThumb} />
              <Box>
                <Typography variant="caption" style={{ color: sub, display: 'block' }}>
                  Last capture
                </Typography>
                {cameraActive && (
                  <Button size="small" variant="text" startIcon={<Repeat size={13} />}
                    onClick={captureAndScan} style={{ color: sub, fontSize: 12, padding: '2px 6px' }}>
                    Re-scan
                  </Button>
                )}
              </Box>
            </Box>
          )}

          <Typography variant="caption" style={{ color: sub, display: 'block', marginTop: 10, lineHeight: 1.6 }}>
            Tip: Good overhead lighting and a straight-on angle give the best results.
            After scanning, click any cell on the board to correct a misread letter.
          </Typography>
        </Paper>

        {/* ── RIGHT: Board + Rack + Moves ── */}
        <Box className={styles.rightPanel}>

          {/* Board */}
          <Paper className={styles.boardPanel} elevation={2} style={{ background: cardBg, borderColor: border }}>
            <Box className={styles.boardHeader}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Typography variant="subtitle2" style={{ fontWeight: 700 }}>Board</Typography>
                {tileCount > 0 && (
                  <Typography variant="caption" style={{ color: sub }}>{tileCount} tiles</Typography>
                )}
              </Box>
              <Button size="small" variant="text" startIcon={<X size={13} />}
                onClick={clearBoard} style={{ color: sub, fontSize: 12, minWidth: 0 }}>
                Clear
              </Button>
            </Box>

            {selectedCell && (
              <Typography variant="caption" style={{ color: '#60a5fa', display: 'block', marginBottom: 6, fontSize: 11 }}>
                Editing {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1} — type a letter · Backspace to clear · Esc · arrows
              </Typography>
            )}

            {/* Column headers A–O */}
            <Box className={styles.colHeaders} style={{ color: sub }}>
              <Box className={styles.rowSpacer} />
              {'ABCDEFGHIJKLMNO'.split('').map(l => (
                <Box key={l} className={styles.colHdr}>{l}</Box>
              ))}
            </Box>

            <Box className={styles.boardGrid}>
              {BOARD_LAYOUT.map((rowArr, r) => (
                <Box key={r} className={styles.boardRow}>
                  <Box className={styles.rowHdr} style={{ color: sub }}>{r + 1}</Box>
                  {rowArr.map((sq, c) => {
                    const letter = boardLetters[r]?.[c];
                    const isSel  = selectedCell?.row === r && selectedCell?.col === c;
                    const sqColor = SQUARE_COLORS[sq];
                    const isCenter = r === 7 && c === 7;
                    return (
                      <Box
                        key={c}
                        className={`${styles.cell} ${letter ? styles.hasTile : ''} ${isSel ? styles.selected : ''}`}
                        style={{
                          background: isSel
                            ? '#2563eb'
                            : letter
                              ? '#f5e6c8'
                              : sqColor || (isDark ? '#2d3748' : '#f0f4f8'),
                          color: isSel ? '#fff' : letter ? '#111' : sqColor ? '#fff' : sub,
                          borderColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)',
                        }}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {letter
                          ? letter
                          : sq > 0
                            ? <span className={styles.sqLabel}>{SQUARE_LABELS[sq]}</span>
                            : isCenter
                              ? <span style={{ fontSize: 11, opacity: 0.5 }}>★</span>
                              : null}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Rack */}
          <Paper className={styles.rackPanel} elevation={2} style={{ background: cardBg, borderColor: border }}>
            <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 10 }}>Your Rack</Typography>
            <Box style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className={styles.rackInput}
                style={{ background: isDark ? '#1e293b' : '#f8fafc', color: text, borderColor: border }}
                value={rack}
                onChange={e => setRack(e.target.value.toUpperCase().replace(/[^A-Z?]/g, '').slice(0, 7))}
                placeholder="e.g. AEINRST"
                maxLength={7}
              />
              {rack.length > 0 && (
                <Box style={{ display: 'flex', gap: 3 }}>
                  {rack.split('').map((t, i) => (
                    <Box key={i} className={styles.rackTile}>{t}</Box>
                  ))}
                </Box>
              )}
            </Box>
            <Typography variant="caption" style={{ color: sub, display: 'block', marginTop: 4 }}>
              Use ? for blank tiles
            </Typography>
            <Box style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={calculateMoves}
                disabled={isLoadingMoves || !rack}
                size="small"
                startIcon={isLoadingMoves ? <CircularProgress size={13} color="inherit" /> : <Lightning size={14} />}
              >
                {isLoadingMoves ? 'Calculating…' : 'Get Best Moves'}
              </Button>
              {rack && (
                <Button variant="text" size="small" onClick={() => { setRack(''); setMoveError(null); }}
                  style={{ color: sub, fontSize: 12 }}>
                  Clear rack
                </Button>
              )}
            </Box>
            {moveError && <Alert severity="error" sx={{ mt: 1, fontSize: 12 }}>{moveError}</Alert>}
          </Paper>

          {/* Top Moves */}
          {topMoves.length > 0 && (
            <Paper className={styles.movesPanel} elevation={2} style={{ background: cardBg, borderColor: border }}>
              <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
                Best Moves
              </Typography>
              {topMoves.slice(0, 10).map((move, i) => (
                <Box key={i} className={styles.moveRow}
                  style={{ borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}>
                  <Box className={styles.mRank} style={{ color: sub }}>{i + 1}</Box>
                  <Box className={styles.mPos}
                    style={{ color: sub, background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}>
                    {formatLocation(move)}
                  </Box>
                  <Box className={styles.mWord} style={{ color: text }}>{move.word}</Box>
                  <Box className={styles.mScore} style={{ color: '#60a5fa' }}>{move.score}</Box>
                  {move.leave !== undefined && (
                    <Box className={styles.mLeave}
                      style={{ color: sub, background: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff' }}>
                      {move.leave}
                    </Box>
                  )}
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
