import React, { useState, useEffect, useRef } from "react";
import styles from "./AnimatedMascot.module.css";

const theoImages = [
  "/images/theomascot.png",
  "/images/theomascot2.png",
  "/images/theomascot3.png",
  "/images/theomascot4.png"
];
const tessImages = [
  "/images/tessmascot.png",
  "/images/tessmascot2.png",
  "/images/tessmascot3.png"
];

export default function AnimatedMascot({ about = 'theo' }) {
  const mascotImages = about === 'tess' ? tessImages : theoImages;
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(0);
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

  // Switch between stencil and color mode every 6 seconds
  useEffect(() => {
    modeTimeoutRef.current = setInterval(() => {
      setStencilMode((prev) => !prev);
    }, 6000);
    return () => clearInterval(modeTimeoutRef.current);
  }, []);

  // Choose class for stencil or color
  const mascotClass = `${styles.mascot} ${stencilMode ? styles.stencilEffect : ''}`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", aspectRatio: "1 / 1" }}>
      <img
        src={mascotImages[prev]}
        alt="Theo the mascot previous pose"
        className={mascotClass}
        style={{
          opacity: crossfade ? 0 : 1,
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
          opacity: crossfade ? 1 : 0,
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