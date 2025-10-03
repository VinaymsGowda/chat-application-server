const Chat = require("../models/Chat");
const ChatUsers = require("../models/ChatUsers");
const { ChatService } = require("../services/chatService");
const { groupChatService } = require("../services/groupChatService");
const { messageService } = require("../services/messageService");
const { uploadFileToS3 } = require("../services/s3Helper");
const accessUserChat = async (req, res) => {
  try {
    const { user } = req;
    const { userId } = req.params;

    const chat = await ChatService.getChatByUserIds(user.id, userId);
    if (chat.length == 0) {
      res.status(404).json({
        message: "Chat not found",
      });
    } else {
      const latestMessage = await messageService.getLatestMessageOfChat(
        chat[0].id
      );

      res.status(200).json({
        message: "Chat found",
        chat: chat[0],
        latestMessage: latestMessage,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

const getChats = async (req, res) => {
  try {
    const { user } = req;
    const searchQuery = req.query.searchQuery;
    const { chats, otherUsers } = await ChatService.getAllChatsOfUser(
      user.id,
      searchQuery
    );
    res.status(200).json({
      message: "Chats fetched successfully",
      chats: chats,
      otherUsers: otherUsers,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

const createGroupChat = async (req, res) => {
  try {
    const reqBody = req.body.data;
    if (!reqBody) {
      return res.status(400).json("Please provide req body");
    }

    const body = JSON.parse(reqBody);
    const userIds = body.userIds;

    if (!userIds || userIds.length < 2) {
      return res.status(400).json({
        message: "Atlease two users are needed to create a group chat",
      });
    }

    const { groupName } = body;

    const groupAdmin = req.user.id;

    if (!groupName) {
      return res.status(400).json({
        message: "Please provide name of the group",
      });
    }

    const newGroupChat = {
      groupName: groupName,
      isGroupChat: true,
      groupAdminId: groupAdmin,
      chatType: "group",
    };
    if (req.file) {
      const result = await uploadFileToS3(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        "group-profile"
      );
      if (!result) {
        return res.status(400).json("Failed to upload image");
      }

      newGroupChat.groupProfile = result;
    }

    const newGroup = await groupChatService.createGroupChat(
      newGroupChat,
      userIds
    );

    if (!newGroup) {
      throw new Error("Failed to create group", error);
    }

    return res.status(201).json({
      message: "Group created successfully",
      data: newGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

const leaveGroupChat = async (req, res) => {
  try {
    const { user } = req;
    const { chatId } = req.params;

    const chatDetails = await Chat.findOne({
      where: {
        id: chatId,
      },
      raw: true,
    });
    if (chatDetails && !chatDetails.isGroupChat) {
      return res.status(400).json({
        message: "User can only leave group chat",
      });
    }

    await groupChatService.leaveGroupChat(user.id, chatId);

    res.status(200).json({
      message: "You have left the group chat successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

const getNewUsersListForGroupChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;

    if (!chatId) {
      return res.status(400).json({
        message: "Params Chat id is required",
      });
    }
    const data = await groupChatService.getUsersListToAddInGroupChat(chatId);

    if (data.length === 0) {
      return res.status(404).json({
        message: "No users found",
      });
    }

    return res.status(200).json({
      message: "Users fetched successfully",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

const addUsersToGroupChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const user = req.user;
    if (!chatId) {
      return res.status(400).json({
        message: "Params chat id is required",
      });
    }

    const chat = await Chat.findOne({
      where: {
        id: chatId,
      },
      raw: true,
    });

    if (chat.groupAdminId !== user.id) {
      return res.status(403).json({
        message: "Only group admin can add members",
      });
    }
    const userIds = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        message: "Invalid Input data",
      });
    }

    if (Array.isArray(userIds) && userIds.length === 0) {
      return res.status(400).json({
        message: "No users provided to add",
      });
    }

    const newGroupUsers = await groupChatService.addUsersToGroupChat(
      chatId,
      userIds
    );

    res.status(201).json({
      message: "Users successfully added to group chat",
      data: newGroupUsers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error" || error.message,
    });
  }
};

const removeUserFromGroup = async (req, res) => {
  try {
    const user = req.user;
    const chatId = req.params.chatId;
    if (!chatId) {
      return res.status(400).json({
        message: "Params chat id is required",
      });
    }
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        message: "Params User id is required",
      });
    }

    const chat = await Chat.findOne({
      where: {
        id: chatId,
      },
      raw: true,
    });

    if (chat.groupAdminId !== user.id) {
      return res.status(403).json({
        message: "Only group admin can remove members",
      });
    }

    await groupChatService.removeUserFromGroup(chatId, userId);

    return res.status(200).json({
      message: "Group member removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error" || error.message,
    });
  }
};

const updateGroupDetails = async (req, res) => {
  try {
    const body = req.body.data;
    const chatId = req.params.chatId;

    if (!chatId) {
      return res.status(400).json({
        message: "Either body chat name or params chat id is not provided",
      });
    }

    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({
        message: "Invalid chat id not found",
      });
    }

    if (!body && !req.file) {
      return res.status(400).json({
        message: "Please provide data to update, Empty payload",
      });
    }

    let reqBody = {};
    if (body) {
      try {
        reqBody = JSON.parse(body);
      } catch (err) {
        console.log("Failed to parse body");
      }
    }

    if (req.file) {
      const result = await uploadFileToS3(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        "group-profile"
      );
      if (!result) {
        return res.status(400).json("Failed to upload image");
      }
      reqBody.groupProfile = result;
    }

    const data = await ChatService.updateChatById(chatId, reqBody);

    if (data[0] === 0) {
      return res.status(400).json({
        message: "No changes to update",
      });
    }

    return res.status(200).json({
      message: "Chat updated successfully",
      data: data[1],
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

const getChatInfo = async (req, res) => {
  try {
    const chatId = req.params.chatId;

    if (!chatId) {
      return res.status(400).json({
        message: "Either body chat name or params chat id is not provided",
      });
    }

    const { chat, users } = await ChatService.getChatById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Chat found successfully",
      chat: chat,
      users: users,
    });
  } catch (error) {}
};

const ChatController = {
  accessUserChat,
  getChats,
  createGroupChat,
  leaveGroupChat,
  getNewUsersListForGroupChat,
  addUsersToGroupChat,
  removeUserFromGroup,
  updateGroupDetails,
  getChatInfo,
};
module.exports = { ChatController };
