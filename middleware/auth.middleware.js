const admin = require("../config/firebase/firebase.config");
const userService = require("../services/userService");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = await userService.getUserByAuthProviderId(decodedToken.uid);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      req.user = user;

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  verifyToken,
};
