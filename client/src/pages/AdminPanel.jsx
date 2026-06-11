// ─── Admin Panel Page ─────────────────────────────────────────────────────────
// Sirf admin access kar sakta hai
// Users manage, reports dekhna, rooms delete karna
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UserAvatar from "../components/UserAvatar";

const AdminPanel = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // users | reports | rooms
  const [loading, setLoading] = useState(true);

  // ── Data fetch karo ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, reportsRes, roomsRes] = await Promise.all([
          axios.get("/api/users"),
          axios.get("/api/users/reports/all"),
          axios.get("/api/rooms"),
        ]);
        setUsers(usersRes.data);
        setReports(reportsRes.data);
        setRooms(roomsRes.data);
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Role change karo ───────────────────────────────────────────────────────
  const handleRoleChange = async (userId, role) => {
    try {
      const { data } = await axios.put(`/api/users/role/${userId}`, { role });
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
    } catch {
      alert("Failed to update role");
    }
  };

  // ── Ban / Unban ────────────────────────────────────────────────────────────
  const handleBan = async (userId, ban) => {
    if (!window.confirm(ban ? "Ban this user?" : "Unban this user?")) return;
    try {
      const { data } = await axios.put(`/api/users/ban/${userId}`, { ban });
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
    } catch {
      alert("Failed");
    }
  };

  // ── Room delete ────────────────────────────────────────────────────────────
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      await axios.delete(`/api/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r._id !== roomId));
    } catch {
      alert("Failed to delete room");
    }
  };

  // ── Report status update ───────────────────────────────────────────────────
  const handleReportAction = async (reportId, status, actionTaken) => {
    try {
      await axios.put(`/api/users/reports/${reportId}`, { status, actionTaken });
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status, actionTaken } : r))
      );
    } catch {
      alert("Failed to update report");
    }
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalUsers = users.length;
  const onlineUsers = users.filter((u) => u.isOnline).length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/rooms")}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
          </button>
          <h2 style={styles.title}>
            <i className="ti ti-shield-check" style={{ color: "#534ab7", marginRight: 8 }} />
            Admin Panel
          </h2>
        </div>

        {/* Stats cards */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statVal}>{totalUsers}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statVal, color: "#1d9e75" }}>{onlineUsers}</div>
            <div style={styles.statLabel}>Online Now</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statVal, color: "#ef4444" }}>{pendingReports}</div>
            <div style={styles.statLabel}>Pending Reports</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statVal}>{rooms.length}</div>
            <div style={styles.statLabel}>Active Rooms</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["users", "reports", "rooms"].map((tab) => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Users Tab ── */}
        {activeTab === "users" && (
          <div style={styles.section}>
            {users.map((u) => (
              <div key={u._id} style={styles.userRow}>
                <UserAvatar user={u} size={36} showOnline />
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{u.username}</div>
                  <div style={styles.userMeta}>{u.email} · {u.role}</div>
                </div>

                {/* Role select */}
                <select
                  style={styles.select}
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  disabled={u.role === "admin"}
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>

                {/* Ban / Unban */}
                <button
                  style={{ ...styles.actionBtn, ...(u.isBanned ? styles.unbanBtn : styles.banBtn) }}
                  onClick={() => handleBan(u._id, !u.isBanned)}
                  disabled={u.role === "admin"}
                >
                  {u.isBanned ? "Unban" : "Ban"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Reports Tab ── */}
        {activeTab === "reports" && (
          <div style={styles.section}>
            {reports.length === 0 && <p style={styles.emptyText}>No reports yet</p>}
            {reports.map((r) => (
              <div key={r._id} style={styles.reportCard}>
                <div style={styles.reportHeader}>
                  <div style={styles.reportMeta}>
                    <span style={styles.reportBy}>
                      <UserAvatar user={r.reportedBy} size={20} />
                      {r.reportedBy?.username} reported
                    </span>
                    <span style={styles.reportedUser}>
                      <UserAvatar user={r.reportedUser} size={20} />
                      {r.reportedUser?.username}
                    </span>
                  </div>
                  {/* Status badge */}
                  <span style={{
                    ...styles.statusBadge,
                    background: r.status === "pending" ? "#fef3c7" : r.status === "reviewed" ? "#d1fae5" : "#f3f4f6",
                    color: r.status === "pending" ? "#92400e" : r.status === "reviewed" ? "#065f46" : "#6b7280",
                  }}>
                    {r.status}
                  </span>
                </div>
                <p style={styles.reportReason}>"{r.reason}"</p>
                {r.status === "pending" && (
                  <div style={styles.reportActions}>
                    <button
                      style={styles.banBtn}
                      onClick={() => handleReportAction(r._id, "reviewed", "banned")}
                    >
                      Ban User
                    </button>
                    <button
                      style={styles.dismissBtn}
                      onClick={() => handleReportAction(r._id, "dismissed", "dismissed")}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Rooms Tab ── */}
        {activeTab === "rooms" && (
          <div style={styles.section}>
            {rooms.map((r) => (
              <div key={r._id} style={styles.roomRow}>
                <i className="ti ti-hash" style={{ fontSize: 16, color: "#9ca3af" }} />
                <div style={styles.roomInfo}>
                  <div style={styles.roomName}>{r.name}</div>
                  <div style={styles.roomMeta}>{r.members?.length || 0} members · Created by {r.createdBy?.username}</div>
                </div>
                <button style={styles.deleteBtn} onClick={() => handleDeleteRoom(r._id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#f4f4f6", padding: "1.5rem 1rem" },
  container: { maxWidth: 720, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4 },
  title: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", display: "flex", alignItems: "center" },
  stats: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.25rem" },
  statCard: { background: "#fff", borderRadius: 12, padding: "14px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  statVal: { fontSize: 24, fontWeight: 700, color: "#1a1a2e" },
  statLabel: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  tabs: { display: "flex", gap: 4, marginBottom: "1rem", background: "#fff", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  tab: { flex: 1, padding: "8px", border: "none", borderRadius: 8, background: "transparent", fontSize: 13, fontWeight: 500, color: "#6b7280", cursor: "pointer" },
  activeTab: { background: "#eeedfe", color: "#534ab7" },
  section: { background: "#fff", borderRadius: 12, padding: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  userRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f4f4f6" },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: 600, color: "#1a1a2e" },
  userMeta: { fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  select: { padding: "5px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, background: "#f9fafb", cursor: "pointer" },
  actionBtn: { padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  banBtn: { background: "#fee2e2", color: "#ef4444", padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  unbanBtn: { background: "#d1fae5", color: "#065f46" },
  dismissBtn: { background: "#f3f4f6", color: "#6b7280", padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  reportCard: { border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px", marginBottom: 10 },
  reportHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  reportMeta: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" },
  reportBy: { display: "flex", alignItems: "center", gap: 4 },
  reportedUser: { display: "flex", alignItems: "center", gap: 4, fontWeight: 600 },
  statusBadge: { fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 },
  reportReason: { fontSize: 13, color: "#6b7280", fontStyle: "italic", marginBottom: 10 },
  reportActions: { display: "flex", gap: 8 },
  deleteBtn: { background: "#fee2e2", color: "#ef4444", padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  roomRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f4f4f6" },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 14, fontWeight: 600, color: "#1a1a2e" },
  roomMeta: { fontSize: 12, color: "#9ca3af" },
  emptyText: { textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "1.5rem 0" },
};

export default AdminPanel;
