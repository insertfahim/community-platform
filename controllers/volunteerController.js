const {
    requestVolunteer,
    verifyVolunteer,
    listVolunteers,
    upsertVolunteerProfile,
    listVolunteerRequests,
} = require("../models/User");
const { addLog } = require("../models/HistoryLog");

const ensureAuth = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
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

const verify = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
    const { userId, verified, reason, adminNotes } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    await verifyVolunteer(userId, !!verified, { reason, adminNotes });
    await addLog({
        userId: req.user.id,
        action: "volunteer_verified",
        meta: { userId, verified: !!verified, reason: reason || null },
    });
    res.json({ message: "Volunteer verified status updated" });
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
    const volunteers = await listVolunteers(filters);
    res.json({ volunteers });
};

const queue = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
    const pending = await listVolunteerRequests();
    res.json({ pending });
};

module.exports = { request, verify, list, queue };
