const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        startAt: { type: Date, required: true },
        endAt: { type: Date, required: true },
        location: { type: String, required: true },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const EventModel =
    mongoose.models.Event || mongoose.model("Event", eventSchema);

const createEvent = async (data) => {
    const doc = await EventModel.create(data);
    return doc._id.toString();
};

const listEvents = async (userId, filters = {}) => {
    const query = { ownerId: userId };
    if (filters.from) query.startAt = { $gte: new Date(filters.from) };
    if (filters.to)
        query.endAt = Object.assign(query.endAt || {}, {
            $lte: new Date(filters.to),
        });
    return EventModel.find(query).sort({ startAt: 1 }).lean();
};

const updateEvent = async (id, ownerId, updates) => {
    const allowed = ["title", "description", "startAt", "endAt", "location"];
    const safe = {};
    Object.keys(updates || {}).forEach((k) => {
        if (allowed.includes(k)) safe[k] = updates[k];
    });
    const doc = await EventModel.findOneAndUpdate(
        { _id: id, ownerId },
        { $set: safe },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

const deleteEvent = async (id, ownerId) => {
    const doc = await EventModel.findOneAndDelete({ _id: id, ownerId }).lean();
    return !!doc;
};

module.exports = {
    EventModel,
    createEvent,
    listEvents,
    updateEvent,
    deleteEvent,
};
