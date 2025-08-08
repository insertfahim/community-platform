const { addLog, listLogs } = require("../models/HistoryLog");

const ensureAuth = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    return true;
};

const record = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { action, meta } = req.body;
    if (!action) return res.status(400).json({ message: "action required" });
    const id = await addLog({ userId: req.user.id, action, meta });
    // When logging disabled, id will be null; still return 201
    res.status(201).json({ id });
};

const list = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const logs = await listLogs(req.user.id);
    res.json({ logs });
};

module.exports = { record, list };
