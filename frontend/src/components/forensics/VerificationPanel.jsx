import { CheckCircle2, ShieldCheck } from "lucide-react";

function hashShort(value = "") {
  if (!value) return "--";
  if (value.length <= 24) return value;
  return `${value.slice(0, 12)}...${value.slice(-12)}`;
}

function statusTone(status) {
  if (["AUTHENTIC", "VALID", "VERIFIED"].includes(status)) return "text-emerald-600 dark:text-emerald-300";
  if (["TAMPERED", "INVALID"].includes(status)) return "text-red-600 dark:text-red-300";
  return "text-amber-600 dark:text-amber-300";
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</div>
      <div className="mt-1 break-all font-mono text-xs text-slate-900 dark:text-slate-100">{value || "--"}</div>
    </div>
  );
}

export default function VerificationPanel({ report, verifyState, verifying, onVerify, error }) {
  const timestamp = report?.timestamp || "--";
  const signatureValid = verifyState?.signature_valid;
  const verifyStatus = verifyState?.status || (report ? "PENDING" : "NOT_READY");

  return (
    <section className="h-full min-h-0 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-end">
        <span className={`text-xs font-semibold ${statusTone(verifyStatus)}`}>{verifyStatus.replace("_", " ")}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <InfoRow label="File Hash (SHA-256)" value={hashShort(report?.file_hash)} />
        <InfoRow label="Report Hash" value={hashShort(report?.report_hash)} />
        <InfoRow label="Timestamp" value={timestamp} />
        <InfoRow
          label="Digital Signature"
          value={signatureValid === true ? "Verified" : signatureValid === false ? "Invalid" : "Pending"}
        />
      </div>

      <button
        type="button"
        onClick={onVerify}
        disabled={!report || verifying}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:text-cyan-300"
      >
        {verifyState?.status === "AUTHENTIC" ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
        {verifying ? "Verifying..." : "Verify Report"}
      </button>

      {error && <div className="mt-2 rounded-lg border border-red-400/40 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    </section>
  );
}
