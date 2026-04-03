const toneMap = {
  primary: {
    icon: "bg-cyan-400/15 text-cyan-400",
    ring: "from-cyan-400/20 to-transparent",
  },
  danger: {
    icon: "bg-red-500/15 text-red-500",
    ring: "from-red-500/20 to-transparent",
  },
  success: {
    icon: "bg-green-500/15 text-green-500",
    ring: "from-green-500/20 to-transparent",
  },
  warning: {
    icon: "bg-amber-400/15 text-amber-400",
    ring: "from-amber-400/20 to-transparent",
  },
};

export default function StatCard({ icon: Icon, label, value, tone, isHighlight }) {
  const palette = toneMap[tone] ?? toneMap.primary;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 ${
        isHighlight ? "ring-1 ring-red-500/30" : ""
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90 dark:opacity-70 ${palette.ring}`} />
      <div className="relative flex items-center gap-3">
        <div className={`rounded-lg p-2 ${palette.icon}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-300">{label}</span>
      </div>
      <div className="relative mt-4">
        <div className="text-3xl font-bold leading-none text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}
