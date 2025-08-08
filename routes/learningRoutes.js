const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const learningController = require("../controllers/learningController");

router.post("/", requireAuth, learningController.create);
router.get("/", learningController.list);

module.exports = router;
