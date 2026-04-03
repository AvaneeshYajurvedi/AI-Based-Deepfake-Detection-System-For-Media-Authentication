"""
video_pipeline.py
-----------------
PS0201 – AI-Based Deepfake Detection System
Video Analysis Pipeline (Person 3 Module)

Pipeline:
  1. FFmpeg frame extraction  → 1 frame/sec, hard cap 60 frames
  2. Run 3 image models on every frame, average their per-frame scores
  3. Compute overall verdict against a hardcoded threshold
  4. Flag temporal-anomaly frames (confidence spike > 0.2 above mean)
  5. Extract audio track → .wav → ready for Person 4's audio module
  6. Return structured result dict

Public API:
    analyze_video(file_path: str) -> dict
"""

import os
import sys
import uuid
import shutil
import logging
import tempfile
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np
from PIL import Image

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
log = logging.getLogger("video_pipeline")

# ---------------------------------------------------------------------------
# Hardcoded decision threshold
# A frame/video confidence score ≥ this value → AI-generated
# ---------------------------------------------------------------------------
DEEPFAKE_THRESHOLD: float = 0.50

# Temporal anomaly: flag a frame if its score exceeds mean + this delta
TEMPORAL_SPIKE_DELTA: float = 0.20

# Maximum frames to analyse (hard cap)
MAX_FRAMES: int = 60

# ---------------------------------------------------------------------------
# Model registry
# Each entry must expose a callable:  predict(pil_image) -> float  (0–1)
# 0.0 = definitely REAL, 1.0 = definitely AI-generated
# ---------------------------------------------------------------------------

def _load_model_siglip_general():
    """
    Backbone : SigLIP fine-tuned on 60k AI + 60k human images (general scenes, no face bias)
    Repo     : Ateeqq/ai-vs-human-image-detector  ✅ verified on HuggingFace
    Labels   : {0: "AI", 1: "Human"}  — works on ANY image content
    Accuracy : ~98% on general AI-vs-human test set

    Install  : pip install torch transformers
    """
    import torch
    from transformers import AutoImageProcessor, SiglipForImageClassification

    device = "cuda" if torch.cuda.is_available() else "cpu"
    repo   = "Ateeqq/ai-vs-human-image-detector"

    log.info("Loading general AI-vs-human SigLIP: %s …", repo)
    processor = AutoImageProcessor.from_pretrained(repo)
    model     = SiglipForImageClassification.from_pretrained(repo)
    model.eval().to(device)

    id2label = model.config.id2label
    # Resolve AI/fake index dynamically
    ai_idx = next(
        (k for k, v in id2label.items() if "ai" in v.lower() or "fake" in v.lower() or "artificial" in v.lower()),
        0
    )
    log.info("Ateeqq SigLIP ready | ai_idx=%d | labels=%s | device=%s", ai_idx, id2label, device)

    def predict(img: Image.Image) -> float:
        inputs = processor(images=img.convert("RGB"), return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1)[0]
        return float(probs[ai_idx].item())

    return predict


def _load_model_vit_general():
    """
    Backbone : ViT fine-tuned on general AI-vs-human generated images
    Repo     : dima806/ai_vs_human_generated_image_detection  ✅ verified on HuggingFace
    Labels   : {0: "human", 1: "AI-generated"}
    Accuracy : ~97.9% on 7 995-image test set — general content, not face-specific

    Install  : pip install torch transformers
    """
    import torch
    from transformers import ViTForImageClassification, ViTImageProcessor

    device = "cuda" if torch.cuda.is_available() else "cpu"
    repo   = "dima806/ai_vs_human_generated_image_detection"

    log.info("Loading general AI-vs-human ViT: %s …", repo)
    processor = ViTImageProcessor.from_pretrained(repo)
    model     = ViTForImageClassification.from_pretrained(repo)
    model.eval().to(device)

    id2label = model.config.id2label
    ai_idx = next(
        (k for k, v in id2label.items() if "ai" in v.lower() or "fake" in v.lower() or "generated" in v.lower()),
        1
    )
    log.info("dima806 general ViT ready | ai_idx=%d | labels=%s | device=%s", ai_idx, id2label, device)

    def predict(img: Image.Image) -> float:
        inputs = processor(images=img.convert("RGB"), return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1)[0]
        return float(probs[ai_idx].item())

    return predict


def _load_model_siglip_v2():
    """
    Backbone : SigLIP2 fine-tuned on real vs AI-generated images (general content)
    Repo     : prithivMLmods/Deepfake-Detect-Siglip2  ✅ verified on HuggingFace
    Labels   : {0: "Fake", 1: "Real"}
    Notes    : Trained on diverse AI-generated content beyond just faces

    Install  : pip install torch transformers
    """
    import torch
    from transformers import AutoImageProcessor, SiglipForImageClassification

    device = "cuda" if torch.cuda.is_available() else "cpu"
    repo   = "prithivMLmods/Deepfake-Detect-Siglip2"

    log.info("Loading SigLIP2 general deepfake detector: %s …", repo)
    processor = AutoImageProcessor.from_pretrained(repo)
    model     = SiglipForImageClassification.from_pretrained(repo)
    model.eval().to(device)

    id2label = model.config.id2label
    fake_idx = next(
        (k for k, v in id2label.items() if "fake" in v.lower() or "ai" in v.lower()),
        0
    )
    log.info("SigLIP2 ready | fake_idx=%d | labels=%s | device=%s", fake_idx, id2label, device)

    def predict(img: Image.Image) -> float:
        inputs = processor(images=img.convert("RGB"), return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}
        with torch.no_grad():
            logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1)[0]
        return float(probs[fake_idx].item())

    return predict


# ---------------------------------------------------------------------------
# Lazy-load models once (module-level singletons)
# ---------------------------------------------------------------------------
_MODELS: Optional[List] = None

def _get_models() -> List:
    global _MODELS
    if _MODELS is None:
        log.info("Loading image models …")
        _MODELS = [
            _load_model_siglip_general(),
            _load_model_vit_general(),
            _load_model_siglip_v2(),
        ]
        log.info("%d models ready", len(_MODELS))
    return _MODELS


# ---------------------------------------------------------------------------
# FFmpeg helpers
# ---------------------------------------------------------------------------

def _check_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        raise EnvironmentError(
            "ffmpeg not found. Install it: sudo apt install ffmpeg  |  brew install ffmpeg"
        )


def _extract_frames(video_path: str, out_dir: str) -> List[str]:
    """
    Extract 1 frame/sec from *video_path* into *out_dir*.
    Returns sorted list of JPEG file paths, capped at MAX_FRAMES.
    """
    pattern = os.path.join(out_dir, "frame_%04d.jpg")
    cmd = [
        "ffmpeg",
        "-y",                      # overwrite
        "-i", video_path,
        "-vf", "fps=1",            # 1 frame per second
        "-frames:v", str(MAX_FRAMES),
        "-q:v", "2",               # high-quality JPEG
        pattern,
    ]
    log.info("Extracting frames: %s", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg frame extraction failed:\n{result.stderr}")

    frames = sorted(Path(out_dir).glob("frame_*.jpg"))
    log.info("Extracted %d frames (cap=%d)", len(frames), MAX_FRAMES)
    return [str(f) for f in frames]



# ---------------------------------------------------------------------------
# Metadata & Provenance Analysis
# ---------------------------------------------------------------------------

_AI_TOOL_SIGNATURES = {
    "runway":           "Runway Gen",
    "pika":             "Pika Labs",
    "sora":             "OpenAI Sora",
    "kling":            "Kling AI (Kuaishou)",
    "hailuo":           "Hailuo AI (MiniMax)",
    "luma":             "Luma Dream Machine",
    "genmo":            "Genmo AI",
    "stable video":     "Stable Video Diffusion",
    "animatediff":      "AnimateDiff",
    "zeroscope":        "ZeroScope",
    "hotshot":          "Hotshot-XL",
    "text2video":       "Text-to-Video model",
    "videocrafter":     "VideoCrafter",
    "modelscope":       "ModelScope Text2Video",
    "cogvideo":         "CogVideo",
    "cogvideox":        "CogVideoX",
    "opensora":         "Open-Sora",
    "make-a-video":     "Meta Make-A-Video",
    "imagen video":     "Google Imagen Video",
    "wan2.1":           "Wan2.1 (Alibaba)",
    "wan 2":            "Wan2.1 (Alibaba)",
    "hunyuan":          "HunyuanVideo (Tencent)",
    "ltxvideo":         "LTX-Video (Lightricks)",
    "ltx-video":        "LTX-Video (Lightricks)",
    "mochi":            "Mochi-1 (Genmo)",
    "pyramid flow":     "Pyramid Flow",
    "lavie":            "LaVie",
    "phenaki":          "Google Phenaki",
}

_SUSPICIOUS_KEYWORDS = [
    "gan", "diffusion", "nerf", "neural render",
    "synthesized", "synthetic", "ai-render", "deepfake",
    "text-to-video", "text2video", "generated",
]

_ENCODER_WHITELIST = [
    "lavf", "lavc", "x264", "x265", "xvid", "avc", "hevc",
    "h264", "h265", "vp8", "vp9", "av1", "mpeg", "aac",
    "apple", "android", "samsung", "sony", "canon", "nikon",
    "gopro", "dji", "handbrake", "adobe", "premiere", "davinci",
    "resolve", "fcpx", "windows", "iphone", "pixel",
]


def _run_ffprobe(video_path):
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format", "-show_streams",
        video_path,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode != 0:
            log.warning("ffprobe failed: %s", result.stderr[:200])
            return None
        return json.loads(result.stdout)
    except Exception as exc:
        log.warning("ffprobe error: %s", exc)
        return None


def _flatten_metadata(probe):
    flat = {}
    fmt = probe.get("format", {})
    for k, v in fmt.items():
        if k != "tags":
            flat[k.lower()] = str(v)
    for k, v in fmt.get("tags", {}).items():
        flat[k.lower()] = str(v)
    for stream in probe.get("streams", []):
        codec_type = stream.get("codec_type", "unknown")
        for k, v in stream.items():
            if k != "tags":
                flat[f"{codec_type}_{k}".lower()] = str(v)
        for k, v in stream.get("tags", {}).items():
            flat[f"{codec_type}_{k}".lower()] = str(v)
    return flat


def analyze_metadata(video_path):
    """
    Extract and analyse video container metadata for AI-generation fingerprints.

    Checks:
      1. Known AI tool signatures in any metadata field (encoder, writing_app, comment, etc.)
      2. Generic suspicious keywords (gan, diffusion, synthetic, generated, etc.)
      3. Missing or Unix-epoch creation timestamp
      4. Suspiciously round duration (AI tools often output exact N-second clips)
      5. Unusual container brand (major_brand)

    Returns dict:
        raw_metadata       : dict   all ffprobe tags flattened
        ai_tool_detected   : str | None
        suspicious_fields  : list[dict]  each {field, value, reason}
        provenance_verdict : "AI-Tool-Detected" | "Suspicious" | "Clean" | "Unknown"
        provenance_notes   : str
    """
    out = {
        "raw_metadata": {},
        "ai_tool_detected": None,
        "suspicious_fields": [],
        "provenance_verdict": "Unknown",
        "provenance_notes": "",
    }

    probe = _run_ffprobe(video_path)
    if probe is None:
        out["provenance_notes"] = "ffprobe unavailable — metadata analysis skipped."
        return out

    flat = _flatten_metadata(probe)
    out["raw_metadata"] = flat
    log.info("Metadata: %d fields extracted", len(flat))

    suspicious = []
    ai_tool = None

    # 1 & 2: scan every field value
    for field, value in flat.items():
        val_lower = value.lower()
        if any(w in val_lower for w in _ENCODER_WHITELIST):
            continue
        for sig, tool_name in _AI_TOOL_SIGNATURES.items():
            if sig in val_lower:
                ai_tool = tool_name
                suspicious.append({
                    "field": field,
                    "value": value,
                    "reason": f"Matches known AI generation tool: {tool_name}",
                })
                log.info("AI tool fingerprint: field=%s sig=%s tool=%s", field, sig, tool_name)
                break
        else:
            for kw in _SUSPICIOUS_KEYWORDS:
                if kw in val_lower:
                    suspicious.append({
                        "field": field,
                        "value": value,
                        "reason": f"Contains suspicious keyword: '{kw}'",
                    })
                    break

    # 3: missing / epoch creation timestamp
    ct = flat.get("creation_time") or flat.get("video_creation_time", "")
    if ct in ("", "0", "1970-01-01T00:00:00.000000Z"):
        suspicious.append({
            "field": "creation_time",
            "value": ct or "(missing)",
            "reason": "Missing or Unix-epoch timestamp — unusual for camera-recorded video.",
        })

    # 4: suspiciously round duration
    try:
        dur = float(flat.get("duration", "0"))
        if dur > 0 and dur == round(dur) and dur <= 120:
            suspicious.append({
                "field": "duration",
                "value": str(dur),
                "reason": f"Exactly {int(dur)}s duration — AI tools frequently produce round-length clips.",
            })
    except (ValueError, TypeError):
        pass

    # 5: unusual container brand
    brand = flat.get("major_brand", "").lower().strip()
    legit_brands = {"isom", "mp42", "avc1", "qt  ", "m4v ", "f4v ", "3gp5", "mp41", "msnv"}
    if brand and brand not in legit_brands:
        suspicious.append({
            "field": "major_brand",
            "value": brand,
            "reason": f"Unusual container brand '{brand}' — not typical of camera-recorded footage.",
        })

    out["suspicious_fields"] = suspicious

    # Verdict
    hard_flags = [s for s in suspicious if "tool" in s["reason"].lower() or "keyword" in s["reason"].lower()]
    if ai_tool:
        out["ai_tool_detected"] = ai_tool
        out["provenance_verdict"] = "AI-Tool-Detected"
    elif len(hard_flags) >= 1 or len(suspicious) >= 3:
        out["provenance_verdict"] = "Suspicious"
    else:
        out["provenance_verdict"] = "Clean"

    # Notes
    notes = []
    if ai_tool:
        notes.append(f"AI generation tool identified in metadata: {ai_tool}.")
    if suspicious:
        top = suspicious[:3]
        flag_str = "; ".join(f"{s['field']}='{s['value']}' ({s['reason']})" for s in top)
        if len(suspicious) > 3:
            flag_str += f" … +{len(suspicious)-3} more"
        notes.append(f"Suspicious metadata flags: {flag_str}.")
    if not notes:
        notes.append("No known AI tool signatures or suspicious metadata found.")
    encoder_val = flat.get("encoder") or flat.get("video_encoder", "not reported")
    notes.append(f"Reported encoder: {encoder_val}.")
    out["provenance_notes"] = " ".join(notes)
    log.info("Provenance verdict: %s", out["provenance_verdict"])
    return out

def _extract_audio(video_path: str, out_dir: str) -> Optional[str]:
    """
    Extract audio track as 16-kHz mono WAV.
    Returns the .wav file path, or None if the video has no audio.
    """
    wav_path = os.path.join(out_dir, "audio_track.wav")
    cmd = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-vn",                     # no video
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        wav_path,
    ]
    log.info("Extracting audio …")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 or not os.path.exists(wav_path):
        log.warning("No audio track found (or extraction failed). Skipping audio.")
        return None
    size = os.path.getsize(wav_path)
    log.info("Audio saved: %s (%.1f KB)", wav_path, size / 1024)
    return wav_path


# ---------------------------------------------------------------------------
# Frame-level inference
# ---------------------------------------------------------------------------

def _score_frame(img_path: str, models: List) -> float:
    """
    Run all 3 models on a single frame and return the averaged score.
    Works on any frame content — faces, scenes, objects, etc.
    """
    try:
        img = Image.open(img_path).convert("RGB")
    except Exception as exc:
        log.warning("Cannot open frame %s: %s", img_path, exc)
        return 0.5

    scores = []
    for i, model_fn in enumerate(models):
        try:
            s = model_fn(img)
            scores.append(float(np.clip(s, 0.0, 1.0)))
        except Exception as exc:
            log.warning("Model %d failed on %s: %s", i, img_path, exc)

    if not scores:
        return 0.5

    avg = float(np.mean(scores))
    log.debug("Frame %s – model scores %s → avg %.4f", img_path, scores, avg)
    return avg


# ---------------------------------------------------------------------------
# Explanation generator
# ---------------------------------------------------------------------------

def _generate_explanation(
    verdict: str,
    confidence: float,
    threshold: float,
    frame_scores: List[float],
    anomaly_indices: List[int],
    total_frames: int,
) -> str:
    """
    Build a human-readable explanation of why the video was classified
    as AI-Generated or Real, based on frame score statistics.
    """
    pct = confidence * 100
    margin = abs(confidence - threshold) * 100
    high_frames  = sum(1 for s in frame_scores if s >= 0.65)
    low_frames   = sum(1 for s in frame_scores if s <= 0.35)
    mid_frames   = total_frames - high_frames - low_frames
    score_std    = float(np.std(frame_scores)) if frame_scores else 0.0
    consistency  = "highly consistent" if score_std < 0.05 else \
                   "fairly consistent" if score_std < 0.12 else "inconsistent"

    lines: List[str] = []

    # ── Verdict headline ──────────────────────────────────────────────────
    if verdict == "AI-Generated":
        strength = (
            "very high" if confidence >= 0.80 else
            "high"      if confidence >= 0.65 else
            "moderate"  if confidence >= threshold else
            "borderline"
        )
        lines.append(
            f"The video was classified as AI-Generated with {strength} confidence "
            f"({pct:.1f}%, threshold {threshold*100:.0f}%)."
        )
    else:
        strength = (
            "very high" if confidence <= 0.25 else
            "high"      if confidence <= 0.40 else
            "moderate"  if confidence < threshold else
            "borderline"
        )
        lines.append(
            f"The video was classified as Real with {strength} confidence "
            f"(AI score {pct:.1f}% is {margin:.1f}pp below threshold {threshold*100:.0f}%)."
        )

    # ── Frame distribution ────────────────────────────────────────────────
    lines.append(
        f"Across {total_frames} sampled frame(s): "
        f"{high_frames} scored strongly AI (≥65%), "
        f"{low_frames} scored strongly Real (≤35%), "
        f"{mid_frames} were ambiguous (35–65%)."
    )

    # ── Score consistency ─────────────────────────────────────────────────
    lines.append(
        f"Frame scores were {consistency} (std={score_std:.3f}), "
        + (
            "suggesting uniform AI-generation throughout the video."
            if verdict == "AI-Generated" and score_std < 0.08 else
            "suggesting natural variation expected in real footage."
            if verdict == "Real" and score_std < 0.12 else
            "indicating mixed content or varying generation quality across frames."
        )
    )

    # ── Temporal anomalies ────────────────────────────────────────────────
    if anomaly_indices:
        frame_list = ", ".join(str(i + 1) for i in anomaly_indices[:5])
        suffix = f" and {len(anomaly_indices)-5} more" if len(anomaly_indices) > 5 else ""
        lines.append(
            f"Temporal anomalies detected at frame(s) {frame_list}{suffix} — "
            f"these frames spiked >20% above the mean score, which may indicate "
            f"splicing, scene cuts with generated content, or inconsistent editing."
        )
    else:
        lines.append(
            "No temporal anomalies detected — score was stable across all frames."
        )

    # ── Borderline warning ────────────────────────────────────────────────
    if margin < 5.0:
        lines.append(
            f"⚠ The result is borderline (margin={margin:.1f}pp). "
            f"Consider manual review or adjusting the threshold."
        )

    return " ".join(lines)


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------

def analyze_video(file_path: str, threshold: float = DEEPFAKE_THRESHOLD) -> Dict[str, Any]:
    """
    Main entry point for video deepfake analysis.

    Parameters
    ----------
    file_path : str
        Absolute or relative path to the input video file.
    threshold : float, optional
        Decision boundary. Confidence >= threshold → "AI-Generated".
        Defaults to DEEPFAKE_THRESHOLD (0.6). Pass any value 0.0–1.0 to override.

    Returns
    -------
    dict with keys:
        verdict        : "AI-Generated" | "Real"
        confidence     : float  0–1  (avg across all frames)
        threshold_used : float  (DEEPFAKE_THRESHOLD constant)
        frame_scores   : list[float]  per-frame averaged confidence
        anomaly_frames : list[int]    0-based frame indices with score spikes
        audio_path     : str | None   path to extracted .wav (for audio module)
        total_frames   : int
        error          : str | None   non-None if analysis partially/fully failed
    """
    result: Dict[str, Any] = {
        "verdict": None,
        "confidence": None,
        "threshold_used": threshold,
        "frame_scores": [],
        "anomaly_frames": [],
        "audio_path": None,
        "total_frames": 0,
        "explanation": None,
        "metadata": None,
        "error": None,
    }

    # ── Validate input ──────────────────────────────────────────────────────
    if not os.path.isfile(file_path):
        result["error"] = f"File not found: {file_path}"
        log.error(result["error"])
        return result

    try:
        _check_ffmpeg()
    except EnvironmentError as exc:
        result["error"] = str(exc)
        return result

    # ── Temp workspace ───────────────────────────────────────────────────────
    tmp_dir = tempfile.mkdtemp(prefix="deepfake_video_")
    log.info("Working directory: %s", tmp_dir)

    try:
        # ── Step 1 : extract frames ──────────────────────────────────────────
        try:
            frame_paths = _extract_frames(file_path, tmp_dir)
        except RuntimeError as exc:
            result["error"] = f"Frame extraction error: {exc}"
            return result

        if not frame_paths:
            result["error"] = "No frames could be extracted from the video."
            return result

        result["total_frames"] = len(frame_paths)

        # ── Step 2 : extract audio ────────────────────────────────────────────
        audio_wav = _extract_audio(file_path, tmp_dir)
        result["audio_path"] = audio_wav  # hand-off path for Person 4's module

        # ── Step 3 : score every frame (3 models → avg per frame) ─────────────
        models = _get_models()
        frame_scores: List[float] = []

        for idx, fp in enumerate(frame_paths):
            score = _score_frame(fp, models)
            frame_scores.append(score)
            log.info("Frame %3d/%d  score=%.4f", idx + 1, len(frame_paths), score)

        result["frame_scores"] = frame_scores

        # ── Step 4 : overall confidence & verdict ─────────────────────────────
        overall_confidence = float(np.mean(frame_scores))
        result["confidence"] = round(overall_confidence, 4)
        result["verdict"] = (
            "AI-Generated" if overall_confidence >= threshold else "Real"
        )

        # ── Step 5 : temporal anomaly detection ───────────────────────────────
        mean_score = float(np.mean(frame_scores))
        anomaly_indices = [
            i for i, s in enumerate(frame_scores)
            if s > mean_score + TEMPORAL_SPIKE_DELTA
        ]
        result["anomaly_frames"] = anomaly_indices

        # ── Step 6 : explanation ──────────────────────────────────────────────
        result["explanation"] = _generate_explanation(
            verdict=result["verdict"],
            confidence=overall_confidence,
            threshold=threshold,
            frame_scores=frame_scores,
            anomaly_indices=anomaly_indices,
            total_frames=len(frame_paths),
        )

        # ── Summary log ───────────────────────────────────────────────────────
        log.info(
            "=== VIDEO ANALYSIS COMPLETE ===\n"
            "  File          : %s\n"
            "  Frames        : %d\n"
            "  Avg confidence: %.4f\n"
            "  Threshold     : %.2f\n"
            "  Verdict       : %s\n"
            "  Anomaly frames: %s\n"
            "  Audio WAV     : %s\n"
            "  Provenance    : %s\n"
            "  Explanation   : %s",
            file_path,
            len(frame_paths),
            overall_confidence,
            threshold,
            result["verdict"],
            anomaly_indices if anomaly_indices else "none",
            audio_wav or "no audio",
            result["metadata"]["provenance_verdict"] if result["metadata"] else "skipped",
            result["explanation"],
        )

    finally:
        # Keep tmp_dir so audio .wav is accessible by Person 4.
        # Caller is responsible for cleanup after audio module finishes.
        # To auto-clean, uncomment: shutil.rmtree(tmp_dir, ignore_errors=True)
        pass

    return result


# ---------------------------------------------------------------------------
# CLI convenience runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python video_pipeline.py <video_file> [threshold]")
        print("  threshold: float 0.0–1.0, default 0.6")
        sys.exit(1)

    video_file = sys.argv[1]
    threshold_arg = float(sys.argv[2]) if len(sys.argv) > 2 else DEEPFAKE_THRESHOLD

    print(f"\nAnalysing: {video_file}  (threshold={threshold_arg})\n{'─'*50}")
    output = analyze_video(video_file, threshold=threshold_arg)

    print(f"  Verdict       : {output['verdict']}")
    print(f"  Confidence    : {output['confidence']:.4f}  (threshold={output['threshold_used']})")
    print(f"  Total frames  : {output['total_frames']}")
    print(f"  Anomaly frames: {output['anomaly_frames'] or 'none'}")
    print(f"  Audio WAV     : {output['audio_path'] or 'no audio track'}")
    print(f"  Explanation   : {output['explanation']}")
    if output["metadata"]:
        md = output["metadata"]
        print(f"  Provenance    : [{md['provenance_verdict']}] {md['provenance_notes']}")
        if md["ai_tool_detected"]:
            print(f"  *** AI Tool Detected: {md['ai_tool_detected']} ***")
    if output["error"]:
        print(f"  ERROR         : {output['error']}")
    print()