import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Statistics from "./pages/Statistics";
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
    </BrowserRouter>
  );
}

export default App;