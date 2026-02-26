import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Button, Typography, Paper, CircularProgress,
  LinearProgress, Alert
} from '@mui/material';
import { Camera, Crosshair, Repeat, X } from '@phosphor-icons/react';
import { ThemeContext } from '../../App';
import styles from './CameraScan.module.css';
import Tesseract from 'tesseract.js';

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
  1: '#a8d8ea',  // DL – sky blue
  2: '#9575cd',  // DW – purple
  3: '#f48fb1',  // TL – pink
  4: '#e53935',  // TW – red
};
const SQUARE_LABELS = { 1: 'DL', 2: 'DW', 3: 'TL', 4: 'TW' };

// --- Pure helper functions (no hooks) ---

const lerp2D = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

const sortCorners = (pts) => {
  const byY = [...pts].sort((a, b) => a.y - b.y);
  const top = byY.slice(0, 2).sort((a, b) => a.x - b.x);
  const bot = byY.slice(2).sort((a, b) => a.x - b.x);
  return { tl: top[0], tr: top[1], bl: bot[0], br: bot[1] };
};

const hasTile = (imgData) => {
  const { data, width, height } = imgData;
  const x0 = Math.floor(width * 0.2),  x1 = Math.floor(width * 0.8);
  const y0 = Math.floor(height * 0.2), y1 = Math.floor(height * 0.8);
  let dark = 0, total = 0, lumSum = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      lumSum += lum;
      if (lum < 85) dark++;
      total++;
    }
  }
  const avg = lumSum / total;
  const ratio = dark / total;
  // Tiles: bright cream background (avg > 120) with visible dark letter pixels
  return avg > 120 && ratio > 0.028 && ratio < 0.5;
};

const enhanceForOCR = (ctx, imgData) => {
  const { data, width, height } = imgData;
  const out = new ImageData(width, height);
  const od = out.data;
  // Convert to grayscale
  const grays = [];
  for (let i = 0; i < data.length; i += 4) {
    grays.push(Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]));
  }
  // Use 60th-percentile as binary threshold (letter pixels = dark minority)
  const sorted = [...grays].sort((a, b) => a - b);
  const thresh = sorted[Math.floor(sorted.length * 0.6)];
  for (let i = 0; i < grays.length; i++) {
    const v = grays[i] < thresh ? 0 : 255;
    od[i * 4] = v; od[i * 4 + 1] = v; od[i * 4 + 2] = v; od[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
};

// ─────────────────────────────────────────────────────────────────────────────

export default function CameraScan() {
  const { lightMode } = React.useContext(ThemeContext);
  const isDark = lightMode === 'dark';

  // Refs
  const videoRef        = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef       = useRef(null);
  const rafRef          = useRef(null);
  const ocrWorkerRef    = useRef(null);
  // Keep latest state in refs so the RAF closure stays stale-free
  const calibrationRef  = useRef(null);
  const clicksRef       = useRef([]);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError,  setCameraError]  = useState(null);

  // Calibration – 4 corner points stored in overlay-canvas CSS-pixel coordinates
  const [calibration,    setCalibration]    = useState(null);   // {tl,tr,bl,br}
  const [clicksCollected, setClicksCollected] = useState([]);   // temp while clicking
  const [isCalibrating,  setIsCalibrating]  = useState(false);

  // Detection
  const [isDetecting,    setIsDetecting]    = useState(false);
  const [detectProgress, setDetectProgress] = useState(0);
  const [ocrReady,       setOcrReady]       = useState(false);

  // Board: 15×15 of null | 'A'…'Z'
  const [boardLetters, setBoardLetters] = useState(
    () => Array(15).fill(null).map(() => Array(15).fill(null))
  );
  const [selectedCell, setSelectedCell] = useState(null);

  // Rack (raw text)
  const [rack, setRack] = useState('');

  // Moves
  const [topMoves,       setTopMoves]       = useState([]);
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);
  const [moveError,      setMoveError]      = useState(null);

  // Status banner
  const [statusMsg, setStatusMsg] = useState(null); // {type, text}

  // Sync refs whenever state changes so RAF can read the latest values
  useEffect(() => { calibrationRef.current = calibration; }, [calibration]);
  useEffect(() => { clicksRef.current = clicksCollected; }, [clicksCollected]);

  // ── OCR Worker ────────────────────────────────────────────────────────────
  useEffect(() => {
    let worker = null;
    const init = async () => {
      try {
        worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          tessedit_pageseg_mode: '10', // single-character mode
        });
        ocrWorkerRef.current = worker;
        setOcrReady(true);
      } catch (e) {
        console.warn('OCR init failed:', e);
      }
    };
    init();
    return () => { if (worker) worker.terminate(); };
  }, []);

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
      setCameraError('Camera access denied. Check browser permissions and try again.');
    }
  };

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Overlay RAF Drawing ───────────────────────────────────────────────────
  // Only depends on `cameraActive` for setup – reads live state via refs to
  // avoid re-registering (which causes a single-frame flicker) on every update.
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !cameraActive) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const drawPoint = (ctx, pt, label) => {
      ctx.fillStyle = '#00ff88';
      ctx.strokeStyle = '#004422';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pt.x, pt.y);
    };

    const draw = () => {
      // Sync internal resolution to CSS display size (no visual flicker –
      // we're the only writer of this canvas).
      if (canvas.clientWidth > 0 && canvas.width !== canvas.clientWidth) {
        canvas.width  = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cal    = calibrationRef.current;
      const clicks = clicksRef.current;

      if (cal) {
        // Draw calibration corner dots
        [['tl', 1], ['tr', 2], ['bl', 3], ['br', 4]].forEach(([k, n]) =>
          drawPoint(ctx, cal[k], n)
        );
        // Board outline
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cal.tl.x, cal.tl.y);
        ctx.lineTo(cal.tr.x, cal.tr.y);
        ctx.lineTo(cal.br.x, cal.br.y);
        ctx.lineTo(cal.bl.x, cal.bl.y);
        ctx.closePath();
        ctx.stroke();
        // 15×15 grid overlay
        ctx.strokeStyle = 'rgba(0,255,136,0.3)';
        ctx.lineWidth = 0.75;
        for (let i = 1; i < 15; i++) {
          const t = i / 15;
          const top  = lerp2D(cal.tl, cal.tr, t);
          const bot  = lerp2D(cal.bl, cal.br, t);
          const left = lerp2D(cal.tl, cal.bl, t);
          const rgt  = lerp2D(cal.tr, cal.br, t);
          ctx.beginPath(); ctx.moveTo(top.x, top.y);   ctx.lineTo(bot.x, bot.y);   ctx.stroke();
          ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(rgt.x, rgt.y);   ctx.stroke();
        }
      } else if (clicks.length > 0) {
        // Partial click dots during calibration
        clicks.forEach((pt, i) => drawPoint(ctx, pt, i + 1));
        if (clicks.length >= 2) {
          ctx.strokeStyle = 'rgba(0,255,136,0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(clicks[0].x, clicks[0].y);
          for (let i = 1; i < clicks.length; i++) ctx.lineTo(clicks[i].x, clicks[i].y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cameraActive]); // intentionally only cameraActive

  // ── Calibration ───────────────────────────────────────────────────────────
  const startCalibration = () => {
    setCalibration(null);
    setClicksCollected([]);
    setIsCalibrating(true);
    setStatusMsg({ type: 'info', text: 'Click the 4 corners of your board: top-left → top-right → bottom-left → bottom-right' });
  };

  const handleOverlayClick = (e) => {
    if (!isCalibrating) return;
    const canvas = overlayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    setClicksCollected(prev => {
      const next = [...prev, pt];
      if (next.length === 4) {
        const cal = sortCorners(next);
        setCalibration(cal);
        setIsCalibrating(false);
        setStatusMsg({ type: 'success', text: 'Board corners set! Click "Detect Tiles" to scan.' });
        return [];
      }
      return next;
    });
  };

  // ── Capture + OCR ─────────────────────────────────────────────────────────
  const captureAndDetect = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (!video || !canvas || !calibration) return;
    if (video.readyState < 2) {
      setStatusMsg({ type: 'warning', text: 'Camera is still loading, try again.' });
      return;
    }

    setIsDetecting(true);
    setDetectProgress(0);
    setStatusMsg(null);

    // 1. Snapshot the current video frame to an off-screen canvas
    const cap = document.createElement('canvas');
    cap.width  = video.videoWidth;
    cap.height = video.videoHeight;
    cap.getContext('2d').drawImage(video, 0, 0);

    // 2. Scale calibration points (stored in overlay CSS-pixels) → video pixels
    const sx = video.videoWidth  / canvas.width;
    const sy = video.videoHeight / canvas.height;
    const vc = {
      tl: { x: calibration.tl.x * sx, y: calibration.tl.y * sy },
      tr: { x: calibration.tr.x * sx, y: calibration.tr.y * sy },
      bl: { x: calibration.bl.x * sx, y: calibration.bl.y * sy },
      br: { x: calibration.br.x * sx, y: calibration.br.y * sy },
    };

    // 3. Estimate average cell size in video pixels
    const boardW = ((vc.tr.x - vc.tl.x) + (vc.br.x - vc.bl.x)) / 2;
    const boardH = ((vc.bl.y - vc.tl.y) + (vc.br.y - vc.tr.y)) / 2;
    const cw = boardW / 15;
    const ch = boardH / 15;

    // 4. Cell canvas scaled up for OCR
    const CELL_PX = 96;
    const cellCvs = document.createElement('canvas');
    cellCvs.width = cellCvs.height = CELL_PX;
    const cellCtx = cellCvs.getContext('2d');

    const newBoard = Array(15).fill(null).map(() => Array(15).fill(null));
    let done = 0;

    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        // Bilinear interpolation – cell centre in video space
        const cr = (row + 0.5) / 15;
        const cc = (col + 0.5) / 15;
        const top    = lerp2D(vc.tl, vc.tr, cc);
        const bot    = lerp2D(vc.bl, vc.br, cc);
        const center = lerp2D(top, bot, cr);

        // Source region: 80% of the cell width, inset from centre
        const margin = 0.1;
        const srcX = center.x - cw * (0.5 - margin);
        const srcY = center.y - ch * (0.5 - margin);
        const srcW = cw * (1 - 2 * margin);
        const srcH = ch * (1 - 2 * margin);

        cellCtx.clearRect(0, 0, CELL_PX, CELL_PX);
        cellCtx.drawImage(cap, srcX, srcY, srcW, srcH, 0, 0, CELL_PX, CELL_PX);

        const imgData = cellCtx.getImageData(0, 0, CELL_PX, CELL_PX);
        if (hasTile(imgData)) {
          enhanceForOCR(cellCtx, imgData);
          if (ocrWorkerRef.current) {
            try {
              const { data: { text } } = await ocrWorkerRef.current.recognize(cellCvs);
              const letter = text.trim().charAt(0).toUpperCase();
              if (/^[A-Z]$/.test(letter)) newBoard[row][col] = letter;
            } catch (_) { /* skip */ }
          }
        }

        done++;
        setDetectProgress(Math.round(done / 225 * 100));
      }
    }

    setBoardLetters(newBoard);
    setIsDetecting(false);
    const count = newBoard.flat().filter(Boolean).length;
    setStatusMsg({
      type: count > 0 ? 'success' : 'warning',
      text: count > 0
        ? `Found ${count} tile${count !== 1 ? 's' : ''}. Click any cell to correct errors, then enter your rack.`
        : 'No tiles detected. Make sure the board is well-lit and corners are set correctly.',
    });
  }, [calibration]);

  // ── Board Editor ──────────────────────────────────────────────────────────
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
    } else if (e.key === 'Escape') {
      setSelectedCell(null);
    } else if (e.key === 'ArrowRight') setSelectedCell({ row, col: Math.min(14, col + 1) });
    else if (e.key === 'ArrowLeft')  setSelectedCell({ row, col: Math.max(0,  col - 1) });
    else if (e.key === 'ArrowDown')  setSelectedCell({ row: Math.min(14, row + 1), col });
    else if (e.key === 'ArrowUp')    setSelectedCell({ row: Math.max(0,  row - 1), col });
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
      if (moves.length === 0) setMoveError('No valid moves found for this rack and board.');
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

  // ── Styles ────────────────────────────────────────────────────────────────
  const cardBg       = isDark ? 'rgba(30,32,44,0.9)' : '#fff';
  const textColor    = isDark ? '#e2e8f0' : '#1a202c';
  const subText      = isDark ? '#94a3b8'  : '#64748b';
  const borderColor  = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  const tileLetter = (r, c) => boardLetters[r]?.[c] ?? null;
  const tileCount  = boardLetters.flat().filter(Boolean).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box className={styles.container} style={{ color: textColor }}>
      <Typography variant="h5" className={styles.pageTitle}>
        Live Board Scanner
      </Typography>
      <Typography variant="body2" className={styles.pageSubtitle} style={{ color: subText }}>
        Point your webcam at a real Scrabble board. Mark the corners, detect tiles, enter your rack, and get the best moves.
      </Typography>

      {statusMsg && (
        <Alert severity={statusMsg.type} onClose={() => setStatusMsg(null)} sx={{ mb: 2 }}>
          {statusMsg.text}
        </Alert>
      )}

      <Box className={styles.layout}>

        {/* ── LEFT: Camera ── */}
        <Paper className={styles.cameraPanel} elevation={2}
          style={{ background: cardBg, borderColor }}>

          <Box className={styles.controls}>
            {!cameraActive ? (
              <Button variant="contained" startIcon={<Camera size={15} />}
                onClick={startCamera} size="small">
                Start Camera
              </Button>
            ) : (
              <>
                <Button variant="outlined" onClick={stopCamera} size="small"
                  style={{ color: subText, borderColor }}>
                  Stop
                </Button>

                <Button
                  variant={isCalibrating ? 'contained' : 'outlined'}
                  startIcon={<Crosshair size={15} />}
                  onClick={startCalibration}
                  size="small"
                  color={isCalibrating ? 'warning' : 'primary'}
                >
                  {isCalibrating
                    ? `Corners (${clicksCollected.length}/4)`
                    : calibration ? 'Re-set Corners' : 'Set Corners'}
                </Button>

                {calibration && (
                  <Button
                    variant="contained"
                    startIcon={isDetecting ? null : <Repeat size={15} />}
                    onClick={captureAndDetect}
                    size="small"
                    color="success"
                    disabled={isDetecting || !ocrReady}
                  >
                    {isDetecting ? `Scanning ${detectProgress}%` : 'Detect Tiles'}
                  </Button>
                )}
              </>
            )}
          </Box>

          {cameraError && <Alert severity="error" sx={{ mb: 1 }}>{cameraError}</Alert>}

          {isCalibrating && (
            <Alert severity="info" sx={{ mb: 1, fontSize: 13 }}>
              Click the 4 corners of the board: <b>top-left → top-right → bottom-left → bottom-right</b>
            </Alert>
          )}

          {/* Video + overlay */}
          <Box className={styles.videoWrap}>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className={styles.video}
            />
            <canvas
              ref={overlayCanvasRef}
              className={styles.overlayCanvas}
              onClick={handleOverlayClick}
              style={{ pointerEvents: isCalibrating ? 'auto' : 'none', cursor: isCalibrating ? 'crosshair' : 'default' }}
            />
            {isDetecting && (
              <Box className={styles.scanOverlay}>
                <CircularProgress size={26} style={{ color: '#00ff88' }} />
                <Typography variant="caption" style={{ color: '#00ff88', marginTop: 4 }}>
                  Scanning… {detectProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={detectProgress}
                  style={{ width: '80%', marginTop: 6 }} />
              </Box>
            )}
            {!cameraActive && (
              <Box className={styles.cameraOff}>
                <Camera size={44} style={{ opacity: 0.25 }} />
                <Typography variant="body2" style={{ opacity: 0.35, marginTop: 8 }}>Camera off</Typography>
              </Box>
            )}
          </Box>

          {!ocrReady && cameraActive && (
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, opacity: 0.7 }}>
              <CircularProgress size={13} />
              <Typography variant="caption">Loading OCR engine…</Typography>
            </Box>
          )}

          <Typography variant="caption" style={{ color: subText, display: 'block', marginTop: 10, lineHeight: 1.5 }}>
            Tip: Good lighting and a top-down angle improve accuracy.
            After scanning, click any cell and type a letter to correct it.
          </Typography>
        </Paper>

        {/* ── RIGHT: Board + Rack + Moves ── */}
        <Box className={styles.rightPanel}>

          {/* Board */}
          <Paper className={styles.boardPanel} elevation={2} style={{ background: cardBg, borderColor }}>
            <Box className={styles.boardHeader}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Typography variant="subtitle2" style={{ fontWeight: 700 }}>Board</Typography>
                {tileCount > 0 && (
                  <Typography variant="caption" style={{ color: subText }}>
                    {tileCount} tile{tileCount !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
              <Button size="small" variant="text" startIcon={<X size={13} />}
                onClick={() => { setBoardLetters(Array(15).fill(null).map(() => Array(15).fill(null))); setSelectedCell(null); setTopMoves([]); }}
                style={{ color: subText, fontSize: 12, minWidth: 0 }}>
                Clear
              </Button>
            </Box>

            {selectedCell && (
              <Typography variant="caption"
                style={{ color: '#3b82f6', display: 'block', marginBottom: 6, fontSize: 11 }}>
                Editing {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1} — type A–Z · Backspace to clear · Esc to exit · arrows to move
              </Typography>
            )}

            {/* Column headers */}
            <Box className={styles.colHeaders} style={{ color: subText }}>
              <Box className={styles.rowHeaderSpacer} />
              {'ABCDEFGHIJKLMNO'.split('').map(l => (
                <Box key={l} className={styles.colHeader}>{l}</Box>
              ))}
            </Box>

            {/* Grid */}
            <Box className={styles.boardGrid}>
              {BOARD_LAYOUT.map((rowArr, r) => (
                <Box key={r} className={styles.boardRow}>
                  <Box className={styles.rowHeader} style={{ color: subText }}>{r + 1}</Box>
                  {rowArr.map((sq, c) => {
                    const letter = tileLetter(r, c);
                    const isSel  = selectedCell?.row === r && selectedCell?.col === c;
                    const sqColor = SQUARE_COLORS[sq];
                    const isCtr  = r === 7 && c === 7;

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
                          color: isSel
                            ? '#fff'
                            : letter
                              ? '#111'
                              : sqColor ? '#fff' : subText,
                          borderColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.12)',
                        }}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {letter
                          ? letter
                          : sq > 0
                            ? <span className={styles.sqLabel}>{SQUARE_LABELS[sq]}</span>
                            : isCtr ? <span style={{ fontSize: 12, opacity: 0.6 }}>★</span> : null}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Rack */}
          <Paper className={styles.rackPanel} elevation={2} style={{ background: cardBg, borderColor }}>
            <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 10 }}>Your Rack</Typography>
            <Box style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className={styles.rackInput}
                style={{ background: isDark ? '#1e293b' : '#f8fafc', color: textColor, borderColor }}
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
            <Typography variant="caption" style={{ color: subText, display: 'block', marginTop: 5 }}>
              Use ? for blank tiles
            </Typography>
            <Box style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={calculateMoves}
                disabled={isLoadingMoves || !rack}
                size="small"
                startIcon={isLoadingMoves ? <CircularProgress size={13} color="inherit" /> : null}
              >
                {isLoadingMoves ? 'Calculating…' : 'Get Best Moves'}
              </Button>
              {rack && (
                <Button variant="text" size="small" onClick={() => setRack('')}
                  style={{ color: subText, fontSize: 12 }}>
                  Clear rack
                </Button>
              )}
            </Box>
            {moveError && <Alert severity="error" sx={{ mt: 1, fontSize: 12 }}>{moveError}</Alert>}
          </Paper>

          {/* Moves */}
          {topMoves.length > 0 && (
            <Paper className={styles.movesPanel} elevation={2} style={{ background: cardBg, borderColor }}>
              <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: 8 }}>
                Best Moves
              </Typography>
              {topMoves.slice(0, 10).map((move, i) => (
                <Box key={i} className={styles.moveRow}
                  style={{ borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}>
                  <Box className={styles.mRank} style={{ color: subText }}>{i + 1}</Box>
                  <Box className={styles.mPos}
                    style={{ color: subText, background: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}>
                    {formatLocation(move)}
                  </Box>
                  <Box className={styles.mWord} style={{ color: textColor }}>{move.word}</Box>
                  <Box className={styles.mScore} style={{ color: '#3b82f6' }}>{move.score}</Box>
                  {move.leave !== undefined && (
                    <Box className={styles.mLeave}
                      style={{ color: subText, background: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff' }}>
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
