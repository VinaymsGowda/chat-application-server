const express = require("express");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { messageController } = require("../controllers/messageController");
const router = express.Router();

router.post(
  "/send-message",
  upload.single("file"),
  messageController.sendMessage
);
router.get("/:chatId", messageController.getMessagesByChatId);

module.exports = router;
