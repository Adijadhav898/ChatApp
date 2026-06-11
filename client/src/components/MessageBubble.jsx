// ─── MessageBubble Component ──────────────────────────────────────────────────
// Ek message ka UI - text, image, audio sab handle karta hai
// @mention highlight bhi yahan hota hai - sirf apna naam gold mein
import React from "react";
import UserAvatar from "./UserAvatar";
import RoleIcon from "./RoleIcon";

const MessageBubble = ({ message, currentUser, onAvatarClick }) => {
  const isOwn = message.sender._id === currentUser._id;

  // ── @mention text parse karo ────────────────────────────────────────────────
  // "@Rahul bhai check karo" -> ["", "@Rahul", " bhai check karo"]
  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const mentionedName = part.slice(1); // @ hata ke naam nikalo
        // Sirf apna naam highlight karo
        const isSelf = mentionedName === currentUser.username;
        return (
          <span
            key={i}
            className={isSelf ? "mention-self" : ""}
            style={!isSelf ? { color: "#534ab7", fontWeight: 500 } : {}}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // ── Time format karo ────────────────────────────────────────────────────────
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Own message (right side) ────────────────────────────────────────────────
  if (isOwn) {
    return (
      <div style={{ ...styles.row, justifyContent: "flex-end" }}>
        <div style={{ maxWidth: "70%", alignItems: "flex-end", display: "flex", flexDirection: "column" }}>
          <div style={styles.ownBubble}>
            {/* Text */}
            {message.fileType === "text" && (
              <p style={styles.ownText}>{renderContent(message.content)}</p>
            )}
            {/* Image */}
            {message.fileType === "image" && (
              <img src={message.fileUrl} alt="sent" style={styles.msgImage} />
            )}
            {/* Audio */}
            {message.fileType === "audio" && (
              <audio controls src={message.fileUrl} style={styles.audio} />
            )}
          </div>
          <span style={styles.time}>{formatTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  // ── Others message (left side) ──────────────────────────────────────────────
  return (
    <div style={styles.row}>
      {/* Avatar - click karne pe context menu */}
      <div style={{ flexShrink: 0 }}>
        <UserAvatar
          user={message.sender}
          size={34}
          onClick={(e) => onAvatarClick && onAvatarClick(message.sender, e)}
        />
      </div>

      <div style={{ maxWidth: "70%" }}>
        {/* Sender name + role icon */}
        <div style={styles.senderMeta}>
          <span style={styles.senderName}>{message.sender.username}</span>
          <RoleIcon role={message.sender.role} size={12} />
          <span style={styles.time}>{formatTime(message.createdAt)}</span>
        </div>

        {/* Message content */}
        <div style={styles.bubble}>
          {message.fileType === "text" && (
            <p style={styles.text}>{renderContent(message.content)}</p>
          )}
          {message.fileType === "image" && (
            <img src={message.fileUrl} alt="received" style={styles.msgImage} />
          )}
          {message.fileType === "audio" && (
            <audio controls src={message.fileUrl} style={styles.audio} />
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  row: { display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 },
  senderMeta: { display: "flex", alignItems: "center", gap: 5, marginBottom: 3 },
  senderName: { fontSize: 13, fontWeight: 600, color: "#1a1a2e" },
  time: { fontSize: 11, color: "#9ca3af" },
  bubble: {
    background: "#f4f4f6",
    borderRadius: "2px 12px 12px 12px",
    padding: "8px 12px",
    display: "inline-block",
    maxWidth: "100%",
  },
  text: { fontSize: 13, color: "#1a1a2e", lineHeight: 1.5, margin: 0 },
  ownBubble: {
    background: "#eeedfe",
    borderRadius: "12px 2px 12px 12px",
    padding: "8px 12px",
    display: "inline-block",
    maxWidth: "100%",
  },
  ownText: { fontSize: 13, color: "#26215c", lineHeight: 1.5, margin: 0 },
  msgImage: { maxWidth: 220, maxHeight: 200, borderRadius: 8, display: "block" },
  audio: { maxWidth: 220, outline: "none" },
};

export default MessageBubble;
