const { createEvent, listEvents } = require("../models/Event");
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
    const events = await listEvents(req.user.id);
    res.json({ events });
};

module.exports = {
    create,
    list,
};
