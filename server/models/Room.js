// ─── Room Model ──────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────────────────────
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    description: {
      type: String,
      default: "",
      maxlength: 100,
    },

    // ── Creator ─────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // sirf admin create kar sakta hai
    },

    // ── Members ─────────────────────────────────────────────────────────────
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── Settings ────────────────────────────────────────────────────────────
    isPrivate: {
      type: Boolean,
      default: false, // private room mein sirf invited users join kar sakte hain
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);
