const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { requireAuth } = require("../middleware/auth");

if (
    String(process.env.REQUEST_LOGS_ENABLED || "true").toLowerCase() === "true"
) {
    console.log("✅ postRoutes loaded");
}

router.post("/", requireAuth, postController.create);
router.get("/", postController.list);
router.put("/:id/status", requireAuth, postController.updateStatus);
router.put("/:id", requireAuth, postController.update);
router.delete("/:id", requireAuth, postController.remove);

module.exports = router;
