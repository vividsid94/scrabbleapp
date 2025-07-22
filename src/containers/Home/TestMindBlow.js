import React, { useRef, useState } from "react";
import AnimatedMascot from "../../components/AppContent/AnimatedMascot";
import Confetti from "../../components/Confetti/Confetti";

export default function TestMindBlow() {
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [confettiWinner, setConfettiWinner] = useState("player");
  const [mascotType, setMascotType] = useState("theo");
  const [mascotKey, setMascotKey] = useState(0); // To force re-mount for sync

  const triggerConfetti = (winner) => {
    setConfettiWinner(winner);
    setConfettiVisible(true);
    setMascotKey((k) => k + 1); // Sync mascot animation
  };

  return (
    <div style={{ textAlign: "center", marginTop: 40, position: "relative", minHeight: 400 }}>
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>Prepare to be Mind-Blown 🤯</h1>
      <AnimatedMascot key={mascotKey} about={mascotType} />
      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => triggerConfetti("player")}
          style={{ margin: 8, padding: "14px 32px", fontSize: 20, borderRadius: 10, background: "#4ECDC4", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 8px #0002" }}
        >
          Massive Confetti (Player Win)
        </button>
        <button
          onClick={() => triggerConfetti("bot")}
          style={{ margin: 8, padding: "14px 32px", fontSize: 20, borderRadius: 10, background: "#F59E0B", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 8px #0002" }}
        >
          Massive Confetti (Bot Win)
        </button>
        <button
          onClick={() => setMascotType((t) => (t === "theo" ? "tess" : "theo"))}
          style={{ margin: 8, padding: "14px 32px", fontSize: 20, borderRadius: 10, background: "#7C3AED", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 8px #0002" }}
        >
          Switch Mascot ({mascotType === "theo" ? "Tess" : "Theo"})
        </button>
      </div>
      <Confetti
        winner={confettiWinner}
        isVisible={confettiVisible}
        onComplete={() => setConfettiVisible(false)}
      />
      <div style={{ marginTop: 40, fontSize: 18, color: "#888" }}>
        Try switching mascots and triggering confetti for both player and bot!<br />
        The mascot will animate in sync with the confetti explosion.
      </div>
    </div>
  );
} 