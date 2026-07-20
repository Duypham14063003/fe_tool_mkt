import React, { useState } from "react";
import "../assets/css/loginStyle.css";
import { login } from "../services/authService";
import { ApiError } from "../lib/apiClient.js";

const EyeOpen = () => (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" strokeLinejoin="round" />
        <circle cx="10" cy="10" r="2.4" />
    </svg>
);
const EyeClosed = () => (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2.5 3.5l15 15" strokeLinecap="round" />
        <path
            d="M6.6 5.4C7.6 4.8 8.7 4.5 10 4.5c5.5 0 8.5 5.5 8.5 5.5a15 15 0 0 1-2.9 3.6M8.6 14.5A8.5 8.5 0 0 1 1.5 10s1.1-2.1 3.2-3.6M11.7 11.7a2.3 2.3 0 0 1-3.3-3.3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/** Brand mark: falls back to a styled "19T" badge if the logo file isn't
 *  present yet, instead of showing a broken-image icon. */
function BrandLogo({ className }) {
    const [broken, setBroken] = useState(false);
    if (broken) {
        return <div className={`${className} logo-fallback`}>19T</div>;
    }
    return (
        <img
            src="../img/logo19tDigital.jpg"
            alt="19T Digital Logo"
            className={className}
            onError={() => setBroken(true)}
        />
    );
}

/**
 * Login page — matches loginStyle.css 1:1 (class names, tokens, states).
 * On submit, calls the backend's POST /auth/login (which in turn verifies
 * the credentials against Odoo) per the Odoo Login Integration Guide.
 */
export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            setError("Vui lòng nhập đầy đủ email và mật khẩu.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Email không đúng định dạng.");
            return;
        }

        setError("");
        setSubmitting(true);
        try {
            const data = await login({ email: email.trim(), password, remember });
            onLoginSuccess?.(data.user);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    const invalid = Boolean(error);

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-brand">
                    <BrandLogo className="login-logo" />
                    <div className="login-brand-name">19t digital</div>
                    <div className="login-brand-sub">INTERNAL DATABASE</div>
                </div>

                <div className="odoo-badge">
                    <span className="odoo-dot"></span> Xác thực qua Odoo
                </div>

                <form className="login-form" noValidate onSubmit={handleSubmit}>
                    <div className="login-error" hidden={!error}>
                        {error}
                    </div>

                    <label className="field">
                        <span className="field-label">Email</span>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            autoComplete="username"
                            placeholder="email@congty.com"
                            required
                            className={invalid && !email.trim() ? "invalid" : ""}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>

                    <label className="field">
                        <span className="field-label">Mật khẩu</span>
                        <div className="password-wrap">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                required
                                className={invalid && !password.trim() ? "invalid" : ""}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="toggle-pw"
                                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                onClick={() => setShowPassword((v) => !v)}
                            >
                                <span className="toggle-pw-icon">{showPassword ? <EyeClosed /> : <EyeOpen />}</span>
                            </button>
                        </div>
                    </label>

                    <div className="field-row">
                        <label className="checkbox">
                            <input
                                type="checkbox"
                                id="remember"
                                name="remember"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                            />
                            <span>Ghi nhớ đăng nhập</span>
                        </label>
                        <a href="#" className="forgot-link">
                            Quên mật khẩu?
                        </a>
                    </div>

                    <button type="submit" className="btn-login" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="btn-spinner"></span>
                                <span>Đang đăng nhập...</span>
                            </>
                        ) : (
                            <span>Đăng nhập với Odoo</span>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    Tài khoản của bạn được quản lý bởi hệ thống Odoo nội bộ.
                    <br />
                    Liên hệ quản trị viên nếu cần hỗ trợ truy cập.
                </div>
            </div>

            <div className="login-page-footer">© 2026 19T DIGITAL · INTERNAL ANALYTICS</div>
        </div>
    );
}