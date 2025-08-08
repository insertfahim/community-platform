const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const { UserModel } = require("../models/User");

// All admin routes require admin role
router.use(requireAuth, requireRole("admin"));

// List users (basic fields)
router.get("/users", async (_req, res) => {
    try {
        const users = await UserModel.find({})
            .select(
                "name email role isVolunteer isVolunteerVerified created_at"
            )
            .lean();
        res.json({ users });
    } catch (e) {
        console.error("Admin list users error:", e);
        res.status(500).json({ message: "Server error" });
    }
});

// Change a user's role
router.post("/users/:id/role", async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const updated = await UserModel.findByIdAndUpdate(
            id,
            { $set: { role } },
            { new: true }
        )
            .select("name email role")
            .lean();
        if (!updated)
            return res.status(404).json({ message: "User not found" });
        res.json({ user: updated });
    } catch (e) {
        console.error("Admin set role error:", e);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
