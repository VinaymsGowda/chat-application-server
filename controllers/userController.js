const userService = require("../services/userService");
const admin = require("../config/firebase/firebase.config");

const getUsers = async (req, res) => {
  try {
    const query = req.query.query || "";
    const userId = req.user.id;
    const users = await userService.getUsers(userId, query);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    if (!name) {
      return res.status(400).json({
        message: "Name is required to update",
      });
    }

    await userService.updateUserById(user.id, {
      name,
    });
    admin.auth().updateUser(user.authProviderId, {
      displayName: name,
    });

    const updatedUser = await userService.getUserByAuthProviderId(
      user.authProviderId
    );

    return res.status(200).json({
      message: "USer updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const userController = { getUsers, updateUser };

module.exports = { userController };
