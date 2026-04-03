import ConfidenceRing from "./ConfidenceRing";
import ManipulationMeter from "./ManipulationMeter";
import TranscriptViewer from "./TranscriptViewer";
import FrameTimeline from "./FrameTimeline";
import EvidenceReport from "./EvidenceReport";
import { Clock, FileJson, Printer } from "lucide-react";
import { normalizeAnalysisResult } from "../api/deepshield";

const verdictStyles = {
  FAKE: {
    border: "border-t-red-500",
    text: "text-red-500",
  },
  REAL: {
    border: "border-t-green-500",
    text: "text-green-500",
  },
  UNCERTAIN: {
    border: "border-t-amber-400",
    text: "text-amber-400",
  },
};

function PanelCard({ title, meta, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-5 py-4 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {meta ? <span className="text-xs text-gray-500 dark:text-gray-400">{meta}</span> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function ResultPanel({ result, mediaType, filename, status }) {
  const normalized = normalizeAnalysisResult(result);

  if (status === "idle" || !result) {
    return (
      <PanelCard title="Analysis Result">
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <Clock size={48} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
          <div>
            <p className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">Your analysis results will appear here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We will show authenticity score, detected issues, and confidence level
            </p>
          </div>
        </div>
      </PanelCard>
    );
  }

  const conf = Math.round(normalized.confidence * 100);
  const risk = Math.round(normalized.manipulation_risk_score * 100);
  const label = normalized.label;
  const verdictStyle = verdictStyles[label] ?? verdictStyles.UNCERTAIN;

  function exportJSON() {
    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deepshield_${filename || "result"}.json`;
    a.click();
  }

  function exportPDF() { window.print(); }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border border-gray-200 border-t-4 bg-white shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 ${verdictStyle.border}`}>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className={`text-3xl font-extrabold leading-none ${verdictStyle.text}`}>{label}</div>
            <div className="mt-2 max-w-[240px] truncate text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{filename}</div>
          </div>
          <ConfidenceRing conf={conf} verdict={label} />
        </div>
        <div className="flex gap-2 px-5 pb-4">
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors duration-300 hover:border-cyan-400 hover:text-cyan-500 dark:border-slate-600 dark:text-gray-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            onClick={exportJSON}
            title="Export as JSON"
          >
            <FileJson size={14} />
            JSON
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors duration-300 hover:border-cyan-400 hover:text-cyan-500 dark:border-slate-600 dark:text-gray-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            onClick={exportPDF}
            title="Print/Export as PDF"
          >
            <Printer size={14} />
            PDF
          </button>
        </div>
      </div>

      <PanelCard title="Manipulation Analysis">
          <ManipulationMeter risk={risk} />
          <div className="my-5 border-t border-gray-200 dark:border-slate-700" />
          <SentimentBars sentiment={normalized.sentiment} />
          <div className="my-5 border-t border-gray-200 dark:border-slate-700" />
          <TopicTags topics={normalized.detected_topics} />
      </PanelCard>

      {(mediaType === "image" || mediaType === "video") && (
        <PanelCard title="GradCAM Heatmap" meta="Suspicious regions highlighted">
          <HeatmapView url={normalized.heatmap_url} />
        </PanelCard>
      )}

      {mediaType === "video" && normalized.frame_scores.length > 0 && (
        <PanelCard title="Per-frame Confidence Timeline" meta={`${normalized.suspicious_frames?.length || 0} anomaly frames`}>
          <FrameTimeline frames={normalized.frame_scores} anomalies={normalized.suspicious_frames} />
        </PanelCard>
      )}

      {(mediaType === "audio" || mediaType === "video") && normalized.transcript && (
        <PanelCard title="Transcript" meta={`${normalized.flagged_phrases?.length || 0} flagged phrases`}>
          <TranscriptViewer transcript={normalized.transcript} flagged={normalized.flagged_phrases} />
        </PanelCard>
      )}

      <EvidenceReport result={normalized} filename={filename} mediaType={mediaType} />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SentimentBars({ sentiment }) {
  if (!sentiment) return null;
  const bars = [
    { label: "Negative", value: Math.round((sentiment.negative || 0) * 100), color: "bg-red-500" },
    { label: "Neutral", value: Math.round((sentiment.neutral || 0) * 100), color: "bg-slate-400" },
    { label: "Positive", value: Math.round((sentiment.positive || 0) * 100), color: "bg-green-500" },
  ];
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">Sentiment Distribution</div>
      {bars.map(b => (
        <div key={b.label} className="mb-2 flex items-center gap-3">
          <span className="w-16 text-xs text-gray-500 dark:text-gray-400">{b.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
            <div className={`h-full rounded-full ${b.color}`} style={{ width: b.value + "%" }} />
          </div>
          <span className="w-10 text-right text-xs text-gray-600 dark:text-gray-300">{b.value}%</span>
        </div>
      ))}
    </div>
  );
}

function TopicTags({ topics }) {
  if (!topics || topics.length === 0) return null;
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">Detected Topics</div>
      <div className="flex flex-wrap gap-2">
        {topics.map(t => {
          const score = t.score || 0;
          const cls = score > 0.75
            ? "border-red-500/40 bg-red-500/10 text-red-500"
            : score > 0.5
              ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
              : "border-green-500/40 bg-green-500/10 text-green-500";
          return (
            <span key={t.label} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${cls}`}>
              #{t.label.replace(/\s+/g, "")}
              <span className="text-[10px] opacity-80">{Math.round(score * 100)}%</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function HeatmapView({ url }) {
  if (!url) {
    return (
      <div className="relative flex min-h-[160px] items-end justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 pb-3 dark:border-slate-600 dark:bg-slate-900/40">
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-8 gap-0.5 p-1">
          {Array.from({ length: 80 }).map((_, i) => {
            const v = Math.random();
            const bg = v > 0.7
              ? `rgba(220,30,60,${v.toFixed(2)})`
              : v > 0.4
              ? `rgba(245,160,0,${(v * 0.8).toFixed(2)})`
              : `rgba(80,100,200,${(v * 0.4).toFixed(2)})`;
            return <div key={i} className="rounded-[2px]" style={{ background: bg }} />;
          })}
        </div>
        <div className="relative z-10 rounded bg-white/80 px-3 py-1 text-xs text-gray-700 dark:bg-slate-800/90 dark:text-gray-200">
          Backend heatmap will render here
        </div>
      </div>
    );
  }
  return (
    <div>
      <img src={url} alt="GradCAM heatmap" className="w-full rounded-lg" />
    </div>
  );
}
