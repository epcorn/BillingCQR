import React, { useState, useEffect } from "react";
import LoginForm from "./pages/LoginForm";
import BillingLandingPage from "./pages/BillingLandingPage";

function App() {
  const [user, setUser] = useState(null);

  // On mount, check if user info exists in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // ✅ Updated logout handler with backend tracking
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
await fetch(
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/logout`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
);

      }

      // Clear session data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (!user) {
    return <LoginForm onLoginSuccess={setUser} />;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#f0f0f0",
        }}
      >
        <h2>
          Welcome, {user.name} ({user.role})
        </h2>
        <button
          onClick={handleLogout}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>
      <BillingLandingPage />
    </div>
  );
}

export default App;
