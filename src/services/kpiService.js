import { apiGet, apiPost, apiDelete } from "../lib/apiClient.js";

export async function listKpis() {
    return apiGet("/kpis");
}

export async function createKpi(dto) {
    return apiPost("/kpis", dto);
}

export async function deleteKpi(id) {
    return apiDelete(`/kpis/${id}`);
}

/**
 * Tính achievement rate: actual / target * 100
 */
export function calcAchievement(actual, target) {
    if (actual == null || !target) return null;
    return Math.round((actual / target) * 100 * 100) / 100;
}

/**
 * Trả về status theo achievement rate
 * < 80 → NOT_MET | 80-99 → NEAR_TARGET | 100-119 → MET | >= 120 → EXCEEDED
 */
export function kpiStatus(rate) {
    if (rate == null) return null;
    if (rate < 80) return "NOT_MET";
    if (rate < 100) return "NEAR_TARGET";
    if (rate < 120) return "MET";
    return "EXCEEDED";
}
