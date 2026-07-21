import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/apiClient.js";

export async function listAccounts() {
    return apiGet("/platform-accounts");
}

export async function getAccount(id) {
    return apiGet(`/platform-accounts/${id}`);
}

export async function createAccount(dto) {
    return apiPost("/platform-accounts", dto);
}

export async function updateAccount(id, dto) {
    return apiPatch(`/platform-accounts/${id}`, dto);
}

export async function deleteAccount(id) {
    return apiDelete(`/platform-accounts/${id}`);
}

export async function testConnection(id) {
    return apiPost(`/platform-accounts/${id}/test-connection`, {});
}

export async function reconnect(id) {
    return apiPost(`/platform-accounts/${id}/reconnect`, {});
}

export async function getSessionStatus(id) {
    return apiGet(`/platform-accounts/${id}/session-status`);
}

export async function getOAuthUrl(platform) {
    return apiGet(`/auth/${platform.toLowerCase()}/url`);
}
