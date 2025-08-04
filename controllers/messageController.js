const ChatUsers = require("../models/ChatUsers");
const { ChatService } = require("../services/chatService");
const { messageService } = require("../services/messageService");
const { uploadFileToS3 } = require("../services/s3UploadHelper");
const { generateUniqueFileName } = require("../utils/helper");

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const data = JSON.parse(req.body.data);

    const { content, caption, receiverId, type } = data;

    let chatId = data.chatId;

    if (!chatId) {
      if (!receiverId) {
        return res.status(400).json({
          message: "receiverId is required when chatId is not provided.",
        });
      }
      const chat = await ChatService.createChat(senderId, receiverId);

      chatId = chat.id;
    } else {
      // Validate user is part of the chat
      const isMember = await ChatUsers.findOne({
        where: {
          chatId: chatId,
          userId: senderId,
        },
        raw: true,
      });

      if (!isMember) {
        return res.status(403).json({
          message: "You are not a member of this chat",
        });
      }
    }
    const messageBody = {
      senderId,
      chatId,
      content,
      type,
      caption,
    };

    if (req.file) {
      const imageOriginalName = req.file.originalname;

      const result = await uploadFileToS3(
        imageOriginalName,
        req.file.buffer,
        req.file.mimetype
      );
      if (!result) {
        return res.status(400).json({
          message: "Failed to upload image to S3",
        });
      }

      messageBody.imageOriginalName = imageOriginalName;
      messageBody.imagePath = result;
    }
    const message = await messageService.createMessage(messageBody);

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      error: error.message,
      message: "Failed to send message",
    });
  }
};

const getMessagesByChatId = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    if (!chatId) {
      return res.status(400).json({
        message: "Chat id parameter is required",
      });
    }
    const messages = await messageService.getMessagesByChatId(chatId);

    res.status(200).json({
      message: "Chat found",
      messages: messages,
    });
  } catch (error) {
    res.status(500).json({
      error: error?.message || "Internal Server Error",
    });
  }
};
const messageController = {
  sendMessage,
  getMessagesByChatId,
};

module.exports = { messageController };
