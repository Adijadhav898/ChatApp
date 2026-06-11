// ─── Guest Join Page ──────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GuestJoin = () => {
  const { guestLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", gender: "male" });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return setError("Please confirm you are 18 or older");
    setError("");
    setLoading(true);
    try {
      await guestLogin(form.username, form.gender);
      navigate("/rooms");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Avatar icon */}
        <div style={styles.logo}>
          <div style={styles.avatarIcon}>
            <i className="ti ti-user" style={{ fontSize: 32, color: "#7f77dd" }} />
          </div>
          <h2 style={styles.title}>Guest Chat</h2>
          <p style={styles.sub}>Pick a username and join in seconds. No signup required.</p>
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
                placeholder="Enter a username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required minLength={3} maxLength={16}
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

          {/* Age confirm checkbox */}
          <div style={styles.checkRow}>
            <input
              type="checkbox"
              id="age"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <label htmlFor="age" style={styles.checkLabel}>
              I confirm that I'm <strong>18</strong> or older.
            </label>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Joining..." : "Join Room →"}
          </button>
        </form>

        {/* Guest limitations notice */}
        <div style={styles.notice}>
          <i className="ti ti-info-circle" style={{ fontSize: 14, color: "#9ca3af" }} />
          <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 6 }}>
            Guests can only message other guests
          </span>
        </div>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: 13, color: "#6b7280" }}>
          Have an account?{" "}
          <Link to="/login" style={{ color: "#534ab7", fontWeight: 500 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#f4f4f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  card: { background: "#fff", borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 420, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" },
  logo: { textAlign: "center", marginBottom: "2rem" },
  avatarIcon: { width: 64, height: 64, background: "#eeedfe", borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.5 },
  field: { marginBottom: "1.1rem" },
  label: { fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.05em", display: "block", marginBottom: 6 },
  inputWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 18 },
  input: { width: "100%", padding: "10px 14px 10px 38px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, background: "#f9fafb", color: "#1a1a2e", outline: "none", boxSizing: "border-box" },
  checkRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" },
  checkLabel: { fontSize: 13, color: "#374151", cursor: "pointer" },
  error: { color: "#ef4444", fontSize: 13, marginBottom: "1rem" },
  btn: { width: "100%", padding: "12px", background: "#7f77dd", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  notice: { display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1rem", background: "#f9fafb", borderRadius: 8, padding: "8px 12px" },
};

export default GuestJoin;
