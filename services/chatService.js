const { QueryTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const Chat = require("../models/Chat");
const ChatUsers = require("../models/ChatUsers");
const { Op } = require("sequelize");
const Message = require("../models/Message");

const getSelfChat = async (userId) => {
  const query = `
    SELECT U.name as "userName", U.profile_url as "userProfile", 
           C.id as "id", U.id as "userId" 
    FROM chat_users CU 
    INNER JOIN chats C ON C.id = CU.chat_id
    INNER JOIN users U ON U.id = CU.user_id
    WHERE CU.user_id = :userId 
    AND C.chat_type = 'self'
    LIMIT 1
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { userId },
    raw: true,
  });

  return result;
};

const getChatByUserIds = async (userId1, userId2) => {
  if (userId1 === userId2) {
    return await getSelfChat(userId1);
  }

  const query = `
    SELECT U2.name as "userName", U2.profile_url as "userProfile",
           C.id as "id", U2.id as "userId" 
    FROM chat_users CU1 
    INNER JOIN chat_users CU2 ON CU1.chat_id = CU2.chat_id 
    INNER JOIN chats C ON C.id = CU1.chat_id
    INNER JOIN users U1 ON U1.id = CU1.user_id
    INNER JOIN users U2 ON U2.id = CU2.user_id
    WHERE CU1.user_id = :userId1 
    AND CU2.user_id = :userId2 
    AND C.chat_type = 'one_to_one'
  `;

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { userId1, userId2 },
    raw: true,
  });

  return result;
};

const createSelfChat = async (userId) => {
  try {
    const chat = await Chat.create(
      {
        chatType: "self",
        isGroupChat: false,
      },
      {
        raw: true,
      }
    );

    await ChatUsers.create({
      userId: userId,
      chatId: chat.id,
    });

    return chat;
  } catch (error) {
    throw error;
  }
};

const createChat = async (userId1, userId2) => {
  const existingChat = await getChatByUserIds(userId1, userId2);
  if (existingChat.length > 0) {
    return existingChat[0];
  }
  if (userId1 === userId2) {
    return await createSelfChat(userId1);
  }
  const chat = await Chat.create(
    {
      chatType: "one_to_one",
      isGroupChat: false,
    },
    {
      raw: true,
    }
  );
  await ChatUsers.create({
    userId: userId1,
    chatId: chat.id,
  });
  await ChatUsers.create({
    userId: userId2,
    chatId: chat.id,
  });

  return chat;
};

const getAllChatsOfUser = async (userId, searchTerm = "") => {
  const searchPattern = `%${searchTerm}%`;

  // 1. Get existing chats the user is part of (filtered if searchTerm is provided)
  const chatquery = `
    SELECT C.id AS "id", C.chat_type AS "chatType",
           C.group_name AS "groupName", C.group_profile AS "groupProfile",
           C.group_admin_id as "groupAdminId",
           C.created_at as "created_at",C.updated_at as "updatedAt"
    FROM CHAT_USERS CU
    INNER JOIN CHATS C ON C.id = CU.chat_id
    WHERE CU.user_id = :userId
    ${
      searchTerm
        ? `
      AND (
        C.group_name ILIKE :searchTerm
        OR EXISTS (
          SELECT 1 FROM CHAT_USERS CU2
          JOIN USERS U ON U.id = CU2.user_id
          WHERE CU2.chat_id = C.id
            AND CU2.user_id != :userId
            AND (U.name ILIKE :searchTerm OR U.email ILIKE :searchTerm)
        )
      )
    `
        : ""
    }
    ORDER BY C.updated_at desc
  `;

  const chatData = await sequelize.query(chatquery, {
    replacements: { userId, ...(searchTerm && { searchTerm: searchPattern }) },
    type: QueryTypes.SELECT,
  });

  const dataWithUserDetails = await Promise.all(
    chatData.map(async (item) => {
      const usersQuery = `
        SELECT U.id AS "id", U.name AS "name", U.email AS "email",
               U.profile_url AS "profileURL", U.auth_provider_id AS "authProviderId"
        FROM CHAT_USERS CU
        LEFT JOIN USERS U ON U.id = CU.user_id
        WHERE CU.chat_id = :chatId
      `;

      const userData = await sequelize.query(usersQuery, {
        replacements: { chatId: item.id },
        type: QueryTypes.SELECT,
      });

      const latestMessage = await Message.findOne({
        where: { chatId: item.id },
        order: [["createdAt", "desc"]],
        limit: 1,
      });

      return {
        ...item,
        users: userData,
        latestMessage,
      };
    })
  );

  // 2. Run second query ONLY if searchTerm is present
  let otherUsers = [];
  if (searchTerm) {
    const otherUsersQuery = `
      SELECT U.id, U.name, U.email, U.profile_url AS "profileURL", U.auth_provider_id AS "authProviderId"
      FROM USERS U
      WHERE (
        U.id != :userId
        AND (U.name ILIKE :searchTerm OR U.email ILIKE :searchTerm)
        AND U.id NOT IN (
          SELECT CU2.user_id
          FROM CHAT_USERS CU1
          JOIN CHAT_USERS CU2 ON CU1.chat_id = CU2.chat_id
          JOIN CHATS C ON C.id = CU1.chat_id
          WHERE CU1.user_id = :userId
            AND CU2.user_id != :userId
            AND C.chat_type = 'one_to_one'
        )
      )
      OR (
        U.id = :userId
        AND (U.name ILIKE :searchTerm OR U.email ILIKE :searchTerm)
        AND NOT EXISTS (
          SELECT 1
          FROM CHAT_USERS CU
          JOIN CHATS C ON CU.chat_id = C.id
          WHERE CU.user_id = :userId AND C.chat_type = 'self'
        )
      )
    `;

    otherUsers = await sequelize.query(otherUsersQuery, {
      replacements: { userId, searchTerm: searchPattern },
      type: QueryTypes.SELECT,
    });
  }

  return {
    chats: dataWithUserDetails,
    otherUsers,
  };
};

const ChatService = {
  getChatByUserIds,
  getSelfChat,
  createSelfChat,
  createChat,
  getAllChatsOfUser,
};
module.exports = { ChatService };
