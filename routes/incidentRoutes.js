const express = require("express");
const router = express.Router();
const incidentController = require("../controllers/incidentController");
const incidentUpdateController = require("../controllers/incidentUpdateController");
const { requireAuth, requireRole } = require("../middleware/auth");

// Public routes
router.get("/", incidentController.list);
router.get("/:id", incidentController.getById);

// Protected routes (require authentication)
router.post("/", incidentController.create); // Allow anonymous reporting
router.put("/:id", requireAuth, incidentController.update);
router.delete("/:id", requireAuth, incidentController.remove);

// Incident updates routes
router.post(
    "/:incidentId/updates",
    requireAuth,
    incidentUpdateController.create
);
router.get("/:incidentId/updates", incidentUpdateController.getByIncident);
router.put("/updates/:updateId", requireAuth, incidentUpdateController.update);
router.delete(
    "/updates/:updateId",
    requireAuth,
    incidentUpdateController.remove
);
router.get("/my-updates", requireAuth, incidentUpdateController.getByUser);

// Admin-only routes
router.get(
    "/admin/stats",
    requireAuth,
    requireRole("admin"),
    incidentController.getStats
);

module.exports = router;
