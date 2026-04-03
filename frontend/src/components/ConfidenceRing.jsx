import { useEffect, useState } from "react";

const COLORS = { FAKE: "var(--crimson)", REAL: "var(--teal)", UNCERTAIN: "var(--amber)" };

export default function ConfidenceRing({ conf, verdict }) {
  const [animated, setAnimated] = useState(0);
  const R = 38, C = 2 * Math.PI * R;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(conf), 100);
    return () => clearTimeout(t);
  }, [conf]);

  const offset = C - (animated / 100) * C;
  const color = COLORS[verdict] || "var(--indigo)";

  return (
    <div className="conf-ring-wrap">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={R} fill="none" stroke="var(--border)" strokeWidth="7"/>
        <circle
          cx="45" cy="45" r={R}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="45" y="41" textAnchor="middle" fontSize="16" fontWeight="700" fill={color} fontFamily="Syne, sans-serif">{conf}%</text>
        <text x="45" y="54" textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontFamily="DM Sans, sans-serif">confidence</text>
      </svg>
    </div>
  );
}
