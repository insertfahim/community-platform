const IncidentUpdate = require("../models/IncidentUpdate");
const Incident = require("../models/Incident");
const { addLog } = require("../models/HistoryLog");

const create = async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { updateText, statusChange } = req.body;

        if (!updateText || updateText.trim().length === 0) {
            return res.status(400).json({
                message: "Update text is required",
            });
        }

        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const incident = await Incident.getIncidentById(parseInt(incidentId));
        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        // Only the original reporter can add updates
        if (incident.reporter_id !== req.user.id) {
            return res.status(403).json({
                message: "Only the incident reporter can add updates",
            });
        }

        const updateData = {
            incidentId: parseInt(incidentId),
            reporterId: req.user.id,
            updateText: updateText.trim(),
            statusChange: statusChange || null,
        };

        const updateId = await IncidentUpdate.createIncidentUpdate(updateData);

        if (req.user && updateId) {
            await addLog({
                userId: req.user.id,
                action: "incident_update_added",
                meta: {
                    incidentId: parseInt(incidentId),
                    updateId,
                    hasStatusChange: !!statusChange,
                },
            });
        }

        return res.status(201).json({
            message: "Incident update added successfully",
            updateId,
        });
    } catch (error) {
        console.error("❌ Create incident update error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getByIncident = async (req, res) => {
    try {
        const { incidentId } = req.params;

        const incident = await Incident.getIncidentById(parseInt(incidentId));
        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        const updates = await IncidentUpdate.getIncidentUpdates(
            parseInt(incidentId)
        );

        res.status(200).json({ updates });
    } catch (error) {
        console.error("❌ Get incident updates error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const update = async (req, res) => {
    try {
        const { updateId } = req.params;
        const { updateText } = req.body;

        if (!updateText || updateText.trim().length === 0) {
            return res.status(400).json({
                message: "Update text is required",
            });
        }

        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const existingUpdate = await IncidentUpdate.getIncidentUpdateById(
            parseInt(updateId)
        );
        if (!existingUpdate) {
            return res.status(404).json({ message: "Update not found" });
        }

        // Only the update creator can edit it
        if (existingUpdate.reporter_id !== req.user.id) {
            return res.status(403).json({
                message: "You can only edit your own updates",
            });
        }

        const updated = await IncidentUpdate.updateIncidentUpdate(
            parseInt(updateId),
            updateText.trim(),
            req.user.id
        );

        if (!updated) {
            return res.status(500).json({ message: "Failed to update" });
        }

        await addLog({
            userId: req.user.id,
            action: "incident_update_edited",
            meta: { updateId: parseInt(updateId) },
        });

        res.json({ message: "Update edited successfully" });
    } catch (error) {
        console.error("❌ Update incident update error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const remove = async (req, res) => {
    try {
        const { updateId } = req.params;

        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const existingUpdate = await IncidentUpdate.getIncidentUpdateById(
            parseInt(updateId)
        );
        if (!existingUpdate) {
            return res.status(404).json({ message: "Update not found" });
        }

        // Only the update creator can delete it
        if (existingUpdate.reporter_id !== req.user.id) {
            return res.status(403).json({
                message: "You can only delete your own updates",
            });
        }

        const deleted = await IncidentUpdate.deleteIncidentUpdate(
            parseInt(updateId),
            req.user.id
        );

        if (!deleted) {
            return res.status(500).json({ message: "Failed to delete update" });
        }

        await addLog({
            userId: req.user.id,
            action: "incident_update_deleted",
            meta: { updateId: parseInt(updateId) },
        });

        res.json({ message: "Update deleted successfully" });
    } catch (error) {
        console.error("❌ Delete incident update error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getByUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { limit } = req.query;
        const updates = await IncidentUpdate.getUserIncidentUpdates(
            req.user.id,
            limit ? parseInt(limit) : 20
        );

        res.status(200).json({ updates });
    } catch (error) {
        console.error("❌ Get user incident updates error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    create,
    getByIncident,
    update,
    remove,
    getByUser,
};
