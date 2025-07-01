const { ChatService } = require("../services/chatService");
const { groupChatService } = require("../services/groupChatService");
const { messageService } = require("../services/messageService");

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
      const messages = await messageService.getMessagesByChatId(chat[0].id);

      res.status(200).json({
        message: "Chat found",
        chat: chat,
        messages: messages,
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
    const userIds = req.body.userIds;

    if (!userIds || userIds.length < 2) {
      return res.status(400).json({
        message: "Atlease two users are needed to create a group chat",
      });
    }

    const { groupName, groupProfile } = req.body;

    const groupAdmin = req.user.id;

    if (!groupName) {
      return res.status(400).json({
        message: "Please provide name of the group",
      });
    }

    const newGroupChat = {
      groupName: groupName,
      isGroupChat: true,
      groupProfile: groupProfile,
      groupAdminId: groupAdmin,
      chatType: "group",
    };

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

const ChatController = { accessUserChat, getChats, createGroupChat };
module.exports = { ChatController };
