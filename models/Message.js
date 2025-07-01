const sequelize = require("../config/database");
const { DataTypes, Sequelize } = require("sequelize");
const User = require("./User");
const Chat = require("./Chat");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      defaultValue: Sequelize.literal("uuid_generate_v4()"),
    },
    senderId: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      field: "sender_id",
      references: {
        model: User,
        key: "id",
      },
    },
    chatId: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      field: "chat_id",
      references: {
        model: Chat,
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("text", "image", "audio", "video"),
      allowNull: false,
      defaultValue: "text",
    },
    caption: {
      type: DataTypes.TEXT,
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
    timestamps: false,
    tableName: "messages",
    modelName: "Message",
  }
);

User.hasMany(Message, { foreignKey: "senderId", as: "sender" });
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });

Chat.hasMany(Message, { foreignKey: "chatId", as: "messages" });
Message.belongsTo(Chat, { foreignKey: "chatId", as: "chat" });

module.exports = Message;
