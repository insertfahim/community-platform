if (
    String(process.env.REQUEST_LOGS_ENABLED || "true").toLowerCase() === "true"
) {
    console.log("✅ authRoutes loaded");
}
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { findUserById, findUserByUsername } = require("../models/User");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/me", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
        const full = await findUserById(req.user.id);
        if (!full) return res.status(404).json({ message: "User not found" });
        const { password, _id, id, ...rest } = full;
        res.json({ user: { id: full.id, ...rest } });
    } catch (e) {
        console.error("/me error:", e);
        res.status(500).json({ message: "Server error" });
    }
});

// Resolve username -> userId (for messaging)
router.get("/resolve-username", async (req, res) => {
    try {
        const q = (req.query.u || "").toString().trim();
        if (!q) return res.status(400).json({ message: "username required" });
        const user = await findUserByUsername(q);
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.json({
            userId: user.id,
            username: user.username,
            name: user.name,
        });
    } catch (e) {
        console.error("resolve-username error:", e);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
