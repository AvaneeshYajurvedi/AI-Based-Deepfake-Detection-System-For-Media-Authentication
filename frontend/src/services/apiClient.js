import axios from "axios";
import { API_BASE_URL } from "./runtimeConfig";

function joinUrl(base, endpoint) {
  const safeEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (!base) return safeEndpoint;
  return `${base}${safeEndpoint}`;
}

function extractServerMessage(data) {
  if (!data) return "";

  if (typeof data === "string") {
    return data.trim();
  }

  if (Array.isArray(data)) {
    return data.map((item) => extractServerMessage(item)).filter(Boolean).join("; ");
  }

  if (typeof data === "object") {
    const direct = [data.detail, data.message, data.error].find((value) => typeof value === "string" && value.trim());
    if (direct) return direct.trim();

    if (Array.isArray(data.detail)) {
      const validationMessage = data.detail
        .map((item) => {
          if (!item || typeof item !== "object") return "";
          const loc = Array.isArray(item.loc) ? item.loc.join(".") : "request";
          const msg = typeof item.msg === "string" ? item.msg : "validation error";
          return `${loc}: ${msg}`;
        })
        .filter(Boolean)
        .join("; ");

      if (validationMessage) return validationMessage;
    }
  }

  return "";
}

export class ApiRequestError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status || null;
    this.data = options.data;
    this.isTimeout = Boolean(options.isTimeout);
    this.isNetworkError = Boolean(options.isNetworkError);
  }
}

export async function apiRequest({
  method = "get",
  endpoint,
  data,
  headers,
  timeout = 120000,
  onUploadProgress,
}) {
  try {
    const response = await axios({
      method,
      url: joinUrl(API_BASE_URL, endpoint),
      data,
      headers,
      timeout,
      onUploadProgress,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const serverMessage = extractServerMessage(error.response?.data);
      const fallbackMessage = error.code === "ECONNABORTED"
        ? "Request timed out"
        : error.request && !error.response
          ? "Network error - backend unavailable"
          : "API request failed";

      throw new ApiRequestError(serverMessage || fallbackMessage, {
        status: error.response?.status || null,
        data: error.response?.data,
        isTimeout: error.code === "ECONNABORTED",
        isNetworkError: Boolean(error.request && !error.response),
      });
    }

    throw new ApiRequestError("Unexpected API error");
  }
}
