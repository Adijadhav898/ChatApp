// ─── User Routes ─────────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Report = require("../models/Report");
const { protect, isAdmin } = require("../middleware/auth");

// ── Cloudinary Config for Profile Pics ───────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pfpStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat-app/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 200, height: 200, crop: "fill" }], // square crop
  },
});
const upload = multer({ storage: pfpStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── GET /api/users ────────────────────────────────────────────────────────────
// Saare users ki list (admin ke liye)
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/users/:id ────────────────────────────────────────────────────────
// Kisi bhi user ki public profile
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -blockedUsers -email"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/users/settings ───────────────────────────────────────────────────
// Settings update karo (bio, username, last seen, notifications, password)
router.put("/settings", protect, async (req, res) => {
  try {
    const { bio, username, showLastSeen, notificationsEnabled, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Bio update
    if (bio !== undefined) user.bio = bio;

    // Username update
    if (username && username !== user.username) {
      const taken = await User.findOne({ username });
      if (taken) return res.status(400).json({ message: "Username already taken" });
      user.username = username;
    }

    // Last seen toggle
    if (showLastSeen !== undefined) user.showLastSeen = showLastSeen;

    // Notifications toggle
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;

    // Password change
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: "Current password is wrong" });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({ message: "Settings updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/users/upload-pfp ────────────────────────────────────────────────
// Profile picture upload karo
router.post("/upload-pfp", protect, upload.single("pfp"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.path },
      { new: true }
    ).select("-password");

    res.json({ profilePic: user.profilePic });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/users/block/:id ─────────────────────────────────────────────────
// Kisi user ko block karo
router.post("/block/:id", protect, async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    const user = await User.findById(req.user._id);

    // Already blocked hai toh skip karo
    if (user.blockedUsers.includes(targetId)) {
      return res.json({ message: "Already blocked" });
    }

    user.blockedUsers.push(targetId);
    await user.save();

    res.json({ message: "User blocked" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/users/unblock/:id ───────────────────────────────────────────────
// Block hatao
router.post("/unblock/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== req.params.id
    );
    await user.save();
    res.json({ message: "User unblocked" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/users/report ────────────────────────────────────────────────────
// Kisi ko report karo - admin ke paas jayega
router.post("/report", protect, async (req, res) => {
  try {
    const { reportedUserId, reason } = req.body;

    if (!reason) return res.status(400).json({ message: "Reason required" });

    const report = await Report.create({
      reportedBy: req.user._id,
      reportedUser: reportedUserId,
      reason,
    });

    res.status(201).json({ message: "Report submitted", report });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/users/role/:id ───────────────────────────────────────────────────
// Role change karo - sirf admin
router.put("/role/:id", protect, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "moderator", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    res.json({ message: "Role updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/users/ban/:id ────────────────────────────────────────────────────
// Ban/unban user - sirf admin
router.put("/ban/:id", protect, isAdmin, async (req, res) => {
  try {
    const { ban } = req.body; // true = ban, false = unban

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isBanned: ban,
        bannedBy: ban ? req.user._id : null,
        bannedAt: ban ? Date.now() : null,
      },
      { new: true }
    ).select("-password");

    res.json({ message: ban ? "User banned" : "User unbanned", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/users/reports/all ────────────────────────────────────────────────
// Saare reports dekho - sirf admin
router.get("/reports/all", protect, isAdmin, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reportedBy", "username profilePic")
      .populate("reportedUser", "username profilePic role")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/users/reports/:id ────────────────────────────────────────────────
// Report ka status update karo - sirf admin
router.put("/reports/:id", protect, isAdmin, async (req, res) => {
  try {
    const { status, actionTaken } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, actionTaken, reviewedBy: req.user._id },
      { new: true }
    );

    res.json({ message: "Report updated", report });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
