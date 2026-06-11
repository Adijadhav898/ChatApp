// ─── UserContextMenu Component ────────────────────────────────────────────────
// Jab koi user kisi ki avatar pe tap kare toh yeh dropdown menu aata hai
// Options: View Profile, View Status, Send Message, Block, Report
import React, { useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const UserContextMenu = ({ user, position, onClose, onViewProfile, onSendMessage, onBlock }) => {
  const { user: currentUser } = useAuth();
  const menuRef = useRef();

  // ── Outside click pe menu band karo ────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Report User ────────────────────────────────────────────────────────────
  const handleReport = async () => {
    const reason = prompt(`Reason for reporting ${user.username}:`);
    if (!reason) return;
    try {
      await axios.post("/api/users/report", {
        reportedUserId: user._id,
        reason,
      });
      alert("Report submitted. Admin will review it.");
    } catch {
      alert("Failed to submit report");
    }
    onClose();
  };

  // ── Block User ────────────────────────────────────────────────────────────
  const handleBlock = async () => {
    if (!window.confirm(`Block ${user.username}?`)) return;
    try {
      await axios.post(`/api/users/block/${user._id}`);
      onBlock && onBlock(user._id); // parent ko batao
    } catch {
      alert("Failed to block user");
    }
    onClose();
  };

  // Apne aap ka menu nahi dikhana
  if (user._id === currentUser._id) return null;

  return (
    <>
      {/* Background overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        style={{
          ...styles.menu,
          top: position.y,
          left: position.x,
        }}
      >
        {/* User header */}
        <div style={styles.menuHeader}>
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.username} style={styles.menuAvatar} />
          ) : (
            <div style={styles.menuAvatarInitial}>
              {user.username[0].toUpperCase()}
            </div>
          )}
          <span style={styles.menuUsername}>{user.username}</span>
        </div>

        <div style={styles.divider} />

        {/* View Profile */}
        <button style={styles.menuItem} onClick={() => { onViewProfile(user); onClose(); }}>
          <i className="ti ti-user" style={styles.menuIcon} />
          View Profile
        </button>

        {/* Send Message */}
        <button style={styles.menuItem} onClick={() => { onSendMessage(user); onClose(); }}>
          <i className="ti ti-message" style={styles.menuIcon} />
          Send Message
        </button>

        <div style={styles.divider} />

        {/* Block */}
        <button style={{ ...styles.menuItem, ...styles.menuItemDanger }} onClick={handleBlock}>
          <i className="ti ti-ban" style={{ ...styles.menuIcon, color: "#ef4444" }} />
          Block User
        </button>

        {/* Report */}
        <button style={{ ...styles.menuItem, ...styles.menuItemDanger }} onClick={handleReport}>
          <i className="ti ti-flag" style={{ ...styles.menuIcon, color: "#ef4444" }} />
          Report User
        </button>
      </div>
    </>
  );
};

const styles = {
  overlay: { position: "fixed", inset: 0, zIndex: 99 },
  menu: {
    position: "fixed",
    zIndex: 100,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    border: "1px solid #e5e7eb",
    minWidth: 200,
    overflow: "hidden",
  },
  menuHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "#f9fafb",
  },
  menuAvatar: { width: 32, height: 32, borderRadius: "50%", objectFit: "cover" },
  menuAvatarInitial: {
    width: 32, height: 32, borderRadius: "50%", background: "#eeedfe",
    color: "#534ab7", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 600,
  },
  menuUsername: { fontSize: 14, fontWeight: 600, color: "#1a1a2e" },
  divider: { height: 1, background: "#e5e7eb" },
  menuItem: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "11px 14px",
    background: "none", border: "none", cursor: "pointer",
    fontSize: 13, color: "#374151", textAlign: "left",
    transition: "background 0.15s",
  },
  menuItemDanger: { color: "#ef4444" },
  menuIcon: { fontSize: 17, color: "#6b7280" },
};

export default UserContextMenu;
