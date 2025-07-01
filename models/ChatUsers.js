const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Chat = require("./Chat");
const User = require("./User");
const { getUTCDate } = require("../utils/helper");

const ChatUsers = sequelize.define(
  "ChatUsers",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        key: "id",
        model: User,
      },
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "chat_id",

      references: {
        key: "id",
        model: Chat,
      },
    },
    createdAt: {
      type: "TIMESTAMP WITHOUT TIME ZONE",
      field: "created_at",
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: "TIMESTAMP WITHOUT TIME ZONE",
      field: "updated_at",
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "chat_users",
    modelName: "ChatUsers",
    timestamps: false,
  }
);

Chat.hasMany(ChatUsers, {
  foreignKey: "chatId",
  as: "chatUsers",
  foreignKeyConstraint: true,
});

User.hasMany(ChatUsers, {
  foreignKey: "userId",
  as: "chatUsers",
});

ChatUsers.belongsTo(Chat, {
  foreignKey: "chatId",
  as: "chats",
});

ChatUsers.belongsTo(User, {
  foreignKey: "userId",
  as: "users",
});

module.exports = ChatUsers;
