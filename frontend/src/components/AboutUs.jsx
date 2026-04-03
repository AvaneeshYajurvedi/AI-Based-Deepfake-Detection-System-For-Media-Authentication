export default function AboutUs() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">About DeepShield</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        DeepShield helps creators and teams validate media authenticity across image, video, and audio.
        We combine forensic signals, model confidence, and explainable outputs so trust decisions are faster.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-50 p-4 dark:border-cyan-400/30 dark:bg-cyan-400/10">
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Mission</div>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Make authenticity checks accessible for everyone.</p>
        </div>
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-50 p-4 dark:border-emerald-400/30 dark:bg-emerald-400/10">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Coverage</div>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Image, video, audio, and transcript-driven risk flags.</p>
        </div>
        <div className="rounded-xl border border-amber-300/30 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-400/10">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Focus</div>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Actionable reports over raw model scores.</p>
        </div>
      </div>
    </div>
  );
}
