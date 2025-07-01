const sequelize = require("../config/database");
const { DataTypes, Sequelize } = require("sequelize");

const User = sequelize.define(
  "User",
  {
    id: {
      allowNull: false,
      defaultValue: Sequelize.literal("uuid_generate_v4()"),
      primaryKey: true,
      type: DataTypes.UUID,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "name",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "email",
    },
    authProviderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "auth_provider_id",
    },
    profileURL: {
      type: DataTypes.STRING,
      field: "profile_url",
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
    tableName: "users",
    modelName: "User",
    timestamps: false,
  }
);

module.exports = User;
