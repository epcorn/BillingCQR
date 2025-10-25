import React, { useState } from "react";
import axios from "axios";

const LoginForm = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
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
            <div style={styles.formWrapper}>
                <h1 style={styles.title}>Welcome to Billing-CQR</h1>
                {error && <p style={styles.error}>{error}</p>}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>
                    <button type="submit" style={styles.button}>Login</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    wrapper: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: "linear-gradient(135deg, #e0eafc, #cfdef3)",
        padding: "20px"
    },
    formWrapper: {
        width: "100%",
        maxWidth: "400px",
        background: "#fff",
        padding: "40px 30px",
        borderRadius: "12px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
        border: "1px solid #e0e0e0",
        textAlign: "center"
    },
    title: {
        fontSize: "32px",
        color: "#2c3e50",
        marginBottom: "25px",
        fontWeight: "700"
    },
    form: {
        display: "flex",
        flexDirection: "column"
    },
    inputGroup: {
        marginBottom: "15px",
        display: "flex",
        flexDirection: "column",
        textAlign: "left"
    },
    label: {
        marginBottom: "5px",
        fontWeight: "500",
        color: "#333",
        fontSize: "14px"
    },
    input: {
        padding: "10px",
        fontSize: "14px",
        borderRadius: "8px",
        border: "1px solid #c0c0c0",
        backgroundColor: "#f8f8f8",
        outline: "none"
    },
    button: {
        padding: "12px",
        fontSize: "16px",
        fontWeight: "600",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#27ae60",
        color: "#fff",
        cursor: "pointer",
        marginTop: "10px"
    },
    error: {
        color: "red",
        marginBottom: "15px",
        fontSize: "14px"
    }
};

export default LoginForm;
