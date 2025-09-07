const Learning = require("../models/Learning");
const { addLog } = require("../models/HistoryLog");

const create = async (req, res) => {
    try {
        const {
            title,
            description,
            subject,
            level,
            sessionType,
            location,
            contactInfo,
        } = req.body;

        if (
            !title ||
            !description ||
            !subject ||
            !level ||
            !sessionType ||
            !location ||
            !contactInfo
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const sessionData = {
            title,
            description,
            subject,
            level,
            sessionType,
            location,
            contactInfo,
            ownerId: req.user ? req.user.id : undefined,
            status: "active",
        };

        const sessionId = await Learning.createLearningSession(sessionData);

        if (req.user && sessionId) {
            await addLog({
                userId: req.user.id,
                action: "learning_session_created",
                meta: {
                    sessionId,
                    title,
                    subject,
                    sessionType,
                },
            });
        }

        return res.status(201).json({
            message: "Learning session created successfully",
            sessionId,
        });
    } catch (error) {
        console.error("❌ Create learning session error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const list = async (req, res) => {
    try {
        const { subject, level, sessionType, status, ownerId } = req.query;
        const sessions = await Learning.listLearningSessions({
            subject,
            level,
            sessionType,
            status,
            ownerId,
        });

        res.status(200).json({ sessions });
    } catch (error) {
        console.error("❌ List learning sessions error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const sessionId = parseInt(id);

        if (!sessionId) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const updated = await Learning.updateLearningSession(
            sessionId,
            req.user.id,
            req.body
        );

        if (!updated) {
            return res.status(404).json({
                message:
                    "Learning session not found or you don't have permission to update it",
            });
        }

        await addLog({
            userId: req.user.id,
            action: "learning_session_updated",
            meta: { sessionId },
        });

        res.json({ message: "Learning session updated successfully" });
    } catch (error) {
        console.error("❌ Update learning session error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const sessionId = parseInt(id);

        if (!sessionId) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const deleted = await Learning.deleteLearningSession(
            sessionId,
            req.user.id
        );

        if (!deleted) {
            return res.status(404).json({
                message:
                    "Learning session not found or you don't have permission to delete it",
            });
        }

        await addLog({
            userId: req.user.id,
            action: "learning_session_deleted",
            meta: { sessionId },
        });

        res.json({ message: "Learning session deleted successfully" });
    } catch (error) {
        console.error("❌ Delete learning session error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const sessionId = parseInt(id);

        if (!sessionId) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const session = await Learning.getLearningSessionById(sessionId);

        if (!session) {
            return res
                .status(404)
                .json({ message: "Learning session not found" });
        }

        res.json({ session });
    } catch (error) {
        console.error("❌ Get learning session error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    create,
    list,
    update,
    remove,
    getById,
};
