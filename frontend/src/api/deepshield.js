import { apiRequest, ApiRequestError } from "../services/apiClient";
import { API_BASE_URL, ENABLE_API_MOCK_FALLBACK } from "../services/runtimeConfig";

/**
 * DeepShield API Layer
 * All backend calls are centralized here.
 * When backend is ready, only this file needs updating.
 *
 * Backend base is configured through env (VITE_API_BASE_URL or VITE_API_URL)
 * Endpoints:
 *   POST /analyze/image  — Person 1 + Person 2
 *   POST /analyze/audio  — Person 4
 *   POST /analyze/video  — Person 1 + Person 2 + Person 4
 */

/**
 * Shared response schema (Integration Contract v1.0):
 * {
 *   status: "success" | "error",
 *   media_type: "image" | "video" | "audio",
 *   label: "REAL" | "FAKE" | "UNCERTAIN",
 *   confidence: 0.0–1.0,
 *   explanation: "Human readable string",
 *   heatmap_url: string | null,
 *   frame_scores: number[] | null,
 *   suspicious_frames: number[] | null,
 *   metadata: object
 * }
 */

function safeNumber(value, fallback = 0) {
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/%$/, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeScore(value) {
  const number = safeNumber(value, 0);
  if (number < 0) return 0;
  if (number > 1 && number <= 100) return number / 100;
  return number;
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSentiment(sentiment) {
  const source = sentiment && typeof sentiment === "object" ? sentiment : {};
  return {
    positive: normalizeScore(source.positive),
    neutral: normalizeScore(source.neutral),
    negative: normalizeScore(source.negative),
  };
}

function normalizeTopics(topics) {
  return normalizeList(topics)
    .map((topic) => ({
      label: typeof topic?.label === "string" ? topic.label : "Unknown",
      score: normalizeScore(topic?.score),
    }))
    .filter((topic) => topic.label);
}

function unwrapAnalysisPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if ("label" in payload || "confidence" in payload || "status" in payload) return payload;

  const wrapped = [payload.result, payload.data, payload.output].find((value) => value && typeof value === "object");
  return wrapped || payload;
}

function normalizeMediaType(mediaType, fallbackMediaType = null) {
  const normalized = typeof mediaType === "string" ? mediaType.toLowerCase() : "";
  if (["image", "video", "audio"].includes(normalized)) return normalized;
  return fallbackMediaType;
}

function normalizeAssetUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!API_BASE_URL) return trimmed;
  if (!trimmed.startsWith("/")) return `${API_BASE_URL}/${trimmed}`;
  return `${API_BASE_URL}${trimmed}`;
}

function normalizeReportPayload(payload) {
  if (!payload || typeof payload !== "object") return null;

  return {
    status: typeof payload.status === "string" ? payload.status : "error",
    result: typeof payload.result === "string" ? payload.result.toUpperCase() : "UNCERTAIN",
    confidence: normalizeScore(payload.confidence),
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : "",
    file_hash: typeof payload.file_hash === "string" ? payload.file_hash : "",
    report_hash: typeof payload.report_hash === "string" ? payload.report_hash : "",
    digital_signature: typeof payload.digital_signature === "string" ? payload.digital_signature : "",
    verification_url: normalizeAssetUrl(payload.verification_url) || payload.verification_url || "",
    pdf_url: normalizeAssetUrl(payload.pdf_url) || payload.pdf_url || "",
  };
}

function normalizeVerifyPayload(payload) {
  if (!payload || typeof payload !== "object") return null;

  return {
    status: typeof payload.status === "string" ? payload.status.toUpperCase() : "INVALID",
    report_hash: typeof payload.report_hash === "string" ? payload.report_hash : "",
    hash_match: Boolean(payload.hash_match),
    signature_valid: Boolean(payload.signature_valid),
    exists_in_db: Boolean(payload.exists_in_db),
  };
}

export function normalizeAnalysisResult(result, fallbackMediaType = null) {
  const payload = unwrapAnalysisPayload(result);
  if (!payload || typeof payload !== "object") return null;

  const rawStatus = typeof payload.status === "string" ? payload.status.toLowerCase() : "success";
  const status = rawStatus === "error" ? "error" : "success";
  const label = typeof payload.label === "string" ? payload.label.toUpperCase() : "UNCERTAIN";
  return {
    ...payload,
    status,
    media_type: normalizeMediaType(payload.media_type, fallbackMediaType),
    label: ["REAL", "FAKE", "UNCERTAIN"].includes(label) ? label : "UNCERTAIN",
    confidence: normalizeScore(payload.confidence),
    explanation: typeof payload.explanation === "string" ? payload.explanation : "",
    heatmap_url: normalizeAssetUrl(payload.heatmap_url),
    frame_scores: normalizeList(payload.frame_scores).map((value) => normalizeScore(value)),
    suspicious_frames: normalizeList(payload.suspicious_frames).map((value) => Math.max(0, Math.trunc(safeNumber(value, 0)))),
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {},

    // Optional fields that audio pipeline may also return.
    transcript: typeof payload.transcript === "string" ? payload.transcript : null,
    sentiment: normalizeSentiment(payload.sentiment),
    detected_topics: normalizeTopics(payload.detected_topics),
    manipulation_risk_score: normalizeScore(payload.manipulation_risk_score),
    flagged_phrases: normalizeList(payload.flagged_phrases).filter((phrase) => typeof phrase === "string" && phrase.trim().length > 0),
  };
}

async function post(endpoint, file, mediaType, onProgress) {
  if (!(file instanceof File)) {
    throw new Error("Invalid file input");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const responsePayload = await apiRequest({
      method: "post",
      endpoint,
      data: formData,
      timeout: 120000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });

    const normalized = normalizeAnalysisResult(responsePayload, mediaType);
    if (!normalized) {
      throw new Error("Invalid JSON from server");
    }

    if (normalized.status === "error") {
      throw new Error(normalized.explanation || "Server returned an error status");
    }

    return normalized;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const normalized = normalizeAnalysisResult(error.data, mediaType);
      if (normalized?.status === "error") {
        throw new Error(normalized.explanation || "Server returned an error status");
      }

      // TODO: Remove fallback once backend stability is guaranteed in all environments.
      if ((error.isNetworkError || error.isTimeout) && ENABLE_API_MOCK_FALLBACK) {
        return normalizeAnalysisResult({
          ...MOCK_RESULT,
          metadata: {
            ...(MOCK_RESULT.metadata || {}),
            mock_fallback: true,
          },
        }, mediaType);
      }
    }

    throw error;
  }
}

export async function analyzeImage(file, onProgress) {
  return post("/analyze/image", file, "image", onProgress);
}

export async function analyzeAudio(file, onProgress) {
  return post("/analyze/audio", file, "audio", onProgress);
}

export async function analyzeVideo(file, onProgress) {
  return post("/analyze/video", file, "video", onProgress);
}

export function detectMediaType(file) {
  const mime = file.type.toLowerCase();
  if (["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(mime)) return "image";
  if (["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/ogg", "audio/flac", "audio/mp4", "audio/x-m4a"].includes(mime)) return "audio";
  if (["video/mp4", "video/avi", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska"].includes(mime)) return "video";

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  if (["wav", "mp3", "ogg", "flac", "m4a"].includes(ext)) return "audio";
  if (["mp4", "avi", "mov", "webm", "mkv"].includes(ext)) return "video";

  return null;
}

export function analyzeFile(file, onProgress) {
  const type = detectMediaType(file);
  if (type === "image") return analyzeImage(file, onProgress);
  if (type === "audio") return analyzeAudio(file, onProgress);
  if (type === "video") return analyzeVideo(file, onProgress);
  throw new Error("Unsupported file type");
}

export async function generateVerifiedReport(file, mediaType) {
  if (!(file instanceof File)) {
    throw new Error("Invalid file input");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (mediaType) {
    formData.append("media_type", mediaType);
  }

  const payload = await apiRequest({
    method: "post",
    endpoint: "/report",
    data: formData,
    timeout: 180000,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const normalized = normalizeReportPayload(payload);
  if (!normalized || normalized.status !== "success") {
    throw new Error("Failed to generate verified report");
  }

  return normalized;
}

export async function verifyReportHash(reportHash) {
  const payload = await apiRequest({
    method: "get",
    endpoint: `/verify?report_hash=${encodeURIComponent(reportHash)}`,
    timeout: 30000,
  });

  const normalized = normalizeVerifyPayload(payload);
  if (!normalized) {
    throw new Error("Invalid verification response");
  }
  return normalized;
}

export async function verifyReportFull({ file, result, confidence, timestamp, reportHash, digitalSignature }) {
  if (!(file instanceof File)) {
    throw new Error("File is required for full verification");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("result", String(result || "UNCERTAIN"));
  formData.append("confidence", String(Number.isFinite(Number(confidence)) ? Number(confidence) : 0));
  formData.append("timestamp", String(timestamp || ""));
  formData.append("report_hash", String(reportHash || ""));
  formData.append("digital_signature", String(digitalSignature || ""));

  const payload = await apiRequest({
    method: "post",
    endpoint: "/verify-full",
    data: formData,
    timeout: 120000,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const normalized = normalizeVerifyPayload(payload);
  if (!normalized) {
    throw new Error("Invalid verification response");
  }
  return normalized;
}

// ─── MOCK DATA (used until backend is live) ─────────────────────────────────
// Remove the export below once backend is connected.
export const MOCK_RESULT = {
  status: "success",
  media_type: "video",
  label: "FAKE",
  confidence: 0.87,
  heatmap_url: null,
  frame_scores: [0.3,0.4,0.5,0.82,0.88,0.91,0.85,0.7,0.6,0.55,0.5,0.48],
  suspicious_frames: [3,4,5],
  transcript: "The government has been secretly funding operations in the middle east since 2019. Our sources confirm that religious groups are being used as proxies in geopolitical conflicts across the region.",
  sentiment: { positive: 0.08, neutral: 0.22, negative: 0.70 },
  detected_topics: [
    { label: "Geopolitical Tension", score: 0.91 },
    { label: "Religious Conflict", score: 0.78 },
    { label: "War", score: 0.65 },
    { label: "Misinformation", score: 0.82 },
  ],
  manipulation_risk_score: 0.76,
  flagged_phrases: ["secretly funding", "religious groups", "proxies in geopolitical"],
  explanation: "Visual and narrative artifacts are consistent with synthetic manipulation.",
  metadata: {
    model_version: "mock-v1",
  },
};
