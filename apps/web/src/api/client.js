import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
let csrfToken = null;

export class ApiClientError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method) && !config.headers?.["X-CSRF-Token"]) {
    csrfToken ??= await fetchCsrfToken();
    config.headers = {
      ...config.headers,
      "X-CSRF-Token": csrfToken
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data?.error;
    throw new ApiClientError(payload?.message ?? "Không thể kết nối máy chủ.", {
      status: error.response?.status,
      code: payload?.code,
      details: payload?.details
    });
  }
);

export function unwrapEnvelope(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, "data")) return payload.data;
  return payload;
}

export async function getApiReadiness() {
  const response = await apiClient.get("/health/ready", {
    validateStatus: (status) => status < 600
  });
  return unwrapEnvelope(response.data);
}

export async function getLetters(params = {}) {
  const response = await apiClient.get("/letters", { params });
  return unwrapEnvelope(response.data);
}

export async function fetchCsrfToken() {
  const response = await apiClient.get("/auth/csrf");
  const data = unwrapEnvelope(response.data);
  csrfToken = data.csrfToken;
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}
