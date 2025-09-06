const { getSql } = require("../config/db");

const createEvent = async (data) => {
    const sql = getSql();
    const rows = await sql`
        insert into events (title, description, start_at, end_at, location, owner_id)
        values (${data.title}, ${data.description}, ${data.startAt}, ${data.endAt}, ${data.location}, ${data.ownerId})
        returning id
    `;
    return String(rows[0].id);
};

const listEvents = async (userId, filters = {}) => {
    const sql = getSql();
    const conditions = ["owner_id = $1"];
    const params = [userId];
    if (filters.from) {
        params.push(new Date(filters.from));
        conditions.push(`start_at >= $${params.length}`);
    }
    if (filters.to) {
        params.push(new Date(filters.to));
        conditions.push(`end_at <= $${params.length}`);
    }
    const whereClause = `where ${conditions.join(" and ")}`;
    const query = `
        select * from events
        ${whereClause}
        order by start_at asc
    `;
    const rows = await sql(query, params);
    return rows;
};

const updateEvent = async (id, ownerId, updates) => {
    const sql = getSql();
    const mapping = {
        title: "title",
        description: "description",
        startAt: "start_at",
        endAt: "end_at",
        location: "location",
    };
    const sets = [];
    const params = [];
    for (const [k, v] of Object.entries(updates || {})) {
        if (Object.prototype.hasOwnProperty.call(mapping, k)) {
            params.push(v);
            sets.push(`${mapping[k]} = $${params.length}`);
        }
    }
    if (!sets.length) return undefined;
    params.push(id);
    params.push(ownerId);
    const query = `
        update events
        set ${sets.join(", ")}, updated_at = now()
        where id = $${params.length - 1} and owner_id = $${params.length}
        returning id
    `;
    const rows = await sql(query, params);
    return rows.length ? String(rows[0].id) : undefined;
};

const deleteEvent = async (id, ownerId) => {
    const sql = getSql();
    const rows =
        await sql`delete from events where id = ${id} and owner_id = ${ownerId} returning id`;
    return rows.length > 0;
};

module.exports = {
    createEvent,
    listEvents,
    updateEvent,
    deleteEvent,
};
