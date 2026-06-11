// ─── Main Entry Point ───────────────────────────────────────────────────────
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// env variables load karo
dotenv.config();

const app = express();
const server = http.createServer(app); // socket.io ke liye http server chahiye

// ─── CORS Middleware Setup (Official Package) ───────────────────────────────
// Isko sabhi routes aur express.json() se upar rakhna zaroori hai.
// Ye browser ke pre-flight OPTIONS request ko automatic handle kar lega.
app.use(cors({
  origin: "*", // Testing ke liye har jagah se allow karega bina kisi dikkat ke
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ─── Socket.io Setup (Forced Polling Mode) ───────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["polling"], // Render free tier pe connection drop hone se bachaega
  allowEIO3: true          // Backward compatibility ke liye safe hai
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");

// Health check route - server ko jaagta rakhne ke liye
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);       // /api/auth/login, /api/auth/register
app.use("/api/rooms", roomRoutes);      // /api/rooms
app.use("/api/messages", messageRoutes); // /api/messages
app.use("/api/users", userRoutes);      // /api/users

// ─── Socket Handler ───────────────────────────────────────────────────────────
const socketHandler = require("./socket/socketHandler");
socketHandler(io); // socket events yahan handle honge

// ─── MongoDB Connect + Server Start ──────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected!");
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.log("MongoDB connection error:", err));

// io ko export karo taaki routes mein bhi use kar sake
module.exports = { io };