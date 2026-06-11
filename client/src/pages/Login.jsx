// ─── Login Page ───────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/rooms");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <i className="ti ti-message-circle" style={{ fontSize: 24, color: "#534ab7" }} />
          </div>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.sub}>Enter your details to access the community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>EMAIL</label>
            <div style={styles.inputWrap}>
              <i className="ti ti-mail" style={styles.inputIcon} />
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <div style={styles.inputWrap}>
              <i className="ti ti-lock" style={styles.inputIcon} />
              <input
                style={{ ...styles.input, paddingRight: 40 }}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              {/* Password show/hide toggle */}
              <i
                className={`ti ti-${showPass ? "eye-off" : "eye"}`}
                style={styles.eyeIcon}
                onClick={() => setShowPass(!showPass)}
              />
            </div>
          </div>

          {/* Error message */}
          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            <i className="ti ti-login" style={{ marginRight: 6 }} />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer links */}
        <div style={styles.footer}>
          <p style={styles.footerText}>NEW HERE?</p>
          <div style={styles.footerBtns}>
            <Link to="/register" style={styles.linkBtn}>
              <i className="ti ti-user-plus" style={{ marginRight: 4 }} />
              Sign Up
            </Link>
            <Link to="/guest" style={styles.guestBtn}>
              <i className="ti ti-user" style={{ marginRight: 4 }} />
              Guest Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "2.5rem",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
  },
  logo: { textAlign: "center", marginBottom: "2rem" },
  logoIcon: {
    width: 56,
    height: 56,
    background: "#eeedfe",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  sub: { fontSize: 14, color: "#6b7280", marginTop: 6 },
  field: { marginBottom: "1.2rem" },
  label: { fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.05em", display: "block", marginBottom: 6 },
  inputWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 18 },
  input: {
    width: "100%",
    padding: "10px 14px 10px 38px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    background: "#f9fafb",
    color: "#1a1a2e",
    outline: "none",
    boxSizing: "border-box",
  },
  eyeIcon: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    color: "#9ca3af", fontSize: 18, cursor: "pointer",
  },
  error: { color: "#ef4444", fontSize: 13, marginBottom: "1rem", textAlign: "center" },
  btn: {
    width: "100%", padding: "12px", background: "#7f77dd", color: "#fff",
    border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: "pointer", marginTop: 4,
  },
  footer: { textAlign: "center", marginTop: "1.5rem" },
  footerText: { fontSize: 11, color: "#9ca3af", letterSpacing: "0.05em", marginBottom: 10 },
  footerBtns: { display: "flex", gap: 10, justifyContent: "center" },
  linkBtn: {
    padding: "8px 20px", background: "transparent", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, color: "#1a1a2e", textDecoration: "none",
    display: "flex", alignItems: "center",
  },
  guestBtn: {
    padding: "8px 20px", background: "#1a1a2e", border: "none",
    borderRadius: 8, fontSize: 13, color: "#fff", textDecoration: "none",
    display: "flex", alignItems: "center",
  },
};

export default Login;
