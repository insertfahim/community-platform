const { listLogs } = require("../models/HistoryLog");

const getUserLogs = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { limit = 50, offset = 0 } = req.query;
        const logs = await listLogs(req.user.id);

        // Apply pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedLogs = logs.slice(startIndex, endIndex);

        // Parse meta data for each log
        const formattedLogs = paginatedLogs.map((log) => ({
            ...log,
            meta: log.meta ? JSON.parse(log.meta) : null,
        }));

        res.json({
            logs: formattedLogs,
            total: logs.length,
            hasMore: endIndex < logs.length,
        });
    } catch (error) {
        console.error("❌ Get user logs error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getLogStats = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const logs = await listLogs(req.user.id);

        // Calculate stats
        const stats = {
            total: logs.length,
            thisWeek: logs.filter((log) => {
                const logDate = new Date(log.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return logDate >= weekAgo;
            }).length,
            thisMonth: logs.filter((log) => {
                const logDate = new Date(log.created_at);
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return logDate >= monthAgo;
            }).length,
            actionTypes: {},
        };

        // Count action types
        logs.forEach((log) => {
            stats.actionTypes[log.action] =
                (stats.actionTypes[log.action] || 0) + 1;
        });

        res.json({ stats });
    } catch (error) {
        console.error("❌ Get log stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getUserLogs,
    getLogStats,
};
