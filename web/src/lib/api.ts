import axios from "axios";

function readCsrf() {
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");
    if (status === 401 && !url.startsWith("/auth/") && window.location.pathname !== "/login") {
      window.location.replace("/login");
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
