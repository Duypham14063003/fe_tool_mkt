import { apiDelete, apiGet, apiPost } from "../lib/apiClient.js";

export async function listPosts(params = {}) {
    return apiGet("/posts", params);
}

export async function getPost(id) {
    return apiGet(`/posts/${id}`);
}

export async function getPostMetrics(id) {
    return apiGet(`/posts/${id}/metrics`);
}

export async function getMetricHistory(id) {
    return apiGet(`/posts/${id}/metric-history`);
}

export async function importFacebookPosts(payload) {
    return apiPost("/posts/imports/facebook", payload);
}

export async function listImportBatches() {
    return apiGet("/posts/imports/history");
}

export async function deleteImportBatch(id) {
    return apiDelete(`/posts/imports/${id}`);
}
