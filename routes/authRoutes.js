const express = require("express");
const { authController } = require("../controllers/authController");

const authRouter = express.Router();

authRouter.post("/signup", authController.createUser);
authRouter.post("/google-auth", authController.handleGoogleAuth);
authRouter.get("/:authProviderId", authController.getUserDetails);

module.exports = { authRouter };
