const express = require("express");
const router = express.Router();
const learningController = require("../controllers/learningController");
const { requireAuth } = require("../middleware/auth");

// Public routes
router.get("/", learningController.list);
router.get("/:id", learningController.getById);

// Protected routes (require authentication)
router.post("/", requireAuth, learningController.create);
router.put("/:id", requireAuth, learningController.update);
router.delete("/:id", requireAuth, learningController.remove);

module.exports = router;
