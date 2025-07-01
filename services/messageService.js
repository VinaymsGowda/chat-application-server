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
  });
  return messages;
};

const messageService = {
  createMessage,
  getMessagesByChatId,
};

module.exports = { messageService };
