const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ["safety", "weather", "health", "other"],
            required: true,
        },
        location: { type: String, required: true },
        status: {
            type: String,
            enum: ["open", "updated", "resolved"],
            default: "open",
        },
        reporterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const IncidentModel =
    mongoose.models.Incident || mongoose.model("Incident", incidentSchema);

const createIncident = async (data) => {
    const doc = await IncidentModel.create(data);
    return doc._id.toString();
};

const listIncidents = async (filters = {}) => {
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.reporterId) query.reporterId = filters.reporterId;
    return IncidentModel.find(query)
        .populate({ path: "reporterId", select: "username name" })
        .sort({ createdAt: -1 })
        .lean();
};

const updateIncident = async (id, updates) => {
    const doc = await IncidentModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

const deleteIncident = async (id, reporterId) => {
    const doc = await IncidentModel.findOneAndDelete({
        _id: id,
        reporterId,
    }).lean();
    return !!doc;
};

module.exports = {
    IncidentModel,
    createIncident,
    listIncidents,
    updateIncident,
    deleteIncident,
};
