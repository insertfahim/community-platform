const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const eventController = require("../controllers/eventController");

router.post("/", requireAuth, eventController.create);
router.get("/", requireAuth, eventController.list);
router.put("/:id", requireAuth, eventController.update);
router.delete("/:id", requireAuth, eventController.remove);

module.exports = router;
