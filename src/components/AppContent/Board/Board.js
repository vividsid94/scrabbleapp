import React, { useState, useEffect, useRef, useContext } from "react";
import styles from './Board.module.css';
import { Box, Tooltip } from '@mui/material';
import { letterLookup } from '../References/staticData';
import { Modal } from '@mui/material';
import { ThemeContext } from '../../../App';
import { useColorSchemeStore } from '../../../stores/colorSchemeStore';
import { ArrowsOut, Hand, ChatCircle } from '@phosphor-icons/react';
import { getOwnershipColor, getHeatColor } from '../../../functions/analysisBoardFunctions';

export default function Board({
    boardMode = "STANDARD",
    move = "N/A",
    points = "",
    rack = "",
    dictionary = "",
    board = [],
    moveDirection,
    onBoardChildClick,
    selectedPosition,
    arrowDirection,
    animate = true,
    showSlip = true,
    showDictionary = true,
    previewScore,
    previewScorePosition,
    lastMoveCoordinates = [],
    commentary = null,
    showNoCommentaryLabel = true,
    enableTelestrator = false,
    analysisGhostGrid = null,
    analysisGhostDashedBorder = true,
    analysisHeatGrid = null,
    analysisHeatMaxCount = 1,
    analysisLaneSelection = null,
    analysisLaneSelectable = false,
    onAnalysisLaneDrag
}) {
    const { lightMode } = useContext(ThemeContext);
    const showWoodenCircle = useColorSchemeStore(state => state.showWoodenCircle);
    const showApplePolygon = useColorSchemeStore(state => state.showApplePolygon);
    let boardTheme = "Board__" + boardMode;
    let tableTheme = "Table__" + boardMode;
    

    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState("slip");
    const [commentaryOpen, setCommentaryOpen] = useState(false);
    const [commentaryHovered, setCommentaryHovered] = useState(false);
    const [circledLetters, setCircledLetters] = useState([]);
    const [boardScale, setBoardScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [boardHeight, setBoardHeight] = useState(0);
    const boardRef = useRef(null);
    const telestratorRef = useRef(null);
    // Lane Isolation's click-and-drag line selection - refs, not state, since
    // nothing here needs to re-render the component itself; the actual
    // selection only changes (and re-renders) via onAnalysisLaneDrag's
    // parent-side state update.
    const laneDragAnchorRef = useRef(null);
    const laneDragActiveRef = useRef(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [telestratorStrokes, setTelestratorStrokes] = useState([]);
    const handleClose = () => setOpen(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 992);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (boardRef.current) {
            const updateHeight = () => {
                if (boardRef.current) {
                    const rect = boardRef.current.getBoundingClientRect();
                    setBoardHeight(rect.height);
                }
            };
            updateHeight();
            const resizeObserver = new ResizeObserver(updateHeight);
            resizeObserver.observe(boardRef.current);
            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [boardScale]);

    useEffect(() => {
        // Reset hover state when commentary changes (move changes)
        setCommentaryHovered(false);
        setCommentaryOpen(false);
    }, [commentary]);
    
    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (boardRef.current) {
            const rect = boardRef.current.getBoundingClientRect();
            
            // Distance to bottom-right corner
            const initialDistance = Math.sqrt(
                Math.pow(e.clientX - rect.right, 2) + 
                Math.pow(e.clientY - rect.bottom, 2)
            );
            
            setDragStart({
                mouseX: e.clientX,
                mouseY: e.clientY,
                scale: boardScale,
                initialDistance: Math.max(initialDistance, 50) // Prevent division by zero
            });
            setIsDragging(true);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !boardRef.current) return;
            
            const rect = boardRef.current.getBoundingClientRect();
            
            // Calculate distance from mouse to bottom-right corner
            const bottomRightX = rect.right;
            const bottomRightY = rect.bottom;
            const currentDistance = Math.sqrt(
                Math.pow(e.clientX - bottomRightX, 2) + 
                Math.pow(e.clientY - bottomRightY, 2)
            );
            
            // Scale based on ratio of current distance to initial distance
            // This prevents feedback loops by using stored initial values
            const distanceRatio = currentDistance / dragStart.initialDistance;
            const newScale = Math.max(1, Math.min(1.5, dragStart.scale * distanceRatio));
            
            setBoardScale(newScale);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    // Lane Isolation drag-select: mousedown/touchstart on a cell (per-cell
    // handlers below) sets the anchor; this effect tracks movement globally
    // so the gesture still resolves correctly even if the pointer leaves the
    // exact cell it started on. touchmove fires on the original touch target
    // rather than whatever's currently under the finger, so it needs
    // elementFromPoint to find the actual cell - mousemove doesn't need this
    // since onMouseEnter on each cell already does the job.
    useEffect(() => {
        if (!analysisLaneSelectable) return undefined;

        const finishGesture = () => {
            if (laneDragAnchorRef.current && !laneDragActiveRef.current) {
                onBoardChildClick && onBoardChildClick(laneDragAnchorRef.current.row, laneDragAnchorRef.current.col);
            }
            laneDragAnchorRef.current = null;
            laneDragActiveRef.current = false;
        };

        const handleWindowTouchMove = (e) => {
            if (!laneDragAnchorRef.current) return;
            const touch = e.touches[0];
            if (!touch) return;
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            const cellEl = el && el.closest ? el.closest('[data-lane-row]') : null;
            if (!cellEl) return;
            const row = Number(cellEl.dataset.laneRow);
            const col = Number(cellEl.dataset.laneCol);
            if (row !== laneDragAnchorRef.current.row || col !== laneDragAnchorRef.current.col) {
                laneDragActiveRef.current = true;
                onAnalysisLaneDrag && onAnalysisLaneDrag(laneDragAnchorRef.current.row, laneDragAnchorRef.current.col, row, col);
                e.preventDefault();
            }
        };

        window.addEventListener('mouseup', finishGesture);
        window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
        window.addEventListener('touchend', finishGesture);

        return () => {
            window.removeEventListener('mouseup', finishGesture);
            window.removeEventListener('touchmove', handleWindowTouchMove);
            window.removeEventListener('touchend', finishGesture);
        };
    }, [analysisLaneSelectable, onBoardChildClick, onAnalysisLaneDrag]);

    const handlePanMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        setPanStart({
            x: e.clientX - panPosition.x,
            y: e.clientY - panPosition.y
        });
    };

    useEffect(() => {
        const handlePanMouseMove = (e) => {
            if (!isPanning) return;
            
            const newX = e.clientX - panStart.x;
            const newY = e.clientY - panStart.y;
            
            // Prevent panning further right than the original position (right wall at x = 0)
            const constrainedX = Math.min(newX, 0);
            
            setPanPosition({ x: constrainedX, y: newY });
        };

        const handlePanMouseUp = () => {
            setIsPanning(false);
        };

        if (isPanning) {
            document.addEventListener('mousemove', handlePanMouseMove);
            document.addEventListener('mouseup', handlePanMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handlePanMouseMove);
            document.removeEventListener('mouseup', handlePanMouseUp);
        };
    }, [isPanning, panStart]);

    useEffect(() => {
        const lowercaseLetters = move.match(/(?<![a-z(])[a-z](?![a-z)])/g);
        if (moveDirection === 'neutral') {
            setCircledLetters([]);
        }
        if (lowercaseLetters) {
            if (moveDirection === 'forward') {
                setCircledLetters(prevLetters => [...prevLetters, ...lowercaseLetters]);
            } else if (moveDirection === 'backward') {
                setCircledLetters(prevLetters => prevLetters.filter(letter => !lowercaseLetters.includes(letter)));
            } 
        }
    }, [move]);

    const handleSlipClick = (event) => {
        event.stopPropagation();
        setOpen(true);
    };
    
    let overallIndex = 0; // Initialize overall index outside the function

    const generateLetterBoxes = (startCharCode, endCharCode) => {
        return (
            <Box className={styles.row}>
                {Array.from({ length: endCharCode - startCharCode + 1 }, (_, index) => {
                    overallIndex++; // Increment overall index for each letter
                    return (
                        <Box
                            className={`${styles.letterBox} ${shouldApplyCircle(overallIndex) ? styles.circle : ''}`}
                            key={String.fromCharCode(startCharCode + index)}
                            id={`letter-${String.fromCharCode(startCharCode + index)}`} // Assign unique IDs to each letter box
                        >
                            {String.fromCharCode(startCharCode + index)}
                        </Box>
                    );
                })}
            </Box>
        );
    };
    
    const shouldApplyCircle = (index) => {
        if (circledLetters.length === 0) {
            return false; // No letters to circle
        }
        const letterIndices = circledLetters.map((letter, idx) => {
            if (idx === 1) { // Apply the offset only for the second letter
                return letter.charCodeAt(0) - 96 + 26;
            }
            return letter.charCodeAt(0) - 96;
        });
        return letterIndices.includes(index);
    };
    
    const SlipContent = () => (
        <Box>
            {generateLetterBoxes(65, 77)}
            {generateLetterBoxes(78, 90)}
            <Box className={styles.spacing}></Box> {/* Add spacing between sections */}
            {generateLetterBoxes(65, 77)}
            {generateLetterBoxes(78, 90)}
        </Box>
    );
    
    const getHeaderStyle = () => ({
        backgroundColor: lightMode === 'dark' ? 'rgb(12, 12, 59)' : '#b8b6a9',
        color: lightMode === 'dark' ? '#fff' : '#1F2937'
    });

    const getFooterStyle = () => ({
        backgroundColor: lightMode === 'dark' ? 'rgb(108, 4, 4)' : '#c8a882',
        color: lightMode === 'dark' ? '#fff' : '#1F2937'
    });



    const getBoardContainerStyle = () => ({
        backgroundColor: 'transparent',
        borderRadius: lightMode === 'light' ? '12px' : '0',
        boxShadow: lightMode === 'light' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
        border: lightMode === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'
    });

    const handleTelestratorMouseDown = (e) => {
        if (!enableTelestrator || !telestratorRef.current) return;
        e.preventDefault();
        const rect = telestratorRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 1000;
        const y = ((e.clientY - rect.top) / rect.height) * 1000;
        setIsDrawing(true);
        setTelestratorStrokes(prev => [
            ...prev,
            { id: Date.now(), points: [{ x, y }] }
        ]);
    };

    const handleTelestratorMouseMove = (e) => {
        if (!enableTelestrator || !isDrawing || !telestratorRef.current) return;
        e.preventDefault();
        const rect = telestratorRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 1000;
        const y = ((e.clientY - rect.top) / rect.height) * 1000;
        setTelestratorStrokes(prev => {
            if (!prev.length) return prev;
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
                ...last,
                points: [...last.points, { x, y }]
            };
            return updated;
        });
    };

    const handleTelestratorEnd = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
    };

    const handleClearTelestrator = () => {
        setTelestratorStrokes([]);
    };

    return (
        <Box className={styles.boardWrapper}>
            <Box
                ref={boardRef}
                className={`${styles.BoardContainer} ${styles[boardTheme]}`}
                style={{
                    ...getBoardContainerStyle(),
                    transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${boardScale})`,
                    transformOrigin: '100% 100%',
                    transition: (isDragging || isPanning) ? 'none' : 'transform 0.1s ease-out'
                }}
            >
            {!isMobile && (
                <Box className={styles.controlButtons}>
                    <Tooltip title="Drag to resize board" placement="right">
                        <Box
                            className={styles.resizeHandle}
                            onMouseDown={handleMouseDown}
                            style={{
                                backgroundColor: lightMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                                cursor: isDragging ? 'grabbing' : 'grab',
                                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                                transform: `scale(${boardScale})`,
                                transformOrigin: 'left center'
                            }}
                        >
                            <ArrowsOut size={16} weight="bold" />
                        </Box>
                    </Tooltip>
                    <Tooltip title="Click and drag to pan board" placement="right">
                        <Box
                            className={styles.panButton}
                            onMouseDown={handlePanMouseDown}
                            style={{
                                backgroundColor: isPanning 
                                    ? (lightMode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)')
                                    : (lightMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'),
                                cursor: isPanning ? 'grabbing' : 'grab',
                                color: lightMode === 'dark' ? '#fff' : '#1F2937',
                                transform: `scale(${boardScale})`,
                                transformOrigin: 'left center'
                            }}
                        >
                            <Hand size={16} weight="bold" />
                        </Box>
                    </Tooltip>
                    {enableTelestrator && (
                        <Tooltip title="Clear telestrator drawings" placement="right">
                            <Box
                                className={styles.telestratorClearButton}
                                onClick={handleClearTelestrator}
                                style={{
                                    backgroundColor: lightMode === 'dark' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(220, 38, 38, 0.9)',
                                    color: '#fff',
                                    transform: `scale(${boardScale})`,
                                    transformOrigin: 'left center'
                                }}
                            >
                                Clear
                            </Box>
                        </Tooltip>
                    )}
                </Box>
            )}

            <Box className={`${styles.Header} ${!showDictionary ? styles.hidden : ''}`} style={getHeaderStyle()}>
                <Box className={styles.headerContent}>
                    {dictionary}
                </Box>
                {boardMode === "STANDARD" && showSlip && (
                    <Box 
                        className={`${styles.coloredBox} ${styles.slipBox} ${styles[`slipBox__${boardMode}`]}`} 
                        onClick={handleSlipClick}
                    >
                        Slip
                    </Box>
                )}
            </Box>
            {/* EPIC WOODEN CIRCULAR BOARD AREA */}
            {showWoodenCircle.current && (
                <div style={{
                    position: 'absolute',
                    top: '-100px',
                    left: '-100px',
                    right: '-100px',
                    bottom: '-100px',
                    borderRadius: '50%',
                    background: `
                        radial-gradient(circle at 40% 35%, 
                            #2D1810 0%, 
                            #4A2C1A 15%, 
                            #6B4423 30%, 
                            #8B5A2B 45%, 
                            #A67C52 60%, 
                            #C19A6B 75%, 
                            #D4B483 90%, 
                            #E6C99C 100%
                        ),
                        radial-gradient(ellipse at 50% 0%, 
                            rgba(255, 255, 255, 0.3) 0%, 
                            rgba(255, 255, 255, 0.1) 30%, 
                            transparent 60%
                        ),
                        radial-gradient(ellipse at 50% 100%, 
                            rgba(0, 0, 0, 0.4) 0%, 
                            rgba(0, 0, 0, 0.2) 30%, 
                            transparent 60%
                        )
                    `,
                    boxShadow: `
                        0 0 60px rgba(45, 24, 16, 0.9),
                        inset 0 0 40px rgba(0, 0, 0, 0.4),
                        0 8px 20px rgba(0, 0, 0, 0.6),
                        0 4px 10px rgba(0, 0, 0, 0.4),
                        inset 0 1px 3px rgba(255, 255, 255, 0.1),
                        inset 0 0 0 2px rgba(0, 0, 0, 0.3)
                    `,
                    border: '2px solid rgba(0, 0, 0, 0.2)',
                    pointerEvents: 'none',
                    zIndex: 1,
                    transform: 'rotate(15deg)'
                }}>
                    {/* Rotated Wood Texture Layer */}
                    <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        borderRadius: '50%',
                        background: `url("https://www.transparenttextures.com/patterns/purty-wood.png")`,
                        backgroundSize: 'auto',
                        backgroundRepeat: 'repeat',
                        transform: 'rotate(75deg)',
                        opacity: 0.8,
                        mixBlendMode: 'multiply'
                    }} />
                </div>
            )}
            
            {/* EPIC APPLE CIRCLE BOARD AREA */}
            {showApplePolygon.current && (
                <div style={{
                    position: 'absolute',
                    top: '-110px',
                    left: '-110px',
                    right: '-110px',
                    bottom: '-110px',
                    borderRadius: '50%',
                    background: `
                        radial-gradient(circle at 40% 35%, 
                            rgba(255, 107, 107, 0.1) 0%, 
                            rgba(255, 82, 82, 0.1) 20%, 
                            rgba(229, 62, 62, 0.1) 40%, 
                            rgba(197, 48, 48, 0.1) 60%, 
                            rgba(155, 44, 44, 0.1) 80%, 
                            rgba(116, 42, 42, 0.1) 100%
                        ),
                        radial-gradient(circle at 60% 45%, 
                            rgba(255, 255, 255, 0.1) 0%, 
                            rgba(255, 255, 255, 0.05) 50%, 
                            transparent 100%
                        )
                    `,
                    clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 100%, 20% 100%, 0% 70%, 0% 35%, 20% 10%)',
                    boxShadow: `
                        0 0 60px rgba(197, 48, 48, 0.8),
                        inset 0 0 40px rgba(0, 0, 0, 0.3),
                        0 15px 40px rgba(0, 0, 0, 0.5)
                    `,
                    pointerEvents: 'none',
                    zIndex: 1,
                    transform: 'rotate(15deg)'
                }} />
            )}
            
            
            
            <Box className={styles.innerBox}>
                <Box className={`${styles.Board} ${styles.tableContainer} ${styles[tableTheme]} ${!animate ? styles.noAnimate : ''}`} style={{ position: 'relative', zIndex: 100 }}>
                    <table>
                        <thead>
                            <tr> 
                                <th className={`${styles.sideNumbering} ${styles.NWcell}`}/>
                                {Object.keys(letterLookup).map(letter => (
                                    <th 
                                        className={styles.sideNumbering} 
                                        key={letter}
                                        style={{
                                            color: lightMode === 'dark' ? '#fff' : '#1F2937'
                                        }}
                                    >
                                        {letter.toLowerCase()}
                                    </th>
                                ))}
                                <th className={`${styles.sideNumbering} ${styles.NEcell}`}/>
                            </tr>
                        </thead>
                        <tbody>
                            {board.map((row, rowIndex) =>
                                <tr key={rowIndex}>
                                    <td 
                                        className={styles.sideNumbering}
                                        style={{
                                            color: lightMode === 'dark' ? '#fff' : '#1F2937'
                                        }}
                                    >
                                        {letterLookup[Object.keys(letterLookup)[rowIndex]]}
                                    </td>
                                    {row.map((col, colIndex) => (
                                        <td
                                            key={colIndex}
                                            data-lane-row={analysisLaneSelectable ? rowIndex : undefined}
                                            data-lane-col={analysisLaneSelectable ? colIndex : undefined}
                                            onClick={() => { if (!analysisLaneSelectable) onBoardChildClick && onBoardChildClick(rowIndex, colIndex); }}
                                            onMouseDown={() => {
                                                if (!analysisLaneSelectable) return;
                                                laneDragAnchorRef.current = { row: rowIndex, col: colIndex };
                                                laneDragActiveRef.current = false;
                                            }}
                                            onMouseEnter={() => {
                                                if (!analysisLaneSelectable || !laneDragAnchorRef.current) return;
                                                if (rowIndex !== laneDragAnchorRef.current.row || colIndex !== laneDragAnchorRef.current.col) {
                                                    laneDragActiveRef.current = true;
                                                    onAnalysisLaneDrag && onAnalysisLaneDrag(laneDragAnchorRef.current.row, laneDragAnchorRef.current.col, rowIndex, colIndex);
                                                }
                                            }}
                                            onTouchStart={() => {
                                                if (!analysisLaneSelectable) return;
                                                laneDragAnchorRef.current = { row: rowIndex, col: colIndex };
                                                laneDragActiveRef.current = false;
                                            }}
                                        >
                                            {col}
                                            {analysisHeatGrid && (
                                                <div
                                                    className={styles.analysisHeatTile}
                                                    style={{ backgroundColor: getHeatColor(analysisHeatGrid[rowIndex]?.[colIndex], analysisHeatMaxCount) }}
                                                />
                                            )}
                                            {analysisLaneSelection?.some(c => c.row === rowIndex && c.col === colIndex) && (
                                                <div className={styles.analysisLaneCell} />
                                            )}
                                            {analysisGhostGrid?.[rowIndex]?.[colIndex] && (() => {
                                                const ghost = analysisGhostGrid[rowIndex][colIndex];
                                                const { bg, textColor } = getOwnershipColor(ghost.ownership);
                                                return (
                                                    <div
                                                        className={styles.analysisGhostTile}
                                                        style={{ backgroundColor: bg, color: textColor, border: analysisGhostDashedBorder ? undefined : 'none' }}
                                                    >
                                                        {ghost.letter.toUpperCase()}
                                                    </div>
                                                );
                                            })()}
                                            {selectedPosition && selectedPosition.row === rowIndex && selectedPosition.col === colIndex && (
                                                <div className={previewScore && previewScorePosition?.row === rowIndex && previewScorePosition?.col === colIndex ? 
                                                    styles.arrowIndicatorWithScore : styles.arrowIndicator}>
                                                    {previewScore && previewScorePosition?.row === rowIndex && previewScorePosition?.col === colIndex ? 
                                                        arrowDirection === 'right' ? 
                                                            `${previewScore}→` : 
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                <span>{previewScore}</span>
                                                                <span>↓</span>
                                                            </div>
                                                        : 
                                                        arrowDirection === 'right' ? '→' : '↓'
                                                    }
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {enableTelestrator && (
                        <svg
                            ref={telestratorRef}
                            className={styles.telestratorOverlay}
                            viewBox="0 0 1000 1000"
                            onMouseDown={handleTelestratorMouseDown}
                            onMouseMove={handleTelestratorMouseMove}
                            onMouseUp={handleTelestratorEnd}
                            onMouseLeave={handleTelestratorEnd}
                        >
                            {telestratorStrokes.map(stroke => (
                                <polyline
                                    key={stroke.id}
                                    points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
                                    fill="none"
                                    stroke="rgba(239, 68, 68, 0.95)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ))}
                        </svg>
                    )}
                </Box>
                <Box className={styles.Right}>
                </Box>
            </Box>
            
            

            {(commentary || showNoCommentaryLabel) && (
                <Box 
                    sx={{ 
                        position: 'relative', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        width: '100%'
                    }}
                    onMouseEnter={() => commentary && !isMobile && setCommentaryHovered(true)}
                >
                    <button 
                        className={`${styles.commentaryBubble} ${!commentary ? styles.commentaryBubbleDisabled : ''}`}
                        onClick={() => {
                            if (commentary && isMobile) {
                                setCommentaryOpen(true);
                            }
                        }}
                        disabled={!commentary}
                        aria-label={commentary ? "View commentary" : "No commentary available"}
                    >
                        <ChatCircle size={20} weight={commentary ? "fill" : "regular"} />
                        <span className={styles.commentaryLabel}>
                            {commentary ? "See commentary" : "No commentary on this turn"}
                        </span>
                    </button>
                    {/* Desktop: Inline commentary on hover */}
                    {commentary && !isMobile && commentaryHovered && (
                        <Box className={styles.commentaryInline}>
                            "{commentary}"
                        </Box>
                    )}
                </Box>
            )}
            {/* Mobile: Modal commentary */}
            {commentary && isMobile && (
                <Modal 
                    open={commentaryOpen} 
                    onClose={() => setCommentaryOpen(false)}
                    disableScrollLock={true}
                    slotProps={{
                        root: {
                            style: { position: 'fixed' }
                        }
                    }}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& .MuiBackdrop-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }}
                >
                    <Box 
                        className={styles.commentaryModal}
                        style={{
                            backgroundColor: lightMode === 'dark' 
                                ? 'rgba(55, 65, 81, 0.95)' 
                                : 'rgba(249, 250, 251, 0.95)',
                            color: lightMode === 'dark' ? '#fff' : '#1F2937'
                        }}
                    >
                        <Box className={styles.commentaryBox}>
                            "{commentary}"
                        </Box>
                    </Box>
                </Modal>
            )}

            <Modal open={open} onClose={handleClose}>
                <Box 
                    className={styles.modalContainer}
                    style={{
                        background: lightMode === 'dark' 
                            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))',
                        color: lightMode === 'dark' ? '#000' : '#1F2937'
                    }}
                >
                    {modalContent === "slip" && <SlipContent />}
                </Box>
            </Modal>
        </Box>
        </Box>
    )
}

