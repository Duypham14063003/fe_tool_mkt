import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/css/statistics.css";
import "../assets/css/settings.css";
import { getStoredUser } from "../services/authService";
import { listKpis, createKpi, deleteKpi, calcAchievement, kpiStatus } from "../services/kpiService";
import logoImg from "../assets/img/logo19tDigital.jpg";

function BrandLogo({ className }) {
    const [broken, setBroken] = useState(false);
    if (broken) return <div className={`${className} logo-fallback`}>19T</div>;
    return <img src={logoImg} alt="19T Digital Logo" className={className} onError={() => setBroken(true)} />;
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
        <path d="M9 2.6v1.6M9 13.8v1.6M15.4 9h-1.6M4.2 9H2.6M13.2 4.8l-1.1 1.1M5.9 12.1l-1.1 1.1M13.2 13.2l-1.1-1.1M5.9 5.9 4.8 4.8" strokeLinecap="round" />
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

export default function Settings({ onLogout }) {
    const location = useLocation();
    const [kpis, setKpis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);

    // KPI Form
    const [platform, setPlatform] = useState("FACEBOOK");
    const [metricName, setMetricName] = useState("totalViews");
    const [targetValue, setTargetValue] = useState(5000);
    const [periodType, setPeriodType] = useState("MONTHLY");
    const [periodStart, setPeriodStart] = useState("2026-07-01");
    const [periodEnd, setPeriodEnd] = useState("2026-07-31");
    const [submitting, setSubmitting] = useState(false);

    const user = getStoredUser();
    const displayName = user?.name || "Admin Premium";
    const avatarChar = displayName.trim().charAt(0).toUpperCase();

    const fetchKpis = async () => {
        setLoading(true);
        try {
            const data = await listKpis();
            setKpis(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKpis();
    }, []);

    const handleCreateKpi = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createKpi({
                platform,
                metricName,
                targetValue: Number(targetValue),
                periodType,
                periodStart,
                periodEnd
            });
            setShowModal(false);
            fetchKpis();
        } catch (err) {
            alert("Lỗi khi thêm KPI: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteKpi = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa mục tiêu KPI này?")) return;
        try {
            await deleteKpi(id);
            fetchKpis();
        } catch (err) {
            alert("Lỗi khi xóa KPI: " + err.message);
        }
    };

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <div className="logo"><BrandLogo className="brand-logo" /></div>
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
                    <a href="#" className="nav-item"><span className="nav-icon"><IconHelp /></span> Hỗ trợ</a>
                    <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setConfirmLogout(true); }}><span className="nav-icon"><IconLogout /></span> Đăng xuất</a>
                </div>
            </aside>

            <main className="main">
                <header className="topbar">
                    <div className="topbar-right">
                        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Thêm chỉ số KPI</button>
                    </div>
                </header>

                <div className="content" style={{ padding: "32px" }}>
                    <div className="breadcrumb"><span className="chip">NỘI BỘ</span></div>
                    <h1 className="page-title">Cài đặt & Quản lý KPI</h1>
                    <p className="page-desc">Thiết lập mục tiêu chỉ số hiệu suất cho các chiến dịch mạng xã hội.</p>

                    {/* User info card */}
                    <div className="profile-card" style={{ marginTop: "24px" }}>
                        <div className="profile-avatar-large">{avatarChar}</div>
                        <div>
                            <h2>{displayName}</h2>
                            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: "2px" }}>{user?.email || "admin@19t.vn"}</p>
                            <span className="chip" style={{ marginTop: "8px", display: "inline-block" }}>QUẢN TRỊ VIÊN HỆ THỐNG</span>
                        </div>
                    </div>

                    {/* KPI Panel */}
                    <section className="panel" style={{ marginTop: "24px" }}>
                        <div className="panel-header">
                            <h2>Mục tiêu KPI Đã Thiết lập</h2>
                        </div>
                        <div className="table-wrap">
                            {loading ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Đang tải KPI...</div>
                            ) : kpis.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Chưa thiết lập KPI nào.</div>
                            ) : (
                                <table className="grid-table">
                                    <thead>
                                        <tr>
                                            <th>Nền tảng</th>
                                            <th>Chỉ số</th>
                                            <th>Chu kỳ</th>
                                            <th>Mục tiêu (Target)</th>
                                            <th>Thực tế (Actual)</th>
                                            <th>Tỷ lệ đạt (%)</th>
                                            <th>Đánh giá</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kpis.map((k) => {
                                            // Simulated actual value for visual demonstration
                                            const actual = k.metricName === "engagementRate" ? 3.42 : 5101;
                                            const rate = calcAchievement(actual, Number(k.targetValue));
                                            const status = kpiStatus(rate);
                                            return (
                                                <tr key={k.id}>
                                                    <td className="center">
                                                        <span className={`account-platform-badge ${k.platform.toLowerCase()}`}>
                                                            {k.platform}
                                                        </span>
                                                    </td>
                                                    <td className="center font-bold">{k.metricName}</td>
                                                    <td className="center">{k.periodType} ({k.periodStart} → {k.periodEnd})</td>
                                                    <td className="center font-bold">{Number(k.targetValue).toLocaleString()}</td>
                                                    <td className="center font-bold">{actual.toLocaleString()}</td>
                                                    <td className="center font-bold" style={{ color: rate >= 100 ? "var(--success)" : "var(--error)" }}>{rate}%</td>
                                                    <td className="center">
                                                        <span className={`kpi-status-badge ${status.toLowerCase()}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="center">
                                                        <button className="btn-text small-btn" style={{ color: "var(--error)" }} onClick={() => handleDeleteKpi(k.id)}>Xóa</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Thiết lập KPI Target Mới</h2>
                        <form onSubmit={handleCreateKpi} style={{ marginTop: "16px" }}>
                            <div className="form-group">
                                <label>Nền tảng</label>
                                <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                                    <option value="FACEBOOK">Facebook</option>
                                    <option value="TIKTOK">TikTok</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Chỉ số cần đo lường (Metric)</label>
                                <select value={metricName} onChange={(e) => setMetricName(e.target.value)}>
                                    <option value="totalViews">Tổng lượt xem (totalViews)</option>
                                    <option value="totalReach">Người tiếp cận (totalReach)</option>
                                    <option value="reactions">Lượt thích/tương tác (reactions)</option>
                                    <option value="engagementRate">Tỷ lệ tương tác % (engagementRate)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Giá trị mục tiêu (Target Value)</label>
                                <input type="number" required value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Loại chu kỳ</label>
                                <select value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
                                    <option value="MONTHLY">Hàng tháng (MONTHLY)</option>
                                    <option value="WEEKLY">Hàng tuần (WEEKLY)</option>
                                    <option value="DAILY">Hàng ngày (DAILY)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ngày bắt đầu</label>
                                <input type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Ngày kết thúc</label>
                                <input type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                            </div>
                            <div className="modal-actions" style={{ marginTop: "24px" }}>
                                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="modal-btn modal-btn-confirm" disabled={submitting}>
                                    {submitting ? "Đang lưu..." : "Lưu KPI Target"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
