// ─── User Model ──────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────────────────────
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // ── Profile ─────────────────────────────────────────────────────────────
    bio: {
      type: String,
      default: "",
      maxlength: 150, // bio 150 characters tak
    },
    profilePic: {
      type: String,
      default: "", // cloudinary URL yahan store hoga
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    // ── Role ────────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["guest", "user", "moderator", "admin"],
      default: "user",
    },

    // ── Status ──────────────────────────────────────────────────────────────
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    showLastSeen: {
      type: Boolean,
      default: true, // user on/off kar sakta hai settings mein
    },

    // ── Block List ──────────────────────────────────────────────────────────
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── Ban ─────────────────────────────────────────────────────────────────
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    bannedAt: {
      type: Date,
      default: null,
    },

    // ── Notifications ───────────────────────────────────────────────────────
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt auto add hoga
  }
);

module.exports = mongoose.model("User", userSchema);
