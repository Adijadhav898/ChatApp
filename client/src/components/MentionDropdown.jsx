// ─── MentionDropdown Component ────────────────────────────────────────────────
// Jab user @ type kare toh yeh dropdown aata hai members ki list ke saath
import React from "react";
import RoleIcon from "./RoleIcon";

const MentionDropdown = ({ members, query, onSelect }) => {
  // Filter karo - jo naam @ke baad type kiya usse match karo
  const filtered = members.filter((m) =>
    m.username.toLowerCase().startsWith(query.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div style={styles.dropdown}>
      <div style={styles.title}>Members — tap to mention</div>
      {filtered.map((member) => (
        <div
          key={member._id}
          style={styles.item}
          onMouseDown={(e) => {
            e.preventDefault(); // input blur hone se rokta hai
            onSelect(member.username);
          }}
        >
          {/* Avatar */}
          <div style={styles.avatar}>
            {member.profilePic ? (
              <img src={member.profilePic} alt={member.username} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              member.username[0].toUpperCase()
            )}
          </div>

          {/* Name */}
          <span style={styles.name}>{member.username}</span>

          {/* Role icon */}
          <RoleIcon role={member.role} size={13} />

          {/* Online dot */}
          {member.isOnline && (
            <div style={styles.onlineDot} />
          )}
        </div>
      ))}
    </div>
  );
};

const styles = {
  dropdown: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    marginBottom: 6,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    overflow: "hidden",
    zIndex: 50,
    maxHeight: 200,
    overflowY: "auto",
  },
  title: {
    fontSize: 10,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "6px 12px 4px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
    transition: "background 0.15s",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "#eeedfe",
    color: "#534ab7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    flexShrink: 0,
  },
  name: { flex: 1, fontWeight: 500 },
  onlineDot: { width: 7, height: 7, borderRadius: "50%", background: "#1d9e75" },
};

export default MentionDropdown;
