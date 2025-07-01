const express = require("express");
const { ChatController } = require("../controllers/chatController");
const chatRouter = express.Router();

chatRouter.get("/", ChatController.getChats);
chatRouter.post("/group-chat", ChatController.createGroupChat);
chatRouter.get("/:userId", ChatController.accessUserChat);

module.exports = chatRouter;
