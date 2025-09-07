const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { requireAuth } = require("../middleware/auth");

// All message routes require authentication
router.use(requireAuth);

// Send a message
router.post("/send", messageController.sendMessage);

// Get conversation with another user
router.get("/conversation/:userId", messageController.getConversation);

// Get list of all conversations
router.get("/conversations", messageController.getConversationsList);

// Get unread message count
router.get("/unread-count", messageController.getUnreadCount);

module.exports = router;
