const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/volunteerController");

// Public routes
router.get("/", controller.list);
router.get("/status/:status", controller.listByStatus);

// Authenticated routes
router.post("/request", requireAuth, controller.request);

// Admin routes
router.get("/queue", requireAuth, controller.queue); // requires admin in controller
router.post("/verify", requireAuth, controller.verify); // legacy - requires admin in controller
router.post("/approve", requireAuth, controller.approve); // requires admin in controller
router.post("/reject", requireAuth, controller.reject); // requires admin in controller
router.post("/hold", requireAuth, controller.hold); // requires admin in controller
router.post("/revoke", requireAuth, controller.revoke); // requires admin in controller

module.exports = router;
