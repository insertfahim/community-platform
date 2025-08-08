const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["request", "offer"], default: "request" },
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, required: true },
        priority: { type: String, required: true },
        location: { type: String, required: true },
        contact_info: { type: String, required: true },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active",
        },
    },
    { timestamps: true }
);

const PostModel = mongoose.models.Post || mongoose.model("Post", postSchema);

const createPost = async (postData) => {
    const doc = await PostModel.create(postData);
    return doc._id.toString();
};

const listPosts = async ({ category, type, status, ownerId }) => {
    const query = {};
    if (category) query.category = category;
    if (type) query.type = type;
    if (status) query.status = status;
    if (ownerId) query.ownerId = ownerId;
    return PostModel.find(query)
        .populate({ path: "ownerId", select: "username name" })
        .sort({ createdAt: -1 })
        .lean();
};

const updatePostStatus = async (id, status) => {
    const updated = await PostModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
    ).lean();
    return updated ? updated._id.toString() : undefined;
};

const getPostById = async (id) => {
    const doc = await PostModel.findById(id).lean();
    if (!doc) return undefined;
    return { ...doc, id: doc._id.toString() };
};

const updatePostFields = async (id, updates) => {
    const allowed = [
        "title",
        "description",
        "category",
        "priority",
        "location",
        "contact_info",
        "type",
        "status",
    ];
    const $set = {};
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            $set[key] = updates[key];
        }
    }
    if (Object.keys($set).length === 0) return undefined;
    const updated = await PostModel.findByIdAndUpdate(
        id,
        { $set },
        { new: true }
    ).lean();
    return updated ? updated._id.toString() : undefined;
};

const deletePostById = async (id) => {
    const res = await PostModel.findByIdAndDelete(id).lean();
    return !!res;
};

module.exports = {
    createPost,
    listPosts,
    updatePostStatus,
    PostModel,
    getPostById,
    updatePostFields,
    deletePostById,
};
