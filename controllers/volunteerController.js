const {
    requestVolunteer,
    verifyVolunteer,
    listVolunteers,
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
    await requestVolunteer(req.user.id);
    await addLog({ userId: req.user.id, action: "volunteer_requested" });
    res.status(200).json({ message: "Volunteer status requested" });
};

const verify = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
    const { userId, verified } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    await verifyVolunteer(userId, !!verified);
    await addLog({
        userId: req.user.id,
        action: "volunteer_verified",
        meta: { userId, verified: !!verified },
    });
    res.json({ message: "Volunteer verified status updated" });
};

const list = async (_req, res) => {
    const volunteers = await listVolunteers();
    res.json({ volunteers });
};

module.exports = { request, verify, list };
