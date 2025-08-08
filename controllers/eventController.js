const {
    createEvent,
    listEvents,
    updateEvent,
    deleteEvent,
} = require("../models/Event");
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
    const { title, description, startAt, endAt, location } = req.body;
    if (!title || !description || !startAt || !endAt || !location) {
        return res.status(400).json({ message: "All fields are required." });
    }
    const id = await createEvent({
        title,
        description,
        startAt,
        endAt,
        location,
        ownerId: req.user.id,
    });
    await addLog({
        userId: req.user.id,
        action: "event_created",
        meta: { eventId: id },
    });
    res.status(201).json({ eventId: id });
};

const list = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { from, to } = req.query;
    const events = await listEvents(req.user.id, { from, to });
    res.json({ events });
};

module.exports = {
    create,
    list,
    update: async (req, res) => {
        if (!ensureAuth(req, res)) return;
        const { id } = req.params;
        const updated = await updateEvent(id, req.user.id, req.body || {});
        if (!updated)
            return res.status(404).json({ message: "Event not found" });
        await addLog({
            userId: req.user.id,
            action: "event_updated",
            meta: { eventId: id },
        });
        res.json({ message: "Updated" });
    },
    remove: async (req, res) => {
        if (!ensureAuth(req, res)) return;
        const { id } = req.params;
        const ok = await deleteEvent(id, req.user.id);
        if (!ok) return res.status(404).json({ message: "Event not found" });
        await addLog({
            userId: req.user.id,
            action: "event_deleted",
            meta: { eventId: id },
        });
        res.json({ message: "Deleted" });
    },
};
