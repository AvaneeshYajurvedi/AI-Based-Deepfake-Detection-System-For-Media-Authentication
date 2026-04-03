// ScanHistory.jsx
export function ScanHistory({ history, onClear, onArchive, emptyText = "No scans yet this session" }) {
  return (
    <div className="card history-panel">
      <div className="card-header">
        <h3 className="card-title">Scan History</h3>
        {history.length > 0 && (
          <div className="flex items-center gap-2">
            {onArchive && (
              <button className="btn-export" onClick={onArchive}>Archive all</button>
            )}
            <button className="btn-export" onClick={onClear}>Clear all</button>
          </div>
        )}
      </div>
      {history.length === 0 ? (
        <div className="history-empty">{emptyText}</div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                {["File","Type","Verdict","Confidence","Risk","Time"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(row => (
                <tr key={row.id}>
                  <td className="file-cell">{row.filename}</td>
                  <td><span className="type-pill">{row.type}</span></td>
                  <td><span className={`verdict-pill v-${row.label.toLowerCase()}`}>{row.label}</span></td>
                  <td className="conf-cell">{row.confidence}%</td>
                  <td>
                    <span style={{ color: row.risk >= 75 ? "var(--crimson)" : row.risk >= 50 ? "var(--amber)" : "var(--teal)" }}>
                      {row.risk}%
                    </span>
                  </td>
                  <td className="time-cell">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ScanHistory;
