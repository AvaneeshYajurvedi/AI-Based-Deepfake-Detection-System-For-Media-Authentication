// ManipulationMeter.jsx
import { useEffect, useState } from "react";

export function ManipulationMeter({ risk }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(risk), 150); return () => clearTimeout(t); }, [risk]);

  const level = risk >= 75 ? "CRITICAL" : risk >= 50 ? "HIGH" : risk >= 25 ? "MODERATE" : "LOW";
  const levelColor = risk >= 75 ? "var(--crimson)" : risk >= 50 ? "var(--amber)" : risk >= 25 ? "var(--amber-light)" : "var(--teal)";

  return (
    <div className="manipulation-section">
      <div className="manip-header">
        <span className="sub-label">Manipulation Risk</span>
        <span className="manip-level" style={{ color: levelColor }}>{level}</span>
      </div>
      <div className="manip-track">
        <div className="manip-fill" style={{ width: animated + "%", background: `linear-gradient(90deg, var(--teal) 0%, var(--amber) 50%, var(--crimson) 100%)`, clipPath: `inset(0 ${100 - animated}% 0 0)`, transition: "clip-path 1s ease" }} />
        <div className="manip-needle" style={{ left: animated + "%", transition: "left 1s ease" }} />
      </div>
      <div className="manip-labels">
        <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
      </div>
      <div className="manip-score">{risk}% manipulation probability</div>
    </div>
  );
}

export default ManipulationMeter;
