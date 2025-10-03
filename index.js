const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

dotenv.config();

const { authRouter } = require("./routes/authRoutes");
const { userRouter } = require("./routes/userRouter");
const admin = require("./config/firebase/firebase.config");
const chatRouter = require("./routes/chatRoutes");
const messageRouter = require("./routes/messageRoutes");
const sequelize = require("./config/database");
const { verifyToken } = require("./middleware/auth.middleware");
const app = express();
const server = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL;

const io = new Server(server, {
  transports: ["polling", "websocket"],
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // personal room for sending notifications pushing new chats
  socket.on("user-room", (userId) => {
    socket.join(userId);
  });

  socket.on("join-chat-room", (chatId) => {
    socket.join(chatId);
  });

  socket.on("new-message", (chatId, newMessage) => {
    socket.in(chatId).emit("message-received", newMessage);
  });

  socket.on("user-removed-from-group", (removedUserId, chatId) => {
    // Notify the removed user
    socket.to(removedUserId).emit("removed-from-group", chatId);
  });

  // caller forward offer to callee
  socket.on("initiate-call", (chat, type, offer, caller) => {
    const chatUsers = chat.users;

    if (Array.isArray(chatUsers)) {
      for (let i = 0; i < chatUsers.length; i++) {
        const userRoomId = chatUsers[i].id;
        socket
          .in(userRoomId)
          .emit("incoming-call", type, { from: caller, offer: offer });
      }
    }
  });

  socket.on("send-answer", (data) => {
    socket.in(data.to).emit("call-answered", {
      from: data.callee,
      offer: data.offer,
    });
  });

  socket.on("ice-candidate", (data) => {
    if (data?.to && data?.candidate) {
      socket.in(data?.to?.id).emit("found-ice-candidate", {
        from: data.from,
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex,
      });
    }
  });

  socket.on("new-chat", (chatUsers) => {
    if (Array.isArray(chatUsers)) {
      for (let i = 0; i < chatUsers.length; i++) {
        const userRoomId = chatUsers[i].id;
        socket.in(userRoomId).emit("new-chat-received");
      }
    }
  });

  socket.on("user-busy-event", (data) => {
    if (data.to) {
      socket.in(data.to.id).emit("user-busy");
    }
  });

  // Handle media control changes (camera, microphone, screen share)
  socket.on("media-control-change", (data) => {
    if (data.to) {
      socket.in(data.to.id || data.to).emit("media-control-change", {
        controlType: data.controlType,
        enabled: data.enabled,
        from: socket.id,
      });
    }
  });

  // Handle call termination
  socket.on("call-ended", (data) => {
    if (data.to) {
      socket.in(data.to.id || data.to).emit("call-ended", {
        from: socket.id,
        reason: "ended_by_participant",
      });
    }
  });

  // Handle call timeout - forward to callee
  socket.on("call-timeout", (data) => {
    if (data.to) {
      socket.in(data.to.id).emit("call-timeout", {
        from: socket.id,
        reason: "no_answer",
      });
    }
  });

  socket.on("disconnect", () => {
    // Notify all rooms that this user was in about the disconnection
    // This will handle cases where user closes browser/app during a call
    socket.broadcast.emit("participant-disconnected", {
      userId: socket.id,
      reason: "disconnected",
    });
  });
});

app.use(express.json());

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

const PORT = process.env.PORT || 3000;

app.get("/test", (req, res) => {
  res.send("Hello World");
});

app.use("/api/auth", authRouter);
app.use(verifyToken);
app.use("/api/users", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
