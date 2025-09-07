const { getSql } = require("../config/db");

const createIncident = async (incidentData) => {
    const sql = getSql();
    const result = await sql`
        insert into incidents (
            title, description, category, severity, location, 
            reporter_id, contact_info, status
        )
        values (
            ${incidentData.title}, ${incidentData.description}, 
            ${incidentData.category}, ${incidentData.severity}, 
            ${incidentData.location}, ${incidentData.reporterId}, 
            ${incidentData.contactInfo}, ${incidentData.status || "reported"}
        )
        returning id
    `;
    return result[0]?.id;
};

const listIncidents = async (filters = {}) => {
    const sql = getSql();
    let whereConditions = [];
    let params = [];

    if (filters.category) {
        whereConditions.push(`category = $${params.length + 1}`);
        params.push(filters.category);
    }

    if (filters.severity) {
        whereConditions.push(`severity = $${params.length + 1}`);
        params.push(filters.severity);
    }

    if (filters.status) {
        whereConditions.push(`status = $${params.length + 1}`);
        params.push(filters.status);
    }

    if (filters.reporterId) {
        whereConditions.push(`reporter_id = $${params.length + 1}`);
        params.push(filters.reporterId);
    }

    const whereClause =
        whereConditions.length > 0
            ? `where ${whereConditions.join(" and ")}`
            : "";

    if (params.length === 0) {
        if (whereConditions.length === 0) {
            // No filters, simple query
            const incidents = await sql`
                select
                    i.*,
                    reporter.name as reporter_name,
                    reporter.username as reporter_username,
                    resolver.name as resolved_by_name,
                    resolver.username as resolved_by_username
                from incidents i
                left join users reporter on i.reporter_id = reporter.id
                left join users resolver on i.resolved_by = resolver.id
                order by
                    case when i.status = 'reported' then 1
                         when i.status = 'investigating' then 2
                         else 3 end,
                    case when i.severity = 'critical' then 1
                         when i.severity = 'high' then 2
                         when i.severity = 'medium' then 3
                         else 4 end,
                    i.created_at desc
            `;
            return incidents;
        } else {
            // This shouldn't happen since params.length === 0 means no filters
            return [];
        }
    } else {
        // For queries with parameters, use unsafe with proper parameter substitution
        const queryString = `
            select
                i.*,
                reporter.name as reporter_name,
                reporter.username as reporter_username,
                resolver.name as resolved_by_name,
                resolver.username as resolved_by_username
            from incidents i
            left join users reporter on i.reporter_id = reporter.id
            left join users resolver on i.resolved_by = resolver.id
            where ${whereConditions.join(" and ")}
            order by
                case when i.status = 'reported' then 1
                     when i.status = 'investigating' then 2
                     else 3 end,
                case when i.severity = 'critical' then 1
                     when i.severity = 'high' then 2
                     when i.severity = 'medium' then 3
                     else 4 end,
                i.created_at desc
        `;
        return await sql.unsafe(queryString, params);
    }
};

const updateIncident = async (incidentId, updates, userId = null) => {
    const sql = getSql();
    const {
        title,
        description,
        category,
        severity,
        location,
        contactInfo,
        status,
        resolutionNotes,
    } = updates;

    // If status is being changed to resolved/closed, set resolved_by and resolved_at
    const setResolvedFields =
        (status === "resolved" || status === "closed") && userId;

    const result = await sql`
        update incidents
        set 
            title = coalesce(${title}, title),
            description = coalesce(${description}, description),
            category = coalesce(${category}, category),
            severity = coalesce(${severity}, severity),
            location = coalesce(${location}, location),
            contact_info = coalesce(${contactInfo}, contact_info),
            status = coalesce(${status}, status),
            resolution_notes = coalesce(${resolutionNotes}, resolution_notes),
            resolved_by = case when ${setResolvedFields} then ${userId} else resolved_by end,
            resolved_at = case when ${setResolvedFields} then now() else resolved_at end,
            updated_at = now()
        where id = ${incidentId}
        returning id
    `;
    return result.length > 0;
};

const deleteIncident = async (incidentId, reporterId) => {
    const sql = getSql();
    const result = await sql`
        delete from incidents
        where id = ${incidentId} and reporter_id = ${reporterId}
        returning id
    `;
    return result.length > 0;
};

const getIncidentById = async (incidentId) => {
    const sql = getSql();
    const result = await sql`
        select 
            i.*,
            reporter.name as reporter_name,
            reporter.username as reporter_username,
            resolver.name as resolved_by_name,
            resolver.username as resolved_by_username
        from incidents i
        left join users reporter on i.reporter_id = reporter.id
        left join users resolver on i.resolved_by = resolver.id
        where i.id = ${incidentId}
    `;
    return result[0] || null;
};

const getIncidentStats = async () => {
    const sql = getSql();
    const stats = await sql`
        select 
            count(*) as total,
            count(case when status = 'reported' then 1 end) as reported,
            count(case when status = 'investigating' then 1 end) as investigating,
            count(case when status = 'resolved' then 1 end) as resolved,
            count(case when status = 'closed' then 1 end) as closed,
            count(case when severity = 'critical' then 1 end) as critical,
            count(case when severity = 'high' then 1 end) as high,
            count(case when created_at > now() - interval '7 days' then 1 end) as recent
        from incidents
    `;
    return stats[0] || {};
};

module.exports = {
    createIncident,
    listIncidents,
    updateIncident,
    deleteIncident,
    getIncidentById,
    getIncidentStats,
};
