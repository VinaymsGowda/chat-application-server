const { default: axios } = require("axios");
const { uploadFileToS3 } = require("../services/s3Helper");
const userService = require("../services/userService");

const createUser = async (req, res) => {
  try {
    const data = req.body.data;

    if (!data) {
      return res.status(400).json("Please provide vali data");
    }

    const body = JSON.parse(data);

    const { name, email, authProviderId } = body;

    if (!name && !email && !authProviderId) {
      return res
        .status(400)
        .json("Name,email and auth provider id is required");
    }

    const newUser = {
      name: name,
      email: email,
      authProviderId: authProviderId,
    };

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
      newUser.profileURL = result;
    }

    const response = await userService.createUser(newUser);
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
      const user = await userService.getUserByAuthProviderId(authProviderId);

      res.status(200).json({
        message: "User already exists",
        data: user,
      });
    } else {
      // this is a new user registration,

      const newUser = await userService.createUser({
        name,
        email,
        authProviderId,
      });
      if (profileURL) {
        const response = await axios.get(profileURL, {
          responseType: "arraybuffer",
        });
        const mimeType = response.headers["content-type"];
        const ext = mimeType.split("/")[1];

        const s3Key = await uploadFileToS3(
          `${newUser.id}.${ext}`,
          Buffer.from(response.data),
          mimeType,
          "user-profile"
        );

        await userService.updateUserById(newUser.id, {
          profileURL: s3Key,
        });

        newUser.profileURL = s3Key;
      }
      res.status(201).json({
        message: "User created successfully",
        data: newUser,
      });
    }
  } catch (error) {
    console.log("Error ", error);

    res.status(500).json({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const authProviderId = req.params.authProviderId;
    const user = await userService.getUserByAuthProviderId(authProviderId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
