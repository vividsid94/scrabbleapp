import React, { forwardRef, useImperativeHandle, useRef } from "react";

const pendulumFlipKeyframes = `
@keyframes pendulumFlip {
  0%   { transform: translateX(0px) scaleX(1); }
  20%  { transform: translateX(-22px) scaleX(-1); }
  40%  { transform: translateX(18px) scaleX(1); }
  60%  { transform: translateX(-10px) scaleX(-1); }
  80%  { transform: translateX(8px) scaleX(1); }
  100% { transform: translateX(0px) scaleX(1); }
}
`;

const ShakeableMascot = forwardRef(({ src, width = 220, alt = "Theo the fox mascot" }, ref) => {
  const imgRef = useRef();

  useImperativeHandle(ref, () => ({
    shake: () => {
      if (imgRef.current) {
        // 1.2s duration, fewer swings
        imgRef.current.style.animation = "pendulumFlip 1.2s ease-in-out";
        imgRef.current.addEventListener(
          "animationend",
          () => {
            imgRef.current.style.animation = "";
          },
          { once: true }
        );
      }
    }
  }));

  return (
    <>
      <style>{pendulumFlipKeyframes}</style>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={{
          width,
          height: "auto",
          display: "block",
          margin: "0 auto",
          transformOrigin: "center top",
        }}
      />
    </>
  );
});

export default ShakeableMascot;
