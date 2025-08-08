const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const incidentController = require("../controllers/incidentController");

router.post("/", requireAuth, incidentController.create);
router.get("/", incidentController.list);
router.put("/:id", requireAuth, incidentController.update);
router.delete("/:id", requireAuth, incidentController.remove);

module.exports = router;
