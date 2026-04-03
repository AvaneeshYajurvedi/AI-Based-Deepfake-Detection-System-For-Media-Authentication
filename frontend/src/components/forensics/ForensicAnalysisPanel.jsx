import { useState } from "react";
import { X } from "lucide-react";

function HeatmapView({ url }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isModalOpen) {
    return (
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">GradCAM Heatmap</div>
        <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-600">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.18),transparent_38%),radial-gradient(circle_at_82%_78%,rgba(245,158,11,0.16),transparent_42%)]" />
          <div className="absolute inset-0 grid grid-cols-8 gap-1 p-2 opacity-45">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="rounded-sm bg-slate-300/35 dark:bg-slate-500/25" />
            ))}
          </div>
          <p className="relative z-10 text-sm text-slate-600 dark:text-slate-300">Heatmap ready for focused review.</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="relative z-10 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors duration-300 hover:bg-cyan-400"
          >
            View Heatmap
          </button>
        </div>
      </div>
    );
  }

  const content = url ? (
    <img src={url} alt="GradCAM heatmap" className="max-h-[70vh] w-full rounded-lg object-contain" />
  ) : (
    <div className="relative flex min-h-[320px] items-end justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 pb-3 dark:border-slate-600 dark:bg-slate-900/40">
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

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">GradCAM Heatmap</h4>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-gray-700 transition-colors duration-300 hover:border-[var(--indigo)] hover:text-[var(--indigo)] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:hover:border-[var(--indigo-mid)] dark:hover:text-[var(--indigo-mid)]"
            aria-label="Close heatmap"
          >
            <X size={16} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

export default function ForensicAnalysisPanel({ normalized }) {
  return <HeatmapView url={normalized?.heatmap_url} />;
}
