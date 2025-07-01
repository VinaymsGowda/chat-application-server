const express = require("express");
const { userController } = require("../controllers/userController");

const userRouter = express.Router();

// get user by filters
userRouter.get("/", userController.getUsers);
userRouter.patch("/", userController.updateUser);
module.exports = { userRouter };
