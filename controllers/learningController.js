const {
    createLearningItem,
    listLearningItems,
    updateLearningItem,
    deleteLearningItem,
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
    const { kind, subject, ownerId } = req.query;
    const items = await listLearningItems({ kind, subject, ownerId });
    res.json({ items });
};

const update = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { id } = req.params;
    const updated = await updateLearningItem(id, req.user.id, req.body || {});
    if (!updated) return res.status(404).json({ message: "Item not found" });
    await addLog({
        userId: req.user.id,
        action: "learning_item_updated",
        meta: { id },
    });
    res.json({ message: "Updated" });
};

const remove = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { id } = req.params;
    const ok = await deleteLearningItem(id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Item not found" });
    await addLog({
        userId: req.user.id,
        action: "learning_item_deleted",
        meta: { id },
    });
    res.json({ message: "Deleted" });
};

module.exports = { create, list, update, remove };
