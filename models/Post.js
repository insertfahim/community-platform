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
        status: { type: String, default: "active" },
    },
    { timestamps: true }
);

const PostModel = mongoose.models.Post || mongoose.model("Post", postSchema);

const createPost = async (postData) => {
    const doc = await PostModel.create(postData);
    return doc._id.toString();
};

module.exports = {
    createPost,
    PostModel,
};
