const Incident = require("../models/Incident");
const { addLog } = require("../models/HistoryLog");

const create = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            severity,
            location,
            contactInfo,
        } = req.body;

        if (!title || !description || !category || !severity || !location) {
            return res.status(400).json({
                message:
                    "Title, description, category, severity, and location are required",
            });
        }

        const incidentData = {
            title,
            description,
            category,
            severity,
            location,
            contactInfo,
            reporterId: req.user ? req.user.id : null,
            status: "reported",
        };

        const incidentId = await Incident.createIncident(incidentData);

        if (req.user && incidentId) {
            await addLog({
                userId: req.user.id,
                action: "incident_reported",
                meta: {
                    incidentId,
                    title,
                    category,
                    severity,
                },
            });
        }

        return res.status(201).json({
            message: "Incident reported successfully",
            incidentId,
        });
    } catch (error) {
        console.error("❌ Create incident error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const list = async (req, res) => {
    try {
        const { category, severity, status, reporterId } = req.query;
        const incidents = await Incident.listIncidents({
            category,
            severity,
            status,
            reporterId,
        });

        res.status(200).json({ incidents });
    } catch (error) {
        console.error("❌ List incidents error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const incidentId = parseInt(id);

        if (!incidentId) {
            return res.status(400).json({ message: "Invalid incident ID" });
        }

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Get the incident to check permissions
        const incident = await Incident.getIncidentById(incidentId);
        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        // Only the reporter or admin can update basic info
        // Admin can update status and resolution
        const isOwner = incident.reporter_id === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "You don't have permission to update this incident",
            });
        }

        // Admins can update status and resolution, owners can update basic info
        const allowedUpdates = isAdmin
            ? req.body
            : {
                  title: req.body.title,
                  description: req.body.description,
                  category: req.body.category,
                  severity: req.body.severity,
                  location: req.body.location,
                  contactInfo: req.body.contactInfo,
              };

        const updated = await Incident.updateIncident(
            incidentId,
            allowedUpdates,
            req.user.id
        );

        if (!updated) {
            return res
                .status(500)
                .json({ message: "Failed to update incident" });
        }

        const actionType = isAdmin
            ? "incident_updated_admin"
            : "incident_updated";
        await addLog({
            userId: req.user.id,
            action: actionType,
            meta: { incidentId },
        });

        res.json({ message: "Incident updated successfully" });
    } catch (error) {
        console.error("❌ Update incident error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const incidentId = parseInt(id);

        if (!incidentId) {
            return res.status(400).json({ message: "Invalid incident ID" });
        }

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const deleted = await Incident.deleteIncident(incidentId, req.user.id);

        if (!deleted) {
            return res.status(404).json({
                message:
                    "Incident not found or you don't have permission to delete it",
            });
        }

        await addLog({
            userId: req.user.id,
            action: "incident_deleted",
            meta: { incidentId },
        });

        res.json({ message: "Incident deleted successfully" });
    } catch (error) {
        console.error("❌ Delete incident error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const incidentId = parseInt(id);

        if (!incidentId) {
            return res.status(400).json({ message: "Invalid incident ID" });
        }

        const { includeUpdates } = req.query;

        let incident;
        if (includeUpdates === "true") {
            incident = await Incident.getIncidentWithUpdates(incidentId);
        } else {
            incident = await Incident.getIncidentById(incidentId);
        }

        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        res.json({ incident });
    } catch (error) {
        console.error("❌ Get incident error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getStats = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const stats = await Incident.getIncidentStats();
        res.json({ stats });
    } catch (error) {
        console.error("❌ Get incident stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    create,
    list,
    update,
    remove,
    getById,
    getStats,
};
