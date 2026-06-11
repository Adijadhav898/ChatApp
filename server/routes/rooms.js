// ─── Room Routes ─────────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const { protect, isAdmin } = require("../middleware/auth");

// ── GET /api/rooms ────────────────────────────────────────────────────────────
// Saare rooms ki list
router.get("/", protect, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("createdBy", "username role") // creator ki info bhi chahiye
      .populate("members", "username profilePic isOnline role"); // members ki info
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/rooms ───────────────────────────────────────────────────────────
// Naya room banao - sirf admin kar sakta hai
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Room name required" });
    }

    // Check karo same name ka room already hai toh nahi
    const exists = await Room.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Room name already taken" });
    }

    const room = await Room.create({
      name,
      description: description || "",
      createdBy: req.user._id,
      members: [req.user._id], // creator automatically member banta hai
      isPrivate: isPrivate || false,
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── POST /api/rooms/:id/join ──────────────────────────────────────────────────
// Room join karo
router.post("/:id/join", protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Already member hai toh dobara add mat karo
    if (room.members.includes(req.user._id)) {
      return res.json({ message: "Already a member", room });
    }

    room.members.push(req.user._id);
    await room.save();

    res.json({ message: "Joined successfully", room });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/rooms/:id/leave ─────────────────────────────────────────────────
// Room leave karo
router.post("/:id/leave", protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.members = room.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    await room.save();

    res.json({ message: "Left room successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/rooms/:id ─────────────────────────────────────────────────────
// Room delete karo - sirf admin
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    await room.deleteOne();
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
