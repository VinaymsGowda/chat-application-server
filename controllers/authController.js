const userService = require("../services/userService");

const createUser = async (req, res) => {
  try {
    const { name, email, authProviderId, profileURL } = req.body;

    const response = await userService.createUser({
      name,
      email,
      authProviderId,
      profileURL,
    });
    res.status(201).json({
      message: "User created successfully",
      data: response,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleGoogleAuth = async (req, res) => {
  try {
    const { authProviderId } = req.body;
    const { name, email, profileURL } = req.body;
    if (!authProviderId || !name || !email) {
      return res.status(400).json({
        message: "Missing required fields: authProviderId, name, or email",
      });
    }
    const user = await userService.getUserByAuthProviderId(authProviderId);

    if (user) {
      await userService.updateUserById(user.id, {
        name,
        profileURL,
      });

      const updatedUser = await userService.getUserByAuthProviderId(
        authProviderId
      );

      res.status(200).json({
        message: "User already exists",
        data: updatedUser,
      });
    } else {
      // this is a new user registration,

      const newUser = await userService.createUser({
        name,
        email,
        authProviderId,
        profileURL,
      });
      res.status(201).json({
        message: "User created successfully",
        data: newUser,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const authProviderId = req.params.authProviderId;
    const user = await userService.getUserByAuthProviderId(authProviderId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "User authenticated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const authController = {
  createUser,
  handleGoogleAuth,
  getUserDetails,
};
module.exports = { authController };
