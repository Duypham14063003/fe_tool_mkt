const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const ACCESS_TOKEN_KEY = "19t_access_token";
const REFRESH_TOKEN_KEY = "19t_refresh_token";
let refreshPromise = null;

function authStorage() {
    if (localStorage.getItem(REFRESH_TOKEN_KEY)) return localStorage;
    if (sessionStorage.getItem(REFRESH_TOKEN_KEY)) return sessionStorage;
    return null;
}

async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const store = authStorage();
        const refreshToken = store?.getItem(REFRESH_TOKEN_KEY);
        if (!store || !refreshToken) return null;

        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            store.removeItem(ACCESS_TOKEN_KEY);
            store.removeItem(REFRESH_TOKEN_KEY);
            return null;
        }

        const tokens = await response.json();
        if (!tokens?.accessToken) return null;

        store.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        if (tokens.refreshToken) {
            store.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        }
        return tokens.accessToken;
    })().finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
}

async function fetchWithAuthRetry(url, options, path) {
    let response = await fetch(url, options);
    if (response.status !== 401 || path === "/auth/login" || path === "/auth/refresh") {
        return response;
    }

    const accessToken = await refreshAccessToken();
    if (!accessToken) return response;

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    response = await fetch(url, { ...options, headers });
    return response;
}

export class ApiError extends Error {
    constructor(message, status, payload) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.payload = payload;
    }
}

function defaultMessageForStatus(status) {
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

function authHeaders() {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

async function parseResponse(response) {
    let data = null;
    try {
        data = await response.json();
    } catch {
        // Some successful endpoints return an empty or non-JSON body.
    }

    if (!response.ok) {
        throw new ApiError(
            data?.message || defaultMessageForStatus(response.status),
            response.status,
            data,
        );
    }
    return data;
}

async function request(path, options, connectionErrorMessage) {
    try {
        const response = await fetchWithAuthRetry(`${BASE_URL}${path}`, options, path);
        return await parseResponse(response);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(connectionErrorMessage, 0, null);
    }
}

export function apiPost(path, body) {
    return request(
        path,
        {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(body),
        },
        "Không thể kết nối tới máy chủ. Kiểm tra mạng hoặc thử lại sau.",
    );
}

export function apiGet(path, params = {}) {
    const query = new URLSearchParams(params).toString();
    const requestPath = `${path}${query ? `?${query}` : ""}`;
    return request(
        requestPath,
        {
            method: "GET",
            headers: authHeaders(),
        },
        "Không thể kết nối tới máy chủ. Kiểm tra mạng hoặc thử lại sau.",
    );
}

export function apiDelete(path) {
    return request(
        path,
        {
            method: "DELETE",
            headers: authHeaders(),
        },
        "Không thể kết nối tới máy chủ.",
    );
}

export function apiPatch(path, body) {
    return request(
        path,
        {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(body),
        },
        "Không thể kết nối tới máy chủ.",
    );
}
