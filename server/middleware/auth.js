// ─── Auth Middleware ──────────────────────────────────────────────────────────
// Yeh middleware har protected route pe lagega
// JWT token verify karega aur user ko request mein attach karega

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Authorization header se token nikalo (Bearer token format)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; // "Bearer <token>" se token nikalo
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User DB se nikalo (password chhod ke)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Banned user ko block karo
    if (req.user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    next(); // sab theek hai, aage jao
  } catch (error) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

// ─── Role Check Middleware ────────────────────────────────────────────────────
// Usage: router.delete("/room/:id", protect, isAdmin, deleteRoom)

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

const isMod = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "moderator")) {
    next();
  } else {
    res.status(403).json({ message: "Moderator access required" });
  }
};

module.exports = { protect, isAdmin, isMod };
