"""
audio_service.py
----------------
Thin adapter between FastAPI route and audio_pipeline.py
Zero changes to core logic in audio_pipeline.py.
Maps result → standard AnalysisResponse schema.
"""

import logging
from app.services.audio_pipeline import SelfCalibratingDetector

log = logging.getLogger("audio_service")

# ─── Load detector once at startup ────────────────────────────────────────────
log.info("Initializing audio deepfake detector...")
_detector = SelfCalibratingDetector()
log.info("Audio detector ready.")


# ─── Explanation Generator ─────────────────────────────────────────────────────

def _generate_explanation(
    label: str,
    confidence: float,
    deepfake_score: float,
    anomaly_scores: dict,
    features: dict
) -> str:
    pct = round(confidence * 100, 1)

    # Get top 3 anomalous features
    top_anomalies = sorted(
        anomaly_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:3]

    reasons = []

    if label == "FAKE":
        # Explain top anomalous signals
        for feat_name, score in top_anomalies:
            if score > 0.3:
                val = features.get(feat_name, None)

                if feat_name == "zcr" and val is not None:
                    reasons.append(
                        f"abnormal zero-crossing rate ({round(float(val), 4)}) — "
                        f"synthetic voices lack natural speech irregularity"
                    )
                elif feat_name == "hf_energy" and val is not None:
                    reasons.append(
                        f"low high-frequency energy ({round(float(val), 4)}) — "
                        f"AI-generated audio suppresses natural high-frequency content"
                    )
                elif feat_name == "mfcc_smoothness" and val is not None:
                    reasons.append(
                        f"unnaturally smooth MFCC frames (score: {round(float(val), 4)}) — "
                        f"real speech varies more between frames"
                    )
                elif feat_name == "flatness_mean" and val is not None:
                    reasons.append(
                        f"spectral flatness anomaly ({round(float(val), 4)}) — "
                        f"GAN noise floor detected in frequency spectrum"
                    )
                elif feat_name == "f0_var" and val is not None:
                    reasons.append(
                        f"abnormal pitch variance ({round(float(val), 4)}) — "
                        f"cloned voices have unnaturally stable fundamental frequency"
                    )
                elif feat_name == "centroid_var" and val is not None:
                    reasons.append(
                        f"low spectral centroid variance ({round(float(val), 4)}) — "
                        f"synthetic speech lacks natural tonal variation"
                    )
                elif feat_name == "wav2vec_cov" and val is not None:
                    reasons.append(
                        f"Wav2Vec2 temporal dynamics anomaly ({round(float(val), 4)}) — "
                        f"neural feature transitions inconsistent with natural speech"
                    )
                else:
                    reasons.append(
                        f"{feat_name.replace('_', ' ')} anomaly detected "
                        f"(score: {round(score, 3)})"
                    )

        if confidence > 0.85:
            verdict_line = f"⚠️ HIGH CONFIDENCE FAKE AUDIO ({pct}%)"
        elif confidence > 0.70:
            verdict_line = f"⚠️ LIKELY AI-GENERATED AUDIO ({pct}%)"
        else:
            verdict_line = f"⚠️ SUSPECTED SYNTHETIC AUDIO ({pct}%)"

        explanation = f"{verdict_line}.\n\nEvidence:\n"
        if reasons:
            for i, r in enumerate(reasons, 1):
                explanation += f"  {i}. {r.capitalize()}.\n"
        else:
            explanation += "  1. Multiple audio signal anomalies detected.\n"

        explanation += f"\n  Deepfake anomaly score: {round(deepfake_score, 4)}"
        return explanation.strip()

    else:
        # REAL explanation — lowest anomaly features
        low_anomalies = sorted(
            anomaly_scores.items(),
            key=lambda x: x[1]
        )[:3]

        for feat_name, score in low_anomalies:
            val = features.get(feat_name, None)

            if feat_name == "zcr" and val is not None:
                reasons.append(
                    f"natural zero-crossing rate ({round(float(val), 4)}) — "
                    f"consistent with genuine human speech"
                )
            elif feat_name == "hf_energy" and val is not None:
                reasons.append(
                    f"healthy high-frequency energy ({round(float(val), 4)}) — "
                    f"full frequency range present as in authentic audio"
                )
            elif feat_name == "mfcc_smoothness" and val is not None:
                reasons.append(
                    f"natural MFCC variation (score: {round(float(val), 4)}) — "
                    f"frame-to-frame changes match real speech patterns"
                )
            elif feat_name == "f0_var" and val is not None:
                reasons.append(
                    f"natural pitch variance ({round(float(val), 4)}) — "
                    f"fundamental frequency varies naturally as in human speech"
                )
            else:
                reasons.append(
                    f"{feat_name.replace('_', ' ')} within normal range "
                    f"(anomaly: {round(score, 3)})"
                )

        if confidence > 0.85:
            verdict_line = f"✅ HIGH CONFIDENCE AUTHENTIC AUDIO ({pct}%)"
        elif confidence > 0.70:
            verdict_line = f"✅ LIKELY AUTHENTIC AUDIO ({pct}%)"
        else:
            verdict_line = f"✅ PROBABLY AUTHENTIC AUDIO ({pct}%)"

        explanation = f"{verdict_line}.\n\nEvidence:\n"
        if reasons:
            for i, r in enumerate(reasons, 1):
                explanation += f"  {i}. {r.capitalize()}.\n"
        else:
            explanation += "  1. Audio signal characteristics consistent with natural speech.\n"

        explanation += f"\n  Deepfake anomaly score: {round(deepfake_score, 4)}"
        return explanation.strip()


# ─── Public API ────────────────────────────────────────────────────────────────

def analyze_audio(file_path: str) -> dict:
    """
    Calls SelfCalibratingDetector.predict() and maps result
    to project standard schema. Core logic untouched.
    """
    try:
        # ── Call the untouched pipeline ───────────────────────────────────────
        raw = _detector.predict(file_path)

        # ── Map verdict → standard label ──────────────────────────────────────
        verdict = raw.get("verdict", "REAL")
        if verdict == "DEEPFAKE":
            label = "FAKE"
        else:
            label = "REAL"

        # confidence already 0-1 in this pipeline
        confidence  = round(float(raw.get("confidence", 0.5)), 4)
        deepfake_score = round(float(raw.get("deepfake_score", 0.5)), 4)
        features    = raw.get("features", {})
        anomaly_scores = raw.get("anomaly_scores", {})

        explanation = _generate_explanation(
            label, confidence, deepfake_score,
            anomaly_scores, features
        )

        return {
            "label":       label,
            "confidence":  confidence,
            "explanation": explanation,
            "metadata": {
                "deepfake_score":  deepfake_score,
                "top_anomalies": dict(
                    sorted(anomaly_scores.items(),
                           key=lambda x: x[1],
                           reverse=True)[:5]
                ),
                "model": "SelfCalibratingDetector + Wav2Vec2"
            }
        }

    except Exception as e:
        log.error("[analyze_audio] Fatal: %s", e)
        return {
            "label":       "ERROR",
            "confidence":  0.0,
            "explanation": f"Audio analysis failed: {str(e)}",
            "metadata":    {}
        }