import React, { useState, useEffect, useRef } from "react";

// Helper to generate a jigsaw piece path
function getPiecePath(x, y, size, tabs) {
  const tabSize = size / 3.5;
  const tabCurve = size / 6;
  let path = `M${x},${y}`;
  if (tabs.top === 0) {
    path += ` h${size}`;
  } else {
    const dir = tabs.top;
    path += ` h${size / 3}`;
    path += ` c${tabCurve},${-tabSize * dir} ${size / 3 - tabCurve},${-tabSize * dir} ${size / 3},0`;
    path += ` h${size / 3}`;
  }
  if (tabs.right === 0) {
    path += ` v${size}`;
  } else {
    const dir = tabs.right;
    path += ` v${size / 3}`;
    path += ` c${tabSize * dir},${tabCurve} ${tabSize * dir},${size / 3 - tabCurve} 0,${size / 3}`;
    path += ` v${size / 3}`;
  }
  if (tabs.bottom === 0) {
    path += ` h-${size}`;
  } else {
    const dir = tabs.bottom;
    path += ` h-${size / 3}`;
    path += ` c${-tabCurve},${tabSize * dir} ${-size / 3 + tabCurve},${tabSize * dir} -${size / 3},0`;
    path += ` h-${size / 3}`;
  }
  if (tabs.left === 0) {
    path += ` v-${size}`;
  } else {
    const dir = tabs.left;
    path += ` v-${size / 3}`;
    path += ` c${-tabSize * dir},${-tabCurve} ${-tabSize * dir},${-size / 3 + tabCurve} 0,-${size / 3}`;
    path += ` v-${size / 3}`;
  }
  path += "Z";
  return path;
}

// General edge map generator for any grid size
function generateTabs(rows, cols) {
  const pieces = [];
  for (let row = 0; row < rows; row++) {
    pieces[row] = [];
    for (let col = 0; col < cols; col++) {
      pieces[row][col] = { top: 0, right: 0, bottom: 0, left: 0 };
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Top edge
      if (row > 0) {
        pieces[row][col].top = -pieces[row - 1][col].bottom;
      } else {
        pieces[row][col].top = 0;
      }
      // Left edge
      if (col > 0) {
        pieces[row][col].left = -pieces[row][col - 1].right;
      } else {
        pieces[row][col].left = 0;
      }
      // Right edge
      if (col < cols - 1) {
        pieces[row][col].right = Math.random() > 0.5 ? 1 : -1;
      } else {
        pieces[row][col].right = 0;
      }
      // Bottom edge
      if (row < rows - 1) {
        pieces[row][col].bottom = Math.random() > 0.5 ? 1 : -1;
      } else {
        pieces[row][col].bottom = 0;
      }
    }
  }
  return pieces;
}

const shuffleArray = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const JigsawPuzzle = () => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const pieceSize = 100;
  const tabSize = pieceSize / 3.5;
  const images = [ 
    '/images/compressed/theomascot-compressed.png',
    '/images/compressed/tessmascot-compressed.png',
    '/images/compressed/theomascot2-compressed.png',
    '/images/compressed/theomascot3-compressed.png',
    '/images/compressed/theomascot4-compressed.png',
    '/images/compressed/tessmascot2-compressed.png',
    '/images/compressed/tessmascot3-compressed.png'
  ];
  const [image, setImage] = useState(images[0]);
  const [pieces, setPieces] = useState([]); // {row, col, tabs, id}
  const [board, setBoard] = useState(Array(rows * cols).fill(null)); // board[i] = pieceIdx or null
  const [dragged, setDragged] = useState(null); // {pieceIdx, from: 'tray'|'board', boardIdx?}
  const draggedRef = useRef(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // {clientX, clientY}
  const [isComplete, setIsComplete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const boardRef = useRef();
  const trayRef = useRef();
  const [trayOrder, setTrayOrder] = useState([]); // Track randomized tray order

  // Mobile responsiveness - adjust piece size based on screen width
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePieceSize, setMobilePieceSize] = useState(80);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setMobilePieceSize(mobile ? 60 : 80);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentPieceSize = isMobile ? mobilePieceSize : pieceSize;
  const currentTabSize = currentPieceSize / 3.5;
  
  // Tray pieces are much smaller for better space efficiency
  const trayPieceSize = isMobile ? 40 : 60;
  const trayTabSize = trayPieceSize / 3.5;

  // Initialize puzzle
  const initializePuzzle = (newRows, newCols, newImage) => {
    const totalPieces = newRows * newCols;
    const tabs = generateTabs(newRows, newCols);
    
    const newPieces = [];
    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / newCols);
      const col = i % newCols;
      newPieces.push({
        id: i,
        row,
        col,
        tabs: tabs[row][col],
        imgRow: row,
        imgCol: col
      });
    }
    
    setPieces(newPieces);
    setBoard(Array(totalPieces).fill(null));
    setIsComplete(false);
    
    // Randomize tray order
    const trayIndices = Array.from({ length: totalPieces }, (_, i) => i);
    const shuffledTray = shuffleArray([...trayIndices]);
    setTrayOrder(shuffledTray);
  };

  useEffect(() => {
    initializePuzzle(rows, cols, image);
    // eslint-disable-next-line
  }, [rows, cols, image]);

  // Check for completion
  useEffect(() => {
    if (
      board.every((pieceIdx, i) => pieceIdx === i) &&
      board.every(idx => idx !== null)
    ) {
      setIsComplete(true);
    } else {
      setIsComplete(false);
    }
  }, [board]);

  // Mouse event handlers
  useEffect(() => {
    if (!dragged) return;
    const handleMouseMove = e => {
      setMousePos({
        x: e.clientX,
        y: e.clientY,
      });
    };
    const handleMouseUp = e => {
      // Get drop targets
      const trayRect = trayRef.current.getBoundingClientRect();
      const boardRect = boardRef.current.getBoundingClientRect();
      const { x: clientX, y: clientY } = mousePos;
      // Check if dropped in tray
      if (
        clientX >= trayRect.left &&
        clientX <= trayRect.right &&
        clientY >= trayRect.top &&
        clientY <= trayRect.bottom
      ) {
        // Move to tray
        if (dragged.from === 'board') {
          setBoard(prev => {
            const newBoard = prev.slice();
            newBoard[dragged.boardIdx] = null;
            return newBoard;
          });
        }
        setDragged(null);
        return;
      }
      // Check if dropped on board
      if (
        clientX >= boardRect.left &&
        clientX <= boardRect.right &&
        clientY >= boardRect.top &&
        clientY <= boardRect.bottom
      ) {
        const relX = clientX - boardRect.left;
        const relY = clientY - boardRect.top;
        let snapRow = Math.floor(relY / currentPieceSize);
        let snapCol = Math.floor(relX / currentPieceSize);
        if (
          snapRow >= 0 && snapRow < rows &&
          snapCol >= 0 && snapCol < cols
        ) {
          const snapIdx = snapRow * cols + snapCol;
          if (dragged.from === 'tray') {
            if (board[snapIdx] === null) {
              // Place piece
              setBoard(prev => {
                const newBoard = prev.slice();
                newBoard[snapIdx] = dragged.pieceIdx;
                return newBoard;
              });
            } else if (board[snapIdx] !== null) {
              // Swap with board piece
              setBoard(prev => {
                const newBoard = prev.slice();
                // Move the board piece to tray
                // setTray(trayPrev => [...trayPrev, newBoard[snapIdx]]); // This line is removed
                newBoard[snapIdx] = dragged.pieceIdx;
                return newBoard;
              });
              // setTray(prev => prev.filter(idx => idx !== dragged.pieceIdx)); // This line is removed
            }
          } else if (dragged.from === 'board') {
            if (snapIdx === dragged.boardIdx) {
              // Dropped on same square, do nothing
            } else if (board[snapIdx] === null) {
              // Move to empty square
              setBoard(prev => {
                const newBoard = prev.slice();
                newBoard[snapIdx] = dragged.pieceIdx;
                newBoard[dragged.boardIdx] = null;
                return newBoard;
              });
            } else if (board[snapIdx] !== null) {
              // Swap with another board piece
              setBoard(prev => {
                const newBoard = prev.slice();
                const temp = newBoard[snapIdx];
                newBoard[snapIdx] = dragged.pieceIdx;
                newBoard[dragged.boardIdx] = temp;
                return newBoard;
              });
            }
          }
        }
        setDragged(null);
        return;
      }
      // If dropped elsewhere, just cancel drag
      setDragged(null);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragged, currentPieceSize, rows, cols, board, mousePos]);

  const handleTrayMouseDown = (pieceIdx, e) => {
    if (isComplete) return;
    draggedRef.current = { pieceIdx, from: 'tray' };
    setDragged({ pieceIdx, from: 'tray' });
    setDragOffset({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleBoardMouseDown = (i, pieceIdx, e) => {
    if (isComplete) return;
    draggedRef.current = { pieceIdx, from: 'board', boardIdx: i };
    setDragged({ pieceIdx, from: 'board', boardIdx: i });
    setDragOffset({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const shuffleTray = () => {
    // Re-randomize the tray order
    const totalPieces = rows * cols;
    const trayIndices = Array.from({ length: totalPieces }, (_, i) => i);
    const shuffledTray = shuffleArray([...trayIndices]);
    setTrayOrder(shuffledTray);
  };

  const resetPuzzle = () => {
    setBoard(Array(rows * cols).fill(null));
    setIsComplete(false);
    setDragged(null);
    setShowPreview(false);
  };

  // Clear draggedRef on drag end
  useEffect(() => {
    if (!dragged) draggedRef.current = null;
  }, [dragged]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "80vh",
      padding: isMobile ? 12 : 16,
      width: '100%'
    }}>
      {/* Control Box / Tray */}
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : 800,
        marginBottom: isMobile ? 16 : 20,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 16 : 20,
        alignItems: 'flex-start'
      }}>
        {/* Left half - Controls */}
        <div style={{
          width: isMobile ? '100%' : '50%',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 8 : 10
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 6 : 8,
            alignItems: 'center'
          }}>
            <label style={{
              fontWeight: 600,
              marginBottom: 4,
              textAlign: 'center',
              fontSize: isMobile ? 14 : 16
            }}>Grid Size:</label>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: isMobile ? 2 : 3, 
              justifyContent: 'center',
              width: '100%'
            }}>
              {[3, 4, 5, 7].map(size => (
                <button
                  key={size}
                  onClick={() => { setRows(size); setCols(size); }}
                  style={{
                    padding: isMobile ? '3px 6px' : '4px 8px',
                    fontSize: isMobile ? 10 : 12,
                    borderRadius: 6,
                    background: rows === size 
                      ? 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)'
                      : 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    letterSpacing: 0.5,
                    boxShadow: rows === size 
                      ? '4px 0px 0px #3D5A80'
                      : '4px 0px 0px #374151',
                    outline: 'transparent',
                    position: 'relative',
                    userSelect: 'none',
                    marginLeft: isMobile ? 1 : 2,
                    marginRight: isMobile ? 1 : 2,
                    marginBottom: 0,
                    transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                    transform: rows === size ? 'scale(1.02)' : 'scale(1)',
                    zIndex: rows === size ? 2 : 1,
                    flex: isMobile ? '1 1 calc(50% - 2px)' : '1 1 calc(50% - 3px)',
                    minWidth: isMobile ? '40px' : '50px'
                  }}
                >
                  {size} x {size}
                  {rows === size && (
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -4,
                      height: 3,
                      background: '#4ECDC4',
                      borderRadius: 2,
                      width: '100%',
                      display: 'block',
                    }} />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 6 : 8,
            alignItems: 'center'
          }}>
            <label style={{
              fontWeight: 600,
              marginBottom: 4,
              textAlign: 'center',
              fontSize: isMobile ? 14 : 16
            }}>Image:</label>
            <select
              value={image}
              onChange={e => setImage(e.target.value)}
              style={{
                fontSize: isMobile ? 12 : 14,
                padding: isMobile ? '4px 8px' : '6px 12px',
                borderRadius: 6,
                width: '100%',
                maxWidth: isMobile ? '100%' : 200
              }}
            >
              {images.map(img => (
                <option key={img} value={img}>
                  {img.split('/').pop()}
                </option>
              ))}
            </select>
          </div>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: isMobile ? 8 : 8,
            width: '100%'
          }}>
            <button onClick={shuffleTray} style={{ 
              flex: '1',
              padding: isMobile ? '10px 16px' : '8px 16px', 
              fontSize: isMobile ? 16 : 14, 
              borderRadius: 8, 
              background: 'linear-gradient(45deg, transparent 5%, #4ECDC4 5%)',
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              letterSpacing: 1,
              boxShadow: '6px 0px 0px #3D5A80',
              outline: 'transparent',
              position: 'relative',
              userSelect: 'none',
              transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
              minHeight: isMobile ? '44px' : 'auto'
            }}>
              Shuffle
            </button>
            <button onClick={resetPuzzle} style={{ 
              flex: '1',
              padding: isMobile ? '10px 16px' : '8px 16px', 
              fontSize: isMobile ? 16 : 14, 
              borderRadius: 8, 
              background: 'linear-gradient(45deg, transparent 5%, #1F2937 5%)',
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              letterSpacing: 1,
              boxShadow: '6px 0px 0px #374151',
              outline: 'transparent',
              position: 'relative',
              userSelect: 'none',
              transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
              minHeight: isMobile ? '44px' : 'auto'
            }}>
              Reset
            </button>
            <button onClick={() => setShowPreview(p => !p)} style={{ 
              flex: '1',
              padding: isMobile ? '10px 16px' : '8px 16px', 
              fontSize: isMobile ? 16 : 14, 
              borderRadius: 8, 
              background: 'linear-gradient(45deg, transparent 5%, #F59E0B 5%)',
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              letterSpacing: 1,
              boxShadow: '6px 0px 0px #D97706',
              outline: 'transparent',
              position: 'relative',
              userSelect: 'none',
              transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
              minHeight: isMobile ? '44px' : 'auto'
            }}>
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
        </div>
        
        {/* Right half - Tray */}
        <div ref={trayRef} style={{ 
          minHeight: trayPieceSize + (isMobile ? 12 : 16), 
          width: isMobile ? '100%' : '50%',
          background: '#f0f4f8', 
          borderRadius: isMobile ? 8 : 12, 
          boxShadow: '0 2px 8px #0001', 
          padding: isMobile ? 6 : 8, 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: isMobile ? 4 : 6, 
          position: 'relative' 
        }}>
          {trayOrder.filter(pieceIdx => !board.includes(pieceIdx)).map((pieceIdx, i) => {
            const piece = pieces[pieceIdx];
            if (!piece) return null;
            // If dragging this piece from tray, render as floating
            if (dragged && dragged.pieceIdx === pieceIdx && dragged.from === 'tray') return null;
            return (
              <div
                key={`tray-${piece.id}`}
                style={{ 
                  width: trayPieceSize, 
                  height: trayPieceSize, 
                  cursor: isComplete ? 'default' : 'grab', 
                  position: 'relative',
                  flexShrink: 0
                }}
                onMouseDown={e => handleTrayMouseDown(pieceIdx, e)}
              >
                <svg
                  width={trayPieceSize + 2 * trayTabSize}
                  height={trayPieceSize + 2 * trayTabSize}
                  viewBox={`0 0 ${trayPieceSize + 2 * trayTabSize} ${trayPieceSize + 2 * trayTabSize}`}
                  style={{ display: 'block', position: 'absolute', left: -trayTabSize, top: -trayTabSize }}
                >
                  <defs>
                    <clipPath id={`clip_tray_${piece.id}`}>
                      <path d={getPiecePath(trayTabSize, trayTabSize, trayPieceSize, piece.tabs)} />
                    </clipPath>
                  </defs>
                  <image
                    href={image}
                    x={trayTabSize - piece.imgCol * trayPieceSize}
                    y={trayTabSize - piece.imgRow * trayPieceSize}
                    width={cols * trayPieceSize}
                    height={rows * trayPieceSize}
                    clipPath={`url(#clip_tray_${piece.id})`}
                    style={{ pointerEvents: 'none' }}
                  />
                  <path
                    d={getPiecePath(trayTabSize, trayTabSize, trayPieceSize, piece.tabs)}
                    fill="none"
                    stroke="#333"
                    strokeWidth={2}
                  />
                </svg>
              </div>
            );
          })}
          {/* Dragging piece from tray (floating) */}
          {dragged && dragged.from === 'tray' && (
            <div
              style={{
                position: 'fixed',
                left: mousePos.x - dragOffset.x - trayTabSize,
                top: mousePos.y - dragOffset.y - trayTabSize,
                width: trayPieceSize + 2 * trayTabSize,
                height: trayPieceSize + 2 * trayTabSize,
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              <svg
                width={trayPieceSize + 2 * trayTabSize}
                height={trayPieceSize + 2 * trayTabSize}
                viewBox={`0 0 ${trayPieceSize + 2 * trayTabSize} ${trayPieceSize + 2 * trayTabSize}`}
                style={{ display: 'block' }}
              >
                <defs>
                  <clipPath id={`clip_tray_drag_${dragged.pieceIdx}`}>
                    <path d={getPiecePath(trayTabSize, trayTabSize, trayPieceSize, pieces[dragged.pieceIdx].tabs)} />
                  </clipPath>
                </defs>
                <image
                  href={image}
                  x={trayTabSize - pieces[dragged.pieceIdx].imgCol * trayPieceSize}
                  y={trayTabSize - pieces[dragged.pieceIdx].imgRow * trayPieceSize}
                  width={cols * trayPieceSize}
                  height={rows * trayPieceSize}
                  clipPath={`url(#clip_tray_drag_${dragged.pieceIdx})`}
                  style={{ pointerEvents: 'none' }}
                />
                <path
                  d={getPiecePath(trayTabSize, trayTabSize, trayPieceSize, pieces[dragged.pieceIdx].tabs)}
                  fill="none"
                  stroke="#333"
                  strokeWidth={2}
                />
              </svg>
            </div>
          )}
        </div>
        {isComplete && (
          <div style={{ 
            marginTop: isMobile ? 16 : 20, 
            fontSize: isMobile ? 16 : 18, 
            fontWeight: 700, 
            color: '#4ECDC4',
            textAlign: 'center'
          }}>
            🎉 Puzzle Complete!
          </div>
        )}
      </div>
      {/* Puzzle Board */}
      <div
        ref={boardRef}
        style={{
          position: "relative",
          width: '100%',
          maxWidth: cols * currentPieceSize,
          height: rows * currentPieceSize,
          background: "#eee",
          borderRadius: isMobile ? 12 : 16,
          boxShadow: '0 2px 12px #0001',
          border: '2px solid #e0e7ef',
          userSelect: 'none',
          marginTop: isMobile ? 12 : 16,
          touchAction: 'none' // Prevent scrolling when dragging pieces
        }}
      >
        {/* Preview overlay */}
        {showPreview && (
          <img
            src={image}
            alt="Preview"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: cols * currentPieceSize,
              height: rows * currentPieceSize,
              opacity: 0.5,
              zIndex: 1,
              pointerEvents: 'none',
              borderRadius: 16,
            }}
          />
        )}
        {/* Board grid */}
        {board.map((pieceIdx, i) => {
          const gridRow = Math.floor(i / cols);
          const gridCol = i % cols;
          const left = gridCol * currentPieceSize - currentTabSize;
          const top = gridRow * currentPieceSize - currentTabSize;
          if (pieceIdx === null) {
            return (
              <div
                key={`board-empty-${i}`}
                style={{
                  position: 'absolute',
                  left: gridCol * currentPieceSize,
                  top: gridRow * currentPieceSize,
                  width: currentPieceSize,
                  height: currentPieceSize,
                  background: '#f0f4f8',
                  borderRadius: 8,
                  border: '1px dashed #bbb',
                  zIndex: 0,
                }}
              />
            );
          }
          // If dragging this piece from board, hide it only in its original square (use ref for immediate effect)
          if (draggedRef.current && draggedRef.current.pieceIdx === pieceIdx && draggedRef.current.from === 'board' && draggedRef.current.boardIdx === i) return null;
          const piece = pieces[pieceIdx];
          return (
            <div
              key={`board-${piece.id}`}
              style={{
                position: 'absolute',
                left,
                top,
                width: currentPieceSize + 2 * currentTabSize,
                height: currentPieceSize + 2 * currentTabSize,
                zIndex: 2,
                cursor: isComplete ? 'default' : 'grab',
              }}
              onMouseDown={e => handleBoardMouseDown(i, pieceIdx, e)}
            >
              <svg
                width={currentPieceSize + 2 * currentTabSize}
                height={currentPieceSize + 2 * currentTabSize}
                viewBox={`0 0 ${currentPieceSize + 2 * currentTabSize} ${currentPieceSize + 2 * currentTabSize}`}
                style={{ display: 'block' }}
              >
                <defs>
                  <clipPath id={`clip_board_${piece.id}`}>
                    <path d={getPiecePath(currentTabSize, currentTabSize, currentPieceSize, piece.tabs)} />
                  </clipPath>
                </defs>
                <image
                  href={image}
                  x={currentTabSize - piece.imgCol * currentPieceSize}
                  y={currentTabSize - piece.imgRow * currentPieceSize}
                  width={cols * currentPieceSize}
                  height={rows * currentPieceSize}
                  clipPath={`url(#clip_board_${piece.id})`}
                  style={{ pointerEvents: 'none' }}
                />
                <path
                  d={getPiecePath(currentTabSize, currentTabSize, currentPieceSize, piece.tabs)}
                  fill="none"
                  stroke="#333"
                  strokeWidth={2}
                />
              </svg>
            </div>
          );
        })}
        {/* Dragging piece from board (floating) */}
        {dragged && dragged.from === 'board' && (
          <div
            style={{
              position: 'fixed',
              left: mousePos.x - dragOffset.x - currentTabSize,
              top: mousePos.y - dragOffset.y - currentTabSize,
              width: currentPieceSize + 2 * currentTabSize,
              height: currentPieceSize + 2 * currentTabSize,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <svg
              width={currentPieceSize + 2 * currentTabSize}
              height={currentPieceSize + 2 * currentTabSize}
              viewBox={`0 0 ${currentPieceSize + 2 * currentTabSize} ${currentPieceSize + 2 * currentTabSize}`}
              style={{ display: 'block' }}
            >
              <defs>
                <clipPath id={`clip_board_drag_${dragged.pieceIdx}`}>
                  <path d={getPiecePath(currentTabSize, currentTabSize, currentPieceSize, pieces[dragged.pieceIdx].tabs)} />
                </clipPath>
              </defs>
              <image
                href={image}
                x={currentTabSize - pieces[dragged.pieceIdx].imgCol * currentPieceSize}
                y={currentTabSize - pieces[dragged.pieceIdx].imgRow * currentPieceSize}
                width={cols * currentPieceSize}
                height={rows * currentPieceSize}
                clipPath={`url(#clip_board_drag_${dragged.pieceIdx})`}
                style={{ pointerEvents: 'none' }}
              />
              <path
                d={getPiecePath(currentTabSize, currentTabSize, currentPieceSize, pieces[dragged.pieceIdx].tabs)}
                fill="none"
                stroke="#333"
                strokeWidth={2}
              />
            </svg>
          </div>
        )}
        {/* Dragging piece from tray (floating) */}
        {dragged && dragged.from === 'tray' && (
          <div
            style={{
              position: 'fixed',
              left: mousePos.x - dragOffset.x - trayTabSize,
              top: mousePos.y - dragOffset.y - trayTabSize,
              width: trayPieceSize + 2 * trayTabSize,
              height: trayPieceSize + 2 * trayTabSize,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <svg
              width={trayPieceSize + 2 * trayTabSize}
              height={trayPieceSize + 2 * trayTabSize}
              viewBox={`0 0 ${trayPieceSize + 2 * trayTabSize} ${trayPieceSize + 2 * trayTabSize}`}
              style={{ display: 'block' }}
            >
              <defs>
                <clipPath id={`clip_tray_drag_${dragged.pieceIdx}`}>
                  <path d={getPiecePath(trayTabSize, trayTabSize, trayPieceSize, pieces[dragged.pieceIdx].tabs)} />
                </clipPath>
              </defs>
              <image
                href={image}
                x={trayTabSize - pieces[dragged.pieceIdx].imgCol * trayPieceSize}
                y={trayTabSize - pieces[dragged.pieceIdx].imgRow * trayPieceSize}
                width={cols * trayPieceSize}
                height={rows * trayPieceSize}
                clipPath={`url(#clip_tray_drag_${dragged.pieceIdx})`}
                style={{ pointerEvents: 'none' }}
              />
              <path
                d={getPiecePath(trayTabSize, trayTabSize, trayPieceSize, pieces[dragged.pieceIdx].tabs)}
                fill="none"
                stroke="#333"
                strokeWidth={2}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default JigsawPuzzle;