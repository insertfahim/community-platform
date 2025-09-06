const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminController");
const { requireAuth } = require("../middleware/auth");

// All admin routes require authentication
router.use(requireAuth);

// Statistics
router.get("/stats", controller.getStats);

// User management
router.get("/users", controller.getUsers);
router.put("/users/:userId/role", controller.updateUserRole);
router.delete("/users/:userId", controller.deleteUser);

// Volunteer management
router.get("/volunteers/requests", controller.getVolunteerRequests);
router.get("/volunteers/status/:status", controller.getVolunteersByStatus);
router.get("/volunteers/status", controller.getVolunteersByStatus);
router.post("/volunteers/:userId/approve", controller.approveVolunteerStatus);
router.post("/volunteers/:userId/reject", controller.rejectVolunteerStatus);
router.post("/volunteers/:userId/hold", controller.holdVolunteerStatus);
router.post("/volunteers/:userId/revoke", controller.revokeVolunteerStatus);

// Content management
router.delete("/posts/:postId", controller.deletePost);
router.delete("/donations/:donationId", controller.deleteDonation);
router.delete("/events/:eventId", controller.deleteEvent);

// Emergency contacts management
router.post("/emergency", controller.addEmergencyContact);
router.delete("/emergency/:contactId", controller.deleteEmergencyContact);

// Activity logs
router.get("/logs", controller.getLogs);

module.exports = router;
