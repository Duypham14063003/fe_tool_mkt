import { apiGet, apiPost } from "../lib/apiClient.js";

const ACCESS_TOKEN_KEY = "19t_access_token";
const REFRESH_TOKEN_KEY = "19t_refresh_token";
const USER_KEY = "19t_auth_user";

function storageFor(remember) {
    return remember ? localStorage : sessionStorage;
}

/**
 * Logs in against POST /auth/login (backend verifies against Odoo, then
 * issues accessToken/refreshToken — see section 4 of the integration guide).
 * Throws ApiError with a ready-to-display Vietnamese message on failure.
 * `remember` controls whether the session persists across browser restarts
 * (localStorage) or only for the current tab session (sessionStorage).
 */
export async function login({ email, password, remember = true }) {
    const payload = { email, password };

    const data = await apiPost("/auth/login", payload);
    const store = storageFor(remember);

    if (data?.accessToken) store.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data?.refreshToken) store.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    if (data?.accessToken) {
        const user = await apiGet("/auth/me");
        data.user = user;
        store.setItem(USER_KEY, JSON.stringify(user));
    }

    return data;
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser() {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn() {
    return Boolean(getAccessToken());
}

export function logout() {
    for (const store of [localStorage, sessionStorage]) {
        store.removeItem(ACCESS_TOKEN_KEY);
        store.removeItem(REFRESH_TOKEN_KEY);
        store.removeItem(USER_KEY);
    }
}

/**
 * Requests a password reset email via the backend.
 * Backend proxies to Odoo's /web/reset_password endpoint.
 * Odoo then sends a reset link to the user's registered email.
 * Throws ApiError with a Vietnamese message on failure.
 */
export async function forgotPassword(email) {
    return apiPost("/auth/forgot-password", { email });
}
