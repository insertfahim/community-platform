const {
    createDonation,
    listDonations,
    updateDonationStatus,
} = require("../models/Donation");
const { addLog } = require("../models/HistoryLog");

const ensureAuth = (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }
    return true;
};

const create = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { kind, description, location, contact } = req.body;
    if (!kind || !description || !location || !contact) {
        return res.status(400).json({ message: "All fields are required." });
    }
    const id = await createDonation({
        kind,
        description,
        location,
        contact,
        ownerId: req.user.id,
    });
    await addLog({
        userId: req.user.id,
        action: "donation_created",
        meta: { donationId: id },
    });
    res.status(201).json({ donationId: id });
};

const list = async (req, res) => {
    const { kind, status } = req.query;
    const donations = await listDonations({ kind, status });
    res.json({ donations });
};

const updateStatus = async (req, res) => {
    if (!ensureAuth(req, res)) return;
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["available", "claimed", "donated"];
    if (!allowed.includes(status))
        return res.status(400).json({ message: "Invalid status" });
    const updated = await updateDonationStatus(id, status);
    if (!updated)
        return res.status(404).json({ message: "Donation not found" });
    await addLog({
        userId: req.user.id,
        action: "donation_status_updated",
        meta: { donationId: id, status },
    });
    res.json({ message: "Updated" });
};

module.exports = {
    create,
    list,
    updateStatus,
};
