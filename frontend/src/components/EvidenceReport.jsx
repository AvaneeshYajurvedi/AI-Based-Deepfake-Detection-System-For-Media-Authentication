import { normalizeAnalysisResult } from "../api/deepshield";

export default function EvidenceReport({ result, filename, mediaType }) {
  const normalized = normalizeAnalysisResult(result);
  if (!normalized) return null;

  const conf = Math.round(normalized.confidence * 100);
  const risk = Math.round(normalized.manipulation_risk_score * 100);
  const timestamp = new Date().toISOString();
  const topTopics = (normalized.detected_topics || []).slice(0, 3).map(t => t.label).join(", ") || "None";
  const sentDominant = normalized.sentiment
    ? Object.entries(normalized.sentiment).sort((a, b) => b[1] - a[1])[0][0]
    : "unknown";

  const riskLevel = risk >= 75 ? "CRITICAL" : risk >= 50 ? "HIGH" : risk >= 25 ? "MODERATE" : "LOW";

  return (
    <div className="card evidence-panel">
      <div className="card-header">
        <h3 className="card-title">Evidence Report</h3>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>Forensic Summary</span>
      </div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="evidence-header-row">
          <div className="evidence-case">CASE #{Math.random().toString(36).substr(2,8).toUpperCase()}</div>
          <div className="evidence-time">{timestamp}</div>
        </div>
        <div className="evidence-divider" />
        <div className="evidence-grid">
          <EvidenceField label="File Analyzed" value={filename || "unknown"} />
          <EvidenceField label="Media Type" value={mediaType?.toUpperCase() || "—"} />
          <EvidenceField label="Verdict" value={normalized.label} highlight={normalized.label} />
          <EvidenceField label="Confidence Score" value={`${conf}%`} />
          <EvidenceField label="Manipulation Risk" value={`${risk}% (${riskLevel})`} />
          <EvidenceField label="Dominant Sentiment" value={sentDominant.charAt(0).toUpperCase() + sentDominant.slice(1)} />
          <EvidenceField label="Topics Detected" value={topTopics} />
          <EvidenceField label="Flagged Phrases" value={normalized.flagged_phrases?.length || 0} />
        </div>
        <div className="evidence-divider" />
        <div className="evidence-narrative">
          <div className="sub-label">Analysis Summary</div>
          <p className="evidence-text">
            This {mediaType} file has been analyzed by the DeepShield AI pipeline.
            The model returned a verdict of <strong>{normalized.label}</strong> with{" "}
            <strong>{conf}% confidence</strong>.{" "}
            {normalized.label === "FAKE"
              ? `Significant artifacts indicative of AI-generated or manipulated media were detected. `
              : normalized.label === "REAL"
              ? `No significant manipulation artifacts were detected in the media. `
              : `The model was unable to make a high-confidence determination. `}
            Manipulation risk is assessed at <strong>{riskLevel}</strong> ({risk}%).{" "}
            {normalized.detected_topics?.length > 0
              ? `The content discusses potentially sensitive topics including ${topTopics}.`
              : "No sensitive topics were flagged in this content."}
            {normalized.flagged_phrases?.length > 0
              ? ` ${normalized.flagged_phrases.length} phrase${normalized.flagged_phrases.length > 1 ? "s were" : " was"} flagged for potential narrative manipulation.`
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function EvidenceField({ label, value, highlight }) {
  const colors = { FAKE: "var(--crimson)", REAL: "var(--teal)", UNCERTAIN: "var(--amber)" };
  return (
    <div className="evidence-field">
      <span className="evidence-field-label">{label}</span>
      <span className="evidence-field-value" style={highlight ? { color: colors[highlight], fontWeight: 600 } : {}}>
        {String(value)}
      </span>
    </div>
  );
}
