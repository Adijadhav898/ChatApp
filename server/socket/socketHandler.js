// ─── Socket Handler ───────────────────────────────────────────────────────────
// Yahan saare real-time events handle honge
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

// Online users track karne ke liye (userId -> socketId)
const onlineUsers = new Map();

const socketHandler = (io) => {
  // ── Socket Auth Middleware ──────────────────────────────────────────────────
  // Har socket connection pe JWT verify karo
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user || user.isBanned) return next(new Error("Unauthorized"));

      socket.user = user; // user ko socket pe attach karo
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // ── User online mark karo ─────────────────────────────────────────────
    onlineUsers.set(socket.user._id.toString(), socket.id);
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

    // Saare users ko batao ki yeh user online aaya
    io.emit("user:online", { userId: socket.user._id, username: socket.user.username });

    // ── Room Join ─────────────────────────────────────────────────────────
    socket.on("room:join", async (roomId) => {
      socket.join(roomId); // socket.io room mein join karo

      // Room ke baaki users ko batao
      socket.to(roomId).emit("room:userJoined", {
        userId: socket.user._id,
        username: socket.user.username,
        role: socket.user.role,
        profilePic: socket.user.profilePic,
      });

      console.log(`${socket.user.username} joined room: ${roomId}`);
    });

    // ── Room Leave ────────────────────────────────────────────────────────
    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("room:userLeft", {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });

    // ── Room Message Send ─────────────────────────────────────────────────
    socket.on("message:send", async (data) => {
      try {
        const { roomId, content, mentions } = data;

        // Block check - agar koi sender ko block kiya hai
        // (sirf personal mein check hota hai, room mein sab dikhta hai)

        // ── @mention extract karo ──────────────────────────────────────────
        // "Hey @Rahul aur @Priya" se ["Rahul", "Priya"] nikalo
        const mentionRegex = /@(\w+)/g;
        const mentionedUsernames = [];
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
          mentionedUsernames.push(match[1]);
        }

        // Username se user IDs dhundho
        const mentionedUsers = await User.find({
          username: { $in: mentionedUsernames },
        }).select("_id username");

        const mentionIds = mentionedUsers.map((u) => u._id);

        // ── Message DB mein save karo ──────────────────────────────────────
        const message = await Message.create({
          sender: socket.user._id,
          room: roomId,
          content,
          mentions: mentionIds,
          fileType: "text",
          isPersonal: false,
        });

        // Populate karke bhejo
        const populated = await Message.findById(message._id)
          .populate("sender", "username profilePic role")
          .populate("mentions", "username _id");

        // ── Saare room members ko message bhejo ────────────────────────────
        io.to(roomId).emit("message:receive", populated);

        // ── Mentioned users ko notification bhejo ─────────────────────────
        mentionedUsers.forEach((mentionedUser) => {
          const mentionedSocketId = onlineUsers.get(mentionedUser._id.toString());
          if (mentionedSocketId) {
            io.to(mentionedSocketId).emit("mention:notification", {
              from: socket.user.username,
              roomId,
              message: content,
            });
          }
        });
      } catch (err) {
        console.error("Message send error:", err);
        socket.emit("error", "Failed to send message");
      }
    });

    // ── Typing Indicator ──────────────────────────────────────────────────
    socket.on("typing:start", (roomId) => {
      // Sirf room ke baaki users ko batao (apne aap ko nahi)
      socket.to(roomId).emit("typing:update", {
        userId: socket.user._id,
        username: socket.user.username,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (roomId) => {
      socket.to(roomId).emit("typing:update", {
        userId: socket.user._id,
        username: socket.user.username,
        isTyping: false,
      });
    });

    // ── Personal Message ──────────────────────────────────────────────────
    socket.on("personal:send", async (data) => {
      try {
        const { receiverId, content } = data;

        // ── Block check ────────────────────────────────────────────────────
        const receiver = await User.findById(receiverId);
        if (!receiver) return socket.emit("error", "User not found");

        // Agar receiver ne sender ko block kiya hai
        if (receiver.blockedUsers.includes(socket.user._id)) {
          return socket.emit("error", "Cannot send message to this user");
        }

        // ── Guest restriction ──────────────────────────────────────────────
        // Guest sirf Guest ko message kar sakta hai
        if (socket.user.role === "guest" && receiver.role !== "guest") {
          return socket.emit("error", "Guests can only message other guests");
        }

        // ── Message save karo ──────────────────────────────────────────────
        const message = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          content,
          fileType: "text",
          isPersonal: true,
        });

        const populated = await Message.findById(message._id).populate(
          "sender",
          "username profilePic role"
        );

        // Sender ko bhi aur receiver ko bhi message bhejo
        socket.emit("personal:receive", populated); // sender ka screen
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("personal:receive", populated); // receiver ka screen
        }
      } catch (err) {
        socket.emit("error", "Failed to send personal message");
      }
    });

    // ── Kick User (Mod/Admin) ─────────────────────────────────────────────
    socket.on("user:kick", async (data) => {
      try {
        const { userId, roomId } = data;

        // Permission check
        if (socket.user.role !== "admin" && socket.user.role !== "moderator") {
          return socket.emit("error", "No permission");
        }

        // Kicked user ka socket dhundho
        const kickedSocketId = onlineUsers.get(userId);
        if (kickedSocketId) {
          // Use ko room se nikalo
          io.to(kickedSocketId).emit("kicked", { roomId, by: socket.user.username });
          const kickedSocket = io.sockets.sockets.get(kickedSocketId);
          if (kickedSocket) kickedSocket.leave(roomId);
        }

        // Room ke baaki users ko batao
        io.to(roomId).emit("room:userKicked", {
          userId,
          by: socket.user.username,
        });
      } catch (err) {
        socket.emit("error", "Failed to kick user");
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.user.username}`);

      // Online users map se hatao
      onlineUsers.delete(socket.user._id.toString());

      // DB update karo
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: Date.now(),
      });

      // Saare users ko batao
      io.emit("user:offline", {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });
  });
};

module.exports = socketHandler;
