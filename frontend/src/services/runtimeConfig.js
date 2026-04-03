const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "").trim();

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

const rawUseMock = import.meta.env.VITE_USE_MOCK;
export const USE_MOCK = rawUseMock ? rawUseMock === "true" : !API_BASE_URL;

const rawMockFallback = import.meta.env.VITE_API_MOCK_FALLBACK;
export const ENABLE_API_MOCK_FALLBACK = rawMockFallback ? rawMockFallback === "true" : true;

export const API_TARGET = API_BASE_URL || "not-configured";
