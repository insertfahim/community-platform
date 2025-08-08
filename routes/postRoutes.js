const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { requireAuth } = require("../middleware/auth");

console.log("✅ postRoutes loaded");

router.post("/", requireAuth, postController.create);
router.get("/", postController.list);
router.put("/:id/status", requireAuth, postController.updateStatus);

module.exports = router;
