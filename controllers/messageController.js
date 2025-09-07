const Message = require("../models/Message");
const { addLog } = require("../models/HistoryLog");

const sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user.id;

        if (!recipientId || !content?.trim()) {
            return res.status(400).json({
                message: "Recipient ID and message content are required",
            });
        }

        if (senderId === parseInt(recipientId)) {
            return res.status(400).json({
                message: "Cannot send message to yourself",
            });
        }

        const messageId = await Message.createMessage({
            senderId,
            recipientId: parseInt(recipientId),
            content: content.trim(),
        });

        // Log the message sending action
        await addLog({
            userId: senderId,
            action: "message_sent",
            meta: {
                messageId,
                recipientId: parseInt(recipientId),
            },
        });

        res.status(201).json({
            message: "Message sent successfully",
            messageId,
        });
    } catch (error) {
        console.error("❌ Send message error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const messages = await Message.getConversation(
            currentUserId,
            parseInt(userId),
            limit
        );

        // Mark messages as read
        await Message.markAsRead(currentUserId, parseInt(userId));

        res.json({ messages });
    } catch (error) {
        console.error("❌ Get conversation error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getConversationsList = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Message.getConversationsList(userId);
        res.json({ conversations });
    } catch (error) {
        console.error("❌ Get conversations list error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await Message.getUnreadCount(userId);
        res.json({ unreadCount });
    } catch (error) {
        console.error("❌ Get unread count error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    sendMessage,
    getConversation,
    getConversationsList,
    getUnreadCount,
};
