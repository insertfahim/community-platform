const mongoose = require("mongoose");

// Toggle history logging via env: set HISTORY_LOGS_ENABLED=true to enable
const HISTORY_LOGS_ENABLED =
    String(process.env.HISTORY_LOGS_ENABLED || "false").toLowerCase() ===
    "true";

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
    if (!HISTORY_LOGS_ENABLED) {
        // Logging disabled: act as a no-op
        return null;
    }
    const doc = await HistoryLogModel.create({ userId, action, meta });
    return doc._id.toString();
};

const listLogs = async (userId) => {
    if (!HISTORY_LOGS_ENABLED) return [];
    return HistoryLogModel.find({ userId }).sort({ createdAt: -1 }).lean();
};

module.exports = {
    HistoryLogModel,
    addLog,
    listLogs,
};
