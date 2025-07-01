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
  console.log("a user connected", socket.id);

  // personal room for sending notifications pushing new chats
  socket.on("user-room", (userId) => {
    socket.join(userId);
  });

  socket.on("join-chat-room", (chatId) => {
    socket.join(chatId);
  });

  socket.on("new-message", (chatId, newMessage) => {
    console.log("Message received");

    socket.in(chatId).emit("message-received", newMessage);
  });

  socket.on("new-chat", (newChat) => {
    const chatUsers = newChat.users;
    console.log("Chat users ", chatUsers);

    if (Array.isArray(chatUsers)) {
      for (let i = 0; i < chatUsers.length; i++) {
        const userRoomId = chatUsers[i].id;

        socket.in(userRoomId).emit("new-chat-received", newChat);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
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
