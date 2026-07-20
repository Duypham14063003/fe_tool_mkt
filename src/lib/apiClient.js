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

    let response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (networkErr) {
        console.error(`[apiClient] POST ${url} failed:`, networkErr);
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

async function handleMockRequest(path, body) {
    // Simulate brief network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

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

    throw new ApiError("API Endpoint không tồn tại trên Mock.", 404, null);
}