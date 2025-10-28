import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaMoneyBillWave, FaCreditCard, FaFileInvoice, FaChartLine, FaWallet } from "react-icons/fa";
import { BsGraphUpArrow } from "react-icons/bs";

const icons = [
  FaMoneyBillWave,
  FaCreditCard,
  FaFileInvoice,
  FaChartLine,
  FaWallet,
  BsGraphUpArrow,
];

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [floatingIcons, setFloatingIcons] = useState([]);

  useEffect(() => {
    const created = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      Icon: icons[Math.floor(Math.random() * icons.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: `${Math.random() * 6}s`,
      animationDuration: `${10 + Math.random() * 8}s`,
      fontSize: `${40 + Math.random() * 20}px`,
      hue: Math.floor(Math.random() * 360), // Random hue for bright colors
    }));
    setFloatingIcons(created);
  }, []);

  // Inject keyframes and CSS for floating icons
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes floatIcon {
        0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        50% { transform: translateY(-40px) translateX(20px) rotate(10deg); }
        100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Floating Background Icons */}
      {floatingIcons.map(({ id, Icon, left, top, animationDelay, animationDuration, fontSize, hue }) => (
        <Icon
          key={id}
          style={{
            ...styles.icon,
            left: `${left}%`,
            top: `${top}%`,
            animationDelay,
            animationDuration,
            fontSize,
            color: `hsla(${hue}, 80%, 55%, 0.28)`, // Bright, colorful, semi-transparent
            opacity: 0.9,
          }}
        />
      ))}

      <div style={styles.card}>
        <h1 style={styles.title}>Billing-CQR Login</h1>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your email"
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    width: "100vw",
    height: "100vh",
    display: "grid",
    placeItems: "center",
    backgroundColor: "#f5f7fa",
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  icon: {
    position: "absolute",
    animationName: "floatIcon",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  card: {
    backgroundColor: "#fdfdfd",           // Softer than pure white
    padding: "50px 40px",
    borderRadius: "18px",
    border: "1px solid #eaeaea",           // Subtle border
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)", // Deeper shadow
    width: "90%",
    maxWidth: "380px",
    textAlign: "center",
    zIndex: 2,
  },
  title: {
    fontSize: "30px",
    color: "#2c3e50",
    marginBottom: "28px",
    fontWeight: "700",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    textAlign: "left",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    color: "#555",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    backgroundColor: "#fafafa",
    outline: "none",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#007ACC",
    color: "#fff",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.2s ease",
  },
  error: {
    color: "#e74c3c",
    marginBottom: "10px",
    fontSize: "14px",
  },
};

export default LoginForm;