import React, { useRef, useState, useEffect } from "react";
import "../assets/css/statistics.css";
import { getStoredUser } from "../services/authService";
import { apiGet } from "../lib/apiClient";
import logoImg from "../assets/img/logo19tDigital.jpg";
import { exportToExcel, exportToPDF } from "../lib/exportUtils";


/** Brand mark: shows logo19tDigital.jpg; falls back to a styled "19T" badge
 *  if the image fails to load. */
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

const FB_ROWS = [
    { stt: "1", date: "01/07", caption: "Tiếp tục xử lý", views: "201", reach: "175", likes: "6", comments: "0", shares: "0", saves: "1", total_time: "0h19m46s", avg_time: "5.7s", watch_through: "0%", new_followers: "0", traffic_source: "Đề xuất 80.3%", new_viewers: "73%", returning_viewers: "27%", male: "66%", female: "34%", age_group: "25-34: 54%", region: "Việt Nam 98%" },
    { stt: "2", date: "02/07", caption: "Nốt tập cuối c", views: "230", reach: "193", likes: "7", comments: "0", shares: "0", saves: "0", total_time: "0h30m32s", avg_time: "7.9s", watch_through: "1.3%", new_followers: "0", traffic_source: "Đề xuất 81.9%", new_viewers: "67%", returning_viewers: "33%", male: "69%", female: "31%", age_group: "18-24: 46%, 25-34: 46%", region: "Việt Nam 94.1%" },
    { stt: "3", date: "03/07", caption: "#xhhhhhhhhhh", views: "175", reach: "148", likes: "9", comments: "0", shares: "0", saves: "0", total_time: "0h11m55s", avg_time: "3.91s", watch_through: "3.8%", new_followers: "1", traffic_source: "Đề xuất 75.4%", new_viewers: "75%", returning_viewers: "25%", male: "41%", female: "59%", age_group: "18-24: 50%, 25-34: 46%", region: "Việt Nam 96.8%" },
    { stt: "4", date: "04/07", caption: "Khách nhận q", views: "167", reach: "132", likes: "7", comments: "0", shares: "1", saves: "0", total_time: "0h19m05s", avg_time: "6.29s", watch_through: "1.1%", new_followers: "0", traffic_source: "Đề xuất 67.0%", new_viewers: "65%", returning_viewers: "35%", male: "60%", female: "40%", age_group: "25-34: 48%, 18-24: 47%", region: "Việt Nam 97.9%" },
    { stt: "5", date: "07/07", caption: "Sẽ ra sao khi l", views: "421", reach: "382", likes: "14", comments: "0", shares: "0", saves: "2", total_time: "1h14m48s", avg_time: "10.2s", watch_through: "0.9%", new_followers: "0", traffic_source: "Đề xuất 89.8%", new_viewers: "79%", returning_viewers: "21%", male: "69%", female: "31%", age_group: "25-34: 50%, 18-24: 45%", region: "Việt Nam 96.5%" },
    { stt: "6", date: "08/07", caption: "Phải giống đú", views: "387", reach: "348", likes: "8", comments: "0", shares: "0", saves: "2", total_time: "0h26m19s", avg_time: "5.85s", watch_through: "0.4%", new_followers: "0", traffic_source: "Đề xuất 87.0%", new_viewers: "74%", returning_viewers: "26%", male: "75%", female: "25%", age_group: "18-24: 48%, 25-34: 44%", region: "Việt Nam 96.1%" },
    { stt: "7", date: "09/07", caption: "Một ảnh bill đ", views: "427", reach: "374", likes: "10", comments: "0", shares: "0", saves: "0", total_time: "0h50m12s", avg_time: "7.02s", watch_through: "0.9%", new_followers: "1", traffic_source: "Đề xuất 88.1%", new_viewers: "69%", returning_viewers: "31%", male: "61%", female: "39%", age_group: "18-24: 54%, 25-34: 40%", region: "Việt Nam 97.4%" },
    { stt: "8", date: "10/07", caption: "Website nha k", views: "393", reach: "355", likes: "2", comments: "3", shares: "0", saves: "1", total_time: "0h48m37s", avg_time: "7.08s", watch_through: "1%", new_followers: "0", traffic_source: "Đề xuất 88.4%", new_viewers: "60%", returning_viewers: "40%", male: "64%", female: "36%", age_group: "18-24: 49%, 25-34: 41%", region: "Việt Nam 99.7%" },
    { stt: "9", date: "11/07", caption: "Tưởng báo gi", views: "455", reach: "391", likes: "10", comments: "0", shares: "1", saves: "0", total_time: "1h06m28s", avg_time: "8.52s", watch_through: "0.9%", new_followers: "0", traffic_source: "Đề xuất 84.2%", new_viewers: "66%", returning_viewers: "34%", male: "71%", female: "29%", age_group: "25-34: 50%, 18-24: 47%", region: "Việt Nam 98.8%" },
    { stt: "10", date: "12/07", caption: "Bài bên Word", views: "476", reach: "401", likes: "25", comments: "0", shares: "2", saves: "1", total_time: "1h05m00s", avg_time: "8.04s", watch_through: "1.2%", new_followers: "0", traffic_source: "Đề xuất 86.4%", new_viewers: "64%", returning_viewers: "36%", male: "59%", female: "41%", age_group: "18-24: 54%, 25-34: 38%", region: "Việt Nam 97.8%" },
    { stt: "11", date: "13/07", caption: "Một cái nút gi", views: "439", reach: "365", likes: "10", comments: "0", shares: "0", saves: "0", total_time: "1h05m00s", avg_time: "8.87s", watch_through: "3.2%", new_followers: "1", traffic_source: "Đề xuất 88.4%", new_viewers: "62%", returning_viewers: "38%", male: "72%", female: "28%", age_group: "18-24: 48%, 25-34: 46%", region: "Việt Nam 99.0%" },
    { stt: "12", date: "14/07", caption: "Khách đổi từ", views: "442", reach: "359", likes: "11", comments: "2", shares: "1", saves: "2", total_time: "1h02m23s", avg_time: "8.26s", watch_through: "1.1%", new_followers: "1", traffic_source: "Đề xuất 84.1%", new_viewers: "62%", returning_viewers: "38%", male: "68%", female: "32%", age_group: "25-34: 51%, 18-24: 42%", region: "Việt Nam 99.0%" },
    { stt: "13", date: "15/07", caption: "Nay không ng", views: "494", reach: "400", likes: "13", comments: "0", shares: "--", saves: "--", total_time: "--", avg_time: "--", watch_through: "--", new_followers: "--", traffic_source: "--", new_viewers: "82%", returning_viewers: "18%", male: "72%", female: "28%", age_group: "25-34: 55%, 18-24: 42%", region: "Việt Nam 99.0%" },
    { stt: "14", date: "16/07", caption: "Hợp đồng khố", views: "394", reach: "--", likes: "11", comments: "0", shares: "0", saves: "0", total_time: "1h00m19s", avg_time: "10.11s", watch_through: "2%", new_followers: "1", traffic_source: "Đề xuất 93.8%", new_viewers: "--", returning_viewers: "--", male: "51%", female: "49%", age_group: "18-24: 50%, 25-34: 42%", region: "Việt Nam 97.9%" }
];

const FB_TOTALS = {
    videos: "14 video",
    views: "5,101",
    reach: "4,023+",
    likes: "143",
    comments: "5",
    shares: "5+",
    saves: "9+",
    total_time: "10h00m24s+",
    avg_time: "--",
    watch_through: "--",
    new_followers: "5+",
    traffic_source: "--",
    new_viewers: "--",
    returning_viewers: "--",
    male: "--",
    female: "--",
    age_group: "--",
    region: "--"
};

const TT_ROWS = [
    { stt: "1", date: "01/07", type: "Video", caption: "Bộ lọc thông b", reach: "232", views: "312", engagement: "5", view_3s: "69", view_1m: "3" },
    { stt: "2", date: "03/07", type: "Video", caption: "Web đẹp chưa", reach: "159", views: "254", engagement: "6", view_3s: "68", view_1m: "4" },
    { stt: "3", date: "04/07", type: "Video", caption: "Vòng quay ma", reach: "227", views: "317", engagement: "12", view_3s: "60", view_1m: "4" },
    { stt: "4", date: "06/07", type: "Video", caption: "Một trạng thái", reach: "309", views: "472", engagement: "9", view_3s: "110", view_1m: "8" },
    { stt: "5", date: "07/07", type: "Video", caption: "Có những lỗi", reach: "172", views: "257", engagement: "1", view_3s: "62", view_1m: "1" },
    { stt: "6", date: "08/07", type: "Video", caption: "Khách 19T fe", reach: "222", views: "308", engagement: "2", view_3s: "76", view_1m: "6" },
    { stt: "7", date: "09/07", type: "Video", caption: "Một ảnh bill đ", reach: "270", views: "381", engagement: "8", view_3s: "79", view_1m: "6" },
    { stt: "8", date: "10/07", type: "Video", caption: "Website nha k", reach: "256", views: "433", engagement: "11", view_3s: "93", view_1m: "7" },
    { stt: "9", date: "11/07", type: "Video", caption: "Bài bên Word", reach: "271", views: "376", engagement: "12", view_3s: "126", view_1m: "11" },
    { stt: "10", date: "12/07", type: "Video", caption: "Tưởng báo giá", reach: "291", views: "412", engagement: "5", view_3s: "129", view_1m: "6" },
    { stt: "11", date: "13/07", type: "Video", caption: "Một cái nút gi", reach: "285", views: "444", engagement: "14", view_3s: "141", view_1m: "12" },
    { stt: "12", date: "14/07", type: "Video", caption: "Khách đổi từ", reach: "258", views: "407", engagement: "11", view_3s: "132", view_1m: "6" },
    { stt: "13", date: "15/07", type: "Video", caption: "Nay không ng", reach: "205", views: "350", engagement: "9", view_3s: "110", view_1m: "13" },
    { stt: "14", date: "16/07", type: "Video", caption: "Hợp đồng khố", reach: "243", views: "376", engagement: "16", view_3s: "137", view_1m: "8" },
    { stt: "15", date: "16/07", type: "Ảnh", caption: "Tin dạng ảnh", reach: "--", views: "--", engagement: "--", view_3s: "--", view_1m: "--" }
];

const TT_TOTALS = {
    videos: "TỔNG 14 VIDEO",
    reach: "3,400",
    views: "5,099",
    engagement: "121",
    view_3s: "1,392",
    view_1m: "95"
};

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

    // Export dropdown states
    const exportRef = useRef(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState("excel");
    const [exportFb, setExportFb] = useState(true);
    const [exportTiktok, setExportTiktok] = useState(true);

    // Profile dropdown states
    const profileRef = useRef(null);
    const [profileOpen, setProfileOpen] = useState(false);

    // Logout confirm modal
    const [confirmLogout, setConfirmLogout] = useState(false);

    // API Stats State
    const [rows, setRows] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [user, setUser] = useState(() => getStoredUser());

    const displayName = user?.name || "Admin Premium";
    const avatarChar = displayName.trim().charAt(0).toUpperCase();

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setFilterOpen(false);
            }
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setExportOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        apiGet("/api/stats/summary", {
            platform: activeTab,
            preset: activePreset,
            from: dateFrom,
            to: dateTo
        })
        .then((data) => {
            if (isMounted) {
                setRows(data.rows || []);
                setTotals(data.totals || null);
                setLoading(false);
            }
        })
        .catch((err) => {
            if (isMounted) {
                console.error("Error loading statistics:", err);
                setError(err.message || "Không thể tải số liệu thống kê.");
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [activeTab, activePreset, dateFrom, dateTo]);

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

    function handleExportSubmit() {
        const sources = [];
        if (exportFb) sources.push("Facebook");
        if (exportTiktok) sources.push("TikTok");

        if (sources.length === 0) {
            alert("Vui lòng chọn ít nhất một nguồn số liệu để xuất!");
            return;
        }

        setExportOpen(false);

        // Fetch needed data depending on what is selected and what is active
        const promises = [];
        let fbData = { rows: [], totals: null };
        let ttData = { rows: [], totals: null };

        if (exportFb) {
            if (activeTab === "facebook") {
                fbData = { rows, totals };
            } else {
                promises.push(
                    apiGet("/api/stats/summary", { platform: "facebook", preset: activePreset, from: dateFrom, to: dateTo })
                        .then(res => { fbData = res; })
                );
            }
        }

        if (exportTiktok) {
            if (activeTab === "tiktok") {
                ttData = { rows, totals };
            } else {
                promises.push(
                    apiGet("/api/stats/summary", { platform: "tiktok", preset: activePreset, from: dateFrom, to: dateTo })
                        .then(res => { ttData = res; })
                );
            }
        }

        Promise.all(promises)
            .then(() => {
                if (exportFormat === "excel") {
                    exportToExcel({
                        fbRows: fbData.rows,
                        fbTotals: fbData.totals,
                        ttRows: ttData.rows,
                        ttTotals: ttData.totals,
                        includeFb: exportFb,
                        includeTiktok: exportTiktok
                    });
                } else {
                    exportToPDF({
                        fbRows: fbData.rows,
                        fbTotals: fbData.totals,
                        ttRows: ttData.rows,
                        ttTotals: ttData.totals,
                        includeFb: exportFb,
                        includeTiktok: exportTiktok
                    });
                }
            })
            .catch(err => {
                console.error("Export error:", err);
                alert("Đã xảy ra lỗi khi tải dữ liệu xuất báo cáo.");
            });
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
                    <a href="#" className="nav-item ">
                        <span className="nav-icon"><IconHelp /></span> Hỗ trợ
                    </a>
                    <a href="#" className="nav-item " onClick={(e) => { e.preventDefault(); setConfirmLogout(true); }}>
                        <span className="nav-icon"><IconLogout /></span> Đăng xuất
                    </a>
                </div>
            </aside>

            <main className="main">
                <header className="topbar">
                    <div className="search">
                        {/*<span className="search-icon">🔍</span>*/}
                        <input type="text" placeholder="Tìm kiếm dữ liệu..." />
                    </div>
                    <div className="topbar-right">
            {/*<span className="status-pill">*/}
            {/*  <i></i> HỆ THỐNG: ỔN ĐỊNH*/}
            {/*</span>*/}
                        {/*<button className="icon-btn" aria-label="Thông báo">*/}
                        {/*    🔔*/}
                        {/*</button>*/}
                        <div className={`profile-dropdown-wrap${profileOpen ? " open" : ""}`} ref={profileRef}>
                            <button 
                                className="icon-btn" 
                                aria-label="Tài khoản" 
                                type="button"
                                onClick={() => setProfileOpen(v => !v)}
                            >
                                👤
                            </button>
                            {profileOpen && (
                                <div className="profile-dropdown">
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
                                    {user?.department && (
                                        <div className="profile-info-row">
                                            <span className="info-label">Phòng ban:</span>
                                            <span className="info-value">{user.department}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={`export-dropdown-wrap${exportOpen ? " open" : ""}`} ref={exportRef}>
                            <button className="btn-primary" type="button" onClick={() => setExportOpen(v => !v)}>
                                ⭳ Xuất báo cáo
                            </button>
                            {exportOpen && (
                                <div className="export-dropdown">
                                    <div className="export-section">
                                        <span className="export-title">Định dạng file</span>
                                        <div className="export-options">
                                            <label className="radio-label">
                                                <input 
                                                    type="radio" 
                                                    name="exportFormat" 
                                                    value="pdf" 
                                                    checked={exportFormat === "pdf"}
                                                    onChange={(e) => setExportFormat(e.target.value)}
                                                />
                                                <span>PDF</span>
                                            </label>
                                            <label className="radio-label">
                                                <input 
                                                    type="radio" 
                                                    name="exportFormat" 
                                                    value="excel" 
                                                    checked={exportFormat === "excel"}
                                                    onChange={(e) => setExportFormat(e.target.value)}
                                                />
                                                <span>Excel</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div className="export-divider"></div>
                                    
                                    <div className="export-section">
                                        <span className="export-title">Số liệu xuất</span>
                                        <div className="export-checkboxes">
                                            <label className="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    checked={exportFb} 
                                                    onChange={(e) => setExportFb(e.target.checked)}
                                                />
                                                <span>Số liệu Facebook</span>
                                            </label>
                                            <label className="checkbox-label">
                                                <input 
                                                    type="checkbox" 
                                                    checked={exportTiktok} 
                                                    onChange={(e) => setExportTiktok(e.target.checked)}
                                                />
                                                <span>Số liệu TikTok</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="export-footer">
                                        <button className="btn-text small-btn" type="button" onClick={() => setExportOpen(false)}>Hủy</button>
                                        <button className="btn-primary small-btn" type="button" onClick={handleExportSubmit}>Xác nhận</button>
                                    </div>
                                </div>
                            )}
                        </div>
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

                        <div className="table-wrap" style={{ position: "relative", minHeight: "200px" }}>
                            {loading ? (
                                <div className="table-loading-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", gap: "12px", color: "var(--ink-soft)" }}>
                                    <div className="table-spinner"></div>
                                    <span>Đang đồng bộ số liệu {activeTab === "facebook" ? "Facebook" : "TikTok"}...</span>
                                </div>
                            ) : error ? (
                                <div className="table-error-state" style={{ padding: "40px", textAlign: "center", color: "red", fontWeight: "600" }}>
                                    ⚠️ {error}
                                </div>
                            ) : activeTab === "facebook" ? (
                                <table className="grid-table">
                                    <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Ngày</th>
                                        <th>Caption</th>
                                        <th>Lượt xem</th>
                                        <th>Người xem</th>
                                        <th>Like</th>
                                        <th>Bình luận</th>
                                        <th>Chia sẻ</th>
                                        <th>Lưu video</th>
                                        <th>Tổng thời gian phát</th>
                                        <th>Thời gian xem TB</th>
                                        <th>Tỷ lệ xem hết</th>
                                        <th>Follow mới</th>
                                        <th>Nguồn chính</th>
                                        <th>Người xem mới</th>
                                        <th>Người xem quay lại</th>
                                        <th>Nam</th>
                                        <th>Nữ</th>
                                        <th>Độ tuổi chính</th>
                                        <th>Khu vực chính</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.stt}>
                                            <td className="center font-bold">{r.stt}</td>
                                            <td className="center">{r.date}</td>
                                            <td className="left caption-cell">{r.caption}</td>
                                            <td className="center">{r.views}</td>
                                            <td className="center">{r.reach}</td>
                                            <td className="center">{r.likes}</td>
                                            <td className="center">{r.comments}</td>
                                            <td className="center">{r.shares}</td>
                                            <td className="center">{r.saves}</td>
                                            <td className="center">{r.total_time}</td>
                                            <td className="center">{r.avg_time}</td>
                                            <td className="center">{r.watch_through}</td>
                                            <td className="center">{r.new_followers}</td>
                                            <td className="left text-soft">{r.traffic_source}</td>
                                            <td className="center">{r.new_viewers}</td>
                                            <td className="center">{r.returning_viewers}</td>
                                            <td className="center">{r.male}</td>
                                            <td className="center">{r.female}</td>
                                            <td className="left text-soft age-group-cell">{r.age_group}</td>
                                            <td className="left text-soft region-cell">{r.region}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                    {totals && (
                                        <tfoot>
                                        <tr className="totals-row">
                                            <td className="center font-bold">TỔNG</td>
                                            <td className="center font-bold">{totals.videos}</td>
                                            <td className="left font-bold">--</td>
                                            <td className="center font-bold highlighted">{totals.views}</td>
                                            <td className="center font-bold highlighted">{totals.reach}</td>
                                            <td className="center font-bold highlighted">{totals.likes}</td>
                                            <td className="center font-bold">{totals.comments}</td>
                                            <td className="center font-bold">{totals.shares}</td>
                                            <td className="center font-bold">{totals.saves}</td>
                                            <td className="center font-bold highlighted">{totals.total_time}</td>
                                            <td className="center font-bold">--</td>
                                            <td className="center font-bold">--</td>
                                            <td className="center font-bold highlighted">{totals.new_followers}</td>
                                            <td className="center font-bold">--</td>
                                            <td className="center font-bold">--</td>
                                            <td className="center font-bold">--</td>
                                            <td className="center font-bold">--</td>
                                            <td className="center font-bold">--</td>
                                            <td className="center font-bold">--</td>
                                            <td className="center font-bold">--</td>
                                        </tr>
                                        </tfoot>
                                    )}
                                </table>
                            ) : (
                                <table className="grid-table">
                                    <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Ngày đăng</th>
                                        <th>Loại</th>
                                        <th>Caption</th>
                                        <th>Reach</th>
                                        <th>Lượt xem</th>
                                        <th>Tương tác</th>
                                        <th>Xem từ 3s</th>
                                        <th>Xem từ 1 phút</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.stt}>
                                            <td className="center font-bold">{r.stt}</td>
                                            <td className="center">{r.date}</td>
                                            <td className="center">{r.type}</td>
                                            <td className="left caption-cell">{r.caption}</td>
                                            <td className="center">{r.reach}</td>
                                            <td className="center">{r.views}</td>
                                            <td className="center">{r.engagement}</td>
                                            <td className="center">{r.view_3s}</td>
                                            <td className="center">{r.view_1m}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                    {totals && (
                                        <tfoot>
                                        <tr className="totals-row">
                                            <td className="center font-bold">TỔNG</td>
                                            <td className="center font-bold" colSpan={2}>{totals.videos}</td>
                                            <td className="left font-bold">--</td>
                                            <td className="center font-bold highlighted">{totals.reach}</td>
                                            <td className="center font-bold highlighted">{totals.views}</td>
                                            <td className="center font-bold highlighted">{totals.engagement}</td>
                                            <td className="center font-bold highlighted">{totals.view_3s}</td>
                                            <td className="center font-bold highlighted">{totals.view_1m}</td>
                                        </tr>
                                        </tfoot>
                                    )}
                                </table>
                            )}
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

            {/* ===== LOGOUT CONFIRM MODAL ===== */}
            {confirmLogout && (
                <div className="modal-backdrop" onClick={() => setConfirmLogout(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        {/*<div className="modal-icon">*/}
                        {/*    <IconLogout />*/}
                        {/*</div>*/}
                        <h2 className="modal-title">Xác nhận đăng xuất</h2>
                        <p className="modal-desc">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
                        <div className="modal-actions">
                            <button
                                className="modal-btn modal-btn-cancel"
                                onClick={() => setConfirmLogout(false)}
                            >
                                Huỷ
                            </button>
                            <button
                                className="modal-btn modal-btn-confirm"
                                onClick={() => { setConfirmLogout(false); if (onLogout) onLogout(); }}
                            >
                                <span><IconLogout /></span> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}