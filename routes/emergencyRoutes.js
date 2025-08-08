const express = require("express");
const router = express.Router();
const emergencyController = require("../controllers/emergencyController");

router.get("/", emergencyController.getAllContacts);
router.get("/category/:category", emergencyController.getByCategory);
router.get("/search", emergencyController.searchByArea);

if (
    String(process.env.REQUEST_LOGS_ENABLED || "true").toLowerCase() === "true"
) {
    console.log("✅ emergencyRoutes loaded");
}
module.exports = router;
