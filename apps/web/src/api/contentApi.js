import { apiClient, unwrapEnvelope } from "./client.js";

export async function listLetters(params = {}) {
  const response = await apiClient.get("/letters", { params });
  return unwrapEnvelope(response.data);
}

export async function getLetter(symbol) {
  const response = await apiClient.get(`/letters/${encodeURIComponent(symbol.normalize("NFC"))}`);
  return unwrapEnvelope(response.data);
}

export async function listTones() {
  const response = await apiClient.get("/tones");
  return unwrapEnvelope(response.data);
}

export async function listVocabulary(params = {}) {
  const response = await apiClient.get("/vocabulary", { params });
  return unwrapEnvelope(response.data);
}

export async function listSpellingEntries(params = {}) {
  const response = await apiClient.get("/spelling-entries", { params });
  return unwrapEnvelope(response.data);
}

export async function listStories(params = {}) {
  const response = await apiClient.get("/stories", { params });
  return unwrapEnvelope(response.data);
}

export async function getStory(slug) {
  const response = await apiClient.get(`/stories/${encodeURIComponent(slug.normalize("NFC"))}`);
  return unwrapEnvelope(response.data);
}
