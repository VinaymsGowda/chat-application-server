const { z } = require("zod");

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  authProviderId: z.string().min(1, "Auth provider ID is required"),
});

const googleAuthSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  authProviderId: z.string().min(1, "Auth provider ID is required"),
  profileURL: z.url("Invalid profile URL").optional(),
});

const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  // Disallowing direct string profileURL inputs as it's an S3 deletion vector
  // profileURL input must come only from req.file S3 processing
});

const createGroupChatSchema = z.object({
  groupName: z.string().min(1, "Group name is required"),
  userIds: z.array(z.uuid("Invalid user ID format")).min(2, "At least two users are required"),
});

const updateGroupChatSchema = z.object({
  groupName: z.string().min(1, "Group name is required").optional(),
});

const addUsersToGroupSchema = z.array(z.uuid("Invalid user ID format")).min(1, "At least one user must be provided");

const sendMessageSchema = z.object({
  content: z.string().optional(),
  caption: z.string().optional(),
  receiverId: z.uuid("Invalid receiver ID format").optional(),
  type: z.enum(["text", "image", "video", "audio", "pdf", "doc", "docx"]).optional(),
  chatId: z.uuid("Invalid chat ID format").optional(),
}).refine(data => data.chatId || data.receiverId, {
  message: "Either chatId or receiverId must be provided",
});

module.exports = {
  signupSchema,
  googleAuthSchema,
  userUpdateSchema,
  createGroupChatSchema,
  updateGroupChatSchema,
  addUsersToGroupSchema,
  sendMessageSchema,
};
