const express = require("express");
const { ChatController } = require("../controllers/chatController");
const chatRouter = express.Router();

chatRouter.get("/", ChatController.getChats);
chatRouter.post("/group-chat", ChatController.createGroupChat);
chatRouter.get(
  "/group-chat/new-users-list/:chatId",
  ChatController.getNewUsersListForGroupChat
);
chatRouter.post(
  "/group-chat/add-users/:chatId",
  ChatController.addUsersToGroupChat
);
chatRouter.delete(
  "/group-chat/remove-user/:chatId/:userId",
  ChatController.removeUserFromGroup
);
chatRouter.get("/:userId", ChatController.accessUserChat);
chatRouter.delete("/group-chat/:chatId", ChatController.leaveGroupChat);
module.exports = chatRouter;
