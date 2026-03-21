const express = require("express");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { authController } = require("../controllers/authController");
const { validateBody } = require("../middleware/validate");
const { signupSchema, googleAuthSchema } = require("../validators/schemas");
const { verifyToken } = require("../middleware/auth.middleware");

const authRouter = express.Router();

authRouter.post(
  "/signup",
  upload.single("profilePic"),
  validateBody(signupSchema),
  authController.createUser
);
authRouter.post(
  "/google-auth",
  validateBody(googleAuthSchema),
  authController.handleGoogleAuth
);
authRouter.get(
  "/:authProviderId",
  verifyToken, 
  authController.getUserDetails
);

module.exports = { authRouter };
