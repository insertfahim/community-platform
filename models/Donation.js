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
    const { kind, status } = filters;
    const query = {};
    if (kind) query.kind = kind;
    if (status) query.status = status;
    return DonationModel.find(query).sort({ createdAt: -1 }).lean();
};

const updateDonationStatus = async (id, status) => {
    const doc = await DonationModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

module.exports = {
    DonationModel,
    createDonation,
    listDonations,
    updateDonationStatus,
};
