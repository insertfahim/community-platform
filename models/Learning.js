const { getSql } = require("../config/db");

const createLearningSession = async (sessionData) => {
    const sql = getSql();
    const result = await sql`
        insert into learning_sessions (
            title, description, subject, level, session_type, 
            location, contact_info, owner_id, status
        )
        values (
            ${sessionData.title}, ${sessionData.description}, 
            ${sessionData.subject}, ${sessionData.level}, 
            ${sessionData.sessionType}, ${sessionData.location}, 
            ${sessionData.contactInfo}, ${sessionData.ownerId}, 
            ${sessionData.status || "active"}
        )
        returning id
    `;
    return result[0]?.id;
};

const listLearningSessions = async (filters = {}) => {
    console.log("🔍 DEBUG: listLearningSessions called with filters:", filters);
    const sql = getSql();

    try {
        // Start with base query
        let query = sql`
            select 
                ls.*,
                u.name as owner_name,
                u.username as owner_username
            from learning_sessions ls
            join users u on ls.owner_id = u.id
        `;

        // Apply filters dynamically
        let conditions = [];

        if (filters.subject) {
            conditions.push(sql`subject ilike ${"%" + filters.subject + "%"}`);
        }

        if (filters.level) {
            conditions.push(sql`level = ${filters.level}`);
        }

        if (filters.sessionType) {
            conditions.push(sql`session_type = ${filters.sessionType}`);
        }

        if (filters.status) {
            conditions.push(sql`status = ${filters.status}`);
        }

        if (filters.ownerId) {
            conditions.push(sql`owner_id = ${filters.ownerId}`);
        }

        // If no filters, get all sessions
        if (conditions.length === 0) {
            const sessions = await sql`
                select 
                    ls.*,
                    u.name as owner_name,
                    u.username as owner_username
                from learning_sessions ls
                join users u on ls.owner_id = u.id
                order by ls.created_at desc
            `;
            console.log(
                "🔍 DEBUG: Retrieved sessions (no filters):",
                sessions.length
            );
            return sessions;
        }

        // This is complex with postgres.js, so let's use a simple approach for now
        // Just return all sessions and filter in memory if needed
        const allSessions = await sql`
            select 
                ls.*,
                u.name as owner_name,
                u.username as owner_username
            from learning_sessions ls
            join users u on ls.owner_id = u.id
            order by ls.created_at desc
        `;

        console.log("🔍 DEBUG: All sessions from DB:", allSessions.length);

        // Apply filters in memory for now (not ideal but will work)
        let filteredSessions = allSessions;

        if (filters.subject) {
            filteredSessions = filteredSessions.filter((s) =>
                s.subject.toLowerCase().includes(filters.subject.toLowerCase())
            );
        }

        if (filters.level) {
            filteredSessions = filteredSessions.filter(
                (s) => s.level === filters.level
            );
        }

        if (filters.sessionType) {
            filteredSessions = filteredSessions.filter(
                (s) => s.session_type === filters.sessionType
            );
        }

        if (filters.status) {
            filteredSessions = filteredSessions.filter(
                (s) => s.status === filters.status
            );
        }

        if (filters.ownerId) {
            filteredSessions = filteredSessions.filter(
                (s) => s.owner_id === parseInt(filters.ownerId)
            );
        }

        console.log("🔍 DEBUG: Filtered sessions:", filteredSessions.length);
        return filteredSessions;
    } catch (error) {
        console.error("❌ Error in listLearningSessions:", error);
        throw error;
    }
};

const updateLearningSession = async (sessionId, ownerId, updates) => {
    const sql = getSql();
    const {
        title,
        description,
        subject,
        level,
        sessionType,
        location,
        contactInfo,
        status,
    } = updates;

    const result = await sql`
        update learning_sessions
        set 
            title = coalesce(${title}, title),
            description = coalesce(${description}, description),
            subject = coalesce(${subject}, subject),
            level = coalesce(${level}, level),
            session_type = coalesce(${sessionType}, session_type),
            location = coalesce(${location}, location),
            contact_info = coalesce(${contactInfo}, contact_info),
            status = coalesce(${status}, status),
            updated_at = now()
        where id = ${sessionId} and owner_id = ${ownerId}
        returning id
    `;
    return result.length > 0;
};

const deleteLearningSession = async (sessionId, ownerId) => {
    const sql = getSql();
    const result = await sql`
        delete from learning_sessions
        where id = ${sessionId} and owner_id = ${ownerId}
        returning id
    `;
    return result.length > 0;
};

const getLearningSessionById = async (sessionId) => {
    const sql = getSql();
    const result = await sql`
        select 
            ls.*,
            u.name as owner_name,
            u.username as owner_username
        from learning_sessions ls
        join users u on ls.owner_id = u.id
        where ls.id = ${sessionId}
    `;
    return result[0] || null;
};

module.exports = {
    createLearningSession,
    listLearningSessions,
    updateLearningSession,
    deleteLearningSession,
    getLearningSessionById,
};
