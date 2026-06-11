// ─── Report Model ────────────────────────────────────────────────────────────
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // ── Kaun report kar raha hai ─────────────────────────────────────────────
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Kise report kiya ─────────────────────────────────────────────────────
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Reason ──────────────────────────────────────────────────────────────
    reason: {
      type: String,
      required: true,
      maxlength: 300,
    },

    // ── Status ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending", // admin ne dekha nahi hai abhi
    },

    // ── Admin Action ────────────────────────────────────────────────────────
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actionTaken: {
      type: String,
      default: "", // "banned", "warned", "dismissed"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);
