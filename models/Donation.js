const { getSql } = require("../config/db");

const createDonation = async (data) => {
    const sql = getSql();
    const rows = await sql`
        insert into donations (kind, description, location, contact, status, owner_id)
        values (${data.kind}, ${data.description}, ${data.location}, ${data.contact}, ${data.status || 'available'}, ${data.ownerId})
        returning id
    `;
    return String(rows[0].id);
};

const listDonations = async (filters = {}) => {
    const sql = getSql();
    const where = [];
    if (filters.kind) where.push(sql`d.kind = ${filters.kind}`);
    if (filters.status) where.push(sql`d.status = ${filters.status}`);
    if (filters.ownerId) where.push(sql`d.owner_id = ${filters.ownerId}`);
    const rows = await sql`
        select d.*, u.username as owner_username, u.name as owner_name
        from donations d
        left join users u on u.id = d.owner_id
        ${where.length ? sql`where ${sql.join(where, sql` and `)}` : sql``}
        order by d.created_at desc
    `;
    return rows.map((r) => ({
        id: String(r.id),
        kind: r.kind,
        description: r.description,
        location: r.location,
        contact: r.contact,
        status: r.status,
        ownerId: r.owner_id
            ? { username: r.owner_username, name: r.owner_name }
            : null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
};

const updateDonationStatus = async (id, status) => {
    const sql = getSql();
    const rows = await sql`
        update donations set status = ${status}, updated_at = now() where id = ${id} returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const updateDonation = async (id, ownerId, updates) => {
    const sql = getSql();
    const allowed = ["kind", "description", "location", "contact", "status"];
    const sets = [];
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(updates || {}, key)) {
            sets.push(sql([`${key} = `], [updates[key]]));
        }
    }
    if (!sets.length) return undefined;
    const rows = await sql`
        update donations set ${sql.join(sets, sql`, `)}, updated_at = now()
        where id = ${id} and owner_id = ${ownerId}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const deleteDonation = async (id, ownerId) => {
    const sql = getSql();
    const rows = await sql`delete from donations where id = ${id} and owner_id = ${ownerId} returning id`;
    return rows.length > 0;
};

module.exports = {
    createDonation,
    listDonations,
    updateDonationStatus,
    updateDonation,
    deleteDonation,
};
