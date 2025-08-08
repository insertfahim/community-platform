const mongoose = require("mongoose");

const learningItemSchema = new mongoose.Schema(
    {
        kind: { type: String, enum: ["offer", "request"], required: true },
        subject: { type: String, required: true },
        details: { type: String, required: true },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const LearningItemModel =
    mongoose.models.LearningItem ||
    mongoose.model("LearningItem", learningItemSchema);

const createLearningItem = async (data) => {
    const doc = await LearningItemModel.create(data);
    return doc._id.toString();
};

const listLearningItems = async (filters = {}) => {
    const query = {};
    if (filters.kind) query.kind = filters.kind;
    if (filters.subject) query.subject = filters.subject;
    return LearningItemModel.find(query).sort({ createdAt: -1 }).lean();
};

module.exports = {
    LearningItemModel,
    createLearningItem,
    listLearningItems,
};
