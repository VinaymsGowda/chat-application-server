const sequelize = require("../config/database");
const { DataTypes, Sequelize } = require("sequelize");

const User = require("./User");

const Chat = sequelize.define(
  "Chat",
  {
    id: {
      allowNull: false,
      defaultValue: Sequelize.literal("uuid_generate_v4()"),
      primaryKey: true,
      type: DataTypes.UUID,
    },
    groupName: {
      type: DataTypes.STRING,
      field: "group_name",
    },
    isGroupChat: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_group_chat",
    },
    groupAdminId: {
      type: DataTypes.UUID,
      field: "group_admin_id",
      references: {
        key: "id",
        model: User,
      },
    },
    groupProfile: {
      type: DataTypes.STRING,
      field: "group_profile",
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
    chatType: {
      type: DataTypes.ENUM("one_to_one", "group", "self"),
      defaultValue: "one_to_one",
      field: "chat_type",
      allowNull: false,
    },
  },
  {
    tableName: "chats",
    modelName: "Chat",
    timestamps: false,
  }
);

User.hasMany(Chat, {
  foreignKey: "groupAdminId",
  as: "chats",
});

Chat.belongsTo(User, {
  foreignKey: "groupAdminId",
  as: "groupAdmin",
});

module.exports = Chat;
