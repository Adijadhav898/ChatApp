// ─── PersonalChatBox Component ────────────────────────────────────────────────
// Floating resizable personal chat window - ChatZoZo jaisa
// Corner mein float karta hai, drag karke resize karo
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import RoleIcon from "./RoleIcon";

const PersonalChatBox = ({ targetUser, onClose }) => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef();

  // ── Purane messages load karo ───────────────────────────────────────────────
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`/api/messages/personal/${targetUser._id}`);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages");
      }
    };
    fetchMessages();
  }, [targetUser._id]);

  // ── Socket se incoming personal messages suno ───────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handlePersonalMsg = (msg) => {
      // Sirf is chat ke messages add karo
      const isRelevant =
        (msg.sender._id === targetUser._id && msg.receiver === currentUser._id) ||
        (msg.sender._id === currentUser._id && msg.receiver === targetUser._id);
      if (isRelevant) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("personal:receive", handlePersonalMsg);
    return () => socket.off("personal:receive", handlePersonalMsg);
  }, [socket, targetUser._id]);

  // ── Auto scroll to bottom ───────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Text message bhejo ──────────────────────────────────────────────────────
  const sendText = () => {
    if (!text.trim() || !socket) return;
    socket.emit("personal:send", {
      receiverId: targetUser._id,
      content: text.trim(),
    });
    setText("");
  };

  // ── Image / Audio upload ────────────────────────────────────────────────────
  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiverId", targetUser._id);
    formData.append("isPersonal", "true");

    try {
      const { data } = await axios.post("/api/messages/upload", formData);
      setMessages((prev) => [...prev, data]);
      // Socket se bhi receiver ko notify karo
      socket.emit("personal:send", {
        receiverId: targetUser._id,
        content: "",
        fileUrl: data.fileUrl,
        fileType: data.fileType,
      });
    } catch {
      alert("Upload failed");
    }
  };

  // ── Enter key se send karo ──────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div style={styles.box}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {/* Target user avatar */}
          <div style={styles.headerAvatar}>
            {targetUser.profilePic ? (
              <img src={targetUser.profilePic} alt={targetUser.username} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              targetUser.username[0].toUpperCase()
            )}
          </div>
          <div>
            <div style={styles.headerName}>
              {targetUser.username}
              <RoleIcon role={targetUser.role} size={12} />
            </div>
            <div style={styles.headerStatus}>
              {targetUser.isOnline ? (
                <><span style={{ color: "#1d9e75", fontSize: 10 }}>●</span> Online</>
              ) : "Offline"}
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          {/* Minimize */}
          <button style={styles.iconBtn} onClick={() => setIsMinimized(!isMinimized)} title="Minimize">
            <i className={`ti ti-${isMinimized ? "maximize" : "minus"}`} style={{ fontSize: 15 }} />
          </button>
          {/* Close */}
          <button style={styles.iconBtn} onClick={onClose} title="Close">
            <i className="ti ti-x" style={{ fontSize: 15 }} />
          </button>
        </div>
      </div>

      {/* ── Chat body - minimize hone pe hide hoga ── */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div style={styles.messages}>
            {messages.length === 0 && (
              <p style={styles.emptyText}>Say hi to {targetUser.username}!</p>
            )}
            {messages.map((msg, i) => {
              const isOwn = msg.sender._id === currentUser._id;
              return (
                <div key={i} style={{ ...styles.msgRow, justifyContent: isOwn ? "flex-end" : "flex-start" }}>
                  <div style={isOwn ? styles.ownBubble : styles.otherBubble}>
                    {msg.fileType === "text" && <p style={styles.msgText}>{msg.content}</p>}
                    {msg.fileType === "image" && <img src={msg.fileUrl} alt="img" style={styles.msgImg} />}
                    {msg.fileType === "audio" && <audio controls src={msg.fileUrl} style={styles.msgAudio} />}
                    <span style={styles.msgTime}>{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input area ── */}
          <div style={styles.inputArea}>
            {/* Image upload */}
            <label style={styles.uploadBtn} title="Send image">
              <i className="ti ti-photo" style={{ fontSize: 18, color: "#7f77dd" }} />
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "image")} />
            </label>

            {/* Audio upload */}
            <label style={styles.uploadBtn} title="Send audio">
              <i className="ti ti-microphone" style={{ fontSize: 18, color: "#7f77dd" }} />
              <input type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "audio")} />
            </label>

            {/* Text input */}
            <input
              style={styles.textInput}
              placeholder={`${currentUser.username}, Type message here....`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
            />

            {/* Send button */}
            <button style={styles.sendBtn} onClick={sendText}>
              <i className="ti ti-send" style={{ fontSize: 16, color: "#fff" }} />
            </button>
          </div>

          {/* Character count */}
          <div style={styles.charCount}>{text.length}/200</div>
        </>
      )}
    </div>
  );
};

const styles = {
  box: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 360,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
    border: "1px solid #e5e7eb",
    zIndex: 300,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    resize: "both", // drag karke resize karo
    minWidth: 280,
    minHeight: 100,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "#1a1a2e",
    cursor: "grab",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#eeedfe",
    color: "#534ab7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    overflow: "hidden",
  },
  headerName: { fontSize: 13, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 4 },
  headerStatus: { fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 },
  headerActions: { display: "flex", gap: 4 },
  iconBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4, borderRadius: 4 },
  messages: { flex: 1, padding: "12px", overflowY: "auto", maxHeight: 300, minHeight: 200, display: "flex", flexDirection: "column", gap: 8 },
  emptyText: { textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: "2rem" },
  msgRow: { display: "flex" },
  ownBubble: { background: "#eeedfe", borderRadius: "12px 2px 12px 12px", padding: "7px 10px", maxWidth: "80%" },
  otherBubble: { background: "#f4f4f6", borderRadius: "2px 12px 12px 12px", padding: "7px 10px", maxWidth: "80%" },
  msgText: { fontSize: 13, color: "#1a1a2e", margin: 0, lineHeight: 1.4 },
  msgImg: { maxWidth: 180, borderRadius: 8, display: "block" },
  msgAudio: { maxWidth: 200 },
  msgTime: { fontSize: 10, color: "#9ca3af", display: "block", marginTop: 3, textAlign: "right" },
  inputArea: { display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderTop: "1px solid #e5e7eb" },
  uploadBtn: { cursor: "pointer", display: "flex", alignItems: "center", padding: 4 },
  textInput: { flex: 1, border: "none", outline: "none", fontSize: 13, color: "#1a1a2e", background: "transparent" },
  sendBtn: { width: 32, height: 32, borderRadius: "50%", background: "#7f77dd", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  charCount: { fontSize: 10, color: "#9ca3af", textAlign: "right", paddingRight: 10, paddingBottom: 4 },
};

export default PersonalChatBox;
