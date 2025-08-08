const {
    findOrCreateConversation,
    listUserConversations,
    touchConversation,
} = require("../models/Conversation");
const { sendMessage, listMessages } = require("../models/Message");
const { addLog } = require("../models/HistoryLog");

const ensureAuth = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    return true;
};

const startConversation = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { recipientId } = req.body;
    if (!recipientId)
        return res.status(400).json({ message: "recipientId required" });
    const convo = await findOrCreateConversation(req.user.id, recipientId);
    await addLog({
        userId: req.user.id,
        action: "conversation_started",
        meta: { conversationId: convo.id, recipientId },
    });
    res.status(201).json({ conversation: convo });
};

const postMessage = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { conversationId } = req.params;
    const { body, recipientId } = req.body;
    if (!body || !recipientId)
        return res
            .status(400)
            .json({ message: "body and recipientId required" });
    const id = await sendMessage({
        conversationId,
        senderId: req.user.id,
        recipientId,
        body,
    });
    await touchConversation(conversationId);
    await addLog({
        userId: req.user.id,
        action: "message_sent",
        meta: { conversationId, messageId: id },
    });
    res.status(201).json({ messageId: id });
};

const getMessages = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { conversationId } = req.params;
    const messages = await listMessages(conversationId);
    res.json({ messages });
};

const listConversations = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const convos = await listUserConversations(req.user.id);
    res.json({ conversations: convos });
};

module.exports = {
    startConversation,
    postMessage,
    getMessages,
    listConversations,
};
