const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const learningController = require("../controllers/learningController");

router.post("/", requireAuth, learningController.create);
router.get("/", learningController.list);
router.put("/:id", requireAuth, learningController.update);
router.delete("/:id", requireAuth, learningController.remove);

module.exports = router;
