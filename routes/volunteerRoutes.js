const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/volunteerController");

router.post("/request", requireAuth, controller.request);
router.post("/verify", requireAuth, controller.verify); // requires admin in controller
router.get("/", controller.list);
router.get("/queue", requireAuth, controller.queue);

module.exports = router;
