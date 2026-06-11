// ─── RoleIcon Component ───────────────────────────────────────────────────────
// Admin ke liye 👑 crown (gold glow), Mod ke liye 🛡️ shield (blue glow)
// Yeh component user list aur chat messages dono mein use hoga

const RoleIcon = ({ role, size = 14 }) => {
  if (role === "admin") {
    return (
      <span
        className="crown-glow"
        style={{ fontSize: size, lineHeight: 1, display: "inline-block" }}
        title="Admin"
      >
        👑
      </span>
    );
  }

  if (role === "moderator") {
    return (
      <span
        className="shield-glow"
        style={{ fontSize: size, lineHeight: 1, display: "inline-block" }}
        title="Moderator"
      >
        🛡️
      </span>
    );
  }

  // User aur Guest ke liye koi icon nahi
  return null;
};

export default RoleIcon;
