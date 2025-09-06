const { getSql } = require("../config/db");

// Toggle history logging via env: set HISTORY_LOGS_ENABLED=true to enable
const HISTORY_LOGS_ENABLED =
    String(process.env.HISTORY_LOGS_ENABLED || "false").toLowerCase() ===
    "true";

const addLog = async ({ userId, action, meta }) => {
    if (!HISTORY_LOGS_ENABLED) {
        return null;
    }
    const sql = getSql();
    const rows = await sql`
        insert into history_logs (user_id, action, meta)
        values (${userId}, ${action}, ${meta ? JSON.stringify(meta) : null})
        returning id
    `;
    return String(rows[0].id);
};

const listLogs = async (userId) => {
    if (!HISTORY_LOGS_ENABLED) return [];
    const sql = getSql();
    const rows = await sql`
        select * from history_logs where user_id = ${userId} order by created_at desc
    `;
    return rows;
};

module.exports = {
    addLog,
    listLogs,
};
