// ─── Main Entry Point ───────────────────────────────────────────────────────
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors"); // Ye module pehle se imported hai
const dotenv = require("dotenv");

// env variables load karo
dotenv.config();

const app = express();
const server = http.createServer(app); // socket.io ke liye http server chahiye

// ─── CORS Middleware Setup (Master Fix) ──────────────────────────────────────
// Custom header function ko hata kar bas ye ek line likhein. 
// Isko baki saare routes aur express.json() se upar rakhna zaroori hai.
app.use(cors({
  origin: "*", // Testing ke liye sab kuch allow karega bina kisi dikkat ke
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
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