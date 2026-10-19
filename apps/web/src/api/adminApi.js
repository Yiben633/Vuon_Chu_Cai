import { apiClient, unwrapEnvelope } from "./client.js";

export async function getAdminSummary() {
  const response = await apiClient.get("/admin/summary");
  return unwrapEnvelope(response.data);
}

export async function listAdminResources({ resourceType, page = 1, limit = 10, status, q }) {
  const response = await apiClient.get(`/admin/${resourceType}`, {
    params: { page, limit, status: status || undefined, q: q || undefined }
  });
  const data = unwrapEnvelope(response.data);
  return { ...data, meta: response.data.meta };
}

export async function getAdminResource({ resourceType, id }) {
  const response = await apiClient.get(`/admin/${resourceType}/${id}`);
  return unwrapEnvelope(response.data);
}

export async function createAdminResource({ resourceType, payload }) {
  const response = await apiClient.post(`/admin/${resourceType}`, payload);
  return unwrapEnvelope(response.data);
}

export async function updateAdminResource({ resourceType, id, payload }) {
  const response = await apiClient.patch(`/admin/${resourceType}/${id}`, payload);
  return unwrapEnvelope(response.data);
}

export async function publishAdminResource({ resourceType, id }) {
  const response = await apiClient.post(`/admin/${resourceType}/${id}/publish`, { confirm: true });
  return unwrapEnvelope(response.data);
}

export async function archiveAdminResource({ resourceType, id }) {
  const response = await apiClient.post(`/admin/${resourceType}/${id}/archive`, { confirm: true });
  return unwrapEnvelope(response.data);
}

export async function uploadAdminAsset({ key, kind, source, licenseStatus, file }) {
  const response = await apiClient.post("/admin/assets/upload", file, {
    params: { key, kind, source, licenseStatus },
    headers: { "Content-Type": file.type || "application/octet-stream" }
  });
  return unwrapEnvelope(response.data);
}
