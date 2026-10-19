import { apiClient, clearCsrfToken, fetchCsrfToken, unwrapEnvelope } from "./client.js";

export async function getMe() {
  const response = await apiClient.get("/auth/me");
  return unwrapEnvelope(response.data);
}

export async function getFamilyProfiles() {
  const response = await apiClient.get("/auth/family-profiles");
  return unwrapEnvelope(response.data);
}

export async function login(payload) {
  const response = await apiClient.post("/auth/login", payload);
  clearCsrfToken();
  await fetchCsrfToken();
  return unwrapEnvelope(response.data);
}

export async function registerFamily(payload) {
  const response = await apiClient.post("/auth/register", payload);
  clearCsrfToken();
  await fetchCsrfToken();
  return unwrapEnvelope(response.data);
}

export async function enterChild(payload) {
  const response = await apiClient.post("/auth/enter-child", payload);
  clearCsrfToken();
  await fetchCsrfToken();
  return unwrapEnvelope(response.data);
}

export async function openParentGate(payload) {
  const response = await apiClient.post("/auth/parent-gate", payload);
  clearCsrfToken();
  await fetchCsrfToken();
  return unwrapEnvelope(response.data);
}

export async function closeParentGate() {
  const response = await apiClient.post("/auth/close-parent-gate", {});
  return unwrapEnvelope(response.data);
}

export async function logout() {
  await apiClient.post("/auth/logout", {});
  clearCsrfToken();
}
