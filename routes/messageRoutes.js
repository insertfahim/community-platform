const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const messageController = require("../controllers/messageController");

router.post("/start", requireAuth, messageController.startConversation);
router.get("/conversations", requireAuth, messageController.listConversations);
router.get(
    "/:conversationId/messages",
    requireAuth,
    messageController.getMessages
);
router.post(
    "/:conversationId/messages",
    requireAuth,
    messageController.postMessage
);

module.exports = router;
