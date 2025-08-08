console.log("✅ authRoutes loaded");
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/me", (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.json({ user: req.user });
});

module.exports = router;
