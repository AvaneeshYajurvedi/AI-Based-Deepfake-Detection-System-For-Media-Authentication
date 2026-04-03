import { apiRequest, ApiRequestError } from "../services/apiClient";
import { ENABLE_API_MOCK_FALLBACK } from "../services/runtimeConfig";

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
    heatmap_url: typeof payload.heatmap_url === "string" ? payload.heatmap_url : null,
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
    const response = await apiRequest({
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

    const normalized = normalizeAnalysisResult(response.data, mediaType);
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
        return normalizeAnalysisResult(MOCK_RESULT, mediaType);
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
  if (["image/jpeg", "image/png"].includes(mime)) return "image";
  if (["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3"].includes(mime)) return "audio";
  if (["video/mp4", "video/avi", "video/x-msvideo"].includes(mime)) return "video";

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png"].includes(ext)) return "image";
  if (["wav", "mp3"].includes(ext)) return "audio";
  if (["mp4", "avi"].includes(ext)) return "video";

  return null;
}

export function analyzeFile(file, onProgress) {
  const type = detectMediaType(file);
  if (type === "image") return analyzeImage(file, onProgress);
  if (type === "audio") return analyzeAudio(file, onProgress);
  if (type === "video") return analyzeVideo(file, onProgress);
  throw new Error("Unsupported file type");
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
