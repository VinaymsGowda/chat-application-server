const Chat = require("../models/Chat");
const ChatUsers = require("../models/ChatUsers");

const createGroupChat = async (newChatBody, userIds) => {
  const newChat = await Chat.create(newChatBody, {
    raw: true,
  });

  for (let i = 0; i < userIds.length; i++) {
    await ChatUsers.create({
      userId: userIds[i],
      chatId: newChat.id,
    });
  }
  return newChat;
};

const groupChatService = {
  createGroupChat,
};

module.exports = { groupChatService };
