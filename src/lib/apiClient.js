// Thin fetch wrapper for the backend API described in the Odoo Login
// Integration Guide (POST /auth/login proxies to Odoo server-side).
// Base URL comes from Vite env so dev/prod can point at different hosts
// without touching code — set VITE_API_BASE_URL in .env / .env.local.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export class ApiError extends Error {
    constructor(message, status, payload) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.payload = payload;
    }
}

function defaultMessageForStatus(status) {
    // Mirrors section 8 ("Lỗi thường gặp") of the integration guide.
    switch (status) {
        case 401:
            return "Email hoặc mật khẩu không đúng.";
        case 403:
            return "Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên để được hỗ trợ.";
        case 503:
            return "Hệ thống xác thực (Odoo) hiện không phản hồi. Vui lòng thử lại sau.";
        default:
            return "Đã có lỗi xảy ra. Vui lòng thử lại.";
    }
}

export async function apiPost(path, body) {
    const url = `${BASE_URL}${path}`;
    
    // Check if mock API is explicitly enabled
    const useMock = import.meta.env.VITE_USE_MOCK_API === "true";
    if (useMock) {
        console.warn(`[apiClient] Explicit Mock mode active for POST ${path}`);
        return handleMockRequest(path, body, {}, "POST");
    }

    const token = localStorage.getItem("19t_access_token") || sessionStorage.getItem("19t_access_token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
        });
    } catch (networkErr) {
        console.log(`[apiClient] POST ${url} failed (Expected when backend is offline):`, networkErr.message);
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocal) {
            console.warn(`[apiClient] Backend connection failed. Falling back to Mock authentication for local testing.`);
            return handleMockRequest(path, body, {}, "POST");
        }
        
        throw new ApiError("Không thể kết nối tới máy chủ. Kiểm tra mạng hoặc thử lại sau.", 0, null);
    }

    let data = null;
    try {
        data = await response.json();
    } catch {
        // Empty or non-JSON body — fine for some error responses.
    }

    if (!response.ok) {
        const message = data?.message || defaultMessageForStatus(response.status);
        throw new ApiError(message, response.status, data);
    }

    return data;
}

export async function apiGet(path, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${path}${query ? "?" + query : ""}`;
    
    const useMock = import.meta.env.VITE_USE_MOCK_API === "true";
    if (useMock) {
        console.warn(`[apiClient] Explicit Mock mode active for GET ${path}`);
        return handleMockRequest(path, null, params);
    }

    const token = localStorage.getItem("19t_access_token") || sessionStorage.getItem("19t_access_token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(url, {
            method: "GET",
            headers: headers
        });
    } catch (networkErr) {
        console.log(`[apiClient] GET ${url} failed (Expected when backend is offline):`, networkErr.message);
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocal) {
            console.warn(`[apiClient] Backend connection failed. Falling back to Mock data for GET ${path}.`);
            return handleMockRequest(path, null, params);
        }
        
        throw new ApiError("Không thể kết nối tới máy chủ. Kiểm tra mạng hoặc thử lại sau.", 0, null);
    }

    let data = null;
    try {
        data = await response.json();
    } catch {
        // Empty or non-JSON body
    }

    if (!response.ok) {
        const message = data?.message || defaultMessageForStatus(response.status);
        throw new ApiError(message, response.status, data);
    }

    return data;
}

export async function apiDelete(path) {
    const url = `${BASE_URL}${path}`;
    const useMock = import.meta.env.VITE_USE_MOCK_API === "true";
    if (useMock) return handleMockRequest(path, null, {}, "DELETE");
    const token = localStorage.getItem("19t_access_token") || sessionStorage.getItem("19t_access_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    let response;
    try {
        response = await fetch(url, { method: "DELETE", headers });
    } catch (networkErr) {
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocal) return handleMockRequest(path, null, {}, "DELETE");
        throw new ApiError("Không thể kết nối tới máy chủ.", 0, null);
    }
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new ApiError(data?.message || defaultMessageForStatus(response.status), response.status, data);
    return data;
}

export async function apiPatch(path, body) {
    const url = `${BASE_URL}${path}`;
    const useMock = import.meta.env.VITE_USE_MOCK_API === "true";
    if (useMock) return handleMockRequest(path, body, {}, "PATCH");
    const token = localStorage.getItem("19t_access_token") || sessionStorage.getItem("19t_access_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    let response;
    try {
        response = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
    } catch (networkErr) {
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocal) return handleMockRequest(path, body, {}, "PATCH");
        throw new ApiError("Không thể kết nối tới máy chủ.", 0, null);
    }
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new ApiError(data?.message || defaultMessageForStatus(response.status), response.status, data);
    return data;
}

// Mock Data Store matching the Facebook & TikTok spreadsheet visual data
const MOCK_FB_ROWS = [
    // { stt: "1", date: "01/07", caption: "Tiếp tục xử lý", views: "201", reach: "175", likes: "6", comments: "0", shares: "0", saves: "1", total_time: "0h19m46s", avg_time: "5.7s", watch_through: "0%", new_followers: "0", traffic_source: "Đề xuất 80.3%", new_viewers: "73%", returning_viewers: "27%", male: "66%", female: "34%", age_group: "25-34: 54%", region: "Việt Nam 98%" },
    // { stt: "2", date: "02/07", caption: "Nốt tập cuối c", views: "230", reach: "193", likes: "7", comments: "0", shares: "0", saves: "0", total_time: "0h30m32s", avg_time: "7.9s", watch_through: "1.3%", new_followers: "0", traffic_source: "Đề xuất 81.9%", new_viewers: "67%", returning_viewers: "33%", male: "69%", female: "31%", age_group: "18-24: 46%, 25-34: 46%", region: "Việt Nam 94.1%" },
    // { stt: "3", date: "03/07", caption: "#xhhhhhhhhhh", views: "175", reach: "148", likes: "9", comments: "0", shares: "0", saves: "0", total_time: "0h11m55s", avg_time: "3.91s", watch_through: "3.8%", new_followers: "1", traffic_source: "Đề xuất 75.4%", new_viewers: "75%", returning_viewers: "25%", male: "41%", female: "59%", age_group: "18-24: 50%, 25-34: 46%", region: "Việt Nam 96.8%" },
    // { stt: "4", date: "04/07", caption: "Khách nhận q", views: "167", reach: "132", likes: "7", comments: "0", shares: "1", saves: "0", total_time: "0h19m05s", avg_time: "6.29s", watch_through: "1.1%", new_followers: "0", traffic_source: "Đề xuất 67.0%", new_viewers: "65%", returning_viewers: "35%", male: "60%", female: "40%", age_group: "25-34: 48%, 18-24: 47%", region: "Việt Nam 97.9%" },
    // { stt: "5", date: "07/07", caption: "Sẽ ra sao khi l", views: "421", reach: "382", likes: "14", comments: "0", shares: "0", saves: "2", total_time: "1h14m48s", avg_time: "10.2s", watch_through: "0.9%", new_followers: "0", traffic_source: "Đề xuất 89.8%", new_viewers: "79%", returning_viewers: "21%", male: "69%", female: "31%", age_group: "25-34: 50%, 18-24: 45%", region: "Việt Nam 96.5%" },
    // { stt: "6", date: "08/07", caption: "Phải giống đú", views: "387", reach: "348", likes: "8", comments: "0", shares: "0", saves: "2", total_time: "0h26m19s", avg_time: "5.85s", watch_through: "0.4%", new_followers: "0", traffic_source: "Đề xuất 87.0%", new_viewers: "74%", returning_viewers: "26%", male: "75%", female: "25%", age_group: "18-24: 48%, 25-34: 44%", region: "Việt Nam 96.1%" },
    // { stt: "7", date: "09/07", caption: "Một ảnh bill đ", views: "427", reach: "374", likes: "10", comments: "0", shares: "0", saves: "0", total_time: "0h50m12s", avg_time: "7.02s", watch_through: "0.9%", new_followers: "1", traffic_source: "Đề xuất 88.1%", new_viewers: "69%", returning_viewers: "31%", male: "61%", female: "39%", age_group: "18-24: 54%, 25-34: 40%", region: "Việt Nam 97.4%" },
    // { stt: "8", date: "10/07", caption: "Website nha k", views: "393", reach: "355", likes: "2", comments: "3", shares: "0", saves: "1", total_time: "0h48m37s", avg_time: "7.08s", watch_through: "1%", new_followers: "0", traffic_source: "Đề xuất 88.4%", new_viewers: "60%", returning_viewers: "40%", male: "64%", female: "36%", age_group: "18-24: 49%, 25-34: 41%", region: "Việt Nam 99.7%" },
    // { stt: "9", date: "11/07", caption: "Tưởng báo gi", views: "455", reach: "391", likes: "10", comments: "0", shares: "1", saves: "0", total_time: "1h06m28s", avg_time: "8.52s", watch_through: "0.9%", new_followers: "0", traffic_source: "Đề xuất 84.2%", new_viewers: "66%", returning_viewers: "34%", male: "71%", female: "29%", age_group: "25-34: 50%, 18-24: 47%", region: "Việt Nam 98.8%" },
    // { stt: "10", date: "12/07", caption: "Bài bên Word", views: "476", reach: "401", likes: "25", comments: "0", shares: "2", saves: "1", total_time: "1h05m00s", avg_time: "8.04s", watch_through: "1.2%", new_followers: "0", traffic_source: "Đề xuất 86.4%", new_viewers: "64%", returning_viewers: "36%", male: "59%", female: "41%", age_group: "18-24: 54%, 25-34: 38%", region: "Việt Nam 97.8%" },
    // { stt: "11", date: "13/07", caption: "Một cái nút gi", views: "439", reach: "365", likes: "10", comments: "0", shares: "0", saves: "0", total_time: "1h05m00s", avg_time: "8.87s", watch_through: "3.2%", new_followers: "1", traffic_source: "Đề xuất 88.4%", new_viewers: "62%", returning_viewers: "38%", male: "72%", female: "28%", age_group: "18-24: 48%, 25-34: 46%", region: "Việt Nam 99.0%" },
    // { stt: "12", date: "14/07", caption: "Khách đổi từ", views: "442", reach: "359", likes: "11", comments: "2", shares: "1", saves: "2", total_time: "1h02m23s", avg_time: "8.26s", watch_through: "1.1%", new_followers: "1", traffic_source: "Đề xuất 84.1%", new_viewers: "62%", returning_viewers: "38%", male: "68%", female: "32%", age_group: "25-34: 51%, 18-24: 42%", region: "Việt Nam 99.0%" },
    // { stt: "13", date: "15/07", caption: "Nay không ng", views: "494", reach: "400", likes: "13", comments: "0", shares: "--", saves: "--", total_time: "--", avg_time: "--", watch_through: "--", new_followers: "--", traffic_source: "--", new_viewers: "82%", returning_viewers: "18%", male: "72%", female: "28%", age_group: "25-34: 55%, 18-24: 42%", region: "Việt Nam 99.0%" },
    // { stt: "14", date: "16/07", caption: "Hợp đồng khố", views: "394", reach: "--", likes: "11", comments: "0", shares: "0", saves: "0", total_time: "1h00m19s", avg_time: "10.11s", watch_through: "2%", new_followers: "1", traffic_source: "Đề xuất 93.8%", new_viewers: "--", returning_viewers: "--", male: "51%", female: "49%", age_group: "18-24: 50%, 25-34: 42%", region: "Việt Nam 97.9%" }
];

const MOCK_FB_TOTALS = {
    videos: "14 video",
    views: "5,101",
    reach: "4,023+",
    likes: "143",
    comments: "5",
    shares: "5+",
    saves: "9+",
    total_time: "10h00m24s+",
    avg_time: "--",
    watch_through: "--",
    new_followers: "5+",
    traffic_source: "--",
    new_viewers: "--",
    returning_viewers: "--",
    male: "--",
    female: "--",
    age_group: "--",
    region: "--"
};

const MOCK_TT_ROWS = [
    { stt: "1", date: "01/07", type: "Video", caption: "Bộ lọc thông b", reach: "232", views: "312", engagement: "5", view_3s: "69", view_1m: "3" },
    { stt: "2", date: "03/07", type: "Video", caption: "Web đẹp chưa", reach: "159", views: "254", engagement: "6", view_3s: "68", view_1m: "4" },
    { stt: "3", date: "04/07", type: "Video", caption: "Vòng quay ma", reach: "227", views: "317", engagement: "12", view_3s: "60", view_1m: "4" },
    { stt: "4", date: "06/07", type: "Video", caption: "Một trạng thái", reach: "309", views: "472", engagement: "9", view_3s: "110", view_1m: "8" },
    { stt: "5", date: "07/07", type: "Video", caption: "Có những lỗi", reach: "172", views: "257", engagement: "1", view_3s: "62", view_1m: "1" },
    { stt: "6", date: "08/07", type: "Video", caption: "Khách 19T fe", reach: "222", views: "308", engagement: "2", view_3s: "76", view_1m: "6" },
    { stt: "7", date: "09/07", type: "Video", caption: "Một ảnh bill đ", reach: "270", views: "381", engagement: "8", view_3s: "79", view_1m: "6" },
    { stt: "8", date: "10/07", type: "Video", caption: "Website nha k", reach: "256", views: "433", engagement: "11", view_3s: "93", view_1m: "7" },
    { stt: "9", date: "11/07", type: "Video", caption: "Bài bên Word", reach: "271", views: "376", engagement: "12", view_3s: "126", view_1m: "11" },
    { stt: "10", date: "12/07", type: "Video", caption: "Tưởng báo giá", reach: "291", views: "412", engagement: "5", view_3s: "129", view_1m: "6" },
    { stt: "11", date: "13/07", type: "Video", caption: "Một cái nút gi", reach: "285", views: "444", engagement: "14", view_3s: "141", view_1m: "12" },
    { stt: "12", date: "14/07", type: "Video", caption: "Khách đổi từ", reach: "258", views: "407", engagement: "11", view_3s: "132", view_1m: "6" },
    { stt: "13", date: "15/07", type: "Video", caption: "Nay không ng", reach: "205", views: "350", engagement: "9", view_3s: "110", view_1m: "13" },
    { stt: "14", date: "16/07", type: "Video", caption: "Hợp đồng khố", reach: "243", views: "376", engagement: "16", view_3s: "137", view_1m: "8" },
    { stt: "15", date: "16/07", type: "Ảnh", caption: "Tin dạng ảnh", reach: "--", views: "--", engagement: "--", view_3s: "--", view_1m: "--" }
];

const MOCK_TT_TOTALS = {
    videos: "TỔNG 14 VIDEO",
    reach: "3,400",
    views: "5,099",
    engagement: "121",
    view_3s: "1,392",
    view_1m: "95"
};

async function handleMockRequest(path, body, queryParams = {}, method = "GET") {
    // Simulate brief network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (path === "/auth/facebook/url") {
        return { url: `${window.location.origin}/accounts?success=facebook&saved=1` };
    }
    if (path === "/auth/tiktok/url") {
        return { url: `${window.location.origin}/accounts?success=tiktok&saved=1` };
    }

    if (path === "/auth/login") {
        const { email, password } = body;
        
        if (!email || !password) {
            throw new ApiError("Email hoặc mật khẩu không đúng.", 401, null);
        }
        
        // Specially handle test passwords/cases to showcase error alerts in UI
        if (password === "wrong" || password === "123456") {
            throw new ApiError("Email hoặc mật khẩu không đúng.", 401, null);
        }

        if (email.startsWith("inactive")) {
            throw new ApiError("Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên để được hỗ trợ.", 403, null);
        }

        // Success response matching Section 5 of Odoo Login Integration Guide
        const nameParts = email.split("@")[0].split(".");
        const capitalizedName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

        return {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token-payload",
            refreshToken: "session-id.mock-refresh-token",
            user: {
                id: "4f7d8d1d-1111-2222-3333-444444444444",
                email: email,
                name: capitalizedName || "Nguyen Van A",
                department: "Công nghệ thông tin",
                job_title: "Kỹ sư phần mềm",
                phone_number: "0912345678",
                employment_status: "active",
                avatar_url: null,
                roles: ["employee", "admin"],
                jobTitle: "Kỹ sư phần mềm",
                phoneNumber: "0912345678",
                employmentStatus: "active",
                avatarUrl: null
            }
        };
    }

    if (path === "/auth/forgot-password") {
        const { email } = body;
        if (!email) {
            throw new ApiError("Vui lòng nhập địa chỉ email.", 400, null);
        }
        // In production the backend calls Odoo /web/reset_password
        // which sends the reset link email. Here we simulate success.
        return { message: "Nếu địa chỉ email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu trong vài phút." };
    }

    if (path === "/api/stats/summary") {
        const platform = queryParams.platform || "facebook";
        if (platform === "tiktok") {
            return { rows: MOCK_TT_ROWS, totals: MOCK_TT_TOTALS };
        } else {
            return { rows: MOCK_FB_ROWS, totals: MOCK_FB_TOTALS };
        }
    }

    if (path === "/dashboard/summary") {
        return {
            totalPosts: 29,
            totalViews: 10200,
            totalReach: 7423,
            totalReactions: 264,
            totalComments: 5,
            totalShares: 10,
            totalSaves: 18,
            totalNewFollowers: 10,
            engagementRate: 3.42
        };
    }

    // Platform Accounts mock (Stateful persistence via localStorage)
    if (path === "/platform-accounts") {
        let storedAccs = JSON.parse(localStorage.getItem("mock_platform_accounts") || "null");
        if (!storedAccs) {
            storedAccs = [
                // { id: "pa-001", platform: "FACEBOOK", accountName: "19T Digital FB", externalAccountId: "100064xxx", connectionStatus: "CONNECTED", lastSyncedAt: new Date(Date.now() - 3600000).toISOString(), tokenExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString() },
                // { id: "pa-002", platform: "TIKTOK", accountName: "19T Digital TikTok", externalAccountId: "@19tdigital", connectionStatus: "CONNECTED", lastSyncedAt: new Date(Date.now() - 7200000).toISOString(), tokenExpiresAt: new Date(Date.now() + 86400000 * 15).toISOString() },
                // { id: "pa-003", platform: "FACEBOOK", accountName: "19T Page 2", externalAccountId: "100065xxx", connectionStatus: "EXPIRED", lastSyncedAt: new Date(Date.now() - 86400000 * 3).toISOString(), tokenExpiresAt: new Date(Date.now() - 86400000).toISOString() }
            ];
            localStorage.setItem("mock_platform_accounts", JSON.stringify(storedAccs));
        }

        if (method === "POST") {
            const newAcc = { id: "mock-new-" + Date.now(), ...body, connectionStatus: body.accessToken ? "CONNECTED" : "DISCONNECTED", lastSyncedAt: null, createdAt: new Date().toISOString() };
            storedAccs.unshift(newAcc);
            localStorage.setItem("mock_platform_accounts", JSON.stringify(storedAccs));
            return newAcc;
        }
        return storedAccs;
    }
    if (/^\/platform-accounts\/[^/]+$/.test(path) && method === "PATCH") {
        const id = path.split("/").pop();
        let storedAccs = JSON.parse(localStorage.getItem("mock_platform_accounts") || "[]");
        storedAccs = storedAccs.map(a => a.id === id ? { ...a, ...body, updatedAt: new Date().toISOString() } : a);
        localStorage.setItem("mock_platform_accounts", JSON.stringify(storedAccs));
        return { id, ...body, updatedAt: new Date().toISOString() };
    }
    if (/^\/platform-accounts\/[^/]+$/.test(path) && method === "DELETE") {
        const id = path.split("/").pop();
        let storedAccs = JSON.parse(localStorage.getItem("mock_platform_accounts") || "[]");
        storedAccs = storedAccs.filter(a => a.id !== id);
        localStorage.setItem("mock_platform_accounts", JSON.stringify(storedAccs));
        return { deleted: true };
    }
    if (/\/test-connection$/.test(path)) {
        return { connected: true, status: "CONNECTED" };
    }
    if (/\/reconnect$/.test(path)) {
        return { connectionStatus: "CONNECTED" };
    }
    if (/\/session-status$/.test(path)) {
        return { sessionStatus: "VALID", lastValidatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() };
    }

    // Sync Jobs mock
    if (path === "/sync" || path === "/sync/facebook" || path === "/sync/tiktok" || /\/sync\/platform-accounts\//.test(path)) {
        const newJob = { id: "job-" + Date.now(), jobType: body?.platform === "TIKTOK" ? "SYNC_TIKTOK" : "SYNC_FACEBOOK", status: "QUEUED", progress: 0, totalItems: 0, processedItems: 0, dateFrom: body?.dateFrom, dateTo: body?.dateTo, createdAt: new Date().toISOString() };
        return { jobId: newJob.id, status: newJob.status };
    }
    if (path === "/sync/jobs") {
        return [
            // { id: "job-001", jobType: "SYNC_FACEBOOK", status: "SUCCESS", progress: 100, totalItems: 14, processedItems: 14, dateFrom: "2026-07-01", dateTo: "2026-07-16", createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), finishedAt: new Date(Date.now() - 3600000).toISOString() },
            // { id: "job-002", jobType: "SYNC_TIKTOK", status: "SUCCESS", progress: 100, totalItems: 15, processedItems: 15, dateFrom: "2026-07-01", dateTo: "2026-07-16", createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), finishedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
            // { id: "job-003", jobType: "SYNC_FACEBOOK", status: "FAILED", progress: 40, totalItems: 14, processedItems: 5, errorMessage: "Token expired", dateFrom: "2026-06-01", dateTo: "2026-06-30", createdAt: new Date(Date.now() - 86400000).toISOString(), finishedAt: new Date(Date.now() - 86400000 + 600000).toISOString() }
        ];
    }
    if (/^\/sync\/jobs\/[^/]+$/.test(path) && method !== "POST") {
        return { id: path.split("/").pop(), jobType: "SYNC_FACEBOOK", status: "SUCCESS", progress: 100, totalItems: 14, processedItems: 14 };
    }
    if (/\/cancel$/.test(path)) {
        return { status: "CANCELLED" };
    }

    // Posts mock
    if (path === "/posts") {
        const platform = queryParams.platform;
        const page = parseInt(queryParams.page) || 1;
        const limit = parseInt(queryParams.limit) || 20;
        const allPosts = [
            // Facebook Posts matching Screenshot 1
            // { id: "fb-001", platform: "FACEBOOK", contentType: "VIDEO", caption: "Bộ lọc thông báo mới", publishedAt: "2026-07-01T08:00:00Z", metrics: [{ views: 312, reach: 232, reactions: 5, comments: 0, shares: 0, view3Seconds: 69, view1Minute: 3, engagementRate: 2.15 }] },
            // { id: "fb-002", platform: "FACEBOOK", contentType: "VIDEO", caption: "Web đẹp chưa các bạn", publishedAt: "2026-07-03T09:00:00Z", metrics: [{ views: 254, reach: 159, reactions: 6, comments: 0, shares: 0, view3Seconds: 68, view1Minute: 4, engagementRate: 3.77 }] },
            // { id: "fb-003", platform: "FACEBOOK", contentType: "VIDEO", caption: "Vòng quay may mắn", publishedAt: "2026-07-04T10:00:00Z", metrics: [{ views: 317, reach: 227, reactions: 12, comments: 0, shares: 0, view3Seconds: 60, view1Minute: 4, engagementRate: 5.29 }] },
            // { id: "fb-004", platform: "FACEBOOK", contentType: "VIDEO", caption: "Một trạng thái không tên", publishedAt: "2026-07-06T11:00:00Z", metrics: [{ views: 472, reach: 309, reactions: 9, comments: 0, shares: 0, view3Seconds: 110, view1Minute: 8, engagementRate: 2.91 }] },
            // { id: "fb-005", platform: "FACEBOOK", contentType: "VIDEO", caption: "Có những lỗi không nên mắc phải", publishedAt: "2026-07-07T12:00:00Z", metrics: [{ views: 257, reach: 172, reactions: 1, comments: 0, shares: 0, view3Seconds: 62, view1Minute: 1, engagementRate: 0.58 }] },
            // { id: "fb-006", platform: "FACEBOOK", contentType: "VIDEO", caption: "Khách 19T feedback", publishedAt: "2026-07-08T13:00:00Z", metrics: [{ views: 308, reach: 222, reactions: 2, comments: 0, shares: 0, view3Seconds: 76, view1Minute: 6, engagementRate: 0.90 }] },
            // { id: "fb-007", platform: "FACEBOOK", contentType: "VIDEO", caption: "Một ảnh bill đủ nói lên tất cả", publishedAt: "2026-07-09T14:00:00Z", metrics: [{ views: 381, reach: 270, reactions: 8, comments: 0, shares: 0, view3Seconds: 79, view1Minute: 6, engagementRate: 2.96 }] },
            // { id: "fb-008", platform: "FACEBOOK", contentType: "VIDEO", caption: "Website nha khoa chuẩn SEO", publishedAt: "2026-07-10T15:00:00Z", metrics: [{ views: 433, reach: 256, reactions: 11, comments: 0, shares: 0, view3Seconds: 93, view1Minute: 7, engagementRate: 4.30 }] },
            // { id: "fb-009", platform: "FACEBOOK", contentType: "VIDEO", caption: "Bài bên WordPress", publishedAt: "2026-07-11T16:00:00Z", metrics: [{ views: 376, reach: 271, reactions: 12, comments: 0, shares: 0, view3Seconds: 126, view1Minute: 11, engagementRate: 4.43 }] },
            // { id: "fb-010", platform: "FACEBOOK", contentType: "VIDEO", caption: "Tưởng báo giá là xong", publishedAt: "2026-07-12T17:00:00Z", metrics: [{ views: 412, reach: 291, reactions: 5, comments: 0, shares: 0, view3Seconds: 129, view1Minute: 6, engagementRate: 1.72 }] },
            // { id: "fb-011", platform: "FACEBOOK", contentType: "VIDEO", caption: "Một cái nút giúp tăng tỷ lệ chuyển đổi", publishedAt: "2026-07-13T18:00:00Z", metrics: [{ views: 444, reach: 285, reactions: 14, comments: 0, shares: 0, view3Seconds: 141, view1Minute: 12, engagementRate: 4.91 }] },
            // { id: "fb-012", platform: "FACEBOOK", contentType: "VIDEO", caption: "Khách đổi từ website cũ sang 19T", publishedAt: "2026-07-14T19:00:00Z", metrics: [{ views: 407, reach: 258, reactions: 11, comments: 0, shares: 0, view3Seconds: 132, view1Minute: 6, engagementRate: 4.26 }] },
            // { id: "fb-013", platform: "FACEBOOK", contentType: "VIDEO", caption: "Nay không nghĩ ra ý tưởng", publishedAt: "2026-07-15T20:00:00Z", metrics: [{ views: 350, reach: 205, reactions: 9, comments: 0, shares: 0, view3Seconds: 110, view1Minute: 13, engagementRate: 4.39 }] },
            // { id: "fb-014", platform: "FACEBOOK", contentType: "VIDEO", caption: "Hợp đồng khổng lồ", publishedAt: "2026-07-16T21:00:00Z", metrics: [{ views: 376, reach: 243, reactions: 16, comments: 0, shares: 0, view3Seconds: 137, view1Minute: 8, engagementRate: 6.58 }] },
            // { id: "fb-015", platform: "FACEBOOK", contentType: "POST", caption: "Tin dạng ảnh", publishedAt: "2026-07-16T22:00:00Z", metrics: [{ views: null, reach: null, reactions: null, comments: null, shares: null, view3Seconds: null, view1Minute: null, engagementRate: null }] },
            //
            // // TikTok Posts matching Screenshot 2
            // { id: "tt-001", platform: "TIKTOK", contentType: "VIDEO", caption: "Tiếp tục xử lý vụ khách đổi website", publishedAt: "2026-07-01T08:00:00Z", metrics: [{ views: 201, viewers: 175, likes: 6, comments: 0, shares: 0, saves: 1, totalWatchTimeSeconds: 1186, averageWatchTimeSeconds: 5.7, completionRate: 0, newFollowers: 0, trafficSource: "Đề xuất 80.3%", maleRate: 66, femaleRate: 34, mainAgeGroup: "25-34: 54%", mainLocation: "Việt Nam 98%" }] },
            // { id: "tt-002", platform: "TIKTOK", contentType: "VIDEO", caption: "Nốt tập cuối của series", publishedAt: "2026-07-02T09:00:00Z", metrics: [{ views: 230, viewers: 193, likes: 7, comments: 0, shares: 0, saves: 0, totalWatchTimeSeconds: 1832, averageWatchTimeSeconds: 7.9, completionRate: 1.3, newFollowers: 0, trafficSource: "Đề xuất 81.9%", maleRate: 69, femaleRate: 31, mainAgeGroup: "18-24: 46%", mainLocation: "Việt Nam 94.1%" }] },
            // { id: "tt-003", platform: "TIKTOK", contentType: "VIDEO", caption: "#xhhhhhhhhhhh", publishedAt: "2026-07-03T10:00:00Z", metrics: [{ views: 175, viewers: 148, likes: 9, comments: 0, shares: 0, saves: 0, totalWatchTimeSeconds: 715, averageWatchTimeSeconds: 3.91, completionRate: 3.8, newFollowers: 1, trafficSource: "Đề xuất 75.4%", maleRate: 40, femaleRate: 59, mainAgeGroup: "18-24: 47%", mainLocation: "Việt Nam 96.8%" }] },
            // { id: "tt-004", platform: "TIKTOK", contentType: "VIDEO", caption: "Khách nhắn tin khen", publishedAt: "2026-07-04T11:00:00Z", metrics: [{ views: 167, viewers: 132, likes: 7, comments: 0, shares: 1, saves: 0, totalWatchTimeSeconds: 1145, averageWatchTimeSeconds: 6.29, completionRate: 1.1, newFollowers: 0, trafficSource: "Đề xuất 67.0%", maleRate: 60, femaleRate: 40, mainAgeGroup: "25-34: 48%", mainLocation: "Việt Nam 97.9%" }] },
            // { id: "tt-005", platform: "TIKTOK", contentType: "VIDEO", caption: "Sẽ ra sao khi làm việc với 19T", publishedAt: "2026-07-07T12:00:00Z", metrics: [{ views: 421, viewers: 382, likes: 14, comments: 0, shares: 0, saves: 2, totalWatchTimeSeconds: 5088, averageWatchTimeSeconds: 10.2, completionRate: 0.9, newFollowers: 0, trafficSource: "Đề xuất 89.8%", maleRate: 69, femaleRate: 31, mainAgeGroup: "25-34: 50%", mainLocation: "Việt Nam 96.5%" }] }
        ];
        const filtered = platform ? allPosts.filter(p => p.platform === platform.toUpperCase()) : allPosts;
        const total = filtered.length;
        const data = filtered.slice((page - 1) * limit, page * limit);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    if (/^\/posts\/[^/]+\/metric-history$/.test(path)) {
        const postId = path.split("/")[2];
        return Array.from({ length: 7 }, (_, i) => ({
            id: `metric-${postId}-${i}`,
            metricDate: new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0],
            views: 150 + Math.floor(Math.random() * 300),
            reach: 100 + Math.floor(Math.random() * 200),
            reactions: Math.floor(Math.random() * 20),
            engagementRate: (Math.random() * 5).toFixed(2)
        }));
    }
    if (/^\/posts\/[^/]+\/metrics$/.test(path)) {
        return [{ views: 350, reach: 280, reactions: 12, comments: 1, shares: 2, saves: 3, engagementRate: 4.28 }];
    }
    if (/^\/posts\/[^/]+$/.test(path)) {
        return { id: path.split("/").pop(), platform: "FACEBOOK", contentType: "VIDEO", caption: "Bài viết mẫu", publishedAt: "2026-07-10T08:00:00Z", metrics: [] };
    }

    // KPI mock
    if (path === "/kpis") {
        if (method === "POST") return { id: "kpi-" + Date.now(), ...body, createdAt: new Date().toISOString() };
        return [
            // { id: "kpi-001", platform: "FACEBOOK", periodType: "MONTHLY", periodStart: "2026-07-01", periodEnd: "2026-07-31", metricName: "totalViews", targetValue: 8000 },
            // { id: "kpi-002", platform: "FACEBOOK", periodType: "MONTHLY", periodStart: "2026-07-01", periodEnd: "2026-07-31", metricName: "engagementRate", targetValue: 5 },
            // { id: "kpi-003", platform: "TIKTOK", periodType: "MONTHLY", periodStart: "2026-07-01", periodEnd: "2026-07-31", metricName: "totalViews", targetValue: 6000 },
            // { id: "kpi-004", platform: "TIKTOK", periodType: "MONTHLY", periodStart: "2026-07-01", periodEnd: "2026-07-31", metricName: "totalReach", targetValue: 4000 }
        ];
    }
    if (/^\/kpis\//.test(path) && method === "DELETE") return { deleted: true };

    // Auth me
    if (path === "/auth/me") {
        const stored = localStorage.getItem("19t_auth_user") || sessionStorage.getItem("19t_auth_user");
        if (stored) return JSON.parse(stored);
        return { id: "mock-user", name: "Admin User", email: "admin@19t.vn", role: "ADMIN" };
    }

    throw new ApiError("API Endpoint không tồn tại trên Mock.", 404, null);
}
