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
    }
  );
  return updatedUser;
};

const getUsers = async (userId, query = "") => {
  const users = await User.findAll({
    where: {
      id: {
        [Op.ne]: userId,
      },
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

const userService = {
  createUser,
  getUserByAuthProviderId,
  updateUserById,
  getUsers,
};

module.exports = userService;
