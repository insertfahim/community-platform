const {
    createLearningItem,
    listLearningItems,
} = require("../models/LearningItem");
const { addLog } = require("../models/HistoryLog");

const ensureAuth = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    return true;
};

const create = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { kind, subject, details } = req.body;
    if (!kind || !subject || !details)
        return res.status(400).json({ message: "All fields required" });
    const id = await createLearningItem({
        kind,
        subject,
        details,
        ownerId: req.user.id,
    });
    await addLog({
        userId: req.user.id,
        action: "learning_item_created",
        meta: { id, kind, subject },
    });
    res.status(201).json({ id });
};

const list = async (req, res) => {
    const { kind, subject } = req.query;
    const items = await listLearningItems({ kind, subject });
    res.json({ items });
};

module.exports = { create, list };
