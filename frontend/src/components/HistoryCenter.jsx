export default function HistoryCenter({ activeHistory, archivedHistory, onClearActive, onArchiveAll, onClearArchived, isLoggedIn }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">History</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLoggedIn
                ? "Saved to your account until you delete or archive it."
                : "Saved only for this browser session unless you log in."}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onArchiveAll} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">Archive all</button>
            <button type="button" onClick={onClearActive} className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">Delete all</button>
          </div>
        </div>

        {activeHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">No active history.</div>
        ) : (
          <div className="space-y-2">
            {activeHistory.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/50">
                <div className="font-medium text-slate-800 dark:text-slate-100">{row.filename}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{row.label} • {row.confidence}% confidence • {row.time}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Archived History</h3>
          <button type="button" onClick={onClearArchived} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">Clear archived</button>
        </div>

        {archivedHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">No archived items yet.</div>
        ) : (
          <div className="space-y-2">
            {archivedHistory.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/50">
                <div className="font-medium text-slate-800 dark:text-slate-100">{row.filename}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{row.label} • archived</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
