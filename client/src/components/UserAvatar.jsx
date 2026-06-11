// ─── UserAvatar Component ─────────────────────────────────────────────────────
// Profile picture ya initials dikhata hai, saath mein online dot aur role icon
import React from "react";
import RoleIcon from "./RoleIcon";

const UserAvatar = ({ user, size = 38, showOnline = false, onClick }) => {
  // Username ka pehla letter capital mein
  const initial = user?.username?.[0]?.toUpperCase() || "?";

  // Role ke hisaab se background color
  const bgColors = {
    admin: "#faeeda",
    moderator: "#e6f1fb",
    user: "#f1efe8",
    guest: "#eeedfe",
  };

  const textColors = {
    admin: "#633806",
    moderator: "#0c447c",
    user: "#444441",
    guest: "#3c3489",
  };

  const bg = bgColors[user?.role] || "#f1efe8";
  const color = textColors[user?.role] || "#444441";

  return (
    <div
      style={{ position: "relative", display: "inline-block", cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      {/* Profile picture ya initials */}
      {user?.profilePic ? (
        <img
          src={user.profilePic}
          alt={user.username}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: bg,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.38,
            fontWeight: 600,
          }}
        >
          {initial}
        </div>
      )}

      {/* Role icon - top right corner pe */}
      {(user?.role === "admin" || user?.role === "moderator") && (
        <div
          style={{
            position: "absolute",
            top: -4,
            right: -6,
            lineHeight: 1,
          }}
        >
          <RoleIcon role={user.role} size={size * 0.42} />
        </div>
      )}

      {/* Online dot - bottom right corner pe */}
      {showOnline && user?.isOnline && (
        <div
          style={{
            position: "absolute",
            bottom: 1,
            right: user?.role === "admin" || user?.role === "moderator" ? 1 : 0,
            width: size * 0.23,
            height: size * 0.23,
            borderRadius: "50%",
            background: "#1d9e75",
            border: "2px solid #fff",
          }}
        />
      )}
    </div>
  );
};

export default UserAvatar;
