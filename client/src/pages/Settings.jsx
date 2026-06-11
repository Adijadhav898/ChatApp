// ─── Settings Page ────────────────────────────────────────────────────────────
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/UserAvatar";

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: user.username || "",
    bio: user.bio || "",
    showLastSeen: user.showLastSeen ?? true,
    notificationsEnabled: user.notificationsEnabled ?? true,
    currentPassword: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploadingPfp, setUploadingPfp] = useState(false);
  const pfpInputRef = useRef();

  // ── Settings save karo ────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        username: form.username,
        bio: form.bio,
        showLastSeen: form.showLastSeen,
        notificationsEnabled: form.notificationsEnabled,
      };
      // Password change sirf tab bhejo jab fill kiya ho
      if (form.currentPassword && form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const { data } = await axios.put("/api/users/settings", payload);
      updateUser(data.user);
      setSuccess("Settings saved!");
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // ── Profile picture upload ────────────────────────────────────────────────
  const handlePfpUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPfp(true);
    const formData = new FormData();
    formData.append("pfp", file);
    try {
      const { data } = await axios.post("/api/users/upload-pfp", formData);
      updateUser({ profilePic: data.profilePic });
      setSuccess("Profile picture updated!");
    } catch {
      setError("Failed to upload profile picture");
    } finally {
      setUploadingPfp(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/rooms")}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
          </button>
          <h2 style={styles.title}>Settings</h2>
        </div>

        <form onSubmit={handleSave}>
          {/* ── Profile Picture ── */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Profile Picture</div>
            <div style={styles.pfpRow}>
              <UserAvatar user={user} size={64} />
              <div>
                <button
                  type="button"
                  style={styles.uploadPfpBtn}
                  onClick={() => pfpInputRef.current?.click()}
                  disabled={uploadingPfp}
                >
                  {uploadingPfp ? "Uploading..." : "Change Photo"}
                </button>
                <p style={styles.pfpHint}>JPG, PNG up to 5MB</p>
              </div>
              <input
                ref={pfpInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePfpUpload}
              />
            </div>
          </div>

          {/* ── Basic Info ── */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Basic Info</div>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                minLength={3} maxLength={20}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Bio</label>
              <textarea
                style={{ ...styles.input, resize: "none", height: 80 }}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell something about yourself..."
                maxLength={150}
              />
              <span style={styles.charCount}>{form.bio.length}/150</span>
            </div>
          </div>

          {/* ── Privacy ── */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Privacy</div>
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Last Seen</div>
                <div style={styles.toggleSub}>Show when you were last online</div>
              </div>
              <div
                style={{ ...styles.toggle, background: form.showLastSeen ? "#7f77dd" : "#e5e7eb" }}
                onClick={() => setForm({ ...form, showLastSeen: !form.showLastSeen })}
              >
                <div style={{ ...styles.toggleThumb, transform: form.showLastSeen ? "translateX(20px)" : "translateX(0)" }} />
              </div>
            </div>

            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Notifications</div>
                <div style={styles.toggleSub}>Get notified for mentions</div>
              </div>
              <div
                style={{ ...styles.toggle, background: form.notificationsEnabled ? "#7f77dd" : "#e5e7eb" }}
                onClick={() => setForm({ ...form, notificationsEnabled: !form.notificationsEnabled })}
              >
                <div style={{ ...styles.toggleThumb, transform: form.notificationsEnabled ? "translateX(20px)" : "translateX(0)" }} />
              </div>
            </div>
          </div>

          {/* ── Password Change ── */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Change Password</div>
            <div style={styles.field}>
              <label style={styles.label}>Current Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="Enter current password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>New Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="Min 6 characters"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
            </div>
          </div>

          {/* Success / Error */}
          {success && <p style={styles.success}>{success}</p>}
          {error && <p style={styles.error}>{error}</p>}

          {/* Save button */}
          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Logout */}
        <button style={styles.logoutBtn} onClick={logout}>
          <i className="ti ti-logout" style={{ marginRight: 6 }} />
          Logout
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#f4f4f6", padding: "1.5rem 1rem" },
  container: { maxWidth: 480, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4 },
  title: { fontSize: 20, fontWeight: 700, color: "#1a1a2e" },
  section: { background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 },
  pfpRow: { display: "flex", alignItems: "center", gap: 16 },
  uploadPfpBtn: { padding: "8px 16px", background: "#eeedfe", color: "#534ab7", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  pfpHint: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  field: { marginBottom: "1rem", position: "relative" },
  label: { fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f9fafb" },
  charCount: { position: "absolute", right: 10, bottom: 8, fontSize: 11, color: "#9ca3af" },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #f4f4f6" },
  toggleLabel: { fontSize: 14, fontWeight: 500, color: "#1a1a2e" },
  toggleSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 },
  toggleThumb: { position: "absolute", top: 2, left: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "transform 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" },
  success: { color: "#1d9e75", fontSize: 13, marginBottom: "0.5rem", textAlign: "center" },
  error: { color: "#ef4444", fontSize: 13, marginBottom: "0.5rem", textAlign: "center" },
  saveBtn: { width: "100%", padding: "12px", background: "#7f77dd", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: "0.75rem" },
  logoutBtn: { width: "100%", padding: "12px", background: "transparent", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
};

export default Settings;
