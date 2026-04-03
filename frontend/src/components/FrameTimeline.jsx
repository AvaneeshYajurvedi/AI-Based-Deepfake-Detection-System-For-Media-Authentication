export default function FrameTimeline({ frames, anomalies }) {
  if (!frames || frames.length === 0) return null;
  const max = Math.max(...frames);
  const h = 80;

  return (
    <div className="timeline-wrap">
      <svg width="100%" height={h + 24} viewBox={`0 0 ${frames.length * 14} ${h + 24}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(v => (
          <line key={v}
            x1="0" y1={h - v * h}
            x2={frames.length * 14} y2={h - v * h}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"
          />
        ))}
        {/* Area fill */}
        <polyline
          points={frames.map((v, i) => `${i * 14 + 7},${h - (v / max) * h * 0.9}`).join(" ")}
          fill="none"
          stroke="var(--indigo)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Anomaly spikes */}
        {anomalies && anomalies.map(i => (
          <rect key={i}
            x={i * 14} y={0}
            width={14} height={h}
            fill="var(--crimson)"
            opacity="0.12"
          />
        ))}
        {/* Dots */}
        {frames.map((v, i) => {
          const isAnomaly = anomalies && anomalies.includes(i);
          return (
            <circle key={i}
              cx={i * 14 + 7}
              cy={h - (v / max) * h * 0.9}
              r={isAnomaly ? 4 : 2.5}
              fill={isAnomaly ? "var(--crimson)" : "var(--indigo)"}
            />
          );
        })}
        {/* X labels */}
        {frames.map((_, i) => i % 5 === 0 && (
          <text key={i} x={i * 14 + 7} y={h + 16}
            textAnchor="middle" fontSize="8" fill="var(--text-muted)"
            fontFamily="DM Sans, sans-serif"
          >{i}s</text>
        ))}
      </svg>
      <div className="timeline-legend">
        <span className="legend-dot" style={{ background: "var(--indigo)" }} /> Frame confidence
        <span className="legend-dot" style={{ background: "var(--crimson)", marginLeft: 12 }} /> Anomaly frame
      </div>
    </div>
  );
}
