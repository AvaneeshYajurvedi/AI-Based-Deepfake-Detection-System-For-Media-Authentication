import { X, FileText, Receipt } from "lucide-react";

const invoices = [
  { id: "INV-2403", amount: "$29.00", status: "Paid", issued: "2026-03-01" },
  { id: "INV-2402", amount: "$29.00", status: "Paid", issued: "2026-02-01" },
];

const payments = [
  { id: "PAY-8931", method: "Visa •••• 4231", amount: "$29.00", date: "2026-03-01" },
  { id: "PAY-8820", method: "Visa •••• 4231", amount: "$29.00", date: "2026-02-01" },
];

export default function BillingPlansModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
      <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-label="Close billing" />
      <div className="relative z-[81] w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Billing & Plans</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invoices and payment history</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 dark:border-slate-600 dark:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <FileText size={16} /> Invoices
            </div>
            <div className="space-y-2">
              {invoices.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{item.id}</div>
                  <div className="text-slate-600 dark:text-slate-300">{item.amount} • {item.status}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Issued: {item.issued}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Receipt size={16} /> Payment History
            </div>
            <div className="space-y-2">
              {payments.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{item.id}</div>
                  <div className="text-slate-600 dark:text-slate-300">{item.amount} • {item.method}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Date: {item.date}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
