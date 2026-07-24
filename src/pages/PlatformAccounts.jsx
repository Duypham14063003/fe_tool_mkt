import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/css/statistics.css";
import "../assets/css/accounts.css";
import { getStoredUser } from "../services/authService";
import {
    listAccounts,
    createAccount,
    deleteAccount,
    testConnection,
    reconnect,
    getOAuthUrl
} from "../services/platformAccountService";
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

export default function PlatformAccounts({ onLogout }) {
    const location = useLocation();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);

    // Form state
    const [platform, setPlatform] = useState("FACEBOOK");
    const [accountName, setAccountName] = useState("");
    const [externalAccountId, setExternalAccountId] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const user = getStoredUser();

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const data = await listAccounts();
            setAccounts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const success = params.get("success");
        const error = params.get("error");
        const isPopup = window.opener && window.opener !== window;

        if (success) {
            const saved = params.get("saved") || "0";
            if (isPopup) {
                window.opener.postMessage({ type: "OAUTH_SUCCESS", platform: success, saved }, window.location.origin);
                window.close();
            } else {
                window.history.replaceState({}, "", "/accounts");
                alert(`Đã liên kết ${success === "facebook" ? "Facebook" : "TikTok"} thành công (${saved} tài khoản).`);
                fetchAccounts();
            }
        } else if (error) {
            if (isPopup) {
                window.opener.postMessage({ type: "OAUTH_ERROR", error }, window.location.origin);
                window.close();
            } else {
                window.history.replaceState({}, "", "/accounts");
                alert(`Liên kết thất bại: ${error}`);
            }
        }
    }, [location.search]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === "OAUTH_SUCCESS") {
                alert(`Đã liên kết ${event.data.platform === "facebook" ? "Facebook" : "TikTok"} thành công (${event.data.saved} tài khoản).`);
                fetchAccounts();
            } else if (event.data?.type === "OAUTH_ERROR") {
                alert(`Liên kết thất bại: ${event.data.error}`);
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleOAuthConnect = async (targetPlatform) => {
        try {
            const { url } = await getOAuthUrl(targetPlatform);
            if (!url) throw new Error("Backend không trả về URL đăng nhập.");
            
            const width = 600;
            const height = 650;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            
            window.open(
                url,
                `Kết nối ${targetPlatform}`,
                `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
            );
        } catch (err) {
            alert(`Không thể bắt đầu liên kết ${targetPlatform}: ${err.message}`);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createAccount({
                platform,
                accountName,
                externalAccountId,
                accessToken
            });
            setShowModal(false);
            setAccountName("");
            setExternalAccountId("");
            setAccessToken("");
            fetchAccounts();
        } catch (err) {
            alert(err.message || "Không thể thêm tài khoản.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTest = async (id) => {
        try {
            const res = await testConnection(id);
            alert(`Kết quả kiểm tra: ${res.connected ? "Thành công (CONNECTED)" : "Thất bại (" + res.status + ")"}`);
        } catch (err) {
            alert("Lỗi kiểm tra kết nối: " + err.message);
        }
    };

    const handleReconnect = async (id) => {
        try {
            await reconnect(id);
            alert("Đã kết nối lại tài khoản.");
            fetchAccounts();
        } catch (err) {
            alert("Lỗi kết nối lại: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
        try {
            await deleteAccount(id);
            fetchAccounts();
        } catch (err) {
            alert("Lỗi khi xóa: " + err.message);
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
                    <div className="topbar-right" style={{ display: "flex", gap: "10px" }}>
                        <button className="btn-outline" onClick={() => handleOAuthConnect("FACEBOOK")}>Kết nối Facebook</button>
                        <button className="btn-primary" onClick={() => handleOAuthConnect("TIKTOK")}>Kết nối TikTok</button>
                    </div>
                </header>

                <div className="content" style={{ padding: "32px" }}>
                    <div className="breadcrumb"><span className="chip">NỘI BỘ</span></div>
                    <h1 className="page-title">Quản lý Tài khoản Mạng xã hội</h1>
                    <p className="page-desc">Liên kết an toàn qua Facebook/TikTok OAuth. Access token được mã hóa và không hiển thị trên giao diện.</p>

                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>Đang tải danh sách tài khoản...</div>
                    ) : accounts.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-soft)" }}>Chưa có tài khoản nào được kết nối.</div>
                    ) : (
                        <div className="accounts-grid">
                            {accounts.map((acc) => (
                                <div className="account-card" key={acc.id}>
                                    <div>
                                        <div className="account-card-header">
                                            <span className={`account-platform-badge ${acc.platform.toLowerCase()}`}>
                                                {acc.platform}
                                            </span>
                                            <span className={`account-status-badge ${acc.connectionStatus.toLowerCase()}`}>
                                                <i>●</i> {acc.connectionStatus}
                                            </span>
                                        </div>
                                        <div className="account-name">{acc.accountName}</div>
                                        <div className="account-id">ID: {acc.externalAccountId}</div>
                                    </div>

                                    <div className="account-meta-info">
                                        <div>Đồng bộ gần nhất: {acc.lastSyncedAt ? new Date(acc.lastSyncedAt).toLocaleString("vi-VN") : "Chưa từng"}</div>
                                        <div>Hết hạn Token: {acc.tokenExpiresAt ? new Date(acc.tokenExpiresAt).toLocaleDateString("vi-VN") : "Không xác định"}</div>
                                    </div>

                                    <div className="account-actions">
                                        <button className="btn-outline small-btn" onClick={() => handleTest(acc.id)}>Test</button>
                                        {acc.connectionStatus !== "CONNECTED" && (
                                            <button className="btn-primary small-btn" onClick={() => handleReconnect(acc.id)}>Kết nối lại</button>
                                        )}
                                        <button className="btn-text small-btn" style={{ color: "var(--error)" }} onClick={() => handleDelete(acc.id)}>Xóa</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Thêm Tài khoản MXH mới</h2>
                        <form onSubmit={handleCreate} style={{ marginTop: "16px" }}>
                            <div className="form-group">
                                <label>Nền tảng</label>
                                <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                                    <option value="FACEBOOK">Facebook</option>
                                    <option value="TIKTOK">TikTok</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tên tài khoản</label>
                                <input type="text" required placeholder="Ví dụ: 19T Digital Fanpage" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>External Account ID / Page ID</label>
                                <input type="text" required placeholder="Ví dụ: 1029384756" value={externalAccountId} onChange={(e) => setExternalAccountId(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Access Token (Tùy chọn)</label>
                                <input type="text" placeholder="Dán Access Token vào đây nếu có..." value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
                            </div>
                            <div className="modal-actions" style={{ marginTop: "24px" }}>
                                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="modal-btn modal-btn-confirm" disabled={submitting}>
                                    {submitting ? "Đang lưu..." : "Lưu tài khoản"}
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
