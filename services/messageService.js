const { DataTypes } = require("sequelize");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const { getUTCDate } = require("../utils/helper");

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
    }
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

const messageService = {
  createMessage,
  getMessagesByChatId,
  getLatestMessageOfChat,
};

module.exports = { messageService };
