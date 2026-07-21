import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/css/statistics.css";
import { getDashboardSummary } from "../services/dashboardService";
import { getStoredUser } from "../services/authService";
import logoImg from "../assets/img/logo19tDigital.jpg";

function BrandLogo({ className }) {
    const [broken, setBroken] = useState(false);
    if (broken) {
        return <div className={`${className} logo-fallback`}>19T</div>;
    }
    return (
        <img
            src={logoImg}
            alt="19T Digital Logo"
            className={className}
            onError={() => setBroken(true)}
        />
    );
}

const IconHome = () => (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2.5 8.5 9 3l6.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 7.5V15h10V7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconChart = () => (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 14.5V9M8 14.5V4M13 14.5v-7" strokeLinecap="round" />
        <path d="M2.5 16h13" strokeLinecap="round" />
    </svg>
);
const IconList = () => (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 5h8M6 9h8M6 13h8" strokeLinecap="round" />
        <circle cx="3" cy="5" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="3" cy="9" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="3" cy="13" r="0.9" fill="currentColor" stroke="none" />
    </svg>
);
const IconGear = () => (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="9" r="2.6" />
        <path
            d="M9 2.6v1.6M9 13.8v1.6M15.4 9h-1.6M4.2 9H2.6M13.2 4.8l-1.1 1.1M5.9 12.1l-1.1 1.1M13.2 13.2l-1.1-1.1M5.9 5.9 4.8 4.8"
            strokeLinecap="round"
        />
    </svg>
);
const IconHelp = () => (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="9" r="6.7" />
        <path d="M7 7c0-1.2 1-2 2-2s2 .7 2 1.8c0 1.3-2 1.4-2 3.2" strokeLinecap="round" />
        <circle cx="9" cy="12.6" r="0.15" fill="currentColor" />
    </svg>
);
const IconLogout = () => (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 15.5H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h3" strokeLinecap="round" />
        <path d="M11.5 12.5 15 9l-3.5-3.5M15 9H6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const NAV_ITEMS = [
    { icon: <IconHome />, label: "Trang chủ", to: "/dashboard" },
    { icon: <IconList />, label: "Nội dung", to: "/posts" },
    { icon: <IconGear />, label: "Cài đặt", to: "/settings" },
];

export default function Dashboard({ onLogout }) {
    const location = useLocation();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const user = getStoredUser();

    const displayName = user?.name || "Admin Premium";
    const avatarChar = displayName.trim().charAt(0).toUpperCase();

    useEffect(() => {
        getDashboardSummary()
            .then((data) => {
                setSummary(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <div className="logo">
                        <BrandLogo className="brand-logo" />
                    </div>
                    <div className="brand-sub">INTERNAL DATABASE</div>
                </div>

                <nav className="nav">
                    {NAV_ITEMS.map((item) => (
                        <Link to={item.to} key={item.label} className={`nav-item${location.pathname === item.to ? " active" : ""}`}>
                            <span className="nav-icon">{item.icon}</span> {item.label}
                        </Link>
                    ))}
                    <Link to="/accounts" className={`nav-item${location.pathname === "/accounts" ? " active" : ""}`}>
                        <span className="nav-icon"><IconGear /></span> Tài khoản MXH
                    </Link>
                    <Link to="/sync" className={`nav-item${location.pathname === "/sync" ? " active" : ""}`}>
                        <span className="nav-icon"><IconChart /></span> Đồng bộ
                    </Link>
                </nav>

                <div className="sidebar-bottom">
                    <a href="#" className="nav-item">
                        <span className="nav-icon"><IconHelp /></span> Hỗ trợ
                    </a>
                    <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setConfirmLogout(true); }}>
                        <span className="nav-icon"><IconLogout /></span> Đăng xuất
                    </a>
                </div>
            </aside>

            <main className="main">
                <header className="topbar">
                    <div className="topbar-right">
                        <div className="profile-dropdown-wrap">
                            <button
                                className="icon-btn"
                                onClick={() => setProfileOpen(!profileOpen)}
                                type="button"
                            >
                                👤
                            </button>
                            {profileOpen && (
                                <div className="profile-dropdown" style={{ right: 0, position: "absolute", zIndex: 10 }}>
                                    <div className="profile-info-header">
                                        <div className="profile-avatar">{avatarChar}</div>
                                        <div className="profile-text">
                                            <span className="profile-name">{displayName}</span>
                                            <span className="profile-email">{user?.email || "admin@19t.vn"}</span>
                                        </div>
                                    </div>
                                    <div className="profile-info-divider"></div>
                                    <div className="profile-info-row">
                                        <span className="info-label">Vai trò:</span>
                                        <span className="info-value">QUẢN TRỊ VIÊN</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="content" style={{ padding: "32px" }}>
                    <div className="breadcrumb">
                        <span className="chip">NỘI BỘ</span>
                    </div>
                    <h1 className="page-title">Bảng điều khiển</h1>
                    <p className="page-desc">Tổng quan các chỉ số đa kênh và hiệu suất làm việc.</p>

                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>Đang tải tổng quan...</div>
                    ) : (
                        <section className="stats-grid" style={{ marginTop: "24px" }}>
                            <div className="stat-card">
                                <span className="stat-label">TỔNG SỐ BÀI VIẾT</span>
                                <div className="stat-value">{summary?.totalPosts ?? 0}</div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">TỔNG LƯỢT XEM</span>
                                <div className="stat-value">{(summary?.totalViews ?? 0).toLocaleString()}</div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">NGƯỜI TIẾP CẬN</span>
                                <div className="stat-value">{(summary?.totalReach ?? 0).toLocaleString()}</div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">TỶ LỆ TƯƠNG TÁC</span>
                                <div className="stat-value">{summary?.engagementRate ?? 0}%</div>
                            </div>
                        </section>
                    )}

                    <div style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div className="panel" style={{ padding: "24px" }}>
                            <h3>Truy cập nhanh</h3>
                            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                                <Link to="/posts" className="btn-primary" style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}>Quản lý Bài viết</Link>
                                <Link to="/sync" className="btn-outline" style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}>Đồng bộ dữ liệu</Link>
                            </div>
                        </div>
                        <div className="panel" style={{ padding: "24px" }}>
                            <h3>Trạng thái hệ thống</h3>
                            <p style={{ marginTop: "16px", color: "var(--success)" }}>Hoạt động bình thường</p>
                            <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--ink-soft)" }}>Tất cả các API kết nối với Facebook, TikTok và Odoo đang ở trạng thái ổn định.</p>
                        </div>
                    </div>
                </div>
            </main>

            {confirmLogout && (
                <div className="modal-backdrop" onClick={() => setConfirmLogout(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Xác nhận đăng xuất</h2>
                        <p className="modal-desc">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
                        <div className="modal-actions">
                            <button className="modal-btn modal-btn-cancel" onClick={() => setConfirmLogout(false)}>Hủy</button>
                            <button className="modal-btn modal-btn-confirm" onClick={onLogout}>Đăng xuất</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
