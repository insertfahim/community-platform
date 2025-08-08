const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const historyController = require("../controllers/historyController");

router.post("/", requireAuth, historyController.record);
router.get("/", requireAuth, historyController.list);

module.exports = router;
