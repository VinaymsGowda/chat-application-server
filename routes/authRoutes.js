const express = require("express");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { authController } = require("../controllers/authController");

const authRouter = express.Router();

authRouter.post(
  "/signup",
  upload.single("profilePic"),
  authController.createUser
);
authRouter.post("/google-auth", authController.handleGoogleAuth);
authRouter.get("/:authProviderId", authController.getUserDetails);

module.exports = { authRouter };
