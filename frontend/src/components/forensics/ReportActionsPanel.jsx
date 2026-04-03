import { useState } from "react";
import { Download, Fingerprint, QrCode } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</div>
      <div className="mt-1 break-all font-mono text-xs text-slate-900 dark:text-slate-100">{value || "--"}</div>
    </div>
  );
}

export default function ReportActionsPanel({ report, loading, onGenerate, onDownload, error, verifyState }) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const verifyStatus = verifyState?.status || (report ? "PENDING" : "NOT_READY");

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="grid min-h-0 flex-1 grid-rows-3 gap-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="inline-flex h-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Fingerprint size={15} />
          {loading ? "Generating..." : "Generate Verified Report"}
        </button>

        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          disabled={!report}
          className="inline-flex h-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:text-cyan-300"
        >
          <QrCode size={15} /> View Report
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={!report?.pdf_url}
          className="inline-flex h-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
        >
          <Download size={15} /> Download Verified PDF
        </button>
      </div>

      {error && <div className="mt-2 rounded-lg border border-red-400/40 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

      <AnimatePresence>
        {reportModalOpen && report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={() => setReportModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">Report View</h4>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="inline-flex rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-600 dark:text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <InfoRow label="Result" value={report.result || "--"} />
                <InfoRow label="Confidence" value={`${Math.round((report.confidence || 0) * 100)}%`} />
                <InfoRow label="Timestamp" value={report.timestamp || "--"} />
                <InfoRow label="Status" value={verifyStatus} />
                <div className="sm:col-span-2">
                  <InfoRow label="File Hash (SHA-256)" value={report.file_hash || "--"} />
                </div>
                <div className="sm:col-span-2">
                  <InfoRow label="Report Hash" value={report.report_hash || "--"} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
