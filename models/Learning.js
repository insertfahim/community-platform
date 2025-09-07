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
    const sql = getSql();
    let whereConditions = [];
    let params = [];

    if (filters.subject) {
        whereConditions.push(`subject ilike $${params.length + 1}`);
        params.push(`%${filters.subject}%`);
    }

    if (filters.level) {
        whereConditions.push(`level = $${params.length + 1}`);
        params.push(filters.level);
    }

    if (filters.sessionType) {
        whereConditions.push(`session_type = $${params.length + 1}`);
        params.push(filters.sessionType);
    }

    if (filters.status) {
        whereConditions.push(`status = $${params.length + 1}`);
        params.push(filters.status);
    }

    if (filters.ownerId) {
        whereConditions.push(`owner_id = $${params.length + 1}`);
        params.push(filters.ownerId);
    }

    const whereClause =
        whereConditions.length > 0
            ? `where ${whereConditions.join(" and ")}`
            : "";

    // Use template literal with dynamic where clause
    const query = `
        select 
            ls.*,
            u.name as owner_name,
            u.username as owner_username
        from learning_sessions ls
        join users u on ls.owner_id = u.id
        ${whereClause}
        order by ls.created_at desc
    `;

    if (params.length === 0) {
        return await sql.unsafe(query);
    }

    // For parameterized queries, we need to use unsafe with manual parameter binding
    const sessions = await sql.unsafe(query, params);
    return sessions;
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
