import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/css/statistics.css";
import "../assets/css/sync.css";
import { getStoredUser } from "../services/authService";
import { listJobs, createSync, cancelJob } from "../services/syncService";
import { listAccounts } from "../services/platformAccountService";
import { usePolling } from "../hooks/usePolling";
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

export default function SyncJobs({ onLogout }) {
    const location = useLocation();
    const [jobs, setJobs] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);

    // Form
    const [platformAccountId, setPlatformAccountId] = useState("");
    const [dateFrom, setDateFrom] = useState("2026-07-01");
    const [dateTo, setDateTo] = useState("2026-07-16");
    const [forceRefresh, setForceRefresh] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const user = getStoredUser();

    const fetchJobs = useCallback(async () => {
        try {
            const data = await listJobs();
            setJobs(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
        listAccounts().then((res) => {
            setAccounts(res || []);
            if (res && res.length > 0) setPlatformAccountId(res[0].id);
        }).catch(console.error);
    }, [fetchJobs]);

    // Check if any job is RUNNING or QUEUED to enable polling
    const hasActiveJob = jobs.some(j => j.status === "RUNNING" || j.status === "QUEUED");
    usePolling(fetchJobs, 3000, hasActiveJob);

    const handleCreateSync = async (e) => {
        e.preventDefault();
        if (!platformAccountId) {
            alert("Vui lòng chọn tài khoản để đồng bộ.");
            return;
        }
        setSubmitting(true);
        try {
            await createSync({
                platformAccountId,
                dateFrom,
                dateTo,
                forceRefresh
            });
            setShowModal(false);
            fetchJobs();
        } catch (err) {
            alert(err.message || "Lỗi khi khởi tạo đồng bộ.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Bạn muốn hủy tiến trình đồng bộ này?")) return;
        try {
            await cancelJob(id);
            fetchJobs();
        } catch (err) {
            alert("Lỗi khi hủy: " + err.message);
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
                        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Tạo lượt đồng bộ mới</button>
                    </div>
                </header>

                <div className="content" style={{ padding: "32px" }}>
                    <div className="breadcrumb"><span className="chip">NỘI BỘ</span></div>
                    <h1 className="page-title">Nhật ký Đồng bộ Dữ liệu (Sync Jobs)</h1>
                    <p className="page-desc">Theo dõi tiến trình cào dữ liệu chỉ số từ các nền tảng mạng xã hội.</p>

                    <section className="panel" style={{ marginTop: "24px" }}>
                        <div className="table-wrap">
                            {loading ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Đang tải danh sách jobs...</div>
                            ) : jobs.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Chưa có tiến trình đồng bộ nào.</div>
                            ) : (
                                <table className="grid-table">
                                    <thead>
                                        <tr>
                                            <th>Mã Job</th>
                                            <th>Loại Job</th>
                                            <th>Trạng thái</th>
                                            <th>Tiến độ</th>
                                            <th>Khoảng thời gian</th>
                                            <th>Thời gian tạo</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job) => (
                                            <tr key={job.id}>
                                                <td className="center font-bold">{job.id}</td>
                                                <td className="center">{job.jobType}</td>
                                                <td className="center">
                                                    <span className={`sync-status-pill ${job.status.toLowerCase()}`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="center">
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                                                        <div className="progress-bar-container">
                                                            <div className="progress-bar-fill" style={{ width: `${job.progress}%` }}></div>
                                                        </div>
                                                        <span>{job.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="center">{job.dateFrom} → {job.dateTo}</td>
                                                <td className="center">{new Date(job.createdAt).toLocaleString("vi-VN")}</td>
                                                <td className="center">
                                                    {(job.status === "RUNNING" || job.status === "QUEUED") && (
                                                        <button className="btn-text small-btn" style={{ color: "var(--error)" }} onClick={() => handleCancel(job.id)}>Hủy</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
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
                        <h2 className="modal-title">Tạo Lượt Đồng bộ Dữ liệu</h2>
                        <form onSubmit={handleCreateSync} style={{ marginTop: "16px" }}>
                            <div className="form-group">
                                <label>Tài khoản kết nối</label>
                                <select value={platformAccountId} onChange={(e) => setPlatformAccountId(e.target.value)}>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            [{acc.platform}] {acc.accountName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Từ ngày</label>
                                <input type="date" required value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Đến ngày</label>
                                <input type="date" required value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input type="checkbox" id="force" checked={forceRefresh} onChange={(e) => setForceRefresh(e.target.checked)} style={{ width: "auto" }} />
                                <label htmlFor="force" style={{ margin: 0, fontWeight: "normal" }}>Ép buộc quét lại dữ liệu cũ (Force Refresh)</label>
                            </div>
                            <div className="modal-actions" style={{ marginTop: "24px" }}>
                                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="modal-btn modal-btn-confirm" disabled={submitting}>
                                    {submitting ? "Đang tạo..." : "Bắt đầu Đồng bộ"}
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
