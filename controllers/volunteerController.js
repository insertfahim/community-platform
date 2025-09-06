const {
    requestVolunteer,
    verifyVolunteer,
    approveVolunteer,
    rejectVolunteer,
    holdVolunteer,
    revokeVolunteer,
    listVolunteers,
    upsertVolunteerProfile,
    listVolunteerRequests,
    listVolunteersByStatus,
} = require("../models/User");
const { addLog } = require("../models/HistoryLog");

const ensureAuth = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    return true;
};

const ensureAdmin = (req, res) => {
    if (!ensureAuth(req, res)) return false;
    if (req.user.role !== "admin") {
        res.status(403).json({ message: "Admin access required" });
        return false;
    }
    return true;
};

const request = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const profile = req.body && req.body.profile;
    if (profile && typeof profile !== "object") {
        return res.status(400).json({ message: "profile must be an object" });
    }
    if (profile) {
        await upsertVolunteerProfile(req.user.id, profile);
    } else {
        await requestVolunteer(req.user.id);
    }
    await addLog({ userId: req.user.id, action: "volunteer_requested" });
    res.status(200).json({ message: "Volunteer request submitted" });
};

const approve = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { userId, adminNotes } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    try {
        await approveVolunteer(userId, { adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_approved",
            meta: { targetUserId: userId, adminNotes: adminNotes || null },
        });
        res.json({ message: "Volunteer approved successfully" });
    } catch (error) {
        console.error("Error approving volunteer:", error);
        res.status(500).json({ message: "Failed to approve volunteer" });
    }
};

const reject = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { userId, reason, adminNotes } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    try {
        await rejectVolunteer(userId, { reason, adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_rejected",
            meta: {
                targetUserId: userId,
                reason: reason || null,
                adminNotes: adminNotes || null,
            },
        });
        res.json({ message: "Volunteer rejected successfully" });
    } catch (error) {
        console.error("Error rejecting volunteer:", error);
        res.status(500).json({ message: "Failed to reject volunteer" });
    }
};

const hold = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { userId, adminNotes } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    try {
        await holdVolunteer(userId, { adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_held",
            meta: { targetUserId: userId, adminNotes: adminNotes || null },
        });
        res.json({ message: "Volunteer status set to hold successfully" });
    } catch (error) {
        console.error("Error holding volunteer:", error);
        res.status(500).json({ message: "Failed to hold volunteer" });
    }
};

const revoke = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { userId, reason, adminNotes } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    try {
        await revokeVolunteer(userId, { reason, adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_revoked",
            meta: {
                targetUserId: userId,
                reason: reason || null,
                adminNotes: adminNotes || null,
            },
        });
        res.json({ message: "Volunteer status revoked successfully" });
    } catch (error) {
        console.error("Error revoking volunteer:", error);
        res.status(500).json({ message: "Failed to revoke volunteer" });
    }
};

// Legacy verify function for backward compatibility
const verify = async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { userId, verified, reason, adminNotes } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    try {
        await verifyVolunteer(userId, !!verified, { reason, adminNotes });
        await addLog({
            userId: req.user.id,
            action: "volunteer_verified",
            meta: {
                targetUserId: userId,
                verified: !!verified,
                reason: reason || null,
            },
        });
        res.json({ message: "Volunteer verified status updated" });
    } catch (error) {
        console.error("Error verifying volunteer:", error);
        res.status(500).json({ message: "Failed to verify volunteer" });
    }
};

const list = async (req, res) => {
    const filters = {};
    if (typeof req.query.verified !== "undefined") {
        filters.verified = String(req.query.verified) === "true";
    }
    if (req.query.location) filters.location = String(req.query.location);
    if (req.query.skills) {
        try {
            const parsed = JSON.parse(String(req.query.skills));
            if (Array.isArray(parsed)) filters.skills = parsed;
        } catch (_) {
            // allow comma separated fallback
            filters.skills = String(req.query.skills)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }
    }
    if (req.query.q) filters.q = String(req.query.q);

    try {
        const volunteers = await listVolunteers(filters);
        res.json({ volunteers });
    } catch (error) {
        console.error("Error listing volunteers:", error);
        res.status(500).json({ message: "Failed to list volunteers" });
    }
};

const listByStatus = async (req, res) => {
    const { status } = req.params;
    const validStatuses = [
        "pending",
        "approved",
        "rejected",
        "hold",
        "revoked",
    ];

    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
            message:
                "Invalid status. Valid statuses: " + validStatuses.join(", "),
        });
    }

    try {
        const volunteers = await listVolunteersByStatus(status || null);
        res.json({ volunteers });
    } catch (error) {
        console.error("Error listing volunteers by status:", error);
        res.status(500).json({
            message: "Failed to list volunteers by status",
        });
    }
};

const queue = async (req, res) => {
    if (!ensureAdmin(req, res)) return;

    try {
        const pending = await listVolunteerRequests();
        res.json({ pending });
    } catch (error) {
        console.error("Error fetching volunteer queue:", error);
        res.status(500).json({ message: "Failed to fetch volunteer queue" });
    }
};

module.exports = {
    request,
    verify, // legacy function for backward compatibility
    approve,
    reject,
    hold,
    revoke,
    list,
    listByStatus,
    queue,
};
