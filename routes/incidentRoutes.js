const express = require("express");
const router = express.Router();
const incidentController = require("../controllers/incidentController");
const { requireAuth, requireRole } = require("../middleware/auth");

// Public routes
router.get("/", incidentController.list);
router.get("/:id", incidentController.getById);

// Protected routes (require authentication)
router.post("/", incidentController.create); // Allow anonymous reporting
router.put("/:id", requireAuth, incidentController.update);
router.delete("/:id", requireAuth, incidentController.remove);

// Admin-only routes
router.get(
    "/admin/stats",
    requireAuth,
    requireRole("admin"),
    incidentController.getStats
);

module.exports = router;
