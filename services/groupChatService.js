const { Op } = require("sequelize");
const Chat = require("../models/Chat");
const ChatUsers = require("../models/ChatUsers");
const User = require("../models/User");
const userService = require("./userService");

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

const leaveGroupChat = async (userId, chatId) => {
  const totalUsers = await ChatUsers.findAll({
    where: {
      chatId: chatId,
    },
    raw: true,
  });

  if (totalUsers.length === 1) {
    await Chat.destroy({
      where: {
        id: chatId,
      },
    });
    await ChatUsers.destroy({
      where: {
        chatId: chatId,
      },
    });
    return;
  }
  const chatDetails = await Chat.findByPk(chatId, {
    raw: true,
  });

  if (chatDetails.isGroupChat && chatDetails.groupAdminId === userId) {
    // transfer adminship to another user
    const newAdmin = await ChatUsers.findOne({
      where: {
        chatId: chatId,
      },
      limit: 1,
      order: [["createdAt", "ASC"]],
      raw: true,
    });

    if (newAdmin) {
      await Chat.update(
        {
          groupAdminId: newAdmin.userId,
        },
        {
          where: {
            id: chatId,
          },
        }
      );
    }
  }
  await ChatUsers.destroy({
    where: {
      userId: userId,
      chatId: chatId,
    },
  });
};

const getUsersListToAddInGroupChat = async (chatId) => {
  const groupChatMembers = await ChatUsers.findAll({
    where: {
      chatId: chatId,
    },
    attributes: ["userId"],
    raw: true,
  });

  const groupMemberIds = new Set(
    groupChatMembers.map((member) => member.userId)
  );

  const users = await User.findAll({
    order: [["name", "asc"]], // Sort by name in ascending order
    raw: true,
  });

  let usersList = [];

  for (let i = 0; i < users.length; i++) {
    let user = users[i];
    let isPresentInGroup = groupMemberIds.has(user.id);
    usersList.push({
      ...user,
      isPresentInGroup,
    });
  }
  return usersList;
};

const addUsersToGroupChat = async (chatId, userIds) => {
  const newGroupUsers = [];
  for (let i = 0; i < userIds.length; i++) {
    const groupUser = await ChatUsers.create(
      {
        userId: userIds[i],
        chatId: chatId,
      },
      {
        raw: true,
      }
    );
    newGroupUsers.push(groupUser);
  }
  return newGroupUsers;
};

const removeUserFromGroup = async (chatId, userId) => {
  await ChatUsers.destroy({
    where: {
      chatId: chatId,
      userId: userId,
    },
  });
};

const groupChatService = {
  createGroupChat,
  leaveGroupChat,
  getUsersListToAddInGroupChat,
  addUsersToGroupChat,
  removeUserFromGroup,
};

module.exports = { groupChatService };
