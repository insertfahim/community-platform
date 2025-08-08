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

const listEvents = async (userId) => {
    return EventModel.find({ ownerId: userId }).sort({ startAt: 1 }).lean();
};

module.exports = {
    EventModel,
    createEvent,
    listEvents,
};
