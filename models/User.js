const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isVolunteer: { type: Boolean, default: false },
        isVolunteerVerified: { type: Boolean, default: false },
        role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

const base64UrlEncode = (inputBuffer) =>
    inputBuffer
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

const hashPassword = (password) => {
    if (!password) {
        throw new Error("Password is required for hashing");
    }
    const salt = crypto.randomBytes(16);
    const iterations = 120000;
    const key = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    return `v1$${base64UrlEncode(salt)}$${iterations}$${base64UrlEncode(key)}`;
};

const verifyPassword = (password, stored) => {
    if (!stored || typeof stored !== "string") return false;
    const parts = stored.split("$");
    // Modern hashed format
    if (parts.length === 4 && parts[0] === "v1") {
        const salt = Buffer.from(
            parts[1].replace(/-/g, "+").replace(/_/g, "/"),
            "base64"
        );
        const iterations = parseInt(parts[2], 10);
        const expected = parts[3];
        const key = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
        const computed = base64UrlEncode(key);
        return crypto.timingSafeEqual(
            Buffer.from(computed),
            Buffer.from(expected)
        );
    }
    // Legacy plain-text fallback (for older databases)
    if (typeof password !== "string") return false;
    const a = Buffer.from(password, "utf8");
    const b = Buffer.from(stored, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

const findUserByEmail = async (email) => {
    const user = await UserModel.findOne({ email }).lean();
    if (!user) return undefined;
    return { ...user, id: user._id.toString() };
};

const createUser = async ({ name, email, password }) => {
    const hashed = hashPassword(password);
    const doc = await UserModel.create({ name, email, password: hashed });
    return doc._id.toString();
};

const findUserById = async (id) => {
    const user = await UserModel.findById(id).lean();
    if (!user) return undefined;
    return { ...user, id: user._id.toString() };
};

const requestVolunteer = async (userId) => {
    const doc = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { isVolunteer: true, isVolunteerVerified: false } },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

const verifyVolunteer = async (userId, verified) => {
    const doc = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { isVolunteer: true, isVolunteerVerified: !!verified } },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

const listVolunteers = async () => {
    return UserModel.find({ isVolunteer: true })
        .select("name email isVolunteerVerified created_at")
        .lean();
};

module.exports = {
    findUserByEmail,
    createUser,
    findUserById,
    UserModel,
    hashPassword,
    verifyPassword,
    requestVolunteer,
    verifyVolunteer,
    listVolunteers,
};
