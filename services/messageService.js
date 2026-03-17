const { DataTypes } = require("sequelize");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

const createMessage = async (messageData) => {
  const message = await Message.create(messageData, {
    raw: true,
  });

  await Chat.update(
    {
      updatedAt: DataTypes.NOW,
    },
    {
      where: {
        id: messageData.chatId,
      },
    },
  );
  return message;
};

const getMessagesByChatId = async (chatId) => {
  const messages = await Message.findAll({
    where: { chatId },
    raw: true,
    order: [["createdAt", "asc"]],
  });
  return messages;
};

const getLatestMessageOfChat = async (chatId) => {
  const latestMessage = await Message.findOne({
    where: { chatId: chatId },
    order: [["createdAt", "desc"]],
    limit: 1,
  });

  return latestMessage;
};

const getLatestMessages = async (chatId) => {
  try {
    const messages = await Message.findAll({
      where: {
        chatId: chatId,
      },
      order: [["createdAt", "desc"]],
      limit: 10,
      include: {
        as: "sender",
        model: User,
        attributes: ["id", "name", "email"],
        association: "",
      },
    });
    return messages.reverse();
  } catch (error) {
    console.error("Error fetching latest messages:", error);
    throw error;
  }
};

const messageService = {
  createMessage,
  getMessagesByChatId,
  getLatestMessageOfChat,
  getLatestMessages,
};

module.exports = { messageService };
