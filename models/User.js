const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        username: { type: String, unique: true, sparse: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isVolunteer: { type: Boolean, default: false },
        isVolunteerVerified: { type: Boolean, default: false },
        // Extended volunteer metadata for a realistic setup
        volunteerProfile: {
            bio: { type: String },
            skills: { type: [String], default: [] },
            availability: { type: [String], default: [] }, // e.g. ["weekdays", "weekends", "mornings"]
            location: { type: String },
            languages: { type: [String], default: [] },
            phone: { type: String },
            hoursPerWeek: { type: Number },
            experienceYears: { type: Number },
            roles: { type: [String], default: [] }, // e.g. ["driver", "tutor"]
            certifications: { type: [String], default: [] },
        },
        volunteerRequestedAt: { type: Date },
        volunteerVerifiedAt: { type: Date },
        volunteerRejectedAt: { type: Date },
        volunteerRejectionReason: { type: String },
        volunteerAdminNotes: { type: String },
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

async function generateUniqueUsername(base) {
    const cleaned = (base || "user")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_.]+|[-_.]+$/g, "");
    let candidate = cleaned || "user";
    let n = 0;
    // Try with suffixes until unique
    // Limit attempts to avoid infinite loop
    for (let i = 0; i < 100; i += 1) {
        const probe = n === 0 ? candidate : `${candidate}${n}`;
        // eslint-disable-next-line no-await-in-loop
        const exists = await UserModel.exists({ username: probe });
        if (!exists) return probe;
        n += 1;
    }
    // Fallback with random suffix
    return `${candidate}${Date.now().toString(36).slice(-4)}`;
}

const createUser = async ({ name, email, password }) => {
    const hashed = hashPassword(password);
    const baseFromEmail = (email || "").split("@")[0] || name || "user";
    const username = await generateUniqueUsername(baseFromEmail);
    const doc = await UserModel.create({
        name,
        email,
        username,
        password: hashed,
    });
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
        {
            $set: {
                isVolunteer: true,
                isVolunteerVerified: false,
                volunteerRequestedAt: new Date(),
                volunteerRejectedAt: null,
                volunteerRejectionReason: null,
            },
        },
        { new: true }
    ).lean();
    return doc ? doc._id.toString() : undefined;
};

const verifyVolunteer = async (userId, verified, opts = {}) => {
    const update = {
        $set: {
            isVolunteer: true,
            isVolunteerVerified: !!verified,
            volunteerAdminNotes: opts.adminNotes || undefined,
            volunteerVerifiedAt: verified ? new Date() : undefined,
            volunteerRejectedAt: !verified ? new Date() : undefined,
            volunteerRejectionReason: !verified ? opts.reason || "" : undefined,
        },
    };
    const doc = await UserModel.findByIdAndUpdate(userId, update, {
        new: true,
    }).lean();
    return doc ? doc._id.toString() : undefined;
};

const listVolunteers = async (filters = {}) => {
    const query = { isVolunteer: true };
    if (typeof filters.verified === "boolean") {
        query.isVolunteerVerified = filters.verified;
    }
    if (filters.location) {
        query["volunteerProfile.location"] = {
            $regex: new RegExp(filters.location, "i"),
        };
    }
    if (
        filters.skills &&
        Array.isArray(filters.skills) &&
        filters.skills.length
    ) {
        query["volunteerProfile.skills"] = { $in: filters.skills };
    }
    if (filters.q) {
        const rx = new RegExp(filters.q, "i");
        query.$or = [
            { name: rx },
            { username: rx },
            { "volunteerProfile.bio": rx },
            { "volunteerProfile.skills": rx },
            { "volunteerProfile.roles": rx },
        ];
    }
    return UserModel.find(query)
        .select("name username isVolunteerVerified created_at volunteerProfile")
        .sort({
            isVolunteerVerified: -1,
            "volunteerProfile.skills": 1,
            created_at: -1,
        })
        .lean();
};

const upsertVolunteerProfile = async (userId, profile) => {
    const allowed = [
        "bio",
        "skills",
        "availability",
        "location",
        "languages",
        "phone",
        "hoursPerWeek",
        "experienceYears",
        "roles",
        "certifications",
    ];
    const setProfile = {};
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(profile || {}, key)) {
            setProfile[`volunteerProfile.${key}`] = profile[key];
        }
    }
    const update = {
        $set: {
            ...setProfile,
            isVolunteer: true,
            isVolunteerVerified: false,
            volunteerRequestedAt: new Date(),
            volunteerRejectedAt: null,
            volunteerRejectionReason: null,
        },
    };
    const doc = await UserModel.findByIdAndUpdate(userId, update, {
        new: true,
    }).lean();
    return doc ? doc._id.toString() : undefined;
};

const listVolunteerRequests = async () => {
    return UserModel.find({ isVolunteer: true, isVolunteerVerified: false })
        .select(
            "name email username volunteerRequestedAt volunteerProfile volunteerRejectionReason volunteerAdminNotes"
        )
        .sort({ volunteerRequestedAt: -1 })
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
    generateUniqueUsername,
    // finder by username for messaging
    findUserByUsername: async (username) => {
        const user = await UserModel.findOne({ username }).lean();
        if (!user) return undefined;
        return { ...user, id: user._id.toString() };
    },
};
