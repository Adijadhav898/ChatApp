// ─── App Routes ───────────────────────────────────────────────────────────────
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import GuestJoin from "./pages/GuestJoin";
import RoomList from "./pages/RoomList";
import ChatRoom from "./pages/ChatRoom";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";

// ── Protected Route - login nahi hai toh login pe bhejo ──────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

// ── Admin Route - sirf admin access kar sakta hai ────────────────────────────
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/rooms" />;
};

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/rooms" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/rooms" /> : <Register />} />
      <Route path="/guest" element={user ? <Navigate to="/rooms" /> : <GuestJoin />} />

      {/* Protected routes */}
      <Route path="/rooms" element={<ProtectedRoute><RoomList /></ProtectedRoute>} />
      <Route path="/rooms/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Admin only */}
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPanel /></AdminRoute></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? "/rooms" : "/login"} />} />
    </Routes>
  );
};

export default App;
