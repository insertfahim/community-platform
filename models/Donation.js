const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
    {
        kind: {
            type: String,
            enum: ["clothes", "food", "books", "other"],
            required: true,
        },
        description: { type: String, required: true },
        location: { type: String, required: true },
        contact: { type: String, required: true },
        status: {
            type: String,
            enum: ["available", "claimed", "donated"],
            default: "available",
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const DonationModel =
    mongoose.models.Donation || mongoose.model("Donation", donationSchema);

const createDonation = async (data) => {
    const doc = await DonationModel.create(data);
    return doc._id.toString();
};

const listDonations = async (filters = {}) => {
    const { kind, status, ownerId } = filters;
    const query = {};
    if (kind) query.kind = kind;
    if (status) query.status = status;
    if (ownerId) query.ownerId = ownerId;
    return DonationModel.find(query)
        .populate({ path: "ownerId", select: "username name" })
        .sort({ createdAt: -1 })
        .lean();
};

const updateDonationStatus = async (id, status) => {
    const doc = await DonationModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

const updateDonation = async (id, ownerId, updates) => {
    const allowed = ["kind", "description", "location", "contact", "status"];
    const safe = {};
    Object.keys(updates || {}).forEach((k) => {
        if (allowed.includes(k)) safe[k] = updates[k];
    });
    const doc = await DonationModel.findOneAndUpdate(
        { _id: id, ownerId },
        { $set: safe },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

const deleteDonation = async (id, ownerId) => {
    const doc = await DonationModel.findOneAndDelete({
        _id: id,
        ownerId,
    }).lean();
    return !!doc;
};

module.exports = {
    DonationModel,
    createDonation,
    listDonations,
    updateDonationStatus,
    updateDonation,
    deleteDonation,
};
