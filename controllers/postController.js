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
            ownerId: req.user ? req.user.id : undefined,
            status: "active",
        };

        console.log("📦 Creating post with:", postData);

        const postId = await Post.createPost(postData);
        if (req.user && postId) {
            await addLog({
                userId: req.user.id,
                action: "post_created",
                meta: {
                    postId,
                    title,
                    type: postData.type,
                    category,
                },
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
        const { category, type, status, sort } = req.query;
        const ownerId = req.query.ownerId || undefined;
        const posts = await Post.listPosts({ category, type, status, ownerId });

        // Optional smart sort: urgency (priority) desc, then recency
        if ((sort || "").toLowerCase() === "smart") {
            const weight = (p) => {
                const v = (p.priority || "").toString().toLowerCase();
                if (v === "emergency" || v === "urgent" || v === "high")
                    return 3;
                if (v === "medium") return 2;
                if (v === "low") return 1;
                return 0;
            };
            posts.sort((a, b) => {
                const uw = weight(b) - weight(a); // higher weight first
                if (uw !== 0) return uw;
                const at = new Date(a.createdAt).getTime();
                const bt = new Date(b.createdAt).getTime();
                return bt - at; // newer first
            });
        }

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

const update = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id } = req.params;
        const existing = await Post.getPostById(id);
        if (!existing)
            return res.status(404).json({ message: "Post not found" });
        if (existing.ownerId?.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const changes = Object.keys(req.body || {});
        const updated = await Post.updatePostFields(id, req.body || {});
        if (!updated)
            return res.status(400).json({ message: "Nothing to update" });
        await addLog({
            userId: req.user.id,
            action: "post_updated",
            meta: { postId: id, title: existing.title, changed: changes },
        });
        res.json({ message: "Updated" });
    } catch (error) {
        console.error("❌ Update post error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const remove = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id } = req.params;
        const existing = await Post.getPostById(id);
        if (!existing)
            return res.status(404).json({ message: "Post not found" });
        if (existing.ownerId?.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const ok = await Post.deletePostById(id);
        if (!ok) return res.status(404).json({ message: "Post not found" });
        await addLog({
            userId: req.user.id,
            action: "post_deleted",
            meta: { postId: id, title: existing.title },
        });
        res.json({ message: "Deleted" });
    } catch (error) {
        console.error("❌ Delete post error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    create,
    list,
    updateStatus,
    update,
    remove,
};
