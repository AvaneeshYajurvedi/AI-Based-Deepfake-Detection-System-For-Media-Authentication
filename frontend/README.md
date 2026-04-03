# DeepShield Frontend

React + Vite frontend for the DeepShield AI deepfake detection system.
**Owner: Akhilesh Kotwal (Person 3)**

---

## Quick Start

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

Create your environment file before integration testing:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

---

## Switch from Mock to Live Backend

1. Set `VITE_API_URL` in `.env` to your backend URL if it is not `http://localhost:8000`
2. Set `VITE_USE_MOCK=false` to force live mode, or leave it unset to follow whether `VITE_API_URL` is present
3. Make sure FastAPI is running and returning JSON from the analyze endpoints

The frontend now normalizes scan results before rendering, so small schema differences such as percentage values, wrapped payloads, or missing optional fields are less likely to break the UI.

The Vite proxy in `vite.config.js` forwards `/analyze/*` to `localhost:8000` automatically — no CORS issues.

---

## Backend Integration Contract v1.0

BASE URL: `http://localhost:8000`

All three endpoints must return this exact envelope:

```json
{
  "status": "success",
  "media_type": "image",
  "label": "REAL" | "FAKE" | "UNCERTAIN",
  "confidence": 0.87,
  "explanation": "Human readable string",
  "heatmap_url": "/outputs/abc.jpg" | null,
  "frame_scores": [0.3, 0.5, 0.88, 0.6] | null,
  "suspicious_frames": [2, 3] | null,
  "metadata": {}
}
```

Optional audio fields can also be present when returned by backend orchestration:
`transcript`, `sentiment`, `manipulation_risk_score`, `flagged_phrases`, `detected_topics`.

### Endpoint MIME rules

- `POST /analyze/image` accepts `image/jpeg`, `image/png`
- `POST /analyze/video` accepts `video/mp4`, `video/avi`
- `POST /analyze/audio` accepts `audio/wav`, `audio/mp3`

### P3 -> P1 call pattern

The API layer in `src/api/deepshield.js` uses:

```js
axios.post('http://localhost:8000/analyze/image', formData)
```

`formData` always uses key: `file`.

### Error responses (FastAPI):
```json
{ "detail": "No face detected" }
{ "detail": "Video too short (min 3 seconds)" }
{ "detail": "File too large (max 500MB)" }
```

---

## File Structure

```
src/
  api/
    deepshield.js       ← ALL API calls live here. Edit this when backend is ready.
  components/
    Sidebar.jsx
    UploadZone.jsx      ← Drag-drop, file preview, scan animation
    ResultPanel.jsx     ← Orchestrates all result panels
    ConfidenceRing.jsx  ← SVG donut chart
    ManipulationMeter.jsx
    TranscriptViewer.jsx ← Flagged phrase highlighting
    FrameTimeline.jsx   ← Per-frame confidence chart (video)
    EvidenceReport.jsx  ← Forensic summary paragraph
    ScanHistory.jsx     ← Session history table
    HowItWorks.jsx      ← Info page
  App.jsx               ← State, routing, layout
  index.css             ← All styles (White Chrome theme)
  main.jsx
```

---

## Integration Checklist

- [ ] Person 1 confirms `localhost:8000` is running with CORS enabled
- [ ] Person 1 shares final JSON schema (compare with this README)
- [ ] `heatmap_url` — must be a publicly accessible URL or base64 string
- [ ] Set `VITE_USE_MOCK=false` when you want the app to hit the backend
- [ ] Test image upload → verify confidence ring animates
- [ ] Test video upload → verify frame timeline renders
- [ ] Test audio upload → verify transcript + sentiment shows
- [ ] Test error cases: no face, large file, server down
