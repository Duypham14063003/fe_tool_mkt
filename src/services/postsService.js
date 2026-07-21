import { apiGet } from "../lib/apiClient.js";

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
