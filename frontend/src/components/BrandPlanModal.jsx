import { useMemo, useState } from "react";
import { X, Crown, CheckCircle2 } from "lucide-react";

const plans = {
  monthly: [
    { name: "Starter", price: "$9", perks: ["500 scans / month", "Basic report export", "Email support"] },
    { name: "Pro", price: "$29", perks: ["5,000 scans / month", "Priority inference queue", "Advanced report insights"] },
    { name: "Enterprise", price: "$99", perks: ["Unlimited scans", "Team seats", "Dedicated success manager"] },
  ],
  yearly: [
    { name: "Starter", price: "$90", perks: ["500 scans / month", "2 months free", "Email support"] },
    { name: "Pro", price: "$290", perks: ["5,000 scans / month", "2 months free", "Advanced report insights"] },
    { name: "Enterprise", price: "$990", perks: ["Unlimited scans", "2 months free", "Dedicated success manager"] },
  ],
};

export default function BrandPlanModal({ open, onClose }) {
  const [cycle, setCycle] = useState("monthly");
  const currentPlans = useMemo(() => plans[cycle], [cycle]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
      <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-label="Close plans" />
      <div className="relative z-[81] w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-300">
              <Crown size={18} />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">Get Brand Plan</span>
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Choose your plan</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select monthly or yearly billing and compare benefits.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 dark:border-slate-600 dark:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900/70">
          <button type="button" onClick={() => setCycle("monthly")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${cycle === "monthly" ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
            Monthly
          </button>
          <button type="button" onClick={() => setCycle("yearly")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${cycle === "yearly" ? "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
            Yearly
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {currentPlans.map((plan) => (
            <div key={`${cycle}-${plan.name}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{plan.name}</div>
              <div className="mt-1 text-2xl font-bold text-cyan-600 dark:text-cyan-300">{plan.price}<span className="text-xs font-medium text-slate-500 dark:text-slate-400">/{cycle === "monthly" ? "mo" : "yr"}</span></div>
              <ul className="mt-3 space-y-2">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-500" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
