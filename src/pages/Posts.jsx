import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/css/statistics.css";
import "../assets/css/posts.css";
import { getStoredUser } from "../services/authService";
import { listPosts, getMetricHistory } from "../services/postsService";
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

function LineChartSVG({ history }) {
    if (!history || history.length === 0) return <div>Không có lịch sử dữ liệu</div>;
    const views = history.map(h => Number(h.views) || 0);
    const max = Math.max(...views, 1);
    const min = Math.min(...views, 0);
    const range = max - min || 1;
    const w = 400;
    const h = 120;
    const step = w / (history.length - 1 || 1);
    const points = views.map((v, i) => `${(i * step).toFixed(1)},${(h - 10 - ((v - min) / range) * (h - 20)).toFixed(1)}`).join(" ");

    return (
        <div style={{ marginTop: "12px" }}>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "120px", overflow: "visible" }}>
                <polyline fill="none" stroke="var(--gold)" strokeWidth="2.5" points={points} />
                {views.map((v, i) => {
                    const cx = (i * step).toFixed(1);
                    const cy = (h - 10 - ((v - min) / range) * (h - 20)).toFixed(1);
                    return <circle key={i} cx={cx} cy={cy} r="4" fill="var(--gold-deep)" />;
                })}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "11px", color: "var(--ink-soft)" }}>
                {history.map(h => <span key={h.id}>{h.metricDate.slice(5)}</span>)}
            </div>
        </div>
    );
}

export default function Posts({ onLogout }) {
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [platformFilter, setPlatformFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [history, setHistory] = useState([]);
    const [confirmLogout, setConfirmLogout] = useState(false);

    const user = getStoredUser();

    const fetchPosts = (page = 1) => {
        setLoading(true);
        const params = { page, limit: 10 };
        if (platformFilter) params.platform = platformFilter;

        listPosts(params)
            .then((res) => {
                setPosts(res.data || []);
                setMeta(res.meta || { page: 1, limit: 10, totalPages: 1 });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPosts(1);
    }, [platformFilter]);

    const handleSelectPost = (post) => {
        setSelectedPost(post);
        getMetricHistory(post.id).then(setHistory).catch(() => setHistory([]));
    };

    const filteredPosts = searchQuery
        ? posts.filter(p => (p.caption || "").toLowerCase().includes(searchQuery.toLowerCase()))
        : posts;

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
                        <div className="search">
                            {/*<span className="search-icon">🔍</span>*/}
                            <input
                                type="text"
                                placeholder="Tìm theo caption..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                <div className="content" style={{ padding: "32px" }}>
                    <div className="breadcrumb"><span className="chip">NỘI BỘ</span></div>
                    <h1 className="page-title">Quản lý Nội dung (Posts)</h1>
                    <p className="page-desc">Danh sách bài viết đã xuất bản và chỉ số hiệu suất từng bài.</p>

                    <div className="posts-filter-bar" style={{ marginTop: "24px" }}>
                        <div className="tabs">
                            <button className={`tab${platformFilter === "" ? " active" : ""}`} onClick={() => setPlatformFilter("")}>Tất cả</button>
                            <button className={`tab${platformFilter === "FACEBOOK" ? " active" : ""}`} onClick={() => setPlatformFilter("FACEBOOK")}>Facebook</button>
                            <button className={`tab${platformFilter === "TIKTOK" ? " active" : ""}`} onClick={() => setPlatformFilter("TIKTOK")}>TikTok</button>
                        </div>
                    </div>

                    <section className="panel">
                        <div className="table-wrap">
                            {loading ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Đang tải bài viết...</div>
                            ) : filteredPosts.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Không tìm thấy bài viết nào.</div>
                            ) : (
                                <table className="grid-table">
                                    <thead>
                                        <tr>
                                            {/*<th>Media</th>*/}
                                            <th>Nền tảng</th>
                                            <th>Caption</th>
                                            <th>Ngày đăng</th>
                                            <th>Lượt xem</th>
                                            <th>Reach</th>
                                            <th>Tương tác (%)</th>
                                            <th>Chi tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPosts.map((post) => {
                                            const latestMetric = post.metrics?.[0] || {};
                                            return (
                                                <tr key={post.id}>
                                                    {/*<td className="center">*/}
                                                    {/*    <div className="post-thumbnail">🎬</div>*/}
                                                    {/*</td>*/}
                                                    <td className="center">
                                                        <span className={`account-platform-badge ${post.platform.toLowerCase()}`}>
                                                            {post.platform}
                                                        </span>
                                                    </td>
                                                    <td className="left caption-cell">{post.caption || "(Không có caption)"}</td>
                                                    <td className="center">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</td>
                                                    <td className="center font-bold">{(latestMetric.views ?? 0).toLocaleString()}</td>
                                                    <td className="center font-bold">{(latestMetric.reach ?? 0).toLocaleString()}</td>
                                                    <td className="center">{latestMetric.engagementRate ?? 0}%</td>
                                                    <td className="center">
                                                        <button className="btn-outline small-btn" onClick={() => handleSelectPost(post)}>Xem</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
                            <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Trang {meta.page} / {meta.totalPages}</span>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    className="btn-outline small-btn"
                                    disabled={meta.page <= 1}
                                    onClick={() => fetchPosts(meta.page - 1)}
                                >
                                    Trang trước
                                </button>
                                <button
                                    className="btn-outline small-btn"
                                    disabled={meta.page >= meta.totalPages}
                                    onClick={() => fetchPosts(meta.page + 1)}
                                >
                                    Trang sau
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Post Detail Modal */}
            {selectedPost && (
                <div className="modal-backdrop" onClick={() => setSelectedPost(null)}>
                    <div className="modal-card" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Chi tiết Bài viết</h2>
                        <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--ink)" }}>{selectedPost.caption}</p>

                        <div className="post-metrics-grid">
                            <div className="post-metric-box">
                                <label>Lượt xem</label>
                                <span>{(selectedPost.metrics?.[0]?.views ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="post-metric-box">
                                <label>Tiếp cận</label>
                                <span>{(selectedPost.metrics?.[0]?.reach ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="post-metric-box">
                                <label>Reactions</label>
                                <span>{selectedPost.metrics?.[0]?.reactions ?? 0}</span>
                            </div>
                        </div>

                        <div className="chart-container">
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--ink-soft)" }}>Biểu đồ lượt xem (7 ngày qua)</label>
                            <LineChartSVG history={history} />
                        </div>

                        <div className="modal-actions" style={{ marginTop: "24px" }}>
                            <button className="modal-btn modal-btn-cancel" onClick={() => setSelectedPost(null)}>Đóng</button>
                        </div>
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
