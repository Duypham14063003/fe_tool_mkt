import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import "../assets/css/statistics.css";
import "../assets/css/posts.css";
import { getStoredUser } from "../services/authService";
import { deleteImportBatch, getMetricHistory, importFacebookPosts, listImportBatches, listPosts } from "../services/postsService";
import { listAccounts } from "../services/platformAccountService";
import { exportReportConnected } from "../services/reportService";
import logoImg from "../assets/img/logo19tDigital.jpg";

function BrandLogo({ className }) {
    const [broken, setBroken] = useState(false);
    if (broken) return <div className={`${className} logo-fallback`}>19T</div>;
    return <img src={logoImg} alt="19T Digital Logo" className={className} onError={() => setBroken(true)} />;
}

function ExpandableCaption({ text }) {
    const contentRef = useRef(null);
    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
        if (!expanded && contentRef.current) {
            setOverflowing(contentRef.current.scrollHeight > contentRef.current.clientHeight + 1);
        }
    }, [text, expanded]);

    return (
        <div className="expandable-caption">
            <div ref={contentRef} className={expanded ? "caption-content expanded" : "caption-content"}>
                {text || "(Không có caption)"}
            </div>
            {(overflowing || expanded) && (
                <button
                    type="button"
                    className="caption-toggle"
                    onClick={(event) => {
                        event.stopPropagation();
                        setExpanded((value) => !value);
                    }}
                >
                    {expanded ? "Thu gọn" : "Xem thêm"}
                </button>
            )}
        </div>
    );
}

const IconExcel = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10.5-8.5l-2.3 3.5 2.3 3.5h-1.8l-1.4-2.3-1.4 2.3H10.1l2.3-3.5-2.3-3.5h1.8l1.4 2.3 1.4-2.3h1.8z"/>
    </svg>
);

const IconPdf = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .8-.7 1.5-1.5 1.5H9v2H7.5V7H10c.8 0 1.5.7 1.5 1.5v1zm5 2c0 .8-.7 1.5-1.5 1.5h-2.5V7H15c.8 0 1.5.7 1.5 1.5v3zm4-3.5H19v1h1.5V10H19v3h-1.5V7h3v1.5zM9 8.5h1v1H9v-1zm5 0h1v3h-1v-3zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
    </svg>
);

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
    // Tài khoản
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [tempDateFrom, setTempDateFrom] = useState("");
    const [tempDateTo, setTempDateTo] = useState("");
    const [appliedDateFrom, setAppliedDateFrom] = useState("");
    const [appliedDateTo, setAppliedDateTo] = useState("");
    const [activePreset, setActivePreset] = useState("all");

    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [history, setHistory] = useState([]);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const facebookImportRef = useRef(null);
    const [importing, setImporting] = useState(false);
    const [importBatches, setImportBatches] = useState([]);
    const [showImportHistory, setShowImportHistory] = useState(false);
    const [selectedImportBatchId, setSelectedImportBatchId] = useState("");

    useEffect(() => {
        listAccounts()
            .then(res => setAccounts(res || []))
            .catch(err => console.error("Error loading accounts:", err));
    }, []);

    const fetchImportBatches = async (selectLatest = false) => {
        try {
            const batches = await listImportBatches();
            setImportBatches(batches || []);
            if (selectLatest && batches?.length) setSelectedImportBatchId(batches[0].id);
            return batches || [];
        } catch (error) {
            console.error("Error loading import history:", error);
            return [];
        }
    };

    useEffect(() => {
        fetchImportBatches(true);
    }, []);

    useEffect(() => {
        setSelectedAccountId("");
    }, [platformFilter]);

    const fetchPosts = (page = 1, importBatchId = selectedImportBatchId) => {
        setLoading(true);
        const pageSize = platformFilter === "FACEBOOK" ? 8 : 100;
        const params = { page, limit: pageSize };
        if (platformFilter) params.platform = platformFilter;
        if (selectedAccountId) params.platformAccountId = selectedAccountId;
        if (platformFilter === "FACEBOOK" && importBatchId) params.importBatchId = importBatchId;
        if (platformFilter === "TIKTOK" && appliedDateFrom) params.dateFrom = appliedDateFrom;
        if (platformFilter === "TIKTOK" && appliedDateTo) params.dateTo = appliedDateTo;

        listPosts(params)
            .then((res) => {
                setPosts(res.data || []);
                setMeta(res.meta || { page: 1, limit: pageSize, totalPages: 1 });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPosts(1);
    }, [platformFilter, selectedAccountId, selectedImportBatchId, appliedDateFrom, appliedDateTo]);

    const handleQuickRange = (type) => {
        setActivePreset(type);
        const today = new Date();
        let from = "";
        let to = "";
        if (type === "this_month") {
            from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
            to = today.toISOString().split("T")[0];
        } else if (type === "last_month") {
            from = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0];
            to = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
        }
        setTempDateFrom(from);
        setTempDateTo(to);
        setAppliedDateFrom(from);
        setAppliedDateTo(to);
    };

    const handleApplyFilter = () => {
        setActivePreset("custom");
        setAppliedDateFrom(tempDateFrom);
        setAppliedDateTo(tempDateTo);
    };

    const handleFacebookImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!selectedAccountId) {
            alert("Vui lòng chọn một tài khoản Facebook trước khi import.");
            event.target.value = "";
            return;
        }
        setImporting(true);
        try {
            const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
            const worksheet = workbook.Sheets.Facebook || workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });
            const isFacebookInsights = rows.some((row) => "ID bài viết" in row && "Thời gian đăng" in row);
            const pick = (row, ...keys) => {
                for (const key of keys) {
                    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
                }
                return null;
            };
            const numberValue = (value) => {
                const normalized = String(value ?? "").replace(/[,.](?=\d{3}\b)/g, "").replace(/[^\d.-]/g, "");
                if (!normalized) return null;
                const parsed = Number(normalized);
                return Number.isFinite(parsed) ? parsed : null;
            };
            const dateValue = (value) => {
                if (typeof value === "number") {
                    const excelDate = XLSX.SSF.parse_date_code(value);
                    if (excelDate) {
                        return new Date(excelDate.y, excelDate.m - 1, excelDate.d, excelDate.H, excelDate.M, excelDate.S).toISOString();
                    }
                }
                const match = String(value ?? "").match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/);
                if (match) {
                    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
                    const month = isFacebookInsights ? match[1] : match[2];
                    const day = isFacebookInsights ? match[2] : match[1];
                    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${(match[4] || "00").padStart(2, "0")}:${match[5] || "00"}:00`).toISOString();
                }
                const parsed = new Date(value);
                return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
            };
            const importedRows = rows
                .filter((row) => String(row.STT).toUpperCase() !== "TỔNG")
                .filter((row) => pick(row, "ID bài viết", "Caption", "Tiêu đề", "Ngày đăng", "Thời gian đăng"))
                .map((row) => {
                    const contentType = pick(row, "Loại bài viết", "Loại");
                    const totalWatchTimeSeconds = numberValue(pick(row, "Số Giây xem", "Tổng thời gian phát"));
                    return {
                        externalPostId: String(pick(row, "ID bài viết", "Post ID") || ""),
                        contentType: /video|thước phim|reel/i.test(String(contentType)) ? "VIDEO" : String(contentType || "Ảnh"),
                        caption: String(pick(row, "Tiêu đề", "Caption") || ""),
                        publishedAt: dateValue(pick(row, "Thời gian đăng", "Ngày đăng", "Ngày")),
                        postUrl: pick(row, "Liên kết vĩnh viễn", "Link bài viết"),
                        durationSeconds: numberValue(pick(row, "Thời lượng (giây)", "Thời lượng")),
                        reach: numberValue(pick(row, "Reach", "Lượt hiển thị")),
                        views: numberValue(pick(row, "Lượt xem")),
                        interactions: numberValue(pick(row, "Tương tác")),
                        reactions: numberValue(pick(row, "Cảm xúc")),
                        comments: numberValue(pick(row, "Bình luận")),
                        shares: numberValue(pick(row, "Lượt chia sẻ", "Chia sẻ")),
                        saves: numberValue(pick(row, "Lượt lưu", "Lưu")),
                        viewers: numberValue(pick(row, "Người xem")),
                        view3Seconds: numberValue(pick(row, "Xem từ 3s")),
                        view1Minute: numberValue(pick(row, "Xem từ 1 phút")),
                        averageWatchTimeSeconds: numberValue(pick(row, "Số Giây xem trung bình", "Thời gian xem TB")),
                        totalWatchTimeSeconds,
                    };
                });
            if (!importedRows.length) throw new Error("Không tìm thấy dòng dữ liệu Facebook hợp lệ");
            const result = await importFacebookPosts({
                platformAccountId: selectedAccountId,
                fileName: file.name,
                rows: importedRows,
            });
            setSelectedImportBatchId(result.id);
            fetchPosts(1, result.id);
            fetchImportBatches();
            alert(`Import hoàn tất: đã lưu ${result.importedRows} dòng từ ${file.name}.`);
        } catch (error) {
            alert(`Không thể import file: ${error.message}`);
        } finally {
            setImporting(false);
            event.target.value = "";
        }
    };

    const handleDeleteImport = async (batch) => {
        if (!window.confirm(`Xóa đợt import "${batch.fileName}" và toàn bộ ${batch.importedRows} bài đã nhập?`)) return;
        try {
            await deleteImportBatch(batch.id);
            const batches = await fetchImportBatches();
            const nextBatchId = batch.id === selectedImportBatchId ? (batches[0]?.id || "") : selectedImportBatchId;
            setSelectedImportBatchId(nextBatchId);
            fetchPosts(1, nextBatchId);
        } catch (error) {
            alert(`Không thể xóa đợt import: ${error.message}`);
        }
    };

    const handleViewImport = (batch) => {
        setPlatformFilter("FACEBOOK");
        setSelectedAccountId(batch.platformAccountId);
        setSelectedImportBatchId(batch.id);
        setShowImportHistory(false);
    };

    const handleSelectPost = (post) => {
        setSelectedPost(post);
        getMetricHistory(post.id).then(setHistory).catch(() => setHistory([]));
    };

    const filteredPosts = posts;

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
            const calculatedInteractions = reactions + (Number(m.comments) || 0) + (Number(m.shares) || 0);
            totals.interactions += m.rawData?.importedInteractions != null
                ? Number(m.rawData.importedInteractions)
                : calculatedInteractions;
        });

        return totals;
    };

    const totals = calcTotals();
    const currentImportBatch = importBatches.find((batch) => batch.id === selectedImportBatchId);

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <div className="logo"><BrandLogo className="brand-logo" /></div>
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
                    <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setConfirmLogout(true); }}><span className="nav-icon"><IconLogout /></span> Đăng xuất</a>
                </div>
            </aside>

            <main className="main">
                <div className="content" style={{ padding: "32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <div className="breadcrumb"><span className="chip">NỘI BỘ</span></div>
                            <h1 className="page-title">Chi Tiết Chỉ Số Đo Lường</h1>
                            <p className="page-desc">Hiển thị đầy đủ thông tin chỉ số thực từ Backend Facebook & TikTok theo thời gian.</p>
                        </div>

                        {/* Nút Xuất Excel & Xuất PDF ở góc phải dòng Tiêu đề (Vùng khoanh đỏ) */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
                            <button
                                onClick={() => exportReportConnected({
                                    posts: filteredPosts,
                                    totals,
                                    platform: platformFilter || "ALL",
                                    dateFrom: platformFilter === "TIKTOK" ? appliedDateFrom : "",
                                    dateTo: platformFilter === "TIKTOK" ? appliedDateTo : "",
                                    format: "XLSX"
                                })}
                                style={{
                                    background: "#107c41",
                                    color: "#fff",
                                    fontWeight: "600",
                                    padding: "8px 18px",
                                    borderRadius: "6px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }}
                                title="Xuất dữ liệu đo lường ra file Excel (.xlsx)"
                            >
                                <IconExcel /> Xuất Excel
                            </button>

                            <button
                                onClick={() => exportReportConnected({
                                    posts: filteredPosts,
                                    totals,
                                    platform: platformFilter || "ALL",
                                    dateFrom: platformFilter === "TIKTOK" ? appliedDateFrom : "",
                                    dateTo: platformFilter === "TIKTOK" ? appliedDateTo : "",
                                    format: "PDF",
                                    tableRef: document.querySelector(".table-wrap") || document.querySelector(".grid-table")
                                })}
                                style={{
                                    background: "#d9381e",
                                    color: "#fff",
                                    fontWeight: "600",
                                    padding: "8px 18px",
                                    borderRadius: "6px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }}
                                title="Xuất báo cáo định dạng PDF"
                            >
                                <IconPdf /> Xuất PDF
                            </button>
                        </div>
                    </div>

                    {/* Thanh nền tảng, tài khoản và import */}
                    <div className="posts-filter-bar" style={{ marginTop: "24px", flexDirection: "column", alignItems: "stretch", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                            {/* Tabs Nền Tảng & Chọn Tài Khoản */}
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
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
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--panel)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)" }}>Tài khoản:</span>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        style={{ border: "1px solid var(--line)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px", background: "var(--panel)", color: "var(--ink)", outline: "none" }}
                                    >
                                        <option value="">Tất cả tài khoản</option>
                                        {accounts
                                            .filter(acc => !platformFilter || acc.platform === platformFilter)
                                            .map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.accountName}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            {platformFilter === "TIKTOK" && (
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
                                    <button className="btn-primary small-btn" onClick={handleApplyFilter}>Lọc</button>
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
                            )}
                            {platformFilter === "FACEBOOK" && (
                                <>
                                    <input
                                        ref={facebookImportRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFacebookImport}
                                        hidden
                                    />
                                    <button
                                        className="btn-outline small-btn"
                                        onClick={() => facebookImportRef.current?.click()}
                                        disabled={importing}
                                        title="Import dữ liệu Facebook từ Excel hoặc CSV"
                                        style={{
                                            alignSelf: "stretch",
                                            padding: "10px 16px",
                                            background: "var(--panel)",
                                            borderRadius: "var(--radius-md)",
                                            fontWeight: "600"
                                        }}
                                    >
                                        {importing ? "Đang import..." : "Import file"}
                                    </button>
                                    <button
                                        className="btn-outline small-btn"
                                        onClick={() => { fetchImportBatches(); setShowImportHistory(true); }}
                                        style={{
                                            alignSelf: "stretch",
                                            padding: "10px 16px",
                                            background: "var(--panel)",
                                            borderRadius: "var(--radius-md)",
                                            fontWeight: "600"
                                        }}
                                    >
                                        Lịch sử import
                                    </button>
                                </>
                            )}
                            </div>
                        </div>
                    </div>

                    <section className="panel" style={{ overflowX: "auto", marginTop: "16px" }}>
                        {platformFilter === "FACEBOOK" && currentImportBatch && (
                            <div className="current-import-banner">
                                Đang xem đợt import: <strong>{currentImportBatch.fileName}</strong>
                                <span>{new Date(currentImportBatch.createdAt).toLocaleString("vi-VN")}</span>
                            </div>
                        )}
                        <div className="table-wrap">
                            {loading ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Đang tải dữ liệu bài viết...</div>
                            ) : filteredPosts.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center" }}>Không có dữ liệu để hiển thị.</div>
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
                                            const calculatedInteractions = reactions + (Number(m.comments) || 0) + (Number(m.shares) || 0);
                                            const totalInter = m.rawData?.importedInteractions != null
                                                ? Number(m.rawData.importedInteractions)
                                                : calculatedInteractions;
                                            const isVideo = ["VIDEO", "THƯỚC PHIM", "REEL", "REELS"].includes(post.contentType?.toUpperCase());
                                            const contentTypeText = isVideo ? "Video" : "Ảnh";

                                            return (
                                                <tr key={post.id}>
                                                    <td className="center font-bold">{(meta.page - 1) * meta.limit + idx + 1}</td>
                                                    <td className="center">{new Date(post.publishedAt).toLocaleDateString("vi-VN")}</td>
                                                    <td className="center">{contentTypeText}</td>
                                                    <td className="left caption-cell" style={{ maxWidth: "320px" }}>
                                                        <ExpandableCaption text={post.caption} />
                                                    </td>
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
                                            <th className="center">Người xem mới</th>
                                            <th className="center">Người xem quay lại</th>
                                            <th className="center">Nam</th>
                                            <th className="center">Nữ</th>
                                            <th className="center">Độ tuổi chính</th>
                                            <th className="center">Khu vực chính</th>
                                            <th className="center">Đánh giá KPI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPosts.map((post, idx) => {
                                            const m = post.metrics?.[0] || {};
                                            const raw = m.rawData || {};
                                            const kpi = post.videoReachKpi;

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
                                                    <td className="center">{m.completionRate != null ? `${Number(m.completionRate).toFixed(1)}%` : "--"}</td>
                                                    <td className="center">{m.newFollowers != null ? Number(m.newFollowers) : "--"}</td>
                                                    <td className="center">{m.trafficSource || raw.reach_type || "--"}</td>
                                                    <td className="center">{m.newViewerRate != null ? `${Number(m.newViewerRate).toFixed(1)}%` : "--"}</td>
                                                    <td className="center">{m.returningViewerRate != null ? `${Number(m.returningViewerRate).toFixed(1)}%` : "--"}</td>
                                                    <td className="center">{m.maleRate != null ? `${Number(m.maleRate).toFixed(1)}%` : "--"}</td>
                                                    <td className="center">{m.femaleRate != null ? `${Number(m.femaleRate).toFixed(1)}%` : "--"}</td>
                                                    <td className="center">{m.mainAgeGroup || "--"}</td>
                                                    <td className="center">{m.mainLocation || "--"}</td>
                                                    <td className="center">
                                                        {kpi?.status ? (
                                                            <div className="video-kpi-result">
                                                                <span className={`video-kpi-badge ${kpi.status === "MET" ? "met" : "not-met"}`}>
                                                                    {kpi.status === "MET" ? "Đạt" : "Chưa đạt"}
                                                                </span>
                                                                <small>{Number(kpi.actual).toLocaleString()} / {Number(kpi.target).toLocaleString()} lượt xem</small>
                                                            </div>
                                                        ) : "--"}
                                                    </td>
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
                                            <td colSpan={8} className="center">--</td>
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

            {showImportHistory && (
                <div className="modal-backdrop" onClick={() => setShowImportHistory(false)}>
                    <div className="modal-card import-history-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Lịch sử import Facebook</h2>
                        <p className="modal-desc">Mỗi file được lưu thành một đợt riêng. Xóa đợt sẽ hoàn tác các bài đã nhập từ file đó.</p>
                        <div className="table-wrap import-history-table">
                            {importBatches.length === 0 ? (
                                <div className="import-history-empty">Chưa có đợt import nào.</div>
                            ) : (
                                <table className="grid-table">
                                    <thead>
                                        <tr>
                                            <th>Thời gian</th>
                                            <th>File</th>
                                            <th>Tài khoản</th>
                                            <th>Dữ liệu</th>
                                            <th>Kết quả</th>
                                            <th>Người import</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importBatches.map((batch) => (
                                            <tr
                                                key={batch.id}
                                                className={`import-history-row${batch.id === selectedImportBatchId ? " selected" : ""}`}
                                                onClick={() => handleViewImport(batch)}
                                                title="Nhấn để xem dữ liệu của đợt import này"
                                            >
                                                <td className="center">{new Date(batch.createdAt).toLocaleString("vi-VN")}</td>
                                                <td className="left font-bold">{batch.fileName}</td>
                                                <td className="center">{batch.platformAccount?.accountName || "--"}</td>
                                                <td className="center">
                                                    {batch.dateFrom && batch.dateTo
                                                        ? `${new Date(batch.dateFrom).toLocaleDateString("vi-VN")} → ${new Date(batch.dateTo).toLocaleDateString("vi-VN")}`
                                                        : "--"}
                                                </td>
                                                <td className="center">
                                                    <span className="import-count-success">{batch.importedRows} mới</span>
                                                </td>
                                                <td className="center">{batch.user?.name || batch.user?.email || "--"}</td>
                                                <td className="center">
                                                    <button
                                                        className="btn-text small-btn import-delete-btn"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleDeleteImport(batch);
                                                        }}
                                                    >
                                                        Xóa đợt
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn modal-btn-cancel" onClick={() => setShowImportHistory(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

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
