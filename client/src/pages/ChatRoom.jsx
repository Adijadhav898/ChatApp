// ─── ChatRoom Page ────────────────────────────────────────────────────────────
// Main chat room - messages, typing indicator, @mention, image/audio upload
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MessageBubble from "../components/MessageBubble";
import UserAvatar from "../components/UserAvatar";
import UserContextMenu from "../components/UserContextMenu";
import ProfilePopup from "../components/ProfilePopup";
import PersonalChatBox from "../components/PersonalChatBox";
import MentionDropdown from "../components/MentionDropdown";

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [members, setMembers] = useState([]);

  // ── Context menu (avatar pe tap) ───────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState(null); // { user, x, y }
  const [profileUser, setProfileUser] = useState(null); // view profile popup
  const [chatTarget, setChatTarget] = useState(null);   // personal chat box

  // ── @mention dropdown ──────────────────────────────────────────────────────
  const [mentionQuery, setMentionQuery] = useState(""); // @ ke baad ka text
  const [showMentions, setShowMentions] = useState(false);

  const messagesEndRef = useRef();
  const textareaRef = useRef();
  const typingTimeoutRef = useRef();

  // ── Room data fetch karo ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await axios.get(`/api/rooms`);
        const found = data.find((r) => r._id === roomId);
        if (!found) return navigate("/rooms");
        setRoom(found);
        setMembers(found.members || []);
      } catch {
        navigate("/rooms");
      }
    };

    // ── Purane messages load karo ──────────────────────────────────────────
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`/api/messages/room/${roomId}`);
        setMessages(data);
      } catch {
        console.error("Failed to load messages");
      }
    };

    fetchRoom();
    fetchMessages();
  }, [roomId]);

  // ── Socket events setup karo ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Room join karo
    socket.emit("room:join", roomId);

    // Naya message aaya
    socket.on("message:receive", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Typing indicator
    socket.on("typing:update", ({ username, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping
          ? [...new Set([...prev, username])]
          : prev.filter((u) => u !== username)
      );
    });

    // Kicked ho gaya
    socket.on("kicked", ({ roomId: kickedRoom }) => {
      if (kickedRoom === roomId) {
        alert("You have been kicked from this room");
        navigate("/rooms");
      }
    });

    // Cleanup
    return () => {
      socket.emit("room:leave", roomId);
      socket.off("message:receive");
      socket.off("typing:update");
      socket.off("kicked");
    };
  }, [socket, roomId]);

  // ── Auto scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Text input change - typing indicator + @mention detect ────────────────
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    // ── Typing indicator ─────────────────────────────────────────────────
    socket?.emit("typing:start", roomId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing:stop", roomId);
    }, 1500);

    // ── @mention detect ──────────────────────────────────────────────────
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // ── @mention select ───────────────────────────────────────────────────────
  const handleMentionSelect = (username) => {
    // @ ke baad jo type kiya tha usse replace karo selected username se
    const newText = text.replace(/@(\w*)$/, `@${username} `);
    setText(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  // ── Message send ──────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!text.trim() || !socket) return;
    socket.emit("message:send", { roomId, content: text.trim() });
    setText("");
    socket.emit("typing:stop", roomId);
    setShowMentions(false);
  };

  // ── File upload (image / audio) ───────────────────────────────────────────
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);
    formData.append("isPersonal", "false");

    try {
      const { data } = await axios.post("/api/messages/upload", formData);
      // Upload ke baad message room mein broadcast karo
      socket?.emit("message:send", {
        roomId,
        content: "",
        fileUrl: data.fileUrl,
        fileType: data.fileType,
      });
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    }
    e.target.value = ""; // input reset
  };

  // ── Enter to send ─────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Avatar click - context menu dikhao ───────────────────────────────────
  const handleAvatarClick = (clickedUser, e) => {
    if (clickedUser._id === user._id) return; // apna context menu nahi
    const rect = e.target.getBoundingClientRect();
    setContextMenu({
      user: clickedUser,
      x: Math.min(rect.left, window.innerWidth - 220),
      y: Math.min(rect.bottom + 4, window.innerHeight - 300),
    });
  };

  // ── Image send permission check ───────────────────────────────────────────
  const canSendImage = user.role === "admin" || user.role === "moderator";

  if (!room) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate("/rooms")}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
          </button>
          <i className="ti ti-hash" style={{ fontSize: 20, color: "#9ca3af" }} />
          <div>
            <div style={styles.roomName}>{room.name}</div>
            <div style={styles.roomMeta}>{members.length} members</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.navBtn} onClick={() => navigate("/settings")}>
            <i className="ti ti-settings" style={{ fontSize: 18, color: "#6b7280" }} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={styles.body}>
        {/* ── Messages area ── */}
        <div style={styles.messagesArea}>
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg._id || i}
                message={msg}
                currentUser={user}
                onAvatarClick={handleAvatarClick}
              />
            ))}
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div style={styles.typingIndicator}>
                <span>{typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input area ── */}
          <div style={styles.inputSection}>
            {/* @mention dropdown */}
            {showMentions && (
              <MentionDropdown
                members={members.filter((m) => m._id !== user._id)}
                query={mentionQuery}
                onSelect={handleMentionSelect}
              />
            )}

            <div style={styles.inputRow}>
              {/* Image upload - sirf admin/mod ke liye */}
              {canSendImage && (
                <label style={styles.uploadBtn} title="Send image">
                  <i className="ti ti-photo" style={{ fontSize: 20, color: "#7f77dd" }} />
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "image")} />
                </label>
              )}

              {/* Audio upload - sabke liye */}
              <label style={styles.uploadBtn} title="Send audio">
                <i className="ti ti-microphone" style={{ fontSize: 20, color: "#7f77dd" }} />
                <input type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "audio")} />
              </label>

              {/* Text input */}
              <input
                ref={textareaRef}
                style={styles.textInput}
                placeholder="Type a message... (@ to mention)"
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
              />

              {/* Send button */}
              <button style={styles.sendBtn} onClick={sendMessage}>
                <i className="ti ti-send" style={{ fontSize: 18, color: "#fff" }} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Members sidebar ── */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Members ({members.length})</div>
          {members.map((m) => (
            <div
              key={m._id}
              style={styles.memberRow}
              onClick={(e) => handleAvatarClick(m, e)}
            >
              <UserAvatar user={m} size={28} showOnline />
              <span style={styles.memberName}>{m.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Context Menu ── */}
      {contextMenu && (
        <UserContextMenu
          user={contextMenu.user}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onViewProfile={(u) => { setProfileUser(u); setContextMenu(null); }}
          onSendMessage={(u) => { setChatTarget(u); setContextMenu(null); }}
          onBlock={(blockedId) => {
            // Blocked user ke messages hide karo
            setMessages((prev) => prev.filter((m) => m.sender._id !== blockedId));
          }}
        />
      )}

      {/* ── Profile Popup ── */}
      {profileUser && (
        <ProfilePopup
          user={profileUser}
          onClose={() => setProfileUser(null)}
          onSendMessage={(u) => { setChatTarget(u); setProfileUser(null); }}
        />
      )}

      {/* ── Personal Chat Box ── */}
      {chatTarget && (
        <PersonalChatBox
          targetUser={chatTarget}
          onClose={() => setChatTarget(null)}
        />
      )}
    </div>
  );
};

const styles = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#f4f4f6" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4 },
  roomName: { fontSize: 15, fontWeight: 700, color: "#1a1a2e" },
  roomMeta: { fontSize: 12, color: "#9ca3af" },
  headerRight: { display: "flex", gap: 8 },
  navBtn: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  messagesArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  messages: { flex: 1, overflowY: "auto", padding: "16px" },
  typingIndicator: { fontSize: 12, color: "#9ca3af", fontStyle: "italic", padding: "0 4px 8px" },
  inputSection: { position: "relative", padding: "10px 16px", borderTop: "1px solid #e5e7eb", background: "#fff" },
  inputRow: { display: "flex", alignItems: "center", gap: 8 },
  uploadBtn: { cursor: "pointer", display: "flex", alignItems: "center", padding: 4, flexShrink: 0 },
  textInput: { flex: 1, padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 20, fontSize: 14, outline: "none", background: "#f9fafb" },
  sendBtn: { width: 38, height: 38, borderRadius: "50%", background: "#7f77dd", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  sidebar: { width: 180, borderLeft: "1px solid #e5e7eb", padding: "16px 12px", overflowY: "auto", background: "#fff", flexShrink: 0 },
  sidebarTitle: { fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 },
  memberRow: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer", fontSize: 13, color: "#374151" },
  memberName: { fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
};

export default ChatRoom;
