import { useState } from "react";
import Login from "./pages/Login";
import Statistics from "./pages/Statistics";
import { isLoggedIn, logout } from "./services/authService";

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLoginSuccess={() => setLoggedIn(true)} />;
  }
  return <Statistics onLogout={handleLogout} />;
}

export default App;