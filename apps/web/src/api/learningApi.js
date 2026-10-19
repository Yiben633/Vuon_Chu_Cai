import { apiClient, unwrapEnvelope } from "./client.js";

export async function startLearningSession(input) {
  const response = await apiClient.post("/learning/sessions", input);
  return unwrapEnvelope(response.data);
}

export async function submitLearningAnswer({ sessionId, ...payload }) {
  const response = await apiClient.post(`/learning/sessions/${sessionId}/answers`, payload);
  return unwrapEnvelope(response.data);
}

export async function pauseLearningSession(sessionId) {
  const response = await apiClient.post(`/learning/sessions/${sessionId}/pause`, {});
  return unwrapEnvelope(response.data);
}

export async function resumeLearningSession(sessionId) {
  const response = await apiClient.post(`/learning/sessions/${sessionId}/resume`, {});
  return unwrapEnvelope(response.data);
}

export async function acknowledgeStoryScene({ sessionId, sceneId, idempotencyKey }) {
  const response = await apiClient.post(`/learning/sessions/${sessionId}/scenes/${encodeURIComponent(sceneId)}/ack`, {
    idempotencyKey
  });
  return unwrapEnvelope(response.data);
}

export async function completeLearningSession({ sessionId, idempotencyKey }) {
  const response = await apiClient.post(`/learning/sessions/${sessionId}/complete`, { idempotencyKey });
  return unwrapEnvelope(response.data);
}
