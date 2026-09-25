import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

function readCsrf() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)crm_csrf=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toUpperCase();
  if (["POST", "PATCH", "DELETE", "PUT"].includes(method)) {
    config.headers.set("X-CSRF-Token", readCsrf());
  }
  return config;
});

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = config?.url ?? "";

    if (status === 401 && config && !config._retried && !url.startsWith("/auth/")) {
      config._retried = true;
      try {
        refreshing = refreshing ?? api.post("/auth/refresh").then(() => undefined);
        await refreshing;
        refreshing = null;
        return api(config);
      } catch {
        refreshing = null;
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }
    return Promise.reject(error);
  },
);

export function mensagemDeErro(error: unknown, padrao = "Algo deu errado. Tente de novo.") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return padrao;
}
