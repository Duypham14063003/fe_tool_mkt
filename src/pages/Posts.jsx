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

function formatDuration(sec) {
    if (!sec || isNaN(sec)) return "--";
    const s = Math.round(Number(sec));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
        return `${hrs}h${mins}m${secs}s`;
    }
    return `${mins}m${secs}s`;
}

export default function Posts({ onLogout }) {
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 100, totalPages: 1 });
    const [platformFilter, setPlatformFilter] = useState("FACEBOOK");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Đang nhập trong input ngày
    const [tempDateFrom, setTempDateFrom] = useState("");
    const [tempDateTo, setTempDateTo] = useState("");

    // Ngày thực tế đã bấm Nút Lọc
    const [appliedDateFrom, setAppliedDateFrom] = useState("");
    const [appliedDateTo, setAppliedDateTo] = useState("");
    
    // Nút preset đang chọn ("all", "this_month", "last_month", "custom")
    const [activePreset, setActivePreset] = useState("all");
    
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [history, setHistory] = useState([]);
    const [confirmLogout, setConfirmLogout] = useState(false);

    const fetchPosts = (page = 1) => {
        setLoading(true);
        const params = { page, limit: 100 };
        if (platformFilter) params.platform = platformFilter;
        if (appliedDateFrom) params.dateFrom = appliedDateFrom;
        if (appliedDateTo) params.dateTo = appliedDateTo;

        listPosts(params)
            .then((res) => {
                setPosts(res.data || []);
                setMeta(res.meta || { page: 1, limit: 100, totalPages: 1 });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPosts(1);
    }, [platformFilter, appliedDateFrom, appliedDateTo]);

    // Bấm nút Chọn Khoảng Nhanh
    const handleQuickRange = (type) => {
        setActivePreset(type);
        const today = new Date();
        let from = "";
        let to = "";

        if (type === "this_month") {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            from = firstDay.toISOString().split("T")[0];
            to = today.toISOString().split("T")[0];
        } else if (type === "last_month") {
            const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
            from = firstDay.toISOString().split("T")[0];
            to = lastDay.toISOString().split("T")[0];
        } else if (type === "all") {
            from = "";
            to = "";
        }

        setTempDateFrom(from);
        setTempDateTo(to);
        setAppliedDateFrom(from);
        setAppliedDateTo(to);
    };

    // Bấm Nút Lọc Dữ Liệu
    const handleApplyFilter = () => {
        setActivePreset("custom");
        setAppliedDateFrom(tempDateFrom);
        setAppliedDateTo(tempDateTo);
    };

    const handleSelectPost = (post) => {
        setSelectedPost(post);
        getMetricHistory(post.id).then(setHistory).catch(() => setHistory([]));
    };

    // Lọc theo từ khóa & ngày áp dụng
    const filteredPosts = posts.filter(p => {
        const matchesSearch = !searchQuery || (p.caption || "").toLowerCase().includes(searchQuery.toLowerCase());
        const postDate = new Date(p.publishedAt);
        const matchesFrom = !appliedDateFrom || postDate >= new Date(appliedDateFrom);
        const matchesTo = !appliedDateTo || postDate <= new Date(appliedDateTo + "T23:59:59");
        return matchesSearch && matchesFrom && matchesTo;
    });

    // Tính toán hàng tổng cộng (Total Row)
    const calcTotals = () => {
        const totals = {
            count: filteredPosts.length,
            views: 0,
            reach: 0,
            viewers: 0,
            interactions: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0,
            view3s: 0,
            view1m: 0,
            watchTime: 0,
            newFollowers: 0
        };

        filteredPosts.forEach(p => {
            const m = p.metrics?.[0] || {};
            totals.views += Number(m.views) || 0;
            totals.reach += Number(m.reach) || 0;
            totals.viewers += Number(m.viewers) || 0;
            totals.likes += Number(m.likes) || 0;
            totals.comments += Number(m.comments) || 0;
            totals.shares += Number(m.shares) || 0;
            totals.saves += Number(m.saves) || 0;
            totals.view3s += Number(m.view3Seconds) || 0;
            totals.view1m += Number(m.view1Minute) || 0;
            totals.watchTime += Number(m.totalWatchTimeSeconds) || 0;
            totals.newFollowers += Number(m.newFollowers) || 0;

            const reactions = Number(m.reactions) || Number(m.likes) || 0;
            totals.interactions += reactions + (Number(m.comments) || 0) + (Number(m.shares) || 0);
        });

        return totals;
    };

    const totals = calcTotals();

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
                    <h1 className="page-title">Chi Tiết Chỉ Số Đo Lường</h1>
                    <p className="page-desc">Hiển thị đầy đủ thông tin chỉ số thực từ Backend Facebook & TikTok theo thời gian.</p>

                    {/* Thanh Bộ Lọc & Ngày tháng */}
                    <div className="posts-filter-bar" style={{ marginTop: "24px", flexDirection: "column", alignItems: "stretch", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                            {/* Tabs Nền Tảng */}
                            <div className="tabs">
                                <button
                                    className={`tab${platformFilter === "FACEBOOK" ? " active" : ""}`}
                                    onClick={() => setPlatformFilter("FACEBOOK")}
                                    style={platformFilter === "FACEBOOK" ? { background: "var(--gold)", color: "#111", fontWeight: "bold" } : {}}
                                >
                                    Facebook
                                </button>
                                <button
                                    className={`tab${platformFilter === "TIKTOK" ? " active" : ""}`}
                                    onClick={() => setPlatformFilter("TIKTOK")}
                                    style={platformFilter === "TIKTOK" ? { background: "var(--gold)", color: "#111", fontWeight: "bold" } : {}}
                                >
                                    TikTok
                                </button>
                                <button
                                    className={`tab${platformFilter === "" ? " active" : ""}`}
                                    onClick={() => setPlatformFilter("")}
                                    style={platformFilter === "" ? { background: "var(--gold)", color: "#111", fontWeight: "bold" } : {}}
                                >
                                    Tất cả
                                </button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--panel)", padding: "10px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--line)", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)" }}>Chọn ngày:</span>
                                <input
                                    type="date"
                                    value={tempDateFrom}
                                    onChange={(e) => setTempDateFrom(e.target.value)}
                                    style={{ border: "1px solid var(--line)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px" }}
                                />
                                <span style={{ color: "var(--ink-soft)" }}>đến</span>
                                <input
                                    type="date"
                                    value={tempDateTo}
                                    onChange={(e) => setTempDateTo(e.target.value)}
                                    style={{ border: "1px solid var(--line)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px" }}
                                />

                                {/* Nút Lọc Dữ Liệu nổi bật */}
                                <button
                                    onClick={handleApplyFilter}
                                    style={{
                                        background: "var(--gold-deep)",
                                        color: "#fff",
                                        fontWeight: "600",
                                        padding: "6px 16px",
                                        borderRadius: "6px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                    }}
                                >
                                    Lọc
                                </button>

                                <div style={{ height: "20px", width: "1px", background: "var(--line)", margin: "0 4px" }} />
                                <button
                                    className="btn-outline small-btn"
                                    onClick={() => handleQuickRange("this_month")}
                                    style={activePreset === "this_month" ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)", fontWeight: "bold" } : {}}
                                >
                                    Tháng này
                                </button>
                                <button
                                    className="btn-outline small-btn"
                                    onClick={() => handleQuickRange("last_month")}
                                    style={activePreset === "last_month" ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)", fontWeight: "bold" } : {}}
                                >
                                    Tháng trước
                                </button>
                                <button
                                    className="btn-outline small-btn"
                                    onClick={() => handleQuickRange("all")}
                                    style={activePreset === "all" ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)", fontWeight: "bold" } : {}}
                                >
                                    Tất cả
                                </button>
                            </div>
                        </div>
                    </div>

                    <section className="panel" style={{ overflowX: "auto", marginTop: "16px" }}>
                        <div className="table-wrap">
                            {loading ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Đang tải dữ liệu bài viết...</div>
                            ) : filteredPosts.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Không tìm thấy dữ liệu nào trong khoảng thời gian này.</div>
                            ) : platformFilter === "FACEBOOK" ? (
                                /* BẢNG CHUẨN FACEBOOK */
                                <table className="grid-table">
                                    <thead>
                                        <tr style={{ background: "#D9E1F2", color: "#000" }}>
                                            <th className="center" style={{ width: "40px" }}>STT</th>
                                            <th className="center" style={{ width: "90px" }}>Ngày đăng</th>
                                            <th className="center" style={{ width: "80px" }}>Loại</th>
                                            <th className="left">Caption</th>
                                            <th className="center">Reach</th>
                                            <th className="center">Lượt xem</th>
                                            <th className="center">Tương tác</th>
                                            <th className="center">Xem từ 3s</th>
                                            <th className="center">Xem từ 1 phút</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPosts.map((post, idx) => {
                                            const m = post.metrics?.[0] || {};
                                            const reactions = Number(m.reactions) || Number(m.likes) || 0;
                                            const totalInter = reactions + (Number(m.comments) || 0) + (Number(m.shares) || 0);
                                            const contentTypeText = post.contentType === "VIDEO" ? "Video" : "Ảnh";

                                            return (
                                                <tr key={post.id}>
                                                    <td className="center font-bold">{idx + 1}</td>
                                                    <td className="center">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</td>
                                                    <td className="center">{contentTypeText}</td>
                                                    <td className="left caption-cell" style={{ maxWidth: "260px" }}>{post.caption || "(Không có caption)"}</td>
                                                    <td className="center font-bold">{m.reach ? Number(m.reach).toLocaleString() : "--"}</td>
                                                    <td className="center font-bold">{m.views ? Number(m.views).toLocaleString() : "--"}</td>
                                                    <td className="center font-bold">{totalInter ? totalInter.toLocaleString() : "0"}</td>
                                                    <td className="center">{m.view3Seconds ? Number(m.view3Seconds).toLocaleString() : "--"}</td>
                                                    <td className="center">{m.view1Minute ? Number(m.view1Minute).toLocaleString() : "--"}</td>
                                                </tr>
                                            );
                                        })}

                                        {/* Hàng tổng cộng */}
                                        <tr style={{ background: "#D9E1F2", fontWeight: "bold" }}>
                                            <td colSpan={4} className="center">TỔNG {totals.count} BÀI</td>
                                            <td className="center">{totals.reach.toLocaleString()}</td>
                                            <td className="center">{totals.views.toLocaleString()}</td>
                                            <td className="center">{totals.interactions.toLocaleString()}</td>
                                            <td className="center">{totals.view3s.toLocaleString()}</td>
                                            <td className="center">{totals.view1m.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : platformFilter === "TIKTOK" ? (
                                /* BẢNG CHUẨN TIKTOK */
                                <table className="grid-table" style={{ fontSize: "12px", minWidth: "1200px" }}>
                                    <thead>
                                        <tr style={{ background: "#B4C6E7", color: "#000" }}>
                                            <th className="center">STT</th>
                                            <th className="center">Ngày</th>
                                            <th className="left" style={{ minWidth: "150px" }}>Caption</th>
                                            <th className="center">Lượt xem</th>
                                            <th className="center">Người xem</th>
                                            <th className="center">Like</th>
                                            <th className="center">Bình luận</th>
                                            <th className="center">Chia sẻ</th>
                                            <th className="center">Lưu video</th>
                                            <th className="center">Tổng thời gian phát</th>
                                            <th className="center">Thời gian xem TB</th>
                                            <th className="center">Tỷ lệ xem hết</th>
                                            <th className="center">Follow mới</th>
                                            <th className="center">Nguồn chính</th>
                                            <th className="center">Nam</th>
                                            <th className="center">Nữ</th>
                                            <th className="center">Độ tuổi chính</th>
                                            <th className="center">Khu vực chính</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPosts.map((post, idx) => {
                                            const m = post.metrics?.[0] || {};
                                            const raw = m.rawData || {};

                                            return (
                                                <tr key={post.id}>
                                                    <td className="center font-bold">{idx + 1}</td>
                                                    <td className="center">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</td>
                                                    <td className="left caption-cell" style={{ maxWidth: "200px" }}>{post.caption || "(Không có caption)"}</td>
                                                    <td className="center font-bold">{m.views ? Number(m.views).toLocaleString() : 0}</td>
                                                    <td className="center">{m.viewers ? Number(m.viewers).toLocaleString() : "--"}</td>
                                                    <td className="center">{m.likes ? Number(m.likes).toLocaleString() : 0}</td>
                                                    <td className="center">{m.comments ? Number(m.comments).toLocaleString() : 0}</td>
                                                    <td className="center">{m.shares ? Number(m.shares).toLocaleString() : 0}</td>
                                                    <td className="center">{m.saves ? Number(m.saves).toLocaleString() : 0}</td>
                                                    <td className="center">{formatDuration(m.totalWatchTimeSeconds)}</td>
                                                    <td className="center">{m.averageWatchTimeSeconds ? `${Number(m.averageWatchTimeSeconds).toFixed(1)}s` : "--"}</td>
                                                    <td className="center">{m.completionRate ? `${Number(m.completionRate).toFixed(1)}%` : "--"}</td>
                                                    <td className="center">{m.newFollowers ? Number(m.newFollowers) : 0}</td>
                                                    <td className="center">{m.trafficSource || raw.reach_type || "Đề xuất"}</td>
                                                    <td className="center">{m.maleRate ? `${Number(m.maleRate)}%` : "--"}</td>
                                                    <td className="center">{m.femaleRate ? `${Number(m.femaleRate)}%` : "--"}</td>
                                                    <td className="center">{m.mainAgeGroup || "--"}</td>
                                                    <td className="center">{m.mainLocation || "Việt Nam"}</td>
                                                </tr>
                                            );
                                        })}

                                        {/* Hàng tổng cộng */}
                                        <tr style={{ background: "#B4C6E7", fontWeight: "bold" }}>
                                            <td colSpan={3} className="center">TỔNG {totals.count} VIDEO</td>
                                            <td className="center">{totals.views.toLocaleString()}</td>
                                            <td className="center">{totals.viewers ? totals.viewers.toLocaleString() : "--"}</td>
                                            <td className="center">{totals.likes.toLocaleString()}</td>
                                            <td className="center">{totals.comments.toLocaleString()}</td>
                                            <td className="center">{totals.shares.toLocaleString()}</td>
                                            <td className="center">{totals.saves.toLocaleString()}</td>
                                            <td className="center">{formatDuration(totals.watchTime)}</td>
                                            <td className="center">--</td>
                                            <td className="center">--</td>
                                            <td className="center">{totals.newFollowers}</td>
                                            <td colSpan={5} className="center">--</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                /* BẢNG TẤT CẢ */
                                <table className="grid-table">
                                    <thead>
                                        <tr>
                                            <th>Nền tảng</th>
                                            <th>Caption</th>
                                            <th>Ngày đăng</th>
                                            <th>Lượt xem</th>
                                            <th>Reach</th>
                                            <th>Tương tác</th>
                                            <th>Chi tiết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPosts.map((post) => {
                                            const m = post.metrics?.[0] || {};
                                            return (
                                                <tr key={post.id}>
                                                    <td className="center">
                                                        <span className={`account-platform-badge ${post.platform.toLowerCase()}`}>
                                                            {post.platform}
                                                        </span>
                                                    </td>
                                                    <td className="left caption-cell">{post.caption || "(Không có caption)"}</td>
                                                    <td className="center">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</td>
                                                    <td className="center font-bold">{(m.views ?? 0).toLocaleString()}</td>
                                                    <td className="center font-bold">{(m.reach ?? 0).toLocaleString()}</td>
                                                    <td className="center">{m.engagementRate ?? 0}%</td>
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
                                <label>Tiếp cận (Reach)</label>
                                <span>{(selectedPost.metrics?.[0]?.reach ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="post-metric-box">
                                <label>Reactions / Likes</label>
                                <span>{selectedPost.metrics?.[0]?.reactions || selectedPost.metrics?.[0]?.likes || 0}</span>
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
