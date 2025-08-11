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
    const where = [sql`owner_id = ${userId}`];
    if (filters.from) where.push(sql`start_at >= ${new Date(filters.from)}`);
    if (filters.to) where.push(sql`end_at <= ${new Date(filters.to)}`);
    const rows = await sql`
        select * from events
        where ${sql.join(where, sql` and `)}
        order by start_at asc
    `;
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
    for (const [k, v] of Object.entries(updates || {})) {
        if (Object.prototype.hasOwnProperty.call(mapping, k)) {
            sets.push(sql([`${mapping[k]} = `], [v]));
        }
    }
    if (!sets.length) return undefined;
    const rows = await sql`
        update events set ${sql.join(sets, sql`, `)}, updated_at = now()
        where id = ${id} and owner_id = ${ownerId}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const deleteEvent = async (id, ownerId) => {
    const sql = getSql();
    const rows = await sql`delete from events where id = ${id} and owner_id = ${ownerId} returning id`;
    return rows.length > 0;
};

module.exports = {
    createEvent,
    listEvents,
    updateEvent,
    deleteEvent,
};
