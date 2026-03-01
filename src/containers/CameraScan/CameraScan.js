import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Button, Paper, CircularProgress, Alert, LinearProgress } from '@mui/material';
import { Camera, X, Lightning, Repeat } from '@phosphor-icons/react';
import Sidenav from '../../components/AppContent/Sidenav/Sidenav.js';
import { ThemeContext } from '../../App';
import styles from './CameraScan.module.css';

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

const SQUARE_COLORS = { 0: null, 1: '#a8d8ea', 2: '#9575cd', 3: '#f48fb1', 4: '#e53935' };
const SQUARE_LABELS = { 1: 'DL', 2: 'DW', 3: 'TL', 4: 'TW' };

export default function CameraScan() {
  const { lightMode } = React.useContext(ThemeContext);
  const isDark = lightMode === 'dark';

  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError,  setCameraError]  = useState(null);
  const [isScanning,   setIsScanning]   = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError,    setScanError]    = useState(null);
  const [previewSrc,   setPreviewSrc]   = useState(null);

  const [boardLetters, setBoardLetters] = useState(
    () => Array(15).fill(null).map(() => Array(15).fill(null))
  );
  const [selectedCell, setSelectedCell] = useState(null);

  const [rack,           setRack]           = useState('');
  const [topMoves,       setTopMoves]       = useState([]);
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);
  const [moveError,      setMoveError]      = useState(null);

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied. Check browser permissions and try again.');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Capture current frame → send to scanBoard function ─────────────────────
  const runScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) { setScanError('Camera still loading.'); return; }

    setIsScanning(true);
    setScanProgress(10);
    setScanError(null);

    const cap = document.createElement('canvas');
    cap.width  = video.videoWidth;
    cap.height = video.videoHeight;
    cap.getContext('2d').drawImage(video, 0, 0);

    const thumb = document.createElement('canvas');
    thumb.width  = 160;
    thumb.height = Math.round(160 * (video.videoHeight / video.videoWidth));
    thumb.getContext('2d').drawImage(cap, 0, 0, thumb.width, thumb.height);
    setPreviewSrc(thumb.toDataURL('image/jpeg', 0.8));

    setScanProgress(25);
    const imageDataUrl = cap.toDataURL('image/jpeg', 0.92);

    let data;
    try {
      const res = await fetch('/.netlify/functions/scanBoard', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: imageDataUrl }),
      });

      setScanProgress(80);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const detail  = errBody.detail
          ? (typeof errBody.detail === 'string' ? errBody.detail : JSON.stringify(errBody.detail))
          : '';
        throw new Error((errBody.error || `Server error ${res.status}`) + (detail ? ` — ${detail}` : ''));
      }

      data = await res.json();
    } catch (e) {
      setScanError('Scan failed: ' + e.message);
      setIsScanning(false);
      return;
    }

    if (!data?.board) { setScanError('Unexpected response from server.'); setIsScanning(false); return; }

    setBoardLetters(data.board);
    setScanProgress(100);
    setIsScanning(false);
    setSelectedCell(null);
    setTopMoves([]);

    if (!data.tileCount) {
      setScanError('No tiles detected — make sure the full board is visible and well-lit.');
    }
  }, []);

  // ── Manual board editing ────────────────────────────────────────────────────
  const handleCellClick = useCallback((r, c) => setSelectedCell({ row: r, col: c }), []);

  const handleKeyDown = useCallback((e) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      e.preventDefault();
      setBoardLetters(p => { const n = p.map(r => [...r]); n[row][col] = key; return n; });
      setSelectedCell({ row, col: Math.min(14, col + 1) });
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setBoardLetters(p => { const n = p.map(r => [...r]); n[row][col] = null; return n; });
    } else if (e.key === 'Escape')   setSelectedCell(null);
    else if (e.key === 'ArrowRight') setSelectedCell({ row, col: Math.min(14, col + 1) });
    else if (e.key === 'ArrowLeft')  setSelectedCell({ row, col: Math.max(0,  col - 1) });
    else if (e.key === 'ArrowDown')  setSelectedCell({ row: Math.min(14, row + 1), col });
    else if (e.key === 'ArrowUp')    setSelectedCell({ row: Math.max(0,  row - 1), col });
  }, [selectedCell]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Move calculation ────────────────────────────────────────────────────────
  const buildAPIBoard = () =>
    BOARD_LAYOUT.map((row, r) => row.map((sq, c) => boardLetters[r][c] ?? sq));

  const calculateMoves = async () => {
    const letters = rack.replace(/\s/g, '').toUpperCase();
    if (!letters) { setMoveError('Enter your rack letters first.'); return; }
    setIsLoadingMoves(true); setMoveError(null); setTopMoves([]);
    try {
      const res  = await fetch('/.netlify/functions/getTopMoves', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          board:   buildAPIBoard(),
          letters: letters.split('').map(t => t === '?' ? '*' : t),
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data  = await res.json();
      const moves = (data.moves || []).filter(m => m.word?.trim());
      setTopMoves(moves);
      if (!moves.length) setMoveError('No valid moves found.');
    } catch (e) {
      setMoveError('Failed: ' + e.message);
    } finally {
      setIsLoadingMoves(false);
    }
  };

  const formatLocation = (move) => {
    if (!move.tiles?.length) return '';
    const f   = move.tiles[0];
    const isH = move.tiles.some(t => t.row === f.row && t.col !== f.col);
    return isH
      ? `${f.row + 1}${String.fromCharCode(65 + f.col)}`
      : `${String.fromCharCode(65 + f.col)}${f.row + 1}`;
  };

  // ── Theme shortcuts ─────────────────────────────────────────────────────────
  const cardBg = isDark ? 'rgba(28,32,44,0.95)' : '#fff';
  const text   = isDark ? '#e2e8f0' : '#1a202c';
  const sub    = isDark ? '#94a3b8'  : '#64748b';
  const border = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const tileCount = boardLetters.flat().filter(v => v !== null).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidenav />
      <Box className={styles.page} style={{ color: text }}>

        <div className={styles.header}>
          <h1 className={styles.title} style={{ color: text }}>Live Board Scanner</h1>
          <p className={styles.subtitle} style={{ color: sub }}>
            Point your camera at the board and tap <strong>Scan</strong>.
            Board detection is automatic — no need to crop or select.
          </p>
        </div>

        <Box className={styles.layout}>

          {/* ── Camera panel ── */}
          <Paper className={styles.cameraPanel} elevation={2}
            style={{ background: cardBg, borderColor: border }}>

            <Box className={styles.controls}>
              {!cameraActive ? (
                <Button variant="contained" size="small"
                  startIcon={<Camera size={15} />}
                  onClick={startCamera}>
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button
                    className={styles.scanBtn}
                    variant="contained" size="small"
                    startIcon={isScanning ? null : <Lightning size={15} />}
                    disabled={isScanning}
                    onClick={runScan}
                  >
                    {isScanning
                      ? <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CircularProgress size={12} color="inherit" />Scanning…
                        </Box>
                      : 'Scan Board'}
                  </Button>

                  <Button className={styles.stopBtn} variant="outlined" size="small"
                    onClick={stopCamera}
                    style={{ color: sub, borderColor: border }}>
                    Stop
                  </Button>
                </>
              )}
            </Box>

            {cameraError && <Alert severity="error"   sx={{ m: '8px 16px 0' }}>{cameraError}</Alert>}
            {scanError   && <Alert severity="warning" sx={{ m: '8px 16px 0' }} onClose={() => setScanError(null)}>{scanError}</Alert>}

            <Box className={styles.videoWrap}>
              <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
              {isScanning && (
                <Box className={styles.scanOverlay}>
                  <CircularProgress size={30} style={{ color: '#D97706' }} />
                  <p style={{ color: '#D97706', margin: '8px 0 0', fontSize: 12 }}>Reading board…</p>
                  <LinearProgress variant="determinate" value={scanProgress}
                    style={{ width: '75%', marginTop: 8 }} />
                </Box>
              )}
              {!cameraActive && (
                <Box className={styles.cameraOff}>
                  <Camera size={44} style={{ opacity: 0.2 }} />
                  <p style={{ opacity: 0.3, marginTop: 10, fontSize: 14, margin: '10px 0 0' }}>Camera off</p>
                </Box>
              )}
            </Box>

            {previewSrc && !isScanning && (
              <Box className={styles.previewRow}
                style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                <img src={previewSrc} alt="Last scan" className={styles.previewThumb} />
                <Box>
                  <p style={{ color: sub, fontSize: 11, margin: '0 0 4px' }}>Last scan</p>
                  {cameraActive && (
                    <Button size="small" variant="text"
                      startIcon={<Repeat size={13} />}
                      onClick={runScan}
                      style={{ color: sub, fontSize: 12, padding: '2px 6px' }}>
                      Re-scan
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            <p className={styles.tips} style={{ color: sub }}>
              Tips: Hold the camera directly above the board. Good even lighting with no glare
              works best. Click any cell to correct a letter after scanning.
            </p>
          </Paper>

          {/* ── Right panel ── */}
          <Box className={styles.rightPanel}>

            {/* Board viewer */}
            <Paper className={styles.boardPanel} elevation={2}
              style={{ background: cardBg, borderColor: border }}>

              <Box className={styles.boardHeader}>
                <Box className={styles.boardTitleRow}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: text }}>Board</span>
                  {tileCount > 0 && (
                    <span className={styles.tileCountBadge}>{tileCount} tiles</span>
                  )}
                </Box>
                <Button size="small" variant="text" startIcon={<X size={13} />}
                  onClick={() => {
                    setBoardLetters(Array(15).fill(null).map(() => Array(15).fill(null)));
                    setSelectedCell(null); setTopMoves([]); setPreviewSrc(null);
                  }}
                  style={{ color: sub, fontSize: 12, minWidth: 0 }}>
                  Clear
                </Button>
              </Box>

              {selectedCell && (
                <p style={{ color: '#60a5fa', fontSize: 11, margin: '0 0 6px' }}>
                  Editing {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1}
                  {' '}— type a letter · Backspace to clear · Esc · arrows
                </p>
              )}

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
                      const letter   = boardLetters[r]?.[c];
                      const isBlank  = letter === '?';
                      const hasTile  = !!letter;
                      const isSel    = selectedCell?.row === r && selectedCell?.col === c;
                      const sqColor  = SQUARE_COLORS[sq];
                      const isCenter = r === 7 && c === 7;
                      return (
                        <Box key={c}
                          className={`${styles.cell} ${hasTile ? styles.hasTile : ''} ${isSel ? styles.selected : ''}`}
                          style={{
                            background:  isSel ? '#2563eb' : isBlank ? '#e8e8e8' : letter ? '#f5e6c8' : sqColor || (isDark ? '#2d3748' : '#f0f4f8'),
                            color:       isSel ? '#fff' : isBlank ? '#888' : letter ? '#111' : sqColor ? '#fff' : sub,
                            borderColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)',
                            fontStyle:   isBlank ? 'italic' : 'normal',
                          }}
                          onClick={() => handleCellClick(r, c)}
                        >
                          {letter ? letter
                            : sq > 0 ? <span className={styles.sqLabel}>{SQUARE_LABELS[sq]}</span>
                            : isCenter ? <span style={{ fontSize: 11, opacity: 0.5 }}>★</span>
                            : null}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Rack */}
            <Paper className={styles.rackPanel} elevation={2}
              style={{ background: cardBg, borderColor: border }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: text, display: 'block', marginBottom: 10 }}>
                Your Rack
              </span>
              <Box style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className={styles.rackInput}
                  style={{ background: isDark ? '#1e293b' : '#f8fafc', color: text, borderColor: border }}
                  value={rack}
                  onChange={e => setRack(e.target.value.toUpperCase().replace(/[^A-Z?]/g, '').slice(0, 7))}
                  placeholder="e.g. AEINRST"
                  maxLength={7}
                />
                {rack.length > 0 && (
                  <Box style={{ display: 'flex', gap: 3 }}>
                    {rack.split('').map((t, i) => <Box key={i} className={styles.rackTile}>{t}</Box>)}
                  </Box>
                )}
              </Box>
              <p style={{ color: sub, fontSize: 11, margin: '4px 0 0' }}>Use ? for blank tiles</p>
              <Box style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button
                  className={styles.scanBtn}
                  variant="contained" size="small"
                  onClick={calculateMoves}
                  disabled={isLoadingMoves || !rack}
                  startIcon={isLoadingMoves ? <CircularProgress size={13} color="inherit" /> : <Lightning size={14} />}
                >
                  {isLoadingMoves ? 'Calculating…' : 'Get Best Moves'}
                </Button>
                {rack && (
                  <Button variant="text" size="small"
                    onClick={() => { setRack(''); setMoveError(null); }}
                    style={{ color: sub, fontSize: 12 }}>
                    Clear rack
                  </Button>
                )}
              </Box>
              {moveError && <Alert severity="error" sx={{ mt: 1, fontSize: 12 }}>{moveError}</Alert>}
            </Paper>

            {/* Best moves */}
            {topMoves.length > 0 && (
              <Paper className={styles.movesPanel} elevation={2}
                style={{ background: cardBg, borderColor: border }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: text, display: 'block', marginBottom: 8 }}>
                  Best Moves
                </span>
                {topMoves.slice(0, 10).map((move, i) => (
                  <Box key={i} className={styles.moveRow}
                    style={{ borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}>
                    <Box className={styles.mRank} style={{ color: sub }}>{i + 1}</Box>
                    <Box className={styles.mPos}
                      style={{ color: sub, background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}>
                      {formatLocation(move)}
                    </Box>
                    <Box className={styles.mWord} style={{ color: text }}>{move.word}</Box>
                    <Box className={styles.mScore}>{move.score}</Box>
                    {move.leave !== undefined && (
                      <Box className={styles.mLeave}
                        style={{ color: sub, background: isDark ? 'rgba(217,119,6,0.12)' : '#fffbeb' }}>
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
    </Box>
  );
}
