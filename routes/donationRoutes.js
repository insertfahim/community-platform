const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const donationController = require("../controllers/donationController");

router.post("/", requireAuth, donationController.create);
router.get("/", donationController.list);
router.put("/:id/status", requireAuth, donationController.updateStatus);
router.put("/:id", requireAuth, donationController.update);
router.delete("/:id", requireAuth, donationController.remove);

module.exports = router;
