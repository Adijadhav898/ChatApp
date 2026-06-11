// ─── RoomList Page ────────────────────────────────────────────────────────────
// Saare rooms ki list + online users sidebar
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import UserAvatar from "../components/UserAvatar";

const RoomList = () => {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // ── Rooms fetch karo ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await axios.get("/api/rooms");
        setRooms(data);
      } catch {
        console.error("Failed to fetch rooms");
      }
    };
    fetchRooms();
  }, []);

  // ── Room create karo (sirf admin) ───────────────────────────────────────────
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const { data } = await axios.post("/api/rooms", newRoom);
      setRooms((prev) => [...prev, data]);
      setShowCreateModal(false);
      setNewRoom({ name: "", description: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  // ── Filter rooms by search ──────────────────────────────────────────────────
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      {/* ── Navbar ── */}
      <div style={styles.navbar}>
        <div style={styles.navLeft}>
          <i className="ti ti-message-circle" style={{ fontSize: 22, color: "#534ab7" }} />
          <span style={styles.navTitle}>ChatApp</span>
        </div>
        <div style={styles.navRight}>
          {/* Admin panel link */}
          {user.role === "admin" && (
            <button style={styles.navBtn} onClick={() => navigate("/admin")}>
              <i className="ti ti-shield" style={{ fontSize: 18 }} />
            </button>
          )}
          {/* Settings */}
          <button style={styles.navBtn} onClick={() => navigate("/settings")}>
            <i className="ti ti-settings" style={{ fontSize: 18 }} />
          </button>
          {/* User avatar + role icon */}
          <UserAvatar user={user} size={32} />
          {/* Logout */}
          <button style={styles.navBtn} onClick={logout} title="Logout">
            <i className="ti ti-logout" style={{ fontSize: 18 }} />
          </button>
        </div>
      </div>

      {/* ── Main body ── */}
      <div style={styles.body}>
        {/* ── Sidebar - online users ── */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Online Users</div>
          {rooms.length === 0 && <p style={styles.emptyText}>No one online</p>}
          {/* Sabke members mein se jo online hain */}
          {[...new Map(
            rooms.flatMap((r) => r.members || []).map((m) => [m._id, m])
          ).values()]
            .filter((m) => onlineUsers.includes(m._id))
            .map((m) => (
              <div key={m._id} style={styles.onlineUser}>
                <UserAvatar user={m} size={28} showOnline />
                <span style={styles.onlineUserName}>{m.username}</span>
              </div>
            ))}

          <div style={{ marginTop: "1.5rem" }}>
            <div style={styles.sidebarTitle}>Quick</div>
            <div style={styles.quickLink} onClick={() => navigate("/settings")}>
              <i className="ti ti-settings" style={{ fontSize: 15 }} /> Settings
            </div>
            <div style={styles.quickLink} onClick={logout}>
              <i className="ti ti-logout" style={{ fontSize: 15 }} /> Logout
            </div>
          </div>
        </div>

        {/* ── Rooms main area ── */}
        <div style={styles.main}>
          {/* Search */}
          <div style={styles.searchWrap}>
            <i className="ti ti-search" style={styles.searchIcon} />
            <input
              style={styles.searchInput}
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Create room button - sirf admin ke liye */}
          {user.role === "admin" && (
            <button style={styles.createBtn} onClick={() => setShowCreateModal(true)}>
              <i className="ti ti-plus" style={{ fontSize: 16 }} />
              Create New Room
            </button>
          )}

          <div style={styles.sectionTitle}>All Rooms</div>

          {/* Room cards */}
          {filteredRooms.length === 0 ? (
            <p style={styles.emptyText}>No rooms found</p>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room._id}
                style={styles.roomCard}
                onClick={() => navigate(`/rooms/${room._id}`)}
              >
                <div style={styles.roomIcon}>
                  <i className={`ti ti-${room.isPrivate ? "lock" : "hash"}`} style={{ fontSize: 18, color: "#9ca3af" }} />
                </div>
                <div style={styles.roomInfo}>
                  <div style={styles.roomName}>{room.name}</div>
                  <div style={styles.roomMeta}>
                    {room.members?.length || 0} members
                    {room.description ? ` · ${room.description}` : ""}
                  </div>
                </div>
                <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "#9ca3af" }} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Create Room Modal ── */}
      {showCreateModal && (
        <>
          <div style={styles.overlay} onClick={() => setShowCreateModal(false)} />
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Create New Room</h3>
            <form onSubmit={handleCreateRoom}>
              <input
                style={styles.modalInput}
                placeholder="Room name"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                required
              />
              <input
                style={styles.modalInput}
                placeholder="Description (optional)"
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
              />
              {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={creating}>
                  {creating ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#f4f4f6", display: "flex", flexDirection: "column" },
  navbar: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  navLeft: { display: "flex", alignItems: "center", gap: 8 },
  navTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e" },
  navRight: { display: "flex", alignItems: "center", gap: 10 },
  navBtn: { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4, borderRadius: 6 },
  body: { display: "flex", flex: 1, gap: 0, maxWidth: 900, margin: "1.5rem auto", width: "100%", padding: "0 1rem" },
  sidebar: { width: 200, flexShrink: 0, marginRight: "1rem" },
  sidebarTitle: { fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 },
  onlineUser: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: "#374151" },
  onlineUserName: { fontSize: 13, color: "#374151" },
  quickLink: { display: "flex", alignItems: "center", gap: 8, padding: "7px 0", fontSize: 13, color: "#6b7280", cursor: "pointer" },
  main: { flex: 1 },
  searchWrap: { position: "relative", marginBottom: 10 },
  searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 17 },
  searchInput: { width: "100%", padding: "10px 14px 10px 38px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, background: "#fff", outline: "none", boxSizing: "border-box" },
  createBtn: { display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "10px 14px", border: "1px dashed #7f77dd", borderRadius: 10, background: "transparent", color: "#534ab7", fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 },
  roomCard: { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", marginBottom: 8, cursor: "pointer", transition: "border-color 0.2s" },
  roomIcon: { width: 36, height: 36, borderRadius: 8, background: "#f4f4f6", display: "flex", alignItems: "center", justifyContent: "center" },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 14, fontWeight: 600, color: "#1a1a2e" },
  roomMeta: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: "2rem" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 },
  modal: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 201, background: "#fff", borderRadius: 16, padding: "1.5rem", width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: "1rem" },
  modalInput: { width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, marginBottom: 10, boxSizing: "border-box", outline: "none" },
  cancelBtn: { flex: 1, padding: "10px", background: "#f4f4f6", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" },
  submitBtn: { flex: 1, padding: "10px", background: "#7f77dd", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
};

export default RoomList;
