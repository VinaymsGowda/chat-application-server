const ChatUsers = require("../models/ChatUsers");
const { ChatService } = require("../services/chatService");
const { messageService } = require("../services/messageService");
const { uploadFileToS3 } = require("../services/s3Helper");
const userService = require("../services/userService");
const { geminiService } = require("../services/ai/geminiService");
const { getIo } = require("../utils/socket");

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    let data = {};
    try {
      data = JSON.parse(req.body.data);
    } catch (error) {
      console.log("Error parsing data", error);

      return res.status(400).json({
        message: "Invalid JSON in data field",
      });
    }

    const { content, caption, receiverId, type } = data;

    let chatId = data.chatId;
    let chatDetails;
    if (!chatId) {
      if (!receiverId) {
        return res.status(400).json({
          message: "receiverId is required when chatId is not provided.",
        });
      }
      const receiverDetails = await userService.getUserById(receiverId);
      if (!receiverDetails) {
        return res.status(404).json({
          message: "Invalid Receiver not found",
        });
      }
      let newChat = await ChatService.createChat(
        senderId,
        receiverId,
        receiverDetails,
      );
      chatId = newChat.id;
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
        req.file.mimetype,
        "attachments",
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

    // Respond to client immediately so HTTP is not blocked
    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
    chatDetails = await ChatService.getChatById(chatId);

    // Fire-and-forget: stream AI response after responding to client
    if (chatDetails.chat.chatType === "AI") {
      _streamAiResponse(chatDetails, chatId, content, senderId).catch((err) =>
        console.error("AI stream error:", err),
      );
    }
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      error: error.message,
      message: "Failed to send message",
    });
  }
};

/**
 * Streams an AI response for the given chat using the same generalized
 * 'typing' / 'stop-typing' socket events used for human users.
 */
async function _streamAiResponse(chatDetails, chatId, userContent, senderId) {
  // Find the AI user inside this chat's participant list
  const chatUsers = chatDetails.users || [];
  const aiUser = chatUsers.find((u) => u.id !== senderId);

  if (!aiUser) {
    console.error("Could not find AI user in chat participants");
    return;
  }

  // Emit the same generalized 'typing' event — client treats it uniformly
  const io = getIo();
  io.to(chatId).emit("typing", { chatId, user: aiUser });

  try {
    const conversationHistory = await messageService.getLatestMessages(chatId);
    const prompt = await geminiService.buildPromptFromConversationHistory(
      conversationHistory,
      userContent,
    );

    const fullText = await geminiService.streamGeminiResponse(
      prompt,
      (chunk) => {
        io.to(chatId).emit("ai-message-chunk", { chatId, chunk });
      },
    );

    // Stop typing indicator
    io.to(chatId).emit("stop-typing", { chatId, user: aiUser });

    // Persist the final AI message to DB
    const aiMessage = await messageService.createMessage({
      senderId: aiUser.id,
      chatId,
      content: fullText,
      type: "text",
    });

    // Emit the saved message so client can finalise the streaming bubble
    io.to(chatId).emit("message-received", aiMessage);
  } catch (error) {
    console.error("Error during AI streaming:", error);
    
    // Stop typing indicator
    const io = getIo();
    io.to(chatId).emit("stop-typing", { chatId, user: aiUser });

    // Handle user-friendly error message
    let errorMessage = "I encountered an error while processing your request. Please try again later.";
    if (error.status === 429) {
      errorMessage = "I've reached my usage limit for now. Please wait a moment before sending another message.";
    } else if (error.message && error.message.includes("quota")) {
      errorMessage = "My context quota has been exceeded. Please try a shorter message or wait a while.";
    }

    try {
      // Persist error as AI message so it's visible in history
      const aiErrorMessage = await messageService.createMessage({
        senderId: aiUser.id,
        chatId,
        content: `*${errorMessage}*`, // Italicized for distinction
        type: "text",
      });

      // Emit error message to client
      io.to(chatId).emit("message-received", aiErrorMessage);
    } catch (dbError) {
      console.error("Failed to log AI error to database:", dbError);
    }
  }
}

const getMessagesByChatId = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    if (!chatId) {
      return res.status(400).json({
        message: "Chat id parameter is required",
      });
    }
    const messages = await messageService.getMessagesByChatId(chatId);
    const { chat, users } = await ChatService.getChatById(chatId);

    const chatInfo = {
      ...chat,
      users: users,
    };

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    res.status(200).json({
      message: "Chat found",
      chat: chatInfo,
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
