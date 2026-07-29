import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/css/statistics.css";
import "../assets/css/accounts.css";
import { getDashboardChannels } from "../services/dashboardService";
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
// const IconHelp = () => (
//     <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
//         <circle cx="9" cy="9" r="6.7" />
//         <path d="M7 7c0-1.2 1-2 2-2s2 .7 2 1.8c0 1.3-2 1.4-2 3.2" strokeLinecap="round" />
//         <circle cx="9" cy="12.6" r="0.15" fill="currentColor" />
//     </svg>
// );
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

function ChannelAccountsTable({ title, platform, accounts = [] }) {
    const rows = accounts.filter((account) => account.platform === platform);
    const isFacebook = platform === "FACEBOOK";
    return (
        <section className="panel dashboard-channel-panel">
            <div className="panel-header">
                <div>
                    <h2>{title}</h2>
                    <p className="page-desc">{rows.length} kênh đang được quản lý</p>
                </div>
            </div>
            <div className="table-wrap">
                {rows.length ? (
                    <table className="grid-table">
                        <thead>
                            <tr>
                                <th>Tài khoản</th>
                                <th>Trạng thái</th>
                                <th>{isFacebook ? "Reach" : "Lượt xem"}</th>
                                <th>{isFacebook ? "Tương tác" : "Follow mới"}</th>
                                <th>Đồng bộ gần nhất</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((account) => (
                                <tr key={account.id}>
                                    <td>
                                        <div className="font-bold">{account.accountName}</div>
                                        <div className="dashboard-account-id">ID: {account.externalAccountId}</div>
                                    </td>
                                    <td className="center">{account.connectionStatus}</td>
                                    <td className="center font-bold">
                                        {Number(isFacebook ? account.totalReach : account.totalViews).toLocaleString()}
                                    </td>
                                    <td className="center font-bold">
                                        {Number(isFacebook ? account.totalInteractions : account.totalFollowers).toLocaleString()}
                                    </td>
                                    <td className="center">
                                        {account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString("vi-VN") : "Chưa đồng bộ"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="dashboard-channel-empty">Chưa có tài khoản {title}.</div>
                )}
            </div>
        </section>
    );
}

function PlatformSummary({ title, platform, accounts = [] }) {
    const rows = accounts.filter((account) => account.platform === platform);
    const isFacebook = platform === "FACEBOOK";
    const primaryTotal = rows.reduce(
        (sum, account) => sum + Number(isFacebook ? account.totalReach : account.totalViews),
        0,
    );
    const secondaryTotal = rows.reduce(
        (sum, account) => sum + Number(isFacebook ? account.totalInteractions : account.totalFollowers),
        0,
    );
    return (
        <section className={`platform-summary ${platform.toLowerCase()}`}>
            <h2>{title}</h2>
            <div className="platform-summary-stats">
                <div>
                    <span>SỐ KÊNH</span>
                    <strong>{rows.length}</strong>
                </div>
                <div>
                    <span>{isFacebook ? "TỔNG REACH" : "TỔNG LƯỢT XEM"}</span>
                    <strong>{primaryTotal.toLocaleString()}</strong>
                </div>
                <div>
                    <span>{isFacebook ? "TỔNG TƯƠNG TÁC" : "FOLLOW MỚI"}</span>
                    <strong>{secondaryTotal.toLocaleString()}</strong>
                </div>
            </div>
        </section>
    );
}

export default function Dashboard({ onLogout }) {
    const location = useLocation();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const user = getStoredUser();

    const displayName = user?.name || "Admin Premium";
    const avatarChar = displayName.trim().charAt(0).toUpperCase();

    useEffect(() => {
        getDashboardChannels()
            .then((data) => {
                setDashboard(data);
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
                    <div className="brand-sub">MARKETING TOOL</div>
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
                    {/*<a href="#" className="nav-item">*/}
                    {/*    <span className="nav-icon"><IconHelp /></span> Hỗ trợ*/}
                    {/*</a>*/}
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
                    <p className="page-desc">Tổng quan số kênh và hiệu suất của từng tài khoản mạng xã hội.</p>

                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>Đang tải tổng quan...</div>
                    ) : (
                        <div className="platform-summary-grid">
                            <PlatformSummary title="Facebook" platform="FACEBOOK" accounts={dashboard?.accounts} />
                            <PlatformSummary title="TikTok" platform="TIKTOK" accounts={dashboard?.accounts} />
                        </div>
                    )}

                    {!loading && (
                        <div className="dashboard-channel-grid">
                            <ChannelAccountsTable title="Facebook" platform="FACEBOOK" accounts={dashboard?.accounts} />
                            <ChannelAccountsTable title="TikTok" platform="TIKTOK" accounts={dashboard?.accounts} />
                        </div>
                    )}
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
