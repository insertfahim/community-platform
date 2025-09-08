const { getSql } = require("../config/db");

const createIncidentUpdate = async (updateData) => {
    const sql = getSql();
    const result = await sql`
        insert into incident_updates (
            incident_id, reporter_id, update_text, status_change
        )
        values (
            ${updateData.incidentId}, ${updateData.reporterId}, 
            ${updateData.updateText}, ${updateData.statusChange}
        )
        returning id
    `;
    return result[0]?.id;
};

const getIncidentUpdates = async (incidentId) => {
    const sql = getSql();
    const updates = await sql`
        select 
            iu.*,
            u.name as reporter_name,
            u.username as reporter_username
        from incident_updates iu
        left join users u on iu.reporter_id = u.id
        where iu.incident_id = ${incidentId}
        order by iu.created_at asc
    `;
    return updates;
};

const updateIncidentUpdate = async (updateId, updateText, reporterId) => {
    const sql = getSql();
    const result = await sql`
        update incident_updates
        set 
            update_text = ${updateText},
            updated_at = now()
        where id = ${updateId} and reporter_id = ${reporterId}
        returning id
    `;
    return result.length > 0;
};

const deleteIncidentUpdate = async (updateId, reporterId) => {
    const sql = getSql();
    const result = await sql`
        delete from incident_updates
        where id = ${updateId} and reporter_id = ${reporterId}
        returning id
    `;
    return result.length > 0;
};

const getIncidentUpdateById = async (updateId) => {
    const sql = getSql();
    const result = await sql`
        select 
            iu.*,
            u.name as reporter_name,
            u.username as reporter_username,
            i.title as incident_title
        from incident_updates iu
        left join users u on iu.reporter_id = u.id
        left join incidents i on iu.incident_id = i.id
        where iu.id = ${updateId}
    `;
    return result[0] || null;
};

const getUserIncidentUpdates = async (userId, limit = 20) => {
    const sql = getSql();
    const updates = await sql`
        select 
            iu.*,
            u.name as reporter_name,
            u.username as reporter_username,
            i.title as incident_title,
            i.status as incident_status
        from incident_updates iu
        left join users u on iu.reporter_id = u.id
        left join incidents i on iu.incident_id = i.id
        where iu.reporter_id = ${userId}
        order by iu.created_at desc
        limit ${limit}
    `;
    return updates;
};

module.exports = {
    createIncidentUpdate,
    getIncidentUpdates,
    updateIncidentUpdate,
    deleteIncidentUpdate,
    getIncidentUpdateById,
    getUserIncidentUpdates,
};
