const faqs = [
  {
    q: "How accurate is DeepShield?",
    a: "Accuracy depends on media quality and manipulation style. We show confidence and risk so decisions are transparent.",
  },
  {
    q: "Do you store uploaded files?",
    a: "Only if local history storage is enabled in settings. You can clear or archive history anytime.",
  },
  {
    q: "Can I use this for team workflows?",
    a: "Yes. The roadmap includes shared workspaces, billing controls, and role-based access.",
  },
  {
    q: "What does archive do?",
    a: "Archive moves items out of active history but keeps them available for future review.",
  },
];

export default function FAQs() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">FAQs</h2>
      <div className="mt-4 space-y-3">
        {faqs.map((item) => (
          <details key={item.q} className="rounded-xl border border-gray-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">{item.q}</summary>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
