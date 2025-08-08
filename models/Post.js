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

const listPosts = async ({ category, type, status }) => {
    const query = {};
    if (category) query.category = category;
    if (type) query.type = type;
    if (status) query.status = status;
    return PostModel.find(query).sort({ createdAt: -1 }).lean();
};

const updatePostStatus = async (id, status) => {
    const updated = await PostModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
    ).lean();
    return updated ? updated._id.toString() : undefined;
};

module.exports = {
    createPost,
    listPosts,
    updatePostStatus,
    PostModel,
};
