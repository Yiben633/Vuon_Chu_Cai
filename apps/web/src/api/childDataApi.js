import { apiClient, unwrapEnvelope } from "./client.js";

export async function getChildren() {
  const response = await apiClient.get("/children");
  return unwrapEnvelope(response.data);
}

export async function getChild(childId) {
  const response = await apiClient.get(`/children/${childId}`);
  return unwrapEnvelope(response.data);
}

export async function updateChildSettings({ childId, settings }) {
  const response = await apiClient.patch(`/children/${childId}/settings`, settings);
  return unwrapEnvelope(response.data);
}

export async function exportChildData(childId) {
  const response = await apiClient.get(`/children/${childId}/export`);
  return unwrapEnvelope(response.data);
}

export async function getChildProgress(childId) {
  const response = await apiClient.get(`/children/${childId}/progress`);
  return unwrapEnvelope(response.data);
}

export async function getChildWallet(childId) {
  const response = await apiClient.get(`/children/${childId}/wallet`);
  return unwrapEnvelope(response.data);
}

export async function getChildMissions(childId) {
  const response = await apiClient.get(`/children/${childId}/missions`);
  return unwrapEnvelope(response.data);
}

export async function claimChildMission({ childId, missionId }) {
  const response = await apiClient.post(`/children/${childId}/missions/${missionId}/claim`, {});
  return unwrapEnvelope(response.data);
}

export async function getRewardsCatalog() {
  const response = await apiClient.get("/rewards");
  return unwrapEnvelope(response.data);
}

export async function getChildInventory(childId) {
  const response = await apiClient.get(`/children/${childId}/inventory`);
  return unwrapEnvelope(response.data);
}

export async function getChildBadges(childId) {
  const response = await apiClient.get(`/children/${childId}/badges`);
  return unwrapEnvelope(response.data);
}

export async function getChildRewardLedger({ childId, page = 1, limit = 20 }) {
  const response = await apiClient.get(`/children/${childId}/reward-ledger`, { params: { page, limit } });
  return unwrapEnvelope(response.data);
}

export async function redeemChildReward({ childId, rewardId, idempotencyKey }) {
  const response = await apiClient.post(`/children/${childId}/redeem`, { rewardId, idempotencyKey });
  return unwrapEnvelope(response.data);
}

export async function equipChildInventoryItem({ childId, itemId }) {
  const response = await apiClient.patch(`/children/${childId}/inventory/${itemId}/equip`, { equipped: true });
  return unwrapEnvelope(response.data);
}

export async function getParentOverviewReport(childId) {
  const response = await apiClient.get(`/children/${childId}/reports/overview`);
  return unwrapEnvelope(response.data);
}

export async function getParentDailyReport({ childId, from, to }) {
  const response = await apiClient.get(`/children/${childId}/reports/daily`, { params: { from, to } });
  return unwrapEnvelope(response.data);
}

export async function getParentAttemptsReport({ childId, page = 1, limit = 20 }) {
  const response = await apiClient.get(`/children/${childId}/reports/attempts`, { params: { page, limit } });
  return unwrapEnvelope(response.data);
}

export async function getRecordingCapability(childId) {
  const response = await apiClient.get(`/children/${childId}/recordings/capability`);
  return unwrapEnvelope(response.data);
}

export async function getSpeechCapability(childId) {
  const response = await apiClient.get(`/children/${childId}/speech/capability`);
  return unwrapEnvelope(response.data);
}

export async function getChildRecordings(childId) {
  const response = await apiClient.get(`/children/${childId}/recordings`);
  return unwrapEnvelope(response.data);
}

export async function uploadChildRecording({ childId, blob, storyId, roleKey, idempotencyKey }) {
  const formData = new FormData();
  formData.append("recording", blob, "recording.webm");
  formData.append("storyId", storyId);
  formData.append("roleKey", roleKey);
  formData.append("idempotencyKey", idempotencyKey);
  const response = await apiClient.post(`/children/${childId}/recordings`, formData);
  return unwrapEnvelope(response.data);
}

export async function deleteChildRecording({ childId, recordingId }) {
  const response = await apiClient.delete(`/children/${childId}/recordings/${recordingId}`);
  return unwrapEnvelope(response.data);
}
