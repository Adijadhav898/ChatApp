// ─── Auth Context ─────────────────────────────────────────────────────────────
// User login/logout state poori app mein share karne ke liye
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);           // logged in user
  const [loading, setLoading] = useState(true);     // initial load check

  // ── App start pe check karo ki token hai toh nahi ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Axios ke har request mein token automatically lagao
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (username, email, password, gender) => {
    const { data } = await axios.post("/api/auth/register", {
      username, email, password, gender,
    });
    saveUser(data);
    return data;
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await axios.post("/api/auth/login", { email, password });
    saveUser(data);
    return data;
  };

  // ── Guest Login ───────────────────────────────────────────────────────────
  const guestLogin = async (username, gender) => {
    const { data } = await axios.post("/api/auth/guest", { username, gender });
    saveUser(data);
    return data;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  // ── Helper: user save karo localStorage mein ──────────────────────────────
  const saveUser = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data);
  };

  // ── Profile update (settings page se) ────────────────────────────────────
  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, guestLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook - easy use ke liye
export const useAuth = () => useContext(AuthContext);
