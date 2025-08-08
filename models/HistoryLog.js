const mongoose = require("mongoose");

const historyLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: { type: String, required: true },
        meta: { type: Object },
    },
    { timestamps: true }
);

const HistoryLogModel =
    mongoose.models.HistoryLog ||
    mongoose.model("HistoryLog", historyLogSchema);

const addLog = async ({ userId, action, meta }) => {
    const doc = await HistoryLogModel.create({ userId, action, meta });
    return doc._id.toString();
};

const listLogs = async (userId) => {
    return HistoryLogModel.find({ userId }).sort({ createdAt: -1 }).lean();
};

module.exports = {
    HistoryLogModel,
    addLog,
    listLogs,
};
