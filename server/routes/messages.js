// ─── Message Routes ───────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Message = require("../models/Message");
const User = require("../models/User");
const { protect, isMod } = require("../middleware/auth");

// ── Cloudinary Config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer + Cloudinary Storage ───────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Image aur audio alag alag folder mein store karo
    const isAudio = file.mimetype.startsWith("audio");
    return {
      folder: isAudio ? "chat-app/audio" : "chat-app/images",
      resource_type: isAudio ? "video" : "image", // cloudinary mein audio = video type
      allowed_formats: isAudio
        ? ["mp3", "wav", "ogg", "webm"]
        : ["jpg", "jpeg", "png", "gif", "webp"],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
});

// ── GET /api/messages/room/:roomId ────────────────────────────────────────────
// Kisi room ke purane messages load karo
router.get("/room/:roomId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId, isPersonal: false })
      .populate("sender", "username profilePic role") // sender ki info
      .populate("mentions", "username") // mentioned users ki info
      .sort({ createdAt: 1 }) // purane pehle
      .limit(50); // last 50 messages

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/messages/personal/:userId ───────────────────────────────────────
// Personal chat ke messages
router.get("/personal/:userId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      isPersonal: true,
      $or: [
        // ya toh main sender hoon aur wo receiver
        { sender: req.user._id, receiver: req.params.userId },
        // ya wo sender hai aur main receiver
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .populate("sender", "username profilePic role")
      .sort({ createdAt: 1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/messages/upload ─────────────────────────────────────────────────
// Image ya audio upload karo Cloudinary pe
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { roomId, receiverId, isPersonal } = req.body;
    const isAudio = req.file.mimetype.startsWith("audio");

    // ── Image permission check ──────────────────────────────────────────────
    // Room mein image sirf Admin/Mod bhej sakte hain
    if (!isAudio && isPersonal !== "true") {
      if (req.user.role !== "admin" && req.user.role !== "moderator") {
        return res.status(403).json({
          message: "Only Admin and Moderator can send images in rooms",
        });
      }
    }

    // ── Message DB mein save karo ───────────────────────────────────────────
    const message = await Message.create({
      sender: req.user._id,
      room: isPersonal === "true" ? null : roomId,
      receiver: isPersonal === "true" ? receiverId : null,
      content: "",
      fileUrl: req.file.path, // cloudinary URL
      fileType: isAudio ? "audio" : "image",
      isPersonal: isPersonal === "true",
    });

    // Populate karke bhejo
    const populated = await message.populate("sender", "username profilePic role");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
