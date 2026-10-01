// Centralized API configuration for local dev and Vercel production
export const getApiBaseUrl = () => {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && typeof envApi === "string" && envApi.startsWith("http")) {
    return envApi.replace(/\/+$/, "");
  }
  // Default to relative URL for Vercel unified serverless routing
  return "";
};

export const API = getApiBaseUrl();
export default API;
