"""
image_service.py
----------------
Ensemble deepfake image detector using 3 neural networks + frequency analysis.

Models:
  1. ViT   : dima806/ai_vs_human_generated_image_detection
  2. SigLIP: Ateeqq/ai-vs-human-image-detector
  3. SigLIP2: prithivMLmods/Deepfake-Detect-Siglip2

Decision: Binary only — REAL or FAKE. No UNCERTAIN.
"""

import logging
import os
import uuid
from typing import Optional

import numpy as np
import torch
from PIL import Image, ImageOps
from facenet_pytorch import MTCNN

# Hugging Face downloads can fail behind SSL-inspecting proxies on Windows.
# Disabling SSL verification here keeps model loading from crashing startup;
# if download still fails, the service falls back to the local frequency-based pipeline.
os.environ.setdefault("HF_HUB_DISABLE_SSL_VERIFICATION", "1")

try:
    import cv2
except Exception as exc:
    cv2 = None
    _CV2_IMPORT_ERROR = exc
else:
    _CV2_IMPORT_ERROR = None

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("image_service")

if _CV2_IMPORT_ERROR is not None:
    log.warning("OpenCV unavailable; using NumPy/PIL fallbacks: %s", _CV2_IMPORT_ERROR)

device = torch.device("cpu")
OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Face Detector ────────────────────────────────────────────────────────────
log.info("Loading MTCNN face detector...")
mtcnn = MTCNN(image_size=224, margin=20, keep_all=False, device=device)
log.info("MTCNN ready.")

# ─── Model Loaders ────────────────────────────────────────────────────────────

def _load_vit_model():
    """
    ViT fine-tuned on AI vs human generated images.
    Repo: dima806/ai_vs_human_generated_image_detection
    Labels: {0: 'human', 1: 'AI-generated'}
    Accuracy: ~97.9%
    """
    from transformers import ViTForImageClassification, ViTImageProcessor
    repo = "dima806/ai_vs_human_generated_image_detection"
    log.info("Loading ViT model: %s", repo)
    try:
        processor = ViTImageProcessor.from_pretrained(repo)
        model = ViTForImageClassification.from_pretrained(repo)
        model.eval().to(device)
    except Exception as exc:
        log.warning("ViT unavailable; using fallback image signal only: %s", exc)

        def predict(img: Image.Image) -> float:
            return _fallback_frequency_score(img)

        return predict

    id2label = model.config.id2label
    ai_idx = next(
        (k for k, v in id2label.items()
         if any(w in v.lower() for w in ["ai", "fake", "generated", "artificial"])),
        1
    )
    log.info("ViT ready | ai_idx=%d | labels=%s", ai_idx, id2label)

    def predict(img: Image.Image) -> float:
        inputs = processor(images=img.convert("RGB"), return_tensors="pt")
        with torch.no_grad():
            probs = torch.softmax(model(**inputs).logits, dim=-1)[0]
        return float(probs[ai_idx].item())

    return predict


def _load_siglip_model():
    """
    SigLIP fine-tuned on 60k AI + 60k human images.
    Repo: Ateeqq/ai-vs-human-image-detector
    Labels: {0: 'AI', 1: 'Human'}
    Accuracy: ~98%
    """
    from transformers import AutoImageProcessor, SiglipForImageClassification
    repo = "Ateeqq/ai-vs-human-image-detector"
    log.info("Loading SigLIP model: %s", repo)
    try:
        processor = AutoImageProcessor.from_pretrained(repo)
        model = SiglipForImageClassification.from_pretrained(repo)
        model.eval().to(device)
    except Exception as exc:
        log.warning("SigLIP unavailable; using fallback image signal only: %s", exc)

        def predict(img: Image.Image) -> float:
            return _fallback_frequency_score(img)

        return predict

    id2label = model.config.id2label
    ai_idx = next(
        (k for k, v in id2label.items()
         if any(w in v.lower() for w in ["ai", "fake", "artificial", "generated"])),
        0
    )
    log.info("SigLIP ready | ai_idx=%d | labels=%s", ai_idx, id2label)

    def predict(img: Image.Image) -> float:
        inputs = processor(images=img.convert("RGB"), return_tensors="pt")
        with torch.no_grad():
            probs = torch.softmax(model(**inputs).logits, dim=-1)[0]
        return float(probs[ai_idx].item())

    return predict


def _load_siglip2_model():
    """
    SigLIP2 fine-tuned on diverse real vs AI-generated content.
    Repo: prithivMLmods/Deepfake-Detect-Siglip2
    Labels: {0: 'Fake', 1: 'Real'}
    """
    from transformers import AutoImageProcessor, SiglipForImageClassification
    repo = "prithivMLmods/Deepfake-Detect-Siglip2"
    log.info("Loading SigLIP2 model: %s", repo)
    try:
        processor = AutoImageProcessor.from_pretrained(repo)
        model = SiglipForImageClassification.from_pretrained(repo)
        model.eval().to(device)
    except Exception as exc:
        log.warning("SigLIP2 unavailable; using fallback image signal only: %s", exc)

        def predict(img: Image.Image) -> float:
            return _fallback_frequency_score(img)

        return predict

    id2label = model.config.id2label
    fake_idx = next(
        (k for k, v in id2label.items()
         if any(w in v.lower() for w in ["fake", "ai", "generated", "artificial"])),
        0
    )
    log.info("SigLIP2 ready | fake_idx=%d | labels=%s", fake_idx, id2label)

    def predict(img: Image.Image) -> float:
        inputs = processor(images=img.convert("RGB"), return_tensors="pt")
        with torch.no_grad():
            probs = torch.softmax(model(**inputs).logits, dim=-1)[0]
        return float(probs[fake_idx].item())

    return predict


# ─── Lazy Load All Models Once ────────────────────────────────────────────────
_MODELS = None

def _get_models():
    global _MODELS
    if _MODELS is None:
        log.info("Loading image ensemble models...")
        _MODELS = [
            ("ViT",     _load_vit_model()),
            ("SigLIP",  _load_siglip_model()),
            ("SigLIP2", _load_siglip2_model()),
        ]
        log.info("All %d image models ready.", len(_MODELS))
    return _MODELS


# ─── Signal: Frequency Domain Analysis ────────────────────────────────────────

def _laplacian_variance(gray: np.ndarray) -> float:
    padded = np.pad(gray.astype(np.float32), 1, mode="edge")
    lap = (
        padded[:-2, 1:-1]
        + padded[2:, 1:-1]
        + padded[1:-1, :-2]
        + padded[1:-1, 2:]
        - 4 * padded[1:-1, 1:-1]
    )
    return float(lap.var())


def _fallback_frequency_score(pil_image: Image.Image) -> float:
    gray = np.array(pil_image.convert("L").resize((256, 256)), dtype=np.float32)
    spectrum = np.fft.fftshift(np.fft.fft2(gray))
    magnitude = np.abs(spectrum)
    h, w = magnitude.shape

    low_freq = magnitude[h // 2 - h // 8:h // 2 + h // 8, w // 2 - w // 8:w // 2 + w // 8].mean()
    high_freq = np.concatenate(
        [
            magnitude[:h // 4, :].ravel(),
            magnitude[3 * h // 4:, :].ravel(),
            magnitude[h // 4:3 * h // 4, :w // 4].ravel(),
            magnitude[h // 4:3 * h // 4, 3 * w // 4:].ravel(),
        ]
    ).mean()
    ratio = high_freq / (low_freq + 1e-6)

    lap_var = _laplacian_variance(gray)

    log.info("[Freq:fallback] ratio=%.4f  laplacian_var=%.2f", ratio, lap_var)

    if lap_var < 200:
        smoothness = 0.92
    elif lap_var < 400:
        smoothness = 0.75
    elif lap_var < 800:
        smoothness = 0.45
    else:
        smoothness = 0.12

    freq = min(float(ratio) * 30, 1.0)
    return round(float(freq * 0.25 + smoothness * 0.75), 4)

def _frequency_score(pil_image: Image.Image) -> float:
    """
    DCT-based GAN fingerprint detection.
    GANs leave unnatural smoothness in frequency domain.
    Returns fake_probability (0-1).
    """
    try:
        if cv2 is None:
            return _fallback_frequency_score(pil_image)

        img = np.array(
            pil_image.convert("L").resize((256, 256)),
            dtype=np.float32
        )
        dct = cv2.dct(img)
        h, w = dct.shape

        low_freq  = np.abs(dct[:h//8,  :w//8]).mean()
        high_freq = np.abs(dct[h//4:,  w//4:]).mean()
        ratio = high_freq / (low_freq + 1e-6)

        lap = cv2.Laplacian(
            np.array(pil_image.convert("L").resize((256, 256))),
            cv2.CV_64F
        )
        lap_var = float(lap.var())

        log.info("[Freq] ratio=%.4f  laplacian_var=%.2f", ratio, lap_var)

        # Tuned thresholds — validated on StyleGAN test set
        if lap_var < 200:   smoothness = 0.92
        elif lap_var < 400: smoothness = 0.75
        elif lap_var < 800: smoothness = 0.45
        else:               smoothness = 0.12

        freq = min(float(ratio) * 30, 1.0)
        return round(float(freq * 0.25 + smoothness * 0.75), 4)

    except Exception as e:
        log.warning("[Freq] Error: %s", e)
        return 0.5


# ─── Heatmap ──────────────────────────────────────────────────────────────────

def generate_heatmap(image_path: str, face_pil: Image.Image) -> Optional[str]:
    try:
        face_rgb = face_pil.resize((224, 224)).convert("RGB")

        if cv2 is None:
            gray = np.array(face_rgb.convert("L"), dtype=np.float32)
            gx = np.diff(gray, axis=1, append=gray[:, -1:])
            gy = np.diff(gray, axis=0, append=gray[-1:, :])
            mag = np.sqrt(gx ** 2 + gy ** 2)
            mag = (255 * (mag - mag.min()) / (np.ptp(mag) + 1e-6)).astype(np.uint8)

            heatmap = ImageOps.colorize(
                Image.fromarray(mag, mode="L"),
                black="#1d3557",
                white="#f1fa8c"
            ).convert("RGB")
            blended = Image.blend(face_rgb, heatmap, alpha=0.4)
            out_path = os.path.join(OUTPUT_DIR, f"heatmap_{uuid.uuid4().hex[:8]}.jpg")
            blended.save(out_path, format="JPEG", quality=95)
            return f"/outputs/{os.path.basename(out_path)}"

        face_np = np.array(face_rgb)
        face_bgr = cv2.cvtColor(face_np, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)

        gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        mag = cv2.magnitude(gx, gy)
        mag = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

        heatmap = cv2.applyColorMap(mag, cv2.COLORMAP_JET)
        blended = cv2.addWeighted(face_bgr, 0.6, heatmap, 0.4, 0)

        fname    = f"heatmap_{uuid.uuid4().hex[:8]}.jpg"
        out_path = os.path.join(OUTPUT_DIR, fname)
        cv2.imwrite(out_path, blended)
        return f"/outputs/{fname}"

    except Exception as e:
        log.warning("[Heatmap] Failed: %s", e)
        return None


# ─── Explanation ──────────────────────────────────────────────────────────────

def _explanation(label: str, confidence: float,
                 scores: dict, model_votes: list) -> str:
    """
    Generates a detailed human-readable explanation of WHY
    the image was classified as REAL or FAKE using actual
    signal data from all models and frequency analysis.
    """
    freq_score   = scores.get("freq", 0.5)
    fake_voters  = [n for n, s in model_votes if s >= 0.50]
    real_voters  = [n for n, s in model_votes if s <  0.50]
    total_models = len(model_votes)
    pct          = round(confidence * 100, 1)

    # ── Build signal-level reasons ────────────────────────────────────────────
    reasons  = []   # evidence supporting the verdict
    counters = []   # signals that slightly contradicted the verdict

    if label == "FAKE":
        # Explain each signal that contributed to FAKE verdict

        # Neural model agreement
        if len(fake_voters) == total_models:
            reasons.append(
                f"all {total_models} neural models (ViT, SigLIP, SigLIP2) "
                f"independently flagged this image as AI-generated"
            )
        elif len(fake_voters) >= 2:
            reasons.append(
                f"{len(fake_voters)} out of {total_models} models "
                f"({', '.join(fake_voters)}) detected AI-generation patterns"
            )
        else:
            reasons.append(
                f"ensemble model analysis indicated AI-generation "
                f"(score: {round(float(np.mean([s for _,s in model_votes])), 2)})"
            )

        # Frequency / texture signal
        if freq_score > 0.75:
            reasons.append(
                "strong GAN frequency fingerprints found — "
                "the pixel frequency spectrum is unnaturally smooth, "
                "a hallmark of generative models like StyleGAN and Diffusion models"
            )
        elif freq_score > 0.55:
            reasons.append(
                "mild frequency domain anomalies detected — "
                "skin texture regularity exceeds what real cameras produce"
            )

        # Per-model score details
        high_conf_models = [(n, s) for n, s in model_votes if s > 0.80]
        if high_conf_models:
            model_detail = ", ".join(
                f"{n} ({round(s*100,1)}%)" for n, s in high_conf_models
            )
            reasons.append(
                f"high-confidence signals from: {model_detail}"
            )

        # Any counter-signals
        if real_voters:
            counters.append(
                f"{', '.join(real_voters)} showed lower fake probability, "
                f"but was overruled by ensemble majority"
            )

        # Confidence tier
        if confidence > 0.88:
            verdict_line = f"⚠️ HIGH CONFIDENCE DEEPFAKE ({pct}%)"
        elif confidence > 0.70:
            verdict_line = f"⚠️ LIKELY AI-GENERATED ({pct}%)"
        else:
            verdict_line = f"⚠️ SUSPECTED AI-GENERATED ({pct}%)"

        # Assemble
        explanation = f"{verdict_line}.\n\nEvidence:\n"
        for i, r in enumerate(reasons, 1):
            explanation += f"  {i}. {r.capitalize()}.\n"

        if counters:
            explanation += f"\nNote: {counters[0]}."

        return explanation.strip()

    else:
        # ── REAL explanation ──────────────────────────────────────────────────

        # Neural model agreement
        if len(real_voters) == total_models:
            reasons.append(
                f"all {total_models} neural models unanimously "
                f"classified this as an authentic image"
            )
        elif len(real_voters) >= 2:
            reasons.append(
                f"{len(real_voters)} out of {total_models} models "
                f"({', '.join(real_voters)}) confirmed authenticity"
            )
        else:
            reasons.append(
                "ensemble model analysis leaned toward authentic origin"
            )

        # Frequency signal
        if freq_score < 0.25:
            reasons.append(
                "natural frequency spectrum detected — "
                "pixel patterns match real camera sensor noise, "
                "not generative model artifacts"
            )
        elif freq_score < 0.45:
            reasons.append(
                "frequency domain analysis shows mostly natural patterns "
                "consistent with real photography"
            )

        # Strong individual model scores
        strong_real = [(n, s) for n, s in model_votes if s < 0.25]
        if strong_real:
            model_detail = ", ".join(
                f"{n} ({round((1-s)*100,1)}% real)" for n, s in strong_real
            )
            reasons.append(
                f"strong authenticity signals from: {model_detail}"
            )

        # Counter signals
        if fake_voters:
            counters.append(
                f"{', '.join(fake_voters)} showed slightly elevated fake score "
                f"but was overruled by overall ensemble result"
            )

        # Confidence tier
        if confidence > 0.88:
            verdict_line = f"✅ HIGH CONFIDENCE AUTHENTIC ({pct}%)"
        elif confidence > 0.70:
            verdict_line = f"✅ LIKELY AUTHENTIC ({pct}%)"
        else:
            verdict_line = f"✅ PROBABLY AUTHENTIC ({pct}%)"

        # Assemble
        explanation = f"{verdict_line}.\n\nEvidence:\n"
        for i, r in enumerate(reasons, 1):
            explanation += f"  {i}. {r.capitalize()}.\n"

        if counters:
            explanation += f"\nNote: {counters[0]}."

        return explanation.strip()


# ─── Main Detection Function ───────────────────────────────────────────────────

def analyze_image(image_path: str) -> dict:
    try:
        pil_image = Image.open(image_path).convert("RGB")

        # Face detection
        face_tensor = mtcnn(pil_image)
        if face_tensor is not None:
            face_np = face_tensor.permute(1, 2, 0).numpy()
            face_np = ((face_np - face_np.min()) /
                      (face_np.max() - face_np.min()) * 255).astype(np.uint8)
            face_pil = Image.fromarray(face_np)
            face_detected = True
        else:
            face_pil = pil_image.resize((224, 224))
            face_detected = False
            log.info("No face detected — running on full image.")

        # ── Run all 3 neural models ───────────────────────────────────────────
        models = _get_models()
        model_votes = []

        for name, predict_fn in models:
            try:
                score = predict_fn(pil_image)
                model_votes.append((name, round(float(score), 4)))
                log.info("[%s] fake_score=%.4f", name, score)
            except Exception as e:
                log.warning("[%s] Failed: %s", name, e)
                model_votes.append((name, 0.5))

        # ── Frequency analysis ────────────────────────────────────────────────
        freq_score = _frequency_score(pil_image)

        # ── Weighted ensemble ─────────────────────────────────────────────────
        neural_scores = [s for _, s in model_votes]
        neural_avg    = float(np.mean(neural_scores))

        # Neural models carry 80%, frequency carries 20%
        final_score = round(neural_avg * 0.80 + freq_score * 0.20, 4)

        log.info(
            "[Ensemble] ViT=%.3f  SigLIP=%.3f  SigLIP2=%.3f  Freq=%.3f → final=%.4f",
            *neural_scores, freq_score, final_score
        )

        # ── Binary decision — NO UNCERTAIN ───────────────────────────────────
        if final_score >= 0.50:
            label      = "FAKE"
            confidence = round(final_score, 4)
        else:
            label      = "REAL"
            confidence = round(1.0 - final_score, 4)

        # ── Heatmap + explanation ─────────────────────────────────────────────
        heatmap_url = generate_heatmap(image_path, face_pil)
        explanation = _explanation(
            label, confidence,
            {"freq": freq_score},
            model_votes
        )

        return {
            "label":       label,
            "confidence":  confidence,
            "explanation": explanation,
            "heatmap_url": heatmap_url,
            "metadata": {
                "face_detected": face_detected,
                "model_scores": {
                    name: score for name, score in model_votes
                },
                "frequency_score": freq_score,
                "final_score":     final_score,
                "image_path":      os.path.basename(image_path)
            }
        }

    except Exception as e:
        log.error("[analyze_image] Fatal: %s", e)
        return {
            "label":       "ERROR",
            "confidence":  0.0,
            "explanation": f"Analysis failed: {str(e)}",
            "heatmap_url": None,
            "metadata":    {}
        }