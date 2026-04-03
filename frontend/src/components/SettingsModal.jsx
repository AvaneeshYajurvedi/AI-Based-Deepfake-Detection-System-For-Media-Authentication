import { useEffect, useState } from "react";
import { X, Settings2, Bell, Languages, MonitorCog, LayoutGrid } from "lucide-react";

const defaultSettings = {
  theme: "light",
  language: "English",
  notifications: true,
  compactLayout: false,
  autoSaveHistory: true,
};

export default function SettingsModal({ open, settings, onClose, onSave }) {
  const [form, setForm] = useState(defaultSettings);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultSettings, ...settings });
    }
  }, [open, settings]);

  if (!open) return null;

  const updateField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto px-4 py-6 sm:items-center">
      <button
        type="button"
        aria-label="Close settings dialog"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-[61] flex max-h-[calc(100vh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-300">
              <Settings2 size={20} />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">DeepShield Settings</span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Preferences
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Adjust the look and behavior of the app the way most websites let you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-600 dark:text-slate-300 dark:hover:text-cyan-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <MonitorCog size={16} className="text-cyan-500 dark:text-cyan-300" />
              Appearance
            </div>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600 dark:text-slate-300">Theme</span>
              <select
                value={form.theme}
                onChange={updateField("theme")}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-slate-600 dark:text-slate-300">Layout density</span>
              <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <div>
                  <div className="font-medium">Compact layout</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tighter spacing across the dashboard</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.compactLayout}
                  onChange={updateField("compactLayout")}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                />
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Languages size={16} className="text-cyan-500 dark:text-cyan-300" />
              General
            </div>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600 dark:text-slate-300">Language</span>
              <select
                value={form.language}
                onChange={updateField("language")}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-slate-600 dark:text-slate-300">Scan history</span>
              <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <div>
                  <div className="font-medium">Save locally</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Keep recent scan history on this device</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.autoSaveHistory}
                  onChange={updateField("autoSaveHistory")}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                />
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Bell size={16} className="text-cyan-500 dark:text-cyan-300" />
              Notifications
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
              <div>
                <div className="font-medium">Enable alerts</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Show a small notice when analysis finishes</div>
              </div>
              <input
                type="checkbox"
                checked={form.notifications}
                onChange={updateField("notifications")}
                className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </section>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
