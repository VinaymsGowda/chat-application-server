const { where } = require("sequelize");
const { getUTCDate } = require("../utils/helper");
const User = require("../models/User");
const { Op } = require("sequelize");
const ChatUsers = require("../models/ChatUsers");

const createUser = async (userData) => {
  const newUser = await User.create(userData, {
    raw: true,
  });

  return newUser;
};

const getUserByAuthProviderId = async (authProviderId) => {
  const user = await User.findOne({
    where: {
      authProviderId: authProviderId,
    },
    raw: true,
  });
  return user;
};

const updateUserById = async (userId, body) => {
  const updatedUser = await User.update(
    { ...body, updatedAt: getUTCDate() },
    {
      where: {
        id: userId,
      },
      raw: true,
      returning: true,
    }
  );
  return updatedUser;
};

const getUsers = async (userId, query = "", isGroup = false) => {
  const users = await User.findAll({
    where: {
      ...(isGroup && {
        id: {
          [Op.ne]: userId,
        },
      }),
      [Op.or]: [
        {
          name: {
            [Op.like]: `%${query}%`,
          },
        },
        {
          email: {
            [Op.like]: `%${query}%`,
          },
        },
      ],
    },
    raw: true,
  });
  return users;
};

const getUserById = async (id) => {
  const user = await User.findOne({
    where: {
      id: id,
    },
    raw: true,
  });

  return user;
};

const userService = {
  createUser,
  getUserByAuthProviderId,
  updateUserById,
  getUsers,
  getUserById,
};

module.exports = userService;
