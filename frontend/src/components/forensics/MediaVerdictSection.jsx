import { AlertTriangle, BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import ConfidenceDial from "./ConfidenceDial";

function getDetectionType(mediaType, score) {
  if (mediaType === "audio") return "Voice Clone";
  if (mediaType === "video") return score >= 0.7 ? "Face Swap" : "GAN Composite";
  return score >= 0.65 ? "GAN Artifact" : "Face Edit";
}

function getRiskLevel(score) {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

export default function MediaVerdictSection({ file, mediaType, normalized }) {
  const verdict = normalized?.label || "UNCERTAIN";
  const confidencePct = Math.round((normalized?.confidence || 0) * 100);
  const riskScore = normalized?.manipulation_risk_score ?? normalized?.confidence ?? 0;
  const riskLevel = getRiskLevel(riskScore);
  const detectionType = getDetectionType(mediaType, riskScore);
  const isReal = verdict === "REAL";
  const isFake = verdict === "FAKE";

  return (
    <section className={`rounded-2xl border bg-slate-950/20 p-3 md:p-4 ${
      isReal
        ? "border-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,0.55),0_0_30px_rgba(16,185,129,0.5),inset_0_0_18px_rgba(16,185,129,0.16)]"
        : isFake
          ? "border-red-400 shadow-[0_0_0_1px_rgba(248,113,113,0.55),0_0_30px_rgba(239,68,68,0.5),inset_0_0_18px_rgba(239,68,68,0.14)]"
          : "border-amber-400/50 shadow-[0_0_24px_rgba(245,158,11,0.2)]"
    }`}>
      <div className="grid gap-4 lg:grid-cols-1">
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Verdict</h3>
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                isReal
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : isFake
                    ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
              }`}
            >
              {isReal ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {verdict}
            </motion.span>
          </div>

          <div className="mt-2 flex items-center justify-center">
            <ConfidenceDial value={confidencePct} verdict={verdict} />
          </div>

          <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-600">
              <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-300">Media Type</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{mediaType?.toUpperCase() || "UNKNOWN"}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-600">
              <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-300">Risk Level</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{riskLevel}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-600">
              <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-300">Detection Type</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{detectionType}</div>
            </div>
          </div>

          <details className="mt-3 rounded-lg border border-slate-200 p-2 dark:border-slate-600">
            <summary className="cursor-pointer list-none text-xs font-semibold text-cyan-600 dark:text-cyan-300">Why this result?</summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {normalized?.explanation || "Model combined forensic signals from spatial, temporal, and frequency domains to determine authenticity."}
            </p>
          </details>

          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900/50">
            <span className="text-slate-600 dark:text-slate-300">Report Integrity Badge</span>
            <span className={`inline-flex items-center gap-1 font-semibold ${isFake ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
              {isFake ? <AlertTriangle size={13} /> : <BadgeCheck size={13} />}
              {isFake ? "TAMPERED" : "VERIFIED REPORT"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
