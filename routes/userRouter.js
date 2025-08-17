const express = require("express");
const { userController } = require("../controllers/userController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const userRouter = express.Router();

// get user by filters
userRouter.get("/", userController.getUsers);
userRouter.patch(
  "/:id",
  upload.single("profileURL"),
  userController.updateUser
);
userRouter.get("/:id", userController.getUserInfo);
module.exports = { userRouter };
