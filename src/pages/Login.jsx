import React, { useState } from "react";
import "../assets/css/loginStyle.css";
import { login, forgotPassword } from "../services/authService";
import { ApiError } from "../lib/apiClient.js";
import logoImg from "../assets/img/logo19tDigital.jpg";

/* ── SVG Icons ──────────────────────────────────────────────── */
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
            strokeLinecap="round" strokeLinejoin="round"
        />
    </svg>
);
const IconMail = () => (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="16" height="13" rx="2" />
        <path d="M2 7l8 5 8-5" strokeLinecap="round" />
    </svg>
);
const IconSent = () => (
    <svg viewBox="0 0 20 20" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="4" width="16" height="13" rx="2" />
        <path d="M2 7l8 5 8-5" strokeLinecap="round" />
        <path d="M12 13.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" stroke="var(--success)" strokeWidth="1.8" />
    </svg>
);
const IconArrowLeft = () => (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12.5 4.5L7 10l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/** Brand mark: shows logo19tDigital.jpg; falls back to "19T" badge */
function BrandLogo({ className }) {
    const [broken, setBroken] = useState(false);
    if (broken) return <div className={`${className} logo-fallback`}>19T</div>;
    return <img src={logoImg} alt="19T Digital Logo" className={className} onError={() => setBroken(true)} />;
}

/* ─────────────────────────────────────────────────────────────
   Forgot Password — Odoo flow
   Bước 1: nhập email → POST /auth/forgot-password
           Backend proxy → Odoo /web/reset_password
           Odoo gửi email chứa link reset mật khẩu
   Bước 2: hướng dẫn kiểm tra hộp thư
           Người dùng nhấn link → đặt lại trên trang Odoo
   Bước 3: đăng nhập lại bằng mật khẩu mới
   ───────────────────────────────────────────────────────────── */
function ForgotPassword({ onBack }) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) { setError("Vui lòng nhập địa chỉ email."); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Email không đúng định dạng."); return; }
        setError("");
        setLoading(true);
        try {
            await forgotPassword(trimmed);
            setSent(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                // Always show success to prevent email enumeration attacks
                setSent(true);
            }
        } finally {
            setLoading(false);
        }
    }

    /* ── Màn hình xác nhận gửi thành công ── */
    if (sent) {
        return (
            <div className="fp-panel">
                <div className="fp-sent-icon">
                    <IconSent />
                </div>
                <h2 className="fp-title">Kiểm tra hòm thư!</h2>
                <p className="fp-desc">
                    Chúng tôi đã gửi yêu cầu đến hệ thống Odoo. Nếu địa chỉ{" "}
                    <strong>{email.trim()}</strong> tồn tại, bạn sẽ nhận được email
                    chứa <strong>đường link đặt lại mật khẩu</strong> trong vài phút.
                </p>

                <div className="fp-steps-box">
                    <div className="fp-step">
                        <span className="fp-step-num">1</span>
                        <span>Mở email từ hệ thống Odoo</span>
                    </div>
                    <div className="fp-step">
                        <span className="fp-step-num">2</span>
                        <span>Nhấn vào link <strong>"Đặt lại mật khẩu"</strong></span>
                    </div>
                    <div className="fp-step">
                        <span className="fp-step-num">3</span>
                        <span>Tạo mật khẩu mới trên trang Odoo</span>
                    </div>
                    <div className="fp-step">
                        <span className="fp-step-num">4</span>
                        <span>Đăng nhập lại bằng mật khẩu mới</span>
                    </div>
                </div>

                <p className="fp-note">
                    Không thấy email? Kiểm tra thư mục <strong>Spam / Junk</strong> hoặc thử lại sau vài phút.
                </p>

                <button className="btn-login" style={{ marginTop: "4px" }} onClick={onBack}>
                    Quay lại đăng nhập
                </button>

                <button
                    className="fp-back"
                    type="button"
                    style={{ marginTop: "14px", alignSelf: "center" }}
                    onClick={() => { setSent(false); setEmail(""); }}
                >
                    <IconArrowLeft /> Gửi lại với email khác
                </button>
            </div>
        );
    }

    /* ── Màn hình nhập email ── */
    return (
        <div className="fp-panel">
            <button className="fp-back" type="button" onClick={onBack}>
                <IconArrowLeft /> Quay lại đăng nhập
            </button>

            <div className="fp-icon-wrap">
                <IconMail />
            </div>

            <h2 className="fp-title">Quên mật khẩu?</h2>
            <p className="fp-desc">
                Nhập email đăng ký của bạn. Hệ thống Odoo sẽ gửi link đặt lại mật khẩu vào hòm thư đó.
            </p>

            <form className="login-form fp-form" noValidate onSubmit={handleSubmit}>
                {error && <div className="login-error">{error}</div>}
                <label className="field">
                    <span className="field-label">Email đăng ký</span>
                    <input
                        type="email"
                        id="fp-email"
                        placeholder="email@congty.com"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className={error && !email.trim() ? "invalid" : ""}
                    />
                </label>
                <button type="submit" className="btn-login" disabled={loading}>
                    {loading
                        ? <><span className="btn-spinner" /><span>Đang gửi...</span></>
                        : "Gửi yêu cầu đặt lại mật khẩu"
                    }
                </button>
            </form>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Main Login page
   ───────────────────────────────────────────────────────────── */
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
    const [showForgot, setShowForgot] = useState(false);

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
                {showForgot ? (
                    <ForgotPassword onBack={() => setShowForgot(false)} />
                ) : (
                    <>
                        <div className="login-brand">
                            <BrandLogo className="login-logo" />
                            <div className="login-brand-sub">INTERNAL DATABASE</div>
                        </div>

                        {/*<div className="odoo-badge">*/}
                        {/*    <span className="odoo-dot"></span> Xác thực qua Odoo*/}
                        {/*</div>*/}

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
                                        <span className="toggle-pw-icon">
                                            {showPassword ? <EyeClosed /> : <EyeOpen />}
                                        </span>
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
                                <button
                                    type="button"
                                    className="forgot-link"
                                    onClick={() => setShowForgot(true)}
                                >
                                    Quên mật khẩu?
                                </button>
                            </div>

                            <button type="submit" className="btn-login" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        <span>Đang đăng nhập...</span>
                                    </>
                                ) : (
                                    <span>Đăng nhập</span>
                                )}
                            </button>
                        </form>

                        <div className="login-footer">
                            Tài khoản của bạn được quản lý bởi hệ thống Odoo nội bộ.
                        </div>
                    </>
                )}
            </div>

            <div className="login-page-footer">© 2026 19T DIGITAL · INTERNAL ANALYTICS</div>
        </div>
    );
}