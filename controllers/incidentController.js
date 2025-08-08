const {
    createIncident,
    listIncidents,
    updateIncident,
} = require("../models/Incident");
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
    const { title, description, category, location } = req.body;
    if (!title || !description || !category || !location) {
        return res.status(400).json({ message: "All fields are required." });
    }
    const id = await createIncident({
        title,
        description,
        category,
        location,
        reporterId: req.user.id,
    });
    await addLog({
        userId: req.user.id,
        action: "incident_created",
        meta: { incidentId: id },
    });
    res.status(201).json({ id });
};

const list = async (req, res) => {
    const { category, status } = req.query;
    const items = await listIncidents({ category, status });
    res.json({ incidents: items });
};

const update = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { id } = req.params;
    const { status, description } = req.body;
    const allowed = ["open", "updated", "resolved"];
    const updates = {};
    if (status) {
        if (!allowed.includes(status))
            return res.status(400).json({ message: "Invalid status" });
        updates.status = status;
    }
    if (description) updates.description = description;
    const updated = await updateIncident(id, updates);
    if (!updated)
        return res.status(404).json({ message: "Incident not found" });
    await addLog({
        userId: req.user.id,
        action: "incident_updated",
        meta: { incidentId: id, ...updates },
    });
    res.json({ message: "Updated" });
};

module.exports = { create, list, update };
