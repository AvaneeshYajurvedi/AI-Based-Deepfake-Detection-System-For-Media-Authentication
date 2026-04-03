import { motion } from "framer-motion";

export default function ConfidenceDial({ value = 0, verdict = "UNCERTAIN" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const color = verdict === "REAL" ? "#12b981" : verdict === "FAKE" ? "#ef4444" : "#f59e0b";
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg viewBox="0 0 112 112" className="h-28 w-28 -rotate-90">
        <circle cx="56" cy="56" r={radius} stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" fill="transparent" />
        <motion.circle
          cx="56"
          cy="56"
          r={radius}
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{pct}%</div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Confidence</div>
      </div>
    </div>
  );
}
