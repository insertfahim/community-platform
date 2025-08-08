const Post = require("../models/Post");
const { addLog } = require("../models/HistoryLog");

const create = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            priority,
            location,
            contact_info,
            type,
        } = req.body;

        if (
            !title ||
            !description ||
            !category ||
            !priority ||
            !location ||
            !contact_info
        ) {
            return res
                .status(400)
                .json({ message: "All fields are required." });
        }

        const postData = {
            title,
            description,
            category,
            priority,
            location,
            contact_info,
            type: type || "request",
            status: "active",
        };

        console.log("📦 Creating post with:", postData);

        const postId = await Post.createPost(postData);
        if (req.user && postId) {
            await addLog({
                userId: req.user.id,
                action: "post_created",
                meta: { postId },
            });
        }

        return res.status(201).json({
            message: "Post created successfully",
            postId,
        });
    } catch (error) {
        console.error("❌ Controller Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const list = async (req, res) => {
    try {
        const { category, type, status } = req.query;
        const posts = await Post.listPosts({ category, type, status });
        res.status(200).json({ posts });
    } catch (error) {
        console.error("❌ List posts error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!id || !status) {
            return res
                .status(400)
                .json({ message: "Post id and status are required." });
        }
        const allowed = ["active", "completed", "cancelled"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }
        const updated = await Post.updatePostStatus(id, status);
        if (!updated) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json({ message: "Status updated" });
    } catch (error) {
        console.error("❌ Update status error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    create,
    list,
    updateStatus,
};
