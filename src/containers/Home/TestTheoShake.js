import React, { useRef } from "react";
import ShakeableMascot from "../../components/AppContent/ShakeableMascot";

const mascotImg = "/images/compressed/theomascot-compressed.png";

export default function TestTheoShake() {
  const mascotRef = useRef();

  const handleShake = () => {
    if (mascotRef.current) {
      mascotRef.current.shake();
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <ShakeableMascot ref={mascotRef} src={mascotImg} width={220} alt="Theo the fox mascot" />
      <button
        onClick={handleShake}
        style={{ marginTop: 24, padding: "10px 24px", fontSize: 18, borderRadius: 8, cursor: "pointer" }}
      >
        Shake Theo's Head
      </button>
    </div>
  );
} 