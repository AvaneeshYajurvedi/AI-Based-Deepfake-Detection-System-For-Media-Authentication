import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { verifyReportHash } from "../../api/deepshield";

const BRAND_LOGO_SRC = "/logo.jpeg";

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</div>
      <div className="mt-1 break-all font-mono text-xs text-slate-900 dark:text-slate-100">{value || "--"}</div>
    </div>
  );
}

export default function ReportViewPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const reportHash = params.get("report_hash") || "";
  const fileHash = params.get("file_hash") || "";
  const timestamp = params.get("timestamp") || "";
  const result = params.get("result") || "";
  const confidence = params.get("confidence") || "";

  const [status, setStatus] = useState("CHECKING");

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!reportHash) {
        setStatus("INVALID");
        return;
      }
      try {
        const verified = await verifyReportHash(reportHash);
        if (mounted) {
          setStatus(verified.status || "INVALID");
        }
      } catch {
        if (mounted) {
          setStatus("INVALID");
        }
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [reportHash]);

  const isValid = status === "VALID" || status === "AUTHENTIC";

  return (
    <div className="h-full overflow-y-auto rounded-2xl bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="inline-flex items-center gap-2">
            <img src={BRAND_LOGO_SRC} alt="DeepShield logo" className="brand-logo-orb h-8 w-8 rounded-full object-cover" />
            <div>
              <h1 className="text-lg font-bold">DeepShield Report Viewer</h1>
              <p className="text-xs text-slate-400">Read-only verification page</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${isValid ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>
            {isValid ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
            {status}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow label="Result" value={result || "--"} />
          <InfoRow label="Confidence" value={confidence ? `${confidence}%` : "--"} />
          <InfoRow label="Timestamp" value={timestamp || "--"} />
          <InfoRow label="Report Hash" value={reportHash || "--"} />
          <div className="sm:col-span-2">
            <InfoRow label="File Hash (SHA-256)" value={fileHash || "--"} />
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
          🔒 No user data stored. Stateless cryptographic verification enabled.
        </div>
      </div>
    </div>
  );
}
