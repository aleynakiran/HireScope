/**
 * Turns Axios/FastAPI errors into a single user-visible string.
 */
export function formatApiError(err, fallback = "Request failed") {
  const status = err?.response?.status;
  if (status === 404) {
    return "API adresi bulunamadı (404). Backend ayakta mı? Geliştirmede genelde Vite proxy kullanılır; doğrudan yanlış porta istek atılıyor olabilir.";
  }

  if (!err?.response) {
    if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
      return "API’ye ulaşılamıyor. Backend çalışıyor mu ve VITE_API_URL doğru mu? (örn. http://127.0.0.1:8000)";
    }
    return typeof err?.message === "string" && err.message ? err.message : fallback;
  }

  const detail = err.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item.msg === "string") return item.msg;
        return null;
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }

  if (detail && typeof detail === "object" && typeof detail.msg === "string") {
    return detail.msg;
  }

  return fallback;
}
