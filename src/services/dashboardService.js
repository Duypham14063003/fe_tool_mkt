import { apiGet } from "../lib/apiClient.js";

/**
 * Gọi GET /dashboard/summary
 * Trả về: totalPosts, totalViews, totalReach, totalReactions, totalComments,
 *          totalShares, totalSaves, totalNewFollowers, engagementRate
 */
export async function getDashboardSummary() {
    return apiGet("/dashboard/summary");
}
