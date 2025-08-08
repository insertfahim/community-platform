const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

const findUserByEmail = async (email) => {
    const user = await UserModel.findOne({ email }).lean();
    if (!user) return undefined;
    return { ...user, id: user._id.toString() };
};

const createUser = async ({ name, email, password }) => {
    const doc = await UserModel.create({ name, email, password });
    return doc._id.toString();
};

module.exports = {
    findUserByEmail,
    createUser,
    UserModel,
};
