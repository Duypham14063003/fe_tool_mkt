import { apiGet, apiPost } from "../lib/apiClient.js";

export async function createSync(dto) {
    return apiPost("/sync", dto);
}

export async function createSyncForAccount(platformAccountId, dto) {
    return apiPost(`/sync/platform-accounts/${platformAccountId}`, dto);
}

export async function listJobs() {
    return apiGet("/sync/jobs");
}

export async function getJob(id) {
    return apiGet(`/sync/jobs/${id}`);
}

export async function cancelJob(id) {
    return apiPost(`/sync/jobs/${id}/cancel`, {});
}
