export default function TranscriptViewer({ transcript, flagged }) {
  if (!transcript) return <div className="transcript-empty">No transcript available</div>;

  function highlight(text, phrases) {
    if (!phrases || phrases.length === 0) return [<span key="0">{text}</span>];
    const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    return text.split(regex).map((part, i) => {
      const isFlag = phrases.some(p => p.toLowerCase() === part.toLowerCase());
      return isFlag
        ? <mark key={i} className="flagged-phrase">{part}</mark>
        : <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="transcript-wrap">
      <div className="transcript-text">{highlight(transcript, flagged)}</div>
      {flagged && flagged.length > 0 && (
        <div className="flagged-legend">
          <span className="flagged-dot" /> {flagged.length} flagged phrase{flagged.length > 1 ? "s" : ""} detected
        </div>
      )}
    </div>
  );
}
