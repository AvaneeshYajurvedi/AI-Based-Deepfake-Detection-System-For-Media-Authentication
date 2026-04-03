"""
video_service.py
----------------
Thin adapter between FastAPI route and video_pipeline.py
Does NOT modify any logic in video_pipeline.py.
Just translates the result dict → standard AnalysisResponse fields.
"""

from app.services.video_pipeline import analyze_video as _run_pipeline


def generate_explanation(
    label: str,
    confidence: float,
    total_frames: int,
    anomaly_frames: list,
    audio_path: str
) -> str:
    has_audio = audio_path is not None

    if label == "FAKE":
        base = (
            f"AI-generated content detected with {round(confidence*100, 1)}% confidence "
            f"across {total_frames} analyzed frames."
        )
        if anomaly_frames:
            base += f" Temporal anomalies found at frames {anomaly_frames[:5]}."
        if has_audio:
            base += " Audio track extracted for further analysis."
        return base

    elif label == "REAL":
        return (
            f"No manipulation detected across {total_frames} frames. "
            f"Consistent natural patterns throughout the video."
            + (" Audio track extracted for further analysis." if has_audio else "")
        )

    else:
        return (
            f"Analysis inconclusive across {total_frames} frames. "
            f"Confidence score ({round(confidence*100,1)}%) is below decision threshold. "
            f"Try a longer or higher quality video."
        )


def analyze_video(file_path: str) -> dict:
    """
    Calls video_pipeline.analyze_video() and maps result
    to the project standard schema. Core logic untouched.
    """

    # ── Call the untouched pipeline ──────────────────────────────────────────
    raw = _run_pipeline(file_path)

    # ── Handle pipeline-level errors ─────────────────────────────────────────
    if raw.get("error") and raw.get("verdict") is None:
        return {
            "label": "ERROR",
            "confidence": 0.0,
            "explanation": f"Video pipeline error: {raw['error']}",
            "frame_scores": [],
            "suspicious_frames": [],
            "metadata": {"error": raw["error"]}
        }

    # ── Map verdict → standard label ─────────────────────────────────────────
    verdict = raw.get("verdict", "Real")
    confidence = float(raw.get("confidence") or 0.0)

    if verdict == "AI-Generated":
        label = "FAKE"
    elif verdict == "Real":
        label = "REAL"
    else:
        label = "UNCERTAIN"

    # ── Map frame scores ──────────────────────────────────────────────────────
    frame_scores = [round(float(s), 4) for s in raw.get("frame_scores", [])]

    # anomaly_frames in video_pipeline are 0-based indices → convert to 1-based
    suspicious_frames = [i + 1 for i in raw.get("anomaly_frames", [])]

    total_frames = int(raw.get("total_frames", len(frame_scores)))
    audio_path = raw.get("audio_path")

    # ── Build explanation ─────────────────────────────────────────────────────
    explanation = generate_explanation(
        label, confidence, total_frames, suspicious_frames, audio_path
    )

    return {
        "label": label,
        "confidence": round(confidence, 4),
        "explanation": explanation,
        "frame_scores": frame_scores,
        "suspicious_frames": suspicious_frames,
        "metadata": {
            "total_frames": total_frames,
            "threshold_used": float(raw.get("threshold_used", 0.5)),
            "anomaly_frame_count": len(suspicious_frames),
            "audio_extracted": audio_path is not None,
            "audio_path": audio_path,
            "pipeline_error": raw.get("error")
        }
    }