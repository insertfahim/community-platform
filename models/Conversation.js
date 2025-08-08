const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

conversationSchema.index({ participants: 1 });

const ConversationModel =
    mongoose.models.Conversation ||
    mongoose.model("Conversation", conversationSchema);

const findOrCreateConversation = async (userIdA, userIdB) => {
    const a = userIdA.toString();
    const b = userIdB.toString();
    const sorted = [a, b].sort();
    let convo = await ConversationModel.findOne({
        participants: { $all: sorted, $size: 2 },
    }).lean();
    if (convo) return { ...convo, id: convo._id.toString() };
    const doc = await ConversationModel.create({ participants: sorted });
    return {
        id: doc._id.toString(),
        participants: sorted,
        lastMessageAt: doc.lastMessageAt,
    };
};

const listUserConversations = async (userId) => {
    return ConversationModel.find({ participants: userId })
        .sort({ lastMessageAt: -1 })
        .lean();
};

const touchConversation = async (conversationId) => {
    await ConversationModel.findByIdAndUpdate(conversationId, {
        $set: { lastMessageAt: new Date() },
    });
};

module.exports = {
    ConversationModel,
    findOrCreateConversation,
    listUserConversations,
    touchConversation,
};
