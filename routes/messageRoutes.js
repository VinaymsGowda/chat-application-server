const express = require("express");
const { messageController } = require("../controllers/messageController");
const router = express.Router();

router.post("/send-message", messageController.sendMessage);
router.get("/:chatId", messageController.getMessagesByChatId);

module.exports = router;
