import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, LinearProgress } from '@mui/material';
import { Camera, CornersOut, Repeat, X, Lightning } from '@phosphor-icons/react';
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

  const videoRef      = useRef(null);
  const videoWrapRef  = useRef(null);
  const streamRef     = useRef(null);
  const dragStartRef  = useRef(null);
  const isDraggingRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError,  setCameraError]  = useState(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [liveBox,     setLiveBox]     = useState(null);
  const [selection,   setSelection]   = useState(null);

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
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
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

  // ── Drag-to-select ──────────────────────────────────────────────────────────
  const getContainerPt = (e) => {
    const rect = videoWrapRef.current.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return {
      x: Math.max(0, Math.min(src.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(src.clientY - rect.top,  rect.height)),
    };
  };

  const makeBox = (a, b) => ({
    left:   Math.min(a.x, b.x),
    top:    Math.min(a.y, b.y),
    width:  Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  });

  const handlePointerDown = useCallback((e) => {
    if (!isSelecting) return;
    e.preventDefault();
    const pt = getContainerPt(e);
    dragStartRef.current  = pt;
    isDraggingRef.current = true;
    setSelection(null);
    setLiveBox({ left: pt.x, top: pt.y, width: 0, height: 0 });
  }, [isSelecting]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    setLiveBox(makeBox(dragStartRef.current, getContainerPt(e)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finaliseSelection = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const box = makeBox(dragStartRef.current, getContainerPt(e));
    if (box.width > 20 && box.height > 20) {
      setSelection(box);
      setLiveBox(box);
      setIsSelecting(false);
    } else {
      setLiveBox(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('mouseup',  finaliseSelection);
    window.addEventListener('touchend', finaliseSelection);
    return () => {
      window.removeEventListener('mouseup',  finaliseSelection);
      window.removeEventListener('touchend', finaliseSelection);
    };
  }, [finaliseSelection]);

  // ── Scan — calls the scanBoard Netlify function (Gemini) ───────────────────
  const runScan = useCallback(async () => {
    const video     = videoRef.current;
    const container = videoWrapRef.current;
    const box       = selection;
    if (!video || !container || !box) return;
    if (video.readyState < 2) { setScanError('Camera still loading.'); return; }

    setIsScanning(true);
    setScanProgress(10);
    setScanError(null);

    // 1. Snapshot the full video frame
    const cap = document.createElement('canvas');
    cap.width  = video.videoWidth;
    cap.height = video.videoHeight;
    cap.getContext('2d').drawImage(video, 0, 0);

    // 2. Crop selected region to its own canvas
    const sx = video.videoWidth  / container.clientWidth;
    const sy = video.videoHeight / container.clientHeight;
    const rx = Math.round(box.left   * sx), ry = Math.round(box.top    * sy);
    const rw = Math.round(box.width  * sx), rh = Math.round(box.height * sy);

    const crop = document.createElement('canvas');
    crop.width  = rw;
    crop.height = rh;
    crop.getContext('2d').drawImage(cap, rx, ry, rw, rh, 0, 0, rw, rh);

    // Show a preview thumbnail of what we're sending
    const thumb = document.createElement('canvas');
    const thumbSize = 120;
    thumb.width = thumb.height = thumbSize;
    thumb.getContext('2d').drawImage(crop, 0, 0, thumbSize, thumbSize);
    setPreviewSrc(thumb.toDataURL('image/jpeg', 0.8));

    setScanProgress(30);

    // 3. Encode as base64 JPEG and send to the scanBoard function
    const imageDataUrl = crop.toDataURL('image/jpeg', 0.85);

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
        throw new Error(errBody.error || `Server error ${res.status}`);
      }

      data = await res.json();
    } catch (e) {
      setScanError('Scan failed: ' + e.message);
      setIsScanning(false);
      return;
    }

    if (!data?.board) {
      setScanError('Unexpected response from server.');
      setIsScanning(false);
      return;
    }

    setBoardLetters(data.board);
    setScanProgress(100);
    setIsScanning(false);
    setSelectedCell(null);
    setTopMoves([]);

    if (!data.tileCount) {
      setScanError('No tiles detected. Check lighting and make sure the selection covers only the board grid.');
    }
  }, [selection]);

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

  // ── Styles ──────────────────────────────────────────────────────────────────
  const cardBg    = isDark ? 'rgba(28,32,44,0.95)' : '#fff';
  const text      = isDark ? '#e2e8f0' : '#1a202c';
  const sub       = isDark ? '#94a3b8'  : '#64748b';
  const border    = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const tileCount = boardLetters.flat().filter(Boolean).length;
  const displayBox = liveBox;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box className={styles.container} style={{ color: text }}>
      <Typography variant="h5" className={styles.pageTitle}>Live Board Scanner</Typography>
      <Typography variant="body2" className={styles.pageSubtitle} style={{ color: sub }}>
        Point your webcam at a Scrabble board, drag to select the board area, then scan.
        Powered by Gemini Vision — set <code>GEMINI_API_KEY</code> in your Netlify env vars.
      </Typography>

      <Box className={styles.layout}>

        {/* ── Camera panel ── */}
        <Paper className={styles.cameraPanel} elevation={2} style={{ background: cardBg, borderColor: border }}>

          <Box className={styles.controls}>
            {!cameraActive ? (
              <Button variant="contained" size="small" startIcon={<Camera size={15} />} onClick={startCamera}>
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  variant={isSelecting ? 'contained' : 'outlined'}
                  size="small"
                  color={isSelecting ? 'warning' : 'primary'}
                  startIcon={<CornersOut size={15} />}
                  onClick={() => setIsSelecting(s => !s)}
                >
                  {isSelecting ? 'Drag to select…' : selection ? 'Re-select Area' : 'Select Board Area'}
                </Button>

                {selection && (
                  <Button
                    variant="contained" size="small" color="success"
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
                )}

                <Button variant="outlined" size="small" onClick={stopCamera}
                  style={{ color: sub, borderColor: border }}>
                  Stop
                </Button>
              </>
            )}
          </Box>

          {cameraError && <Alert severity="error"   sx={{ mb: 1 }}>{cameraError}</Alert>}
          {scanError   && <Alert severity="warning" sx={{ mb: 1 }} onClose={() => setScanError(null)}>{scanError}</Alert>}
          {isSelecting && (
            <Alert severity="info" sx={{ mb: 1, fontSize: 12 }}>
              Click and drag a rectangle tightly around the 15×15 grid.
            </Alert>
          )}

          {/* Video + div selection overlay */}
          <Box
            ref={videoWrapRef}
            className={styles.videoWrap}
            style={{ cursor: isSelecting ? 'crosshair' : 'default' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
          >
            <video ref={videoRef} autoPlay playsInline muted className={styles.video} />

            {displayBox && displayBox.width > 2 && displayBox.height > 2 && (
              <div style={{
                position:      'absolute',
                left:          displayBox.left,
                top:           displayBox.top,
                width:         displayBox.width,
                height:        displayBox.height,
                border:        '2px solid #00e676',
                background:    'rgba(0,230,118,0.10)',
                pointerEvents: 'none',
                boxSizing:     'border-box',
              }}>
                {[{ top: -4, left: -4 }, { top: -4, right: -4 },
                  { bottom: -4, left: -4 }, { bottom: -4, right: -4 }].map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: 8, height: 8,
                    background: '#00e676', borderRadius: 1, ...pos,
                  }} />
                ))}
              </div>
            )}

            {isScanning && (
              <Box className={styles.scanOverlay}>
                <CircularProgress size={30} style={{ color: '#00e676' }} />
                <Typography variant="caption" style={{ color: '#00e676', marginTop: 8 }}>
                  Reading tiles…
                </Typography>
                <LinearProgress variant="determinate" value={scanProgress}
                  style={{ width: '75%', marginTop: 8 }} />
              </Box>
            )}
            {!cameraActive && (
              <Box className={styles.cameraOff}>
                <Camera size={44} style={{ opacity: 0.2 }} />
                <Typography variant="body2" style={{ opacity: 0.3, marginTop: 10 }}>Camera off</Typography>
              </Box>
            )}
          </Box>

          {previewSrc && !isScanning && (
            <Box className={styles.previewRow}>
              <img src={previewSrc} alt="Last scan" className={styles.previewThumb} />
              <Box>
                <Typography variant="caption" style={{ color: sub, display: 'block' }}>Last scan</Typography>
                {selection && cameraActive && (
                  <Button size="small" variant="text" startIcon={<Repeat size={13} />}
                    onClick={runScan}
                    style={{ color: sub, fontSize: 12, padding: '2px 6px' }}>
                    Re-scan
                  </Button>
                )}
              </Box>
            </Box>
          )}

          <Typography variant="caption" style={{ color: sub, display: 'block', marginTop: 10, lineHeight: 1.6 }}>
            Tips: Good even lighting, no glare. Select only the inner 15×15 grid.
            Click any board cell to correct a misread letter after scanning.
          </Typography>
        </Paper>

        {/* ── Right panel ── */}
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
                onClick={() => {
                  setBoardLetters(Array(15).fill(null).map(() => Array(15).fill(null)));
                  setSelectedCell(null); setTopMoves([]); setPreviewSrc(null);
                  setLiveBox(null); setSelection(null);
                }}
                style={{ color: sub, fontSize: 12, minWidth: 0 }}>
                Clear
              </Button>
            </Box>

            {selectedCell && (
              <Typography variant="caption" style={{ color: '#60a5fa', display: 'block', marginBottom: 6, fontSize: 11 }}>
                Editing {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1} — type a letter · Backspace to clear · Esc · arrows
              </Typography>
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
                    const isSel    = selectedCell?.row === r && selectedCell?.col === c;
                    const sqColor  = SQUARE_COLORS[sq];
                    const isCenter = r === 7 && c === 7;
                    return (
                      <Box key={c}
                        className={`${styles.cell} ${letter ? styles.hasTile : ''} ${isSel ? styles.selected : ''}`}
                        style={{
                          background:  isSel ? '#2563eb' : letter ? '#f5e6c8' : sqColor || (isDark ? '#2d3748' : '#f0f4f8'),
                          color:       isSel ? '#fff' : letter ? '#111' : sqColor ? '#fff' : sub,
                          borderColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)',
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
          <Paper className={styles.rackPanel} elevation={2} style={{ background: cardBg, borderColor: border }}>
            <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 10 }}>Your Rack</Typography>
            <Box style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input className={styles.rackInput}
                style={{ background: isDark ? '#1e293b' : '#f8fafc', color: text, borderColor: border }}
                value={rack}
                onChange={e => setRack(e.target.value.toUpperCase().replace(/[^A-Z?]/g, '').slice(0, 7))}
                placeholder="e.g. AEINRST" maxLength={7}
              />
              {rack.length > 0 && (
                <Box style={{ display: 'flex', gap: 3 }}>
                  {rack.split('').map((t, i) => <Box key={i} className={styles.rackTile}>{t}</Box>)}
                </Box>
              )}
            </Box>
            <Typography variant="caption" style={{ color: sub, display: 'block', marginTop: 4 }}>Use ? for blank tiles</Typography>
            <Box style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button variant="contained" color="primary" size="small" onClick={calculateMoves}
                disabled={isLoadingMoves || !rack}
                startIcon={isLoadingMoves ? <CircularProgress size={13} color="inherit" /> : <Lightning size={14} />}>
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

          {/* Moves */}
          {topMoves.length > 0 && (
            <Paper className={styles.movesPanel} elevation={2} style={{ background: cardBg, borderColor: border }}>
              <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>Best Moves</Typography>
              {topMoves.slice(0, 10).map((move, i) => (
                <Box key={i} className={styles.moveRow}
                  style={{ borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}>
                  <Box className={styles.mRank}  style={{ color: sub }}>{i + 1}</Box>
                  <Box className={styles.mPos}   style={{ color: sub, background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}>
                    {formatLocation(move)}
                  </Box>
                  <Box className={styles.mWord}  style={{ color: text }}>{move.word}</Box>
                  <Box className={styles.mScore} style={{ color: '#60a5fa' }}>{move.score}</Box>
                  {move.leave !== undefined && (
                    <Box className={styles.mLeave} style={{ color: sub, background: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff' }}>
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
