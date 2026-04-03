export default function HowItWorks({ showHero = true }) {
  const quickStart = [
    "Upload one media file (image, video, or audio).",
    "Click Analyze File and wait for the verdict card.",
    "Generate Verified PDF for a cryptographically signed report.",
    "Use View Heatmap to inspect suspicious visual regions (image/video).",
  ];

  const pipeline = [
    {
      n: "01",
      title: "Media Intake",
      desc: "DeepShield validates the file type and routes it to the correct AI pipeline.",
      tone: "from-cyan-500/20 to-sky-500/10 border-cyan-400/30",
    },
    {
      n: "02",
      title: "Model Analysis",
      desc: "Specialized detectors evaluate authenticity and produce confidence signals.",
      tone: "from-indigo-500/20 to-violet-500/10 border-indigo-400/30",
    },
    {
      n: "03",
      title: "Visual Forensics",
      desc: "For image/video, GradCAM maps where the model sees manipulation artifacts.",
      tone: "from-teal-500/20 to-emerald-500/10 border-teal-400/30",
    },
    {
      n: "04",
      title: "Cryptographic Report",
      desc: "A verified PDF is generated with hash + signature so authenticity can be validated later.",
      tone: "from-amber-500/20 to-orange-500/10 border-amber-400/30",
    },
  ];

  const interpret = [
    "REAL with high confidence: content likely authentic, but keep context in mind.",
    "FAKE with high confidence: treat as manipulated media and avoid blind forwarding.",
    "Lower confidence: use human review and external corroboration before decisions.",
  ];

  return (
    <div className="space-y-4">
      {showHero && (
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-indigo-500/10 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(34,211,238,0.18)]">
          <h1 className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">How DeepShield Works</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            First-time user guide: what to click, what happens in the backend, and how to trust the final report.
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/60 hover:shadow-[0_10px_24px_rgba(34,211,238,0.16)] dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-500 dark:text-cyan-300">Quick Start</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {quickStart.map((line, idx) => (
              <p key={line}><span className="font-semibold text-cyan-600 dark:text-cyan-300">{idx + 1}.</span> {line}</p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/60 hover:shadow-[0_10px_24px_rgba(129,140,248,0.15)] dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-indigo-500 dark:text-indigo-300">How To Read Results</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {interpret.map((line) => (
              <p key={line}>• {line}</p>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:shadow-[0_10px_28px_rgba(56,189,248,0.12)] dark:border-slate-700 dark:bg-slate-800/60">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-500 dark:text-emerald-300">Backend Pipeline</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {pipeline.map((step) => (
            <div key={step.n} className={`rounded-xl border bg-gradient-to-r p-3 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_10px_24px_rgba(56,189,248,0.18)] ${step.tone}`}>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-200">Step {step.n}</div>
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{step.title}</div>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
