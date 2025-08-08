const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        body: { type: String, required: true },
        readAt: { type: Date },
    },
    { timestamps: true }
);

const MessageModel =
    mongoose.models.Message || mongoose.model("Message", messageSchema);

const sendMessage = async ({ conversationId, senderId, recipientId, body }) => {
    const doc = await MessageModel.create({
        conversationId,
        senderId,
        recipientId,
        body,
    });
    return doc._id.toString();
};

const listMessages = async (conversationId) => {
    return MessageModel.find({ conversationId }).sort({ createdAt: 1 }).lean();
};

module.exports = {
    MessageModel,
    sendMessage,
    listMessages,
};
