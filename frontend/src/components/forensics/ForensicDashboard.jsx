import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import {
  generateVerifiedReport,
  normalizeAnalysisResult,
  verifyReportFull,
  verifyReportHash,
} from "../../api/deepshield";
import HowItWorks from "../HowItWorks";
import MediaVerdictSection from "./MediaVerdictSection";
import ForensicAnalysisPanel from "./ForensicAnalysisPanel";
import VerificationPanel from "./VerificationPanel";
import ReportActionsPanel from "./ReportActionsPanel";

export default function ForensicDashboard({ result, mediaType, status, file, onPdfSessionTimeout }) {
  const normalized = normalizeAnalysisResult(result, mediaType);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [report, setReport] = useState(null);
  const [verifyState, setVerifyState] = useState(null);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    if (status === "done") return;

    setLoading(false);
    setVerifying(false);
    setReport(null);
    setVerifyState(null);
    setReportError(null);
  }, [status, file, mediaType]);

  async function handleGenerateReport() {
    if (!(file instanceof File)) {
      setReportError("Upload a file before generating a verified report.");
      return;
    }

    setLoading(true);
    setReportError(null);
    try {
      const generated = await generateVerifiedReport(file, mediaType);
      setReport(generated);
      setVerifyState(null);
    } catch (error) {
      setReportError(error?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyReport() {
    if (!report) return;

    setVerifying(true);
    setReportError(null);
    try {
      const quick = await verifyReportHash(report.report_hash);
      const full = await verifyReportFull({
        file,
        result: report.result,
        confidence: report.confidence,
        timestamp: report.timestamp,
        reportHash: report.report_hash,
        digitalSignature: report.digital_signature,
      });

      setVerifyState({ ...quick, ...full });
    } catch (error) {
      setReportError(error?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  function handleDownloadPdf() {
    if (!report?.pdf_url) return;

    window.alert("Downloading the verified PDF will end this session immediately.");
    const confirmed = window.confirm(
      "Downloading the verified PDF will end this session immediately. Continue?"
    );
    if (!confirmed) return;

    const anchor = document.createElement("a");
    anchor.href = report.pdf_url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    if (typeof onPdfSessionTimeout === "function") {
      window.setTimeout(() => onPdfSessionTimeout(), 150);
    }
  }

  if (status === "idle" || !normalized) {
    return (
      <div className="h-full overflow-y-auto rounded-2xl border border-dashed border-slate-300 bg-white/80 p-4 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
        <h3 className="mb-3 bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300 bg-clip-text text-center text-2xl font-bold tracking-tight text-transparent">How It Works?</h3>
        <div className="space-y-3">
          <HowItWorks showHero={false} />
          <p className="pt-1 text-center text-sm font-bold text-slate-900 dark:text-slate-100">
            No account required. Upload files directly for analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden pr-1">
      <MediaVerdictSection file={file} mediaType={mediaType} normalized={normalized} />

      <div className="grid min-h-0 grid-cols-[minmax(0,0.62fr)_minmax(0,1.28fr)_minmax(0,0.8fr)] gap-3 overflow-hidden">
        <ForensicAnalysisPanel normalized={normalized} />
        <VerificationPanel
          report={report}
          verifyState={verifyState}
          verifying={verifying}
          onVerify={handleVerifyReport}
          error={reportError}
        />
        <ReportActionsPanel
          report={report}
          loading={loading}
          onGenerate={handleGenerateReport}
          onDownload={handleDownloadPdf}
          error={reportError}
          verifyState={verifyState}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5"><Lock size={13} /> No user data stored. Stateless cryptographic verification enabled.</span>
      </div>
    </motion.div>
  );
}
