// ─── Message Model ───────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // ── Sender ──────────────────────────────────────────────────────────────
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Room ya Personal Chat ────────────────────────────────────────────────
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null, // room message ke liye
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // personal message ke liye
    },

    // ── Content ─────────────────────────────────────────────────────────────
    content: {
      type: String,
      default: "", // text message
    },
    fileUrl: {
      type: String,
      default: "", // cloudinary pe upload ki gayi image/audio ka URL
    },
    fileType: {
      type: String,
      enum: ["text", "image", "audio"],
      default: "text",
    },

    // ── Mentions ────────────────────────────────────────────────────────────
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // jinhe @mention kiya hai unke IDs
      },
    ],

    // ── Message Type ────────────────────────────────────────────────────────
    isPersonal: {
      type: Boolean,
      default: false, // true = personal chat, false = room chat
    },
  },
  {
    timestamps: true, // createdAt se message ka time pata chalega
  }
);

module.exports = mongoose.model("Message", messageSchema);
