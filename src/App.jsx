import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PlatformAccounts from "./pages/PlatformAccounts";
import SyncJobs from "./pages/SyncJobs";
import Posts from "./pages/Posts";
import Settings from "./pages/Settings";
import { isLoggedIn, logout } from "./services/authService";

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message) => setAlertMessage(String(message ?? ""));
    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  useEffect(() => {
    if (!alertMessage) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setAlertMessage("");
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [alertMessage]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={() => (window.location.href = "/")} />} />
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><PlatformAccounts onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/sync" element={<ProtectedRoute><SyncJobs onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/posts" element={<ProtectedRoute><Posts onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {alertMessage && (
        <div
          role="presentation"
          onMouseDown={() => setAlertMessage("")}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "rgba(28, 26, 23, 0.45)",
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-alert-title"
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              width: "min(440px, 100%)",
              border: "1px solid #e4ddd0",
              borderRadius: "14px",
              background: "#fff",
              boxShadow: "0 18px 50px rgba(28, 26, 23, 0.2)",
              padding: "26px",
            }}
          >
            <h2
              id="app-alert-title"
              style={{
                margin: 0,
                color: "#1c1a17",
                fontSize: "21px",
                fontWeight: 650,
              }}
            >
              Thông báo
            </h2>
            <p
              style={{
                margin: "14px 0 24px",
                color: "#5f5a51",
                fontSize: "15px",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {alertMessage}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                autoFocus
                onClick={() => setAlertMessage("")}
                style={{
                  minWidth: "92px",
                  border: 0,
                  borderRadius: "8px",
                  background: "#b98b36",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: 600,
                  padding: "10px 18px",
                }}
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
