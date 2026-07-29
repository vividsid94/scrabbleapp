import React, { useState, useEffect, useRef } from "react";
import styles from "./AnimatedMascot.module.css";

const theoImages = [
  "/images/compressed/theomascot-compressed.png",
  "/images/compressed/theomascot2-compressed.png",
  "/images/compressed/theomascot3-compressed.png",
  "/images/compressed/theomascot4-compressed.png"
];
const tessImages = [
  "/images/compressed/tessmascot-compressed.png",
  "/images/compressed/tessmascot2-compressed.png",
  "/images/compressed/tessmascot3-compressed.png"
];
const topeImages = [
  "/images/compressed/topemascot-compressed.png"
];

export default function AnimatedMascot({ about = 'theo', enableStencilMode = true, onPoseIndexChange, initialPoseIndex = 0 }) {
  const mascotImages = about === 'tess' ? tessImages : about === 'tope' ? topeImages : theoImages;
  const [current, setCurrent] = useState(initialPoseIndex);
  const [prev, setPrev] = useState(initialPoseIndex);
  const [crossfade, setCrossfade] = useState(false);
  const [stencilMode, setStencilMode] = useState(false);
  const poseTimeoutRef = useRef();
  const modeTimeoutRef = useRef();

  // Crossfade between mascot poses
  useEffect(() => {
    poseTimeoutRef.current = setInterval(() => {
      setPrev(current);
      setCrossfade(true);
      setTimeout(() => {
        setCurrent((prevIdx) => (prevIdx + 1) % mascotImages.length);
        setCrossfade(false);
      }, 700); // match fade duration
    }, 2500);
    return () => clearInterval(poseTimeoutRef.current);
  }, [current]);

  // Report the active pose index back to the parent - lets a caller react to
  // which specific pose is showing (e.g. only pairing page-specific decor
  // with one particular pose) without this component needing to know
  // anything about that decor itself.
  useEffect(() => {
    onPoseIndexChange?.(current);
  }, [current, onPoseIndexChange]);

  // Switch between stencil and color mode every 6 seconds - opt-out for
  // callers (like the homepage hero) that want Theo to always stay
  // full-color rather than periodically flash grayscale.
  useEffect(() => {
    if (!enableStencilMode) return;
    modeTimeoutRef.current = setInterval(() => {
      setStencilMode((prev) => !prev);
    }, 6000);
    return () => clearInterval(modeTimeoutRef.current);
  }, [enableStencilMode]);

  // Choose class for stencil or color
  const mascotClass = `${styles.mascot} ${stencilMode ? styles.stencilEffect : ''}`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", aspectRatio: "1 / 1" }}>
      <img
        src={mascotImages[prev]}
        alt="Theo the mascot previous pose"
        className={mascotClass}
        style={{
          // crossfade=true is the ~700ms transition window: prev fades OUT
          // (visible -> hidden) while current fades IN below. At rest
          // (crossfade=false) prev must stay hidden - current is the one
          // actually showing. These two opacity values were swapped, which
          // made the display settle on showing prev (the pose *before* the
          // one current had already advanced to) for the entire ~1.8s
          // between transitions, one full pose behind what current/
          // onPoseIndexChange reported.
          opacity: crossfade ? 1 : 0,
          zIndex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transition: "opacity 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55)"
        }}
        draggable={false}
      />
      <img
        src={mascotImages[current]}
        alt="Theo the mascot current pose"
        className={mascotClass}
        style={{
          opacity: crossfade ? 0 : 1,
          zIndex: 2,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transition: "opacity 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55)"
        }}
        draggable={false}
      />
    </div>
  );
} 