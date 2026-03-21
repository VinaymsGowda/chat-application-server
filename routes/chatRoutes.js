const express = require("express");
const { ChatController } = require("../controllers/chatController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { validateBody } = require("../middleware/validate");
const { createGroupChatSchema, updateGroupChatSchema, addUsersToGroupSchema } = require("../validators/schemas");
const chatRouter = express.Router();

chatRouter.get("/", ChatController.getChats);
chatRouter.post(
  "/group-chat",
  upload.single("groupProfile"),
  validateBody(createGroupChatSchema),
  ChatController.createGroupChat
);
chatRouter.get(
  "/group-chat/new-users-list/:chatId",
  ChatController.getNewUsersListForGroupChat
);
chatRouter.post(
  "/group-chat/add-users/:chatId",
  validateBody(addUsersToGroupSchema),
  ChatController.addUsersToGroupChat
);
chatRouter.delete(
  "/group-chat/remove-user/:chatId/:userId",
  ChatController.removeUserFromGroup
);
chatRouter.patch(
  "/group-chat/:chatId",
  upload.single("groupProfile"),
  validateBody(updateGroupChatSchema),
  ChatController.updateGroupDetails
);
chatRouter.get("/user/:userId", ChatController.accessUserChat);
chatRouter.delete("/group-chat/:chatId", ChatController.leaveGroupChat);
chatRouter.get("/:chatId", ChatController.getChatInfo);
module.exports = chatRouter;
