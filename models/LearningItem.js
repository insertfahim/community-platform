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
    if (filters.ownerId) query.ownerId = filters.ownerId;
    return LearningItemModel.find(query)
        .populate({ path: "ownerId", select: "username name" })
        .sort({ createdAt: -1 })
        .lean();
};

const updateLearningItem = async (id, ownerId, updates) => {
    const allowed = ["kind", "subject", "details"];
    const safe = {};
    Object.keys(updates || {}).forEach((k) => {
        if (allowed.includes(k)) safe[k] = updates[k];
    });
    const doc = await LearningItemModel.findOneAndUpdate(
        { _id: id, ownerId },
        { $set: safe },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

const deleteLearningItem = async (id, ownerId) => {
    const doc = await LearningItemModel.findOneAndDelete({
        _id: id,
        ownerId,
    }).lean();
    return !!doc;
};

module.exports = {
    LearningItemModel,
    createLearningItem,
    listLearningItems,
    updateLearningItem,
    deleteLearningItem,
};
