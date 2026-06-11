// ─── Auth Routes ─────────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// ── Helper: JWT token generate karo ─────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d", // 7 din mein expire hoga
  });
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Naya user register karo
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, gender } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // Check karo ki user already exists toh nahi
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: "Username or email already taken" });
    }

    // Password hash karo (never store plain password!)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Pehla user automatically admin banega
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    // User create karo
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      gender: gender || "other",
      role,
    });

    // Token generate karo aur send karo
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Existing user login karo
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // User dhundho
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Banned check
    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    // Password check karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Online status update karo
    user.isOnline = true;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      bio: user.bio,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── POST /api/auth/guest ──────────────────────────────────────────────────────
// Guest user join karo (no registration needed)
router.post("/guest", async (req, res) => {
  try {
    const { username, gender } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username required" });
    }

    // Guest username unique banana ke liye random number add karo
    const guestUsername = `${username}_${Math.floor(Math.random() * 9000) + 1000}`;

    // Check karo username already nahi hona chahiye
    const exists = await User.findOne({ username: guestUsername });
    if (exists) {
      return res.status(400).json({ message: "Try again" });
    }

    // Guest user create karo (temporary - random password)
    const randomPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    const guest = await User.create({
      username: guestUsername,
      email: `guest_${Date.now()}@temp.com`, // fake email
      password: hashedPassword,
      gender: gender || "other",
      role: "guest",
    });

    res.status(201).json({
      _id: guest._id,
      username: guest.username,
      role: guest.role,
      token: generateToken(guest._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Current logged in user ki info nikalo
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// Logout - online status false karo
router.post("/logout", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: Date.now(),
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
