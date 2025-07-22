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
    "/images/theomascot.png",
    "/images/tessmascot.png",
    "/images/player.png",
    "/images/t2icon.png",
    "/images/woogles-icon.png",
    "/images/compressed-clean-protiles/A.png",
    "/images/compressed-clean-protiles/B.png",
    "/images/compressed-clean-protiles/C.png"
  ];
  const [image, setImage] = useState(images[0]);
  const [pieces, setPieces] = useState([]); // {row, col, tabs, id}
  // Tray is now derived: all piece indices not present on the board
  const [board, setBoard] = useState(Array(rows * cols).fill(null)); // board[i] = pieceIdx or null
  const [dragged, setDragged] = useState(null); // {pieceIdx, from: 'tray'|'board', boardIdx?}
  const draggedRef = useRef(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // {clientX, clientY}
  const [isComplete, setIsComplete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const boardRef = useRef();
  const trayRef = useRef();

  // Initialize puzzle
  const initializePuzzle = (newRows, newCols, newImage) => {
    const tabs = generateTabs(newRows, newCols);
    const newPieces = [];
    for (let row = 0; row < newRows; row++) {
      for (let col = 0; col < newCols; col++) {
        newPieces.push({
          row,
          col,
          tabs: tabs[row][col],
          id: row * newCols + col,
          imgRow: row,
          imgCol: col,
        });
      }
    }
    setPieces(newPieces);
    setBoard(Array(newRows * newCols).fill(null));
    setIsComplete(false);
    setDragged(null);
    setShowPreview(false);
    if (newImage) setImage(newImage);
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
        let snapRow = Math.floor(relY / pieceSize);
        let snapCol = Math.floor(relX / pieceSize);
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
  }, [dragged, pieceSize, rows, cols, board, mousePos]);

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
    // Shuffle unplaced pieces
    const trayPieces = pieces.map((_, idx) => idx).filter(idx => !board.includes(idx));
    const shuffled = shuffleArray(trayPieces);
    // Place shuffled tray pieces at the end of the board (if any nulls)
    setBoard(prev => {
      const newBoard = prev.slice();
      let trayIdx = 0;
      for (let i = 0; i < newBoard.length; i++) {
        if (newBoard[i] === null && trayIdx < shuffled.length) {
          newBoard[i] = null; // keep as null
          trayIdx++;
        }
      }
      return newBoard;
    });
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
    <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", minHeight: "80vh", background: "linear-gradient(135deg, #f8fafc 60%, #e0e7ef 100%)", padding: 32 }}>
      {/* Control Box / Tray */}
      <div style={{ width: pieceSize * 3 + 32, marginRight: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontWeight: 600, marginRight: 12 }}>Grid Size:</label>
            {[3, 4, 5, 7].map(size => (
              <button
                key={size}
                onClick={() => { setRows(size); setCols(size); }}
                style={{
                  marginRight: 8,
                  padding: '8px 18px',
                  fontSize: 16,
                  borderRadius: 6,
                  background: rows === size ? '#4ECDC4' : '#eee',
                  color: rows === size ? '#fff' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 1px 4px #0001',
                }}
              >
                {size} x {size}
              </button>
            ))}
          </div>
          <div>
            <label style={{ fontWeight: 600, marginRight: 12 }}>Image:</label>
            <select
              value={image}
              onChange={e => setImage(e.target.value)}
              style={{ fontSize: 16, padding: '6px 12px', borderRadius: 6 }}
            >
              {images.map(img => (
                <option key={img} value={img}>
                  {img.split('/').pop()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div ref={trayRef} style={{ minHeight: pieceSize + 20, minWidth: pieceSize * 3, background: '#f0f4f8', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 10, display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, position: 'relative' }}>
          {pieces.map((_, pieceIdx) => pieceIdx).filter(pieceIdx => !board.includes(pieceIdx)).map((pieceIdx, i) => {
            const piece = pieces[pieceIdx];
            if (!piece) return null;
            // If dragging this piece from tray, render as floating
            if (dragged && dragged.pieceIdx === pieceIdx && dragged.from === 'tray') return null;
            return (
              <div
                key={`tray-${piece.id}`}
                style={{ width: pieceSize, height: pieceSize, cursor: isComplete ? 'default' : 'grab', position: 'relative' }}
                onMouseDown={e => handleTrayMouseDown(pieceIdx, e)}
              >
                <svg
                  width={pieceSize + 2 * tabSize}
                  height={pieceSize + 2 * tabSize}
                  viewBox={`0 0 ${pieceSize + 2 * tabSize} ${pieceSize + 2 * tabSize}`}
                  style={{ display: 'block', position: 'absolute', left: -tabSize, top: -tabSize }}
                >
                  <defs>
                    <clipPath id={`clip_tray_${piece.id}`}>
                      <path d={getPiecePath(tabSize, tabSize, pieceSize, piece.tabs)} />
                    </clipPath>
                  </defs>
                  <image
                    href={image}
                    x={tabSize - piece.imgCol * pieceSize}
                    y={tabSize - piece.imgRow * pieceSize}
                    width={cols * pieceSize}
                    height={rows * pieceSize}
                    clipPath={`url(#clip_tray_${piece.id})`}
                    style={{ pointerEvents: 'none' }}
                  />
                  <path
                    d={getPiecePath(tabSize, tabSize, pieceSize, piece.tabs)}
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
                left: mousePos.x - dragOffset.x - tabSize,
                top: mousePos.y - dragOffset.y - tabSize,
                width: pieceSize + 2 * tabSize,
                height: pieceSize + 2 * tabSize,
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              <svg
                width={pieceSize + 2 * tabSize}
                height={pieceSize + 2 * tabSize}
                viewBox={`0 0 ${pieceSize + 2 * tabSize} ${pieceSize + 2 * tabSize}`}
                style={{ display: 'block' }}
              >
                <defs>
                  <clipPath id={`clip_tray_drag_${dragged.pieceIdx}`}>
                    <path d={getPiecePath(tabSize, tabSize, pieceSize, pieces[dragged.pieceIdx].tabs)} />
                  </clipPath>
                </defs>
                <image
                  href={image}
                  x={tabSize - pieces[dragged.pieceIdx].imgCol * pieceSize}
                  y={tabSize - pieces[dragged.pieceIdx].imgRow * pieceSize}
                  width={cols * pieceSize}
                  height={rows * pieceSize}
                  clipPath={`url(#clip_tray_drag_${dragged.pieceIdx})`}
                  style={{ pointerEvents: 'none' }}
                />
                <path
                  d={getPiecePath(tabSize, tabSize, pieceSize, pieces[dragged.pieceIdx].tabs)}
                  fill="none"
                  stroke="#333"
                  strokeWidth={2}
                />
              </svg>
            </div>
          )}
        </div>
        <button onClick={shuffleTray} style={{ marginBottom: 12, padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#4ECDC4', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #0002' }}>
          Shuffle
        </button>
        <button onClick={resetPuzzle} style={{ marginBottom: 12, padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#3D5A80', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #0002' }}>
          Reset
        </button>
        <button onClick={() => setShowPreview(p => !p)} style={{ marginBottom: 12, padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#ffe066', color: '#333', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #0002' }}>
          {showPreview ? 'Hide' : 'Show'} Preview
        </button>
        {isComplete && (
          <div style={{ marginTop: 24, fontSize: 20, fontWeight: 700, color: '#4ECDC4' }}>
            🎉 Puzzle Complete!
          </div>
        )}
      </div>
      {/* Puzzle Board */}
      <div
        ref={boardRef}
        style={{
          position: "relative",
          width: cols * pieceSize,
          height: rows * pieceSize,
          background: "#eee",
          borderRadius: 16,
          boxShadow: '0 2px 12px #0001',
          border: '2px solid #e0e7ef',
          userSelect: 'none',
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
              width: cols * pieceSize,
              height: rows * pieceSize,
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
          const left = gridCol * pieceSize - tabSize;
          const top = gridRow * pieceSize - tabSize;
          if (pieceIdx === null) {
            return (
              <div
                key={`board-empty-${i}`}
                style={{
                  position: 'absolute',
                  left: gridCol * pieceSize,
                  top: gridRow * pieceSize,
                  width: pieceSize,
                  height: pieceSize,
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
                width: pieceSize + 2 * tabSize,
                height: pieceSize + 2 * tabSize,
                zIndex: 2,
                cursor: isComplete ? 'default' : 'grab',
              }}
              onMouseDown={e => handleBoardMouseDown(i, pieceIdx, e)}
            >
              <svg
                width={pieceSize + 2 * tabSize}
                height={pieceSize + 2 * tabSize}
                viewBox={`0 0 ${pieceSize + 2 * tabSize} ${pieceSize + 2 * tabSize}`}
                style={{ display: 'block' }}
              >
                <defs>
                  <clipPath id={`clip_board_${piece.id}`}>
                    <path d={getPiecePath(tabSize, tabSize, pieceSize, piece.tabs)} />
                  </clipPath>
                </defs>
                <image
                  href={image}
                  x={tabSize - piece.imgCol * pieceSize}
                  y={tabSize - piece.imgRow * pieceSize}
                  width={cols * pieceSize}
                  height={rows * pieceSize}
                  clipPath={`url(#clip_board_${piece.id})`}
                  style={{ pointerEvents: 'none' }}
                />
                <path
                  d={getPiecePath(tabSize, tabSize, pieceSize, piece.tabs)}
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
              left: mousePos.x - dragOffset.x - tabSize,
              top: mousePos.y - dragOffset.y - tabSize,
              width: pieceSize + 2 * tabSize,
              height: pieceSize + 2 * tabSize,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <svg
              width={pieceSize + 2 * tabSize}
              height={pieceSize + 2 * tabSize}
              viewBox={`0 0 ${pieceSize + 2 * tabSize} ${pieceSize + 2 * tabSize}`}
              style={{ display: 'block' }}
            >
              <defs>
                <clipPath id={`clip_board_drag_${dragged.pieceIdx}`}>
                  <path d={getPiecePath(tabSize, tabSize, pieceSize, pieces[dragged.pieceIdx].tabs)} />
                </clipPath>
              </defs>
              <image
                href={image}
                x={tabSize - pieces[dragged.pieceIdx].imgCol * pieceSize}
                y={tabSize - pieces[dragged.pieceIdx].imgRow * pieceSize}
                width={cols * pieceSize}
                height={rows * pieceSize}
                clipPath={`url(#clip_board_drag_${dragged.pieceIdx})`}
                style={{ pointerEvents: 'none' }}
              />
              <path
                d={getPiecePath(tabSize, tabSize, pieceSize, pieces[dragged.pieceIdx].tabs)}
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
              left: mousePos.x - dragOffset.x - tabSize,
              top: mousePos.y - dragOffset.y - tabSize,
              width: pieceSize + 2 * tabSize,
              height: pieceSize + 2 * tabSize,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <svg
              width={pieceSize + 2 * tabSize}
              height={pieceSize + 2 * tabSize}
              viewBox={`0 0 ${pieceSize + 2 * tabSize} ${pieceSize + 2 * tabSize}`}
              style={{ display: 'block' }}
            >
              <defs>
                <clipPath id={`clip_tray_drag_${dragged.pieceIdx}`}>
                  <path d={getPiecePath(tabSize, tabSize, pieceSize, pieces[dragged.pieceIdx].tabs)} />
                </clipPath>
              </defs>
              <image
                href={image}
                x={tabSize - pieces[dragged.pieceIdx].imgCol * pieceSize}
                y={tabSize - pieces[dragged.pieceIdx].imgRow * pieceSize}
                width={cols * pieceSize}
                height={rows * pieceSize}
                clipPath={`url(#clip_tray_drag_${dragged.pieceIdx})`}
                style={{ pointerEvents: 'none' }}
              />
              <path
                d={getPiecePath(tabSize, tabSize, pieceSize, pieces[dragged.pieceIdx].tabs)}
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