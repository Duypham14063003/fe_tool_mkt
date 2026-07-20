// Thin fetch wrapper for the backend API described in the Odoo Login
// Integration Guide (POST /auth/login proxies to Odoo server-side).
// Base URL comes from Vite env so dev/prod can point at different hosts
// without touching code — set VITE_API_BASE_URL in .env / .env.local.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
        return handleMockRequest(path, body);
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
            return handleMockRequest(path, body);
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

// Mock Data Store matching the Facebook & TikTok spreadsheet visual data
const MOCK_FB_ROWS = [
    { stt: "1", date: "01/07", caption: "Tiếp tục xử lý", views: "201", reach: "175", likes: "6", comments: "0", shares: "0", saves: "1", total_time: "0h19m46s", avg_time: "5.7s", watch_through: "0%", new_followers: "0", traffic_source: "Đề xuất 80.3%", new_viewers: "73%", returning_viewers: "27%", male: "66%", female: "34%", age_group: "25-34: 54%", region: "Việt Nam 98%" },
    { stt: "2", date: "02/07", caption: "Nốt tập cuối c", views: "230", reach: "193", likes: "7", comments: "0", shares: "0", saves: "0", total_time: "0h30m32s", avg_time: "7.9s", watch_through: "1.3%", new_followers: "0", traffic_source: "Đề xuất 81.9%", new_viewers: "67%", returning_viewers: "33%", male: "69%", female: "31%", age_group: "18-24: 46%, 25-34: 46%", region: "Việt Nam 94.1%" },
    { stt: "3", date: "03/07", caption: "#xhhhhhhhhhh", views: "175", reach: "148", likes: "9", comments: "0", shares: "0", saves: "0", total_time: "0h11m55s", avg_time: "3.91s", watch_through: "3.8%", new_followers: "1", traffic_source: "Đề xuất 75.4%", new_viewers: "75%", returning_viewers: "25%", male: "41%", female: "59%", age_group: "18-24: 50%, 25-34: 46%", region: "Việt Nam 96.8%" },
    { stt: "4", date: "04/07", caption: "Khách nhận q", views: "167", reach: "132", likes: "7", comments: "0", shares: "1", saves: "0", total_time: "0h19m05s", avg_time: "6.29s", watch_through: "1.1%", new_followers: "0", traffic_source: "Đề xuất 67.0%", new_viewers: "65%", returning_viewers: "35%", male: "60%", female: "40%", age_group: "25-34: 48%, 18-24: 47%", region: "Việt Nam 97.9%" },
    { stt: "5", date: "07/07", caption: "Sẽ ra sao khi l", views: "421", reach: "382", likes: "14", comments: "0", shares: "0", saves: "2", total_time: "1h14m48s", avg_time: "10.2s", watch_through: "0.9%", new_followers: "0", traffic_source: "Đề xuất 89.8%", new_viewers: "79%", returning_viewers: "21%", male: "69%", female: "31%", age_group: "25-34: 50%, 18-24: 45%", region: "Việt Nam 96.5%" },
    { stt: "6", date: "08/07", caption: "Phải giống đú", views: "387", reach: "348", likes: "8", comments: "0", shares: "0", saves: "2", total_time: "0h26m19s", avg_time: "5.85s", watch_through: "0.4%", new_followers: "0", traffic_source: "Đề xuất 87.0%", new_viewers: "74%", returning_viewers: "26%", male: "75%", female: "25%", age_group: "18-24: 48%, 25-34: 44%", region: "Việt Nam 96.1%" },
    { stt: "7", date: "09/07", caption: "Một ảnh bill đ", views: "427", reach: "374", likes: "10", comments: "0", shares: "0", saves: "0", total_time: "0h50m12s", avg_time: "7.02s", watch_through: "0.9%", new_followers: "1", traffic_source: "Đề xuất 88.1%", new_viewers: "69%", returning_viewers: "31%", male: "61%", female: "39%", age_group: "18-24: 54%, 25-34: 40%", region: "Việt Nam 97.4%" },
    { stt: "8", date: "10/07", caption: "Website nha k", views: "393", reach: "355", likes: "2", comments: "3", shares: "0", saves: "1", total_time: "0h48m37s", avg_time: "7.08s", watch_through: "1%", new_followers: "0", traffic_source: "Đề xuất 88.4%", new_viewers: "60%", returning_viewers: "40%", male: "64%", female: "36%", age_group: "18-24: 49%, 25-34: 41%", region: "Việt Nam 99.7%" },
    { stt: "9", date: "11/07", caption: "Tưởng báo gi", views: "455", reach: "391", likes: "10", comments: "0", shares: "1", saves: "0", total_time: "1h06m28s", avg_time: "8.52s", watch_through: "0.9%", new_followers: "0", traffic_source: "Đề xuất 84.2%", new_viewers: "66%", returning_viewers: "34%", male: "71%", female: "29%", age_group: "25-34: 50%, 18-24: 47%", region: "Việt Nam 98.8%" },
    { stt: "10", date: "12/07", caption: "Bài bên Word", views: "476", reach: "401", likes: "25", comments: "0", shares: "2", saves: "1", total_time: "1h05m00s", avg_time: "8.04s", watch_through: "1.2%", new_followers: "0", traffic_source: "Đề xuất 86.4%", new_viewers: "64%", returning_viewers: "36%", male: "59%", female: "41%", age_group: "18-24: 54%, 25-34: 38%", region: "Việt Nam 97.8%" },
    { stt: "11", date: "13/07", caption: "Một cái nút gi", views: "439", reach: "365", likes: "10", comments: "0", shares: "0", saves: "0", total_time: "1h05m00s", avg_time: "8.87s", watch_through: "3.2%", new_followers: "1", traffic_source: "Đề xuất 88.4%", new_viewers: "62%", returning_viewers: "38%", male: "72%", female: "28%", age_group: "18-24: 48%, 25-34: 46%", region: "Việt Nam 99.0%" },
    { stt: "12", date: "14/07", caption: "Khách đổi từ", views: "442", reach: "359", likes: "11", comments: "2", shares: "1", saves: "2", total_time: "1h02m23s", avg_time: "8.26s", watch_through: "1.1%", new_followers: "1", traffic_source: "Đề xuất 84.1%", new_viewers: "62%", returning_viewers: "38%", male: "68%", female: "32%", age_group: "25-34: 51%, 18-24: 42%", region: "Việt Nam 99.0%" },
    { stt: "13", date: "15/07", caption: "Nay không ng", views: "494", reach: "400", likes: "13", comments: "0", shares: "--", saves: "--", total_time: "--", avg_time: "--", watch_through: "--", new_followers: "--", traffic_source: "--", new_viewers: "82%", returning_viewers: "18%", male: "72%", female: "28%", age_group: "25-34: 55%, 18-24: 42%", region: "Việt Nam 99.0%" },
    { stt: "14", date: "16/07", caption: "Hợp đồng khố", views: "394", reach: "--", likes: "11", comments: "0", shares: "0", saves: "0", total_time: "1h00m19s", avg_time: "10.11s", watch_through: "2%", new_followers: "1", traffic_source: "Đề xuất 93.8%", new_viewers: "--", returning_viewers: "--", male: "51%", female: "49%", age_group: "18-24: 50%, 25-34: 42%", region: "Việt Nam 97.9%" }
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

async function handleMockRequest(path, body, queryParams = {}) {
    // Simulate brief network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

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
            return {
                rows: MOCK_TT_ROWS,
                totals: MOCK_TT_TOTALS
            };
        } else {
            return {
                rows: MOCK_FB_ROWS,
                totals: MOCK_FB_TOTALS
            };
        }
    }

    throw new ApiError("API Endpoint không tồn tại trên Mock.", 404, null);
}