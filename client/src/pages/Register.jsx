// ─── Register Page ────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "", gender: "male" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.gender);
      navigate("/rooms");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <i className="ti ti-message-circle" style={{ fontSize: 24, color: "#534ab7" }} />
          </div>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.sub}>Join the community today</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={styles.field}>
            <label style={styles.label}>USERNAME</label>
            <div style={styles.inputWrap}>
              <i className="ti ti-user" style={styles.inputIcon} />
              <input
                style={styles.input}
                type="text"
                placeholder="cooluser123"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required minLength={3} maxLength={20}
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <div style={styles.inputWrap}>
              <i className="ti ti-lock" style={styles.inputIcon} />
              <input
                style={styles.input}
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required minLength={6}
              />
            </div>
          </div>

          {/* Gender */}
          <div style={styles.field}>
            <label style={styles.label}>GENDER</label>
            <div style={styles.inputWrap}>
              <i className="ti ti-gender-bigender" style={styles.inputIcon} />
              <select
                style={styles.input}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.2rem", fontSize: 13, color: "#6b7280" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#534ab7", fontWeight: 500 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#f4f4f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  card: { background: "#fff", borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 420, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" },
  logo: { textAlign: "center", marginBottom: "2rem" },
  logoIcon: { width: 56, height: 56, background: "#eeedfe", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  sub: { fontSize: 14, color: "#6b7280", marginTop: 6 },
  field: { marginBottom: "1.1rem" },
  label: { fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.05em", display: "block", marginBottom: 6 },
  inputWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 18 },
  input: { width: "100%", padding: "10px 14px 10px 38px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, background: "#f9fafb", color: "#1a1a2e", outline: "none", boxSizing: "border-box" },
  error: { color: "#ef4444", fontSize: 13, marginBottom: "1rem", textAlign: "center" },
  btn: { width: "100%", padding: "12px", background: "#7f77dd", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4 },
};

export default Register;
