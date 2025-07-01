const ChatUsers = require("../models/ChatUsers");
const { ChatService } = require("../services/chatService");
const { messageService } = require("../services/messageService");

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { content, type, caption, receiverId } = req.body;
    let chatId = req.body.chatId;

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

    const message = await messageService.createMessage({
      senderId,
      chatId,
      content,
      type,
      caption,
    });

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
