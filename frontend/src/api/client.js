import axios from "axios";

function normalizeOrigin(url) {
  if (url == null) return "";
  const s = String(url).trim().replace(/\/$/, "");
  return s || "";
}

/**
 * Real backend origin (OAuth redirects, or prod API URL).
 * Prefer VITE_BACKEND_ORIGIN; else VITE_API_URL if it looks absolute; else dev default.
 */
const backendOrigin =
  normalizeOrigin(import.meta.env.VITE_BACKEND_ORIGIN) ||
  (normalizeOrigin(import.meta.env.VITE_API_URL).startsWith("http")
    ? normalizeOrigin(import.meta.env.VITE_API_URL)
    : "") ||
  "http://127.0.0.1:8000";

/**
 * If VITE_API_URL is set to an http(s) URL, call API directly.
 * Otherwise in dev, use same-origin `/api` (Vite proxy → backend).
 */
const explicitApiUrl = normalizeOrigin(import.meta.env.VITE_API_URL);
const useDirectApi = /^https?:\/\//i.test(explicitApiUrl);

const baseURL =
  useDirectApi && explicitApiUrl ? explicitApiUrl : import.meta.env.DEV ? "/api" : backendOrigin;

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

/** Use for OAuth links (`/oauth/...`) — must be absolute backend URL. */
export const apiBaseURL = backendOrigin;
