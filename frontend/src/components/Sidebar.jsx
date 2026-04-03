import { BarChart3, AlertCircle, CheckCircle, Shield, BookOpen, Info, CircleQuestionMark } from "lucide-react";
import { getPathForPage } from "../router/routes";

export default function Sidebar({ page, setPage, stats }) {
  const nav = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "how", icon: BookOpen, label: "How It Works" },
    { id: "about", icon: Info, label: "About Us" },
    { id: "faqs", icon: CircleQuestionMark, label: "FAQs" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white transition-colors duration-300 md:flex dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-gray-200 px-5 py-6 dark:border-slate-700">
        <div className="flex items-center gap-2 text-cyan-500 dark:text-cyan-300">
          <Shield size={22} />
          <span>DeepShield</span>
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Media Authentication</div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <div className="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Navigation</div>
        {nav.map(n => {
          const Icon = n.icon;
          return (
            <a
              key={n.id}
              href={getPathForPage(n.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors duration-300 ${
                page === n.id
                  ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-600 dark:border-cyan-400/40 dark:bg-cyan-400/20 dark:text-cyan-200"
                  : "border-transparent text-gray-600 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600 dark:text-gray-300 dark:hover:border-cyan-400/40 dark:hover:bg-slate-700/90 dark:hover:text-cyan-200"
              }`}
              onClick={(event) => {
                event.preventDefault();
                setPage(n.id);
              }}
            >
              <Icon size={18} />
              <span className="font-medium">{n.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-gray-200 px-5 py-4 text-sm text-gray-600 dark:border-slate-700 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          <span>{stats.real} confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" />
          <span>{stats.fake} flagged</span>
        </div>
      </div>
    </aside>
  );
}
