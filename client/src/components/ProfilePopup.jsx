// ─── ProfilePopup Component ───────────────────────────────────────────────────
// Jab "View Profile" pe click karo toh yeh popup window aata hai
import React from "react";
import RoleIcon from "./RoleIcon";

const ProfilePopup = ({ user, onClose, onSendMessage }) => {
  if (!user) return null;

  // Last seen format karo
  const formatLastSeen = (date) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <>
      {/* Dark overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Popup */}
      <div style={styles.popup}>
        {/* Close button */}
        <button style={styles.closeBtn} onClick={onClose}>
          <i className="ti ti-x" style={{ fontSize: 18 }} />
        </button>

        {/* Profile pic */}
        <div style={styles.avatarWrap}>
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.username} style={styles.avatar} />
          ) : (
            <div style={styles.avatarInitial}>
              {user.username[0].toUpperCase()}
            </div>
          )}

          {/* Online dot */}
          {user.isOnline && <div style={styles.onlineDot} />}

          {/* Role icon */}
          {(user.role === "admin" || user.role === "moderator") && (
            <div style={styles.roleIconWrap}>
              <RoleIcon role={user.role} size={20} />
            </div>
          )}
        </div>

        {/* Name + role */}
        <h3 style={styles.username}>{user.username}</h3>
        <p style={styles.roleBadge}>
          {user.role === "admin" && "👑 Admin"}
          {user.role === "moderator" && "🛡️ Moderator"}
          {user.role === "user" && "User"}
          {user.role === "guest" && "Guest"}
        </p>

        {/* Bio */}
        {user.bio && (
          <div style={styles.bioBox}>
            <p style={styles.bio}>{user.bio}</p>
          </div>
        )}

        {/* Info rows */}
        <div style={styles.infoBox}>
          {/* Online status */}
          <div style={styles.infoRow}>
            <i className="ti ti-circle-filled" style={{ fontSize: 12, color: user.isOnline ? "#1d9e75" : "#9ca3af" }} />
            <span style={styles.infoText}>
              {user.isOnline ? "Online now" : "Offline"}
            </span>
          </div>

          {/* Last seen - sirf tab dikhao jab user ne allow kiya ho */}
          {!user.isOnline && user.showLastSeen && user.lastSeen && (
            <div style={styles.infoRow}>
              <i className="ti ti-clock" style={{ fontSize: 14, color: "#9ca3af" }} />
              <span style={styles.infoText}>
                Last seen: {formatLastSeen(user.lastSeen)}
              </span>
            </div>
          )}

          {/* Member since */}
          <div style={styles.infoRow}>
            <i className="ti ti-calendar" style={{ fontSize: 14, color: "#9ca3af" }} />
            <span style={styles.infoText}>
              Joined: {new Date(user.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>

        {/* Send message button */}
        <button
          style={styles.msgBtn}
          onClick={() => { onSendMessage(user); onClose(); }}
        >
          <i className="ti ti-message" style={{ marginRight: 6 }} />
          Send Message
        </button>
      </div>
    </>
  );
};

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, backdropFilter: "blur(2px)" },
  popup: {
    position: "fixed",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 201,
    background: "#fff",
    borderRadius: 20,
    padding: "2rem",
    width: 300,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute", top: 12, right: 12,
    background: "none", border: "none", cursor: "pointer",
    color: "#9ca3af", padding: 4,
  },
  avatarWrap: { position: "relative", display: "inline-block", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: "50%", objectFit: "cover" },
  avatarInitial: {
    width: 80, height: 80, borderRadius: "50%",
    background: "#eeedfe", color: "#534ab7",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 30, fontWeight: 700,
  },
  onlineDot: {
    position: "absolute", bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: "50%",
    background: "#1d9e75", border: "2px solid #fff",
  },
  roleIconWrap: { position: "absolute", top: -4, right: -8 },
  username: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  roleBadge: { fontSize: 13, color: "#6b7280", marginTop: 4, marginBottom: 12 },
  bioBox: { background: "#f9fafb", borderRadius: 10, padding: "10px 14px", marginBottom: 12 },
  bio: { fontSize: 13, color: "#374151", lineHeight: 1.5 },
  infoBox: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, alignItems: "flex-start", padding: "0 4px" },
  infoRow: { display: "flex", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: "#6b7280" },
  msgBtn: {
    width: "100%", padding: "10px", background: "#7f77dd", color: "#fff",
    border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};

export default ProfilePopup;
