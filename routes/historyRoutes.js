const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");
const { requireAuth } = require("../middleware/auth");

// All history routes require authentication
router.use(requireAuth);

// Get user's activity logs
router.get("/", historyController.getUserLogs);

// Get user's activity stats
router.get("/stats", historyController.getLogStats);

module.exports = router;
