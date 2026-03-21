const userService = require("../services/userService");
const admin = require("../config/firebase/firebase.config");
const { uploadFileToS3, deleteFileFromS3 } = require("../services/s3Helper");

const getUsers = async (req, res) => {
  try {
    const query = req.query.query || "";
    const userId = req.user.id;
    const isGroup = req.query.isGroup === "true" ? true : false;
    const users = await userService.getUsers(userId, query, isGroup);

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
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        message: "Params id is required",
      });
    }

    const user = req.user;

    // IDOR check: Users can only update their own profiles
    if (id !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot update another user's profile",
      });
    }

    // validateBody middleware gives us cleaned generic string fields (e.g. name)
    // and inherently strips dangerous fields like "profileURL" thanks to userUpdateSchema
    const reqBody = { ...req.validatedData };

    if (req.file) {
      const result = await uploadFileToS3(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
        "user-profile"
      );
      if (!result) {
        return res.status(400).json("Failed to upload image");
      }
      reqBody.profileURL = result;
    }

    if (Object.keys(reqBody).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Req body is required",
      });
    }

    // Deletion is now safe because reqBody.profileURL ONLY exists if req.file was uploaded
    if (reqBody.profileURL) {
      const userDetails = await userService.getUserByAuthProviderId(
        user.authProviderId
      );
      if (userDetails.profileURL) {
        await deleteFileFromS3(userDetails.profileURL);
      }
    }

    const [affectedCount, affectedRows] = await userService.updateUserById(
      user.id,
      reqBody
    );

    return res.status(200).json({
      message: "USer updated successfully",
      data: affectedRows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const getUserInfo = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Params id is required",
      });
    }
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const userController = { getUsers, updateUser, getUserInfo };

module.exports = { userController };
