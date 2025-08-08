const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        category: { type: String, required: true },
        main_area: { type: String, required: true },
        city: { type: String, required: true },
        full_address: { type: String },
        phone: { type: String },
        fax: { type: String },
    },
    { timestamps: true, collection: "emergency_contacts" }
);

const EmergencyModel =
    mongoose.models.Emergency || mongoose.model("Emergency", emergencySchema);

const getAllContacts = async () => {
    return EmergencyModel.find({}).sort({ category: 1, main_area: 1 }).lean();
};

const getContactsByCategory = async (category) => {
    return EmergencyModel.find({ category }).sort({ main_area: 1 }).lean();
};

const searchContactsByArea = async (searchTerm) => {
    const regex = new RegExp(searchTerm, "i");
    return EmergencyModel.find({ $or: [{ main_area: regex }, { city: regex }] })
        .sort({ category: 1, main_area: 1 })
        .lean();
};

module.exports = {
    getAllContacts,
    getContactsByCategory,
    searchContactsByArea,
    EmergencyModel,
};
