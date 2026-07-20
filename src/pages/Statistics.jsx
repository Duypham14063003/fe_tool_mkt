import React, { useRef, useState, useEffect } from "react";
import "../assets/css/statistics.css";
import { getStoredUser } from "../services/authService";

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

/* Minimal line icons, 18x18, currentColor so .nav-icon / .nav-item.active
   color rules from statistics.css apply automatically. */
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
    { icon: <IconHome />, label: "Trang chủ", active: false },
    { icon: <IconChart />, label: "Thống kê", active: true },
    { icon: <IconList />, label: "Nội dung", active: false },
    { icon: <IconGear />, label: "Cài đặt", active: false },
];

const STAT_CARDS = [
    { label: "TỔNG LƯỢT XEM", icon: "◎", value: "5,101", plus: false, trend: "6,2,9,7,12,10,15" },
    { label: "NGƯỜI TIẾP CẬN", icon: "⚇", value: "4,023", plus: true, trend: "4,8,5,10,9,13,14" },
    { label: "LƯỢT THÍCH", icon: "♡", value: "143", plus: false, trend: "10,9,11,8,12,9,11" },
    { label: "CHIA SẺ", icon: "⇗", value: "5", plus: true, trend: "2,3,2,4,3,5,4" },
];

const ROWS = [
    { stt: "01", date: "16/07", content: "Hợp đồng khối lượng...", views: "1,842", reach: "1,502", likes: "54", comments: "12", shares: "2", avg: "0:14" },
    { stt: "02", date: "15/07", content: "Nay không ngừng...", views: "2,104", reach: "1,680", likes: "67", comments: "18", shares: "3", avg: "0:19" },
    { stt: "03", date: "14/07", content: "Khách đổi từ mẫu c...", views: "1,155", reach: "841", likes: "22", comments: "5", shares: "0", avg: "0:11" },
];

const TOTALS = { views: "5,101", reach: "4,023", likes: "143", comments: "35", shares: "5", avg: "0:15 avg" };

const PRESETS = [
    { days: 7, label: "7 ngày qua" },
    { days: 30, label: "30 ngày qua" },
    { days: 90, label: "90 ngày qua" },
];

function Sparkline({ points }) {
    // points is a comma-separated string of y-values (0-15 range), rendered
    // across a fixed 60x24 viewBox to match the .sparkline CSS size.
    const values = points.split(",").map(Number);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const w = 60;
    const h = 24;
    const step = w / (values.length - 1);
    const coords = values
        .map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - ((v - min) / range) * (h - 6)).toFixed(1)}`)
        .join(" ");

    return (
        <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <polyline points={coords} />
        </svg>
    );
}
export default function Statistics({ onLogout }) {
    const [activeTab, setActiveTab] = useState("facebook");
    const [filterOpen, setFilterOpen] = useState(false);
    const [activePreset, setActivePreset] = useState(30);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [filterLabel, setFilterLabel] = useState("Giai đoạn: 30 ngày qua");
    const wrapRef = useRef(null);

    const [user, setUser] = useState(() => getStoredUser());

    const displayName = user?.name || "Admin Premium";
    const avatarChar = displayName.trim().charAt(0).toUpperCase();

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function choosePreset(days, label) {
        setActivePreset(days);
        setDateFrom("");
        setDateTo("");
        setFilterLabel(`Giai đoạn: ${label}`);
    }

    function applyCustomRange() {
        if (dateFrom && dateTo) {
            setActivePreset(null);
            setFilterLabel(`Giai đoạn: ${dateFrom} → ${dateTo}`);
        }
        setFilterOpen(false);
    }

    function clearFilter() {
        setActivePreset(30);
        setDateFrom("");
        setDateTo("");
        setFilterLabel("Giai đoạn: 30 ngày qua");
    }

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <div className="logo">
                        <BrandLogo className="brand-logo" />
                        <div className="brand-name">19t digital</div>
                    </div>
                    <div className="brand-sub">INTERNAL DATABASE</div>
                </div>

                <nav className="nav">
                    {NAV_ITEMS.map((item) => (
                        <a href="#" key={item.label} className={`nav-item${item.active ? " active" : ""}`}>
                            <span className="nav-icon">{item.icon}</span> {item.label}
                        </a>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="user-card">
                        <div className="avatar">{avatarChar}</div>
                        <div>
                            <div className="user-name">{displayName}</div>
                            <div className="user-role">QUẢN TRỊ VIÊN</div>
                        </div>
                    </div>
                    <a href="#" className="nav-item small">
                        <span className="nav-icon"><IconHelp /></span> Hỗ trợ
                    </a>
                    <a href="#" className="nav-item small" onClick={(e) => { e.preventDefault(); if (onLogout) onLogout(); }}>
                        <span className="nav-icon"><IconLogout /></span> Đăng xuất
                    </a>
                </div>
            </aside>

            <main className="main">
                <header className="topbar">
                    <div className="search">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Tìm kiếm dữ liệu..." />
                    </div>
                    <div className="topbar-right">
            <span className="status-pill">
              <i></i> HỆ THỐNG: ỔN ĐỊNH
            </span>
                        <button className="icon-btn" aria-label="Thông báo">
                            🔔
                        </button>
                        <button className="icon-btn" aria-label="Tài khoản">
                            👤
                        </button>
                        <button className="btn-primary">⭳ Xuất báo cáo</button>
                    </div>
                </header>

                <div className="content">
                    <div className="breadcrumb">
                        <span className="chip">NỘI BỘ</span> <span className="sep">/</span> Phân tích dữ liệu
                    </div>
                    <h1 className="page-title">Tổng quan Hiệu suất</h1>
                    <p className="page-desc">Báo cáo chỉ số tiếp cận và tương tác đa nền tảng — Chu kỳ Q3.</p>

                    <section className="stats-grid">
                        {STAT_CARDS.map((card) => (
                            <div className="stat-card" key={card.label}>
                                <div className="stat-top">
                                    <span className="stat-label">{card.label}</span>
                                    <span className="stat-icon">{card.icon}</span>
                                </div>
                                <div className="stat-value-row">
                  <span className="stat-value">
                    {card.value}
                      {card.plus && <span className="plus">+</span>}
                  </span>
                                    <Sparkline points={card.trend} />
                                </div>
                                <div className="stat-time"> 5 phút trước</div>
                            </div>
                        ))}
                    </section>

                    <section className="panel">
                        <div className="tabs">
                            <button
                                className={`tab${activeTab === "facebook" ? " active" : ""}`}
                                onClick={() => setActiveTab("facebook")}
                            >
                                Facebook
                            </button>
                            <button
                                className={`tab${activeTab === "tiktok" ? " active" : ""}`}
                                onClick={() => setActiveTab("tiktok")}
                            >
                                TikTok
                            </button>
                        </div>

                        <div className="panel-header">
                            <h2>Chi tiết Hiệu suất Nội dung</h2>
                            <div className="panel-actions">
                                <button className="btn-outline"> Bộ lọc</button>

                                <div className={`date-filter${filterOpen ? " open" : ""}`} ref={wrapRef}>
                                    <button
                                        className="btn-outline date-filter-toggle"
                                        type="button"
                                        onClick={() => setFilterOpen((v) => !v)}
                                    >
                                        <span>{filterLabel}</span> <span className="caret">▾</span>
                                    </button>

                                    <div className="date-filter-dropdown">
                                        <div className="date-filter-presets">
                                            {PRESETS.map((p) => (
                                                <button
                                                    key={p.days}
                                                    className={`preset-btn${activePreset === p.days ? " active" : ""}`}
                                                    type="button"
                                                    onClick={() => choosePreset(p.days, p.label)}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="date-filter-divider"></div>

                                        <div className="date-filter-custom">
                                            <label className="date-field">
                                                <span>Từ ngày</span>
                                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                            </label>
                                            <label className="date-field">
                                                <span>Đến ngày</span>
                                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                            </label>
                                        </div>

                                        <div className="date-filter-footer">
                                            <button className="btn-text" type="button" onClick={clearFilter}>
                                                Xóa
                                            </button>
                                            <button className="btn-primary date-filter-apply" type="button" onClick={applyCustomRange}>
                                                Áp dụng
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="table-wrap">
                            <table>
                                <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>NGÀY</th>
                                    <th>NỘI DUNG</th>
                                    <th className="num">LƯỢT XEM</th>
                                    <th className="num">TIẾP CẬN</th>
                                    <th className="num">THÍCH</th>
                                    <th className="num">BÌNH LUẬN</th>
                                    <th className="num">CHIA SẺ</th>
                                    <th className="num">XEM TB</th>
                                </tr>
                                </thead>
                                <tbody>
                                {ROWS.map((r) => (
                                    <tr key={r.stt}>
                                        <td>{r.stt}</td>
                                        <td>{r.date}</td>
                                        <td>{r.content}</td>
                                        <td className="num">{r.views}</td>
                                        <td className="num">{r.reach}</td>
                                        <td className="num">{r.likes}</td>
                                        <td className="num">{r.comments}</td>
                                        <td className="num">{r.shares}</td>
                                        <td className="num accent">{r.avg}</td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot>
                                <tr>
                                    <td className="total-label" colSpan={3}>
                                        TỔNG CỘNG
                                    </td>
                                    <td className="num">{TOTALS.views}</td>
                                    <td className="num">{TOTALS.reach}</td>
                                    <td className="num">{TOTALS.likes}</td>
                                    <td className="num">{TOTALS.comments}</td>
                                    <td className="num">{TOTALS.shares}</td>
                                    <td className="num accent">{TOTALS.avg}</td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    </section>

                    <section className="bottom-grid">
                        <div className="insight-card">
                            <h3>Nhận định trong tuần</h3>
                            <blockquote>
                                "Nội dung dạng ngắn đạt mức tương tác cao nhất trong khoảng từ 18:00 đến 21:00. Ưu tiên điểm thu hút
                                thị giác trong 3 giây đầu tiên để tối đa hóa thời gian xem."
                            </blockquote>
                            <div className="quote-author">— ĐỘI NGŨ CHIẾN LƯỢC</div>
                        </div>

                        <div className="art-card">
                            <div className="art-overlay-top">
                                <span className="art-title">CHỈ SỐ THỐNG KÊ MẠNG XÃ HỘI</span>
                                <div className="art-metrics">
                                    <div>
                                        <span className="art-num">450K</span>
                                        <span className="art-label">REACH</span>
                                    </div>
                                    <div>
                                        <span className="art-num">1.2 Tỷ</span>
                                        <span className="art-label">IMPRESSIONS</span>
                                    </div>
                                    <div>
                                        <span className="art-num">3.2%</span>
                                        <span className="art-label">CTR</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer className="footer">
                        <span></span>
                        <span className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">System Status</a>
            </span>
                    </footer>
                </div>
            </main>
        </div>
    );
}