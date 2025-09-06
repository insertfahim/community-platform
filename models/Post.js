const { getSql } = require("../config/db");

const createPost = async (postData) => {
    const sql = getSql();
    const rows = await sql`
        insert into posts (type, title, description, category, priority, location, contact_info, owner_id, status)
        values (${postData.type || "request"}, ${postData.title}, ${postData.description}, ${postData.category}, ${postData.priority}, ${postData.location}, ${postData.contact_info}, ${postData.ownerId || null}, ${postData.status || "active"})
        returning id
    `;
    return String(rows[0].id);
};

const listPosts = async ({ category, type, status, ownerId }) => {
    const sql = getSql();
    const conditions = [];
    const params = [];
    if (category) {
        params.push(category);
        conditions.push(`p.category = $${params.length}`);
    }
    if (type) {
        params.push(type);
        conditions.push(`p.type = $${params.length}`);
    }
    if (status) {
        params.push(status);
        conditions.push(`p.status = $${params.length}`);
    }
    if (ownerId) {
        params.push(ownerId);
        conditions.push(`p.owner_id = $${params.length}`);
    }
    const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
    const query = `
        select p.*, u.username as owner_username, u.name as owner_name
        from posts p
        left join users u on u.id = p.owner_id
        ${whereClause}
        order by p.created_at desc
    `;
    const rows = await sql(query, params);
    return rows.map((r) => ({
        id: String(r.id),
        type: r.type,
        title: r.title,
        description: r.description,
        category: r.category,
        priority: r.priority,
        location: r.location,
        contact_info: r.contact_info,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        ownerId: r.owner_id
            ? { username: r.owner_username, name: r.owner_name }
            : null,
    }));
};

const updatePostStatus = async (id, status) => {
    const sql = getSql();
    const rows = await sql`
        update posts set status = ${status}, updated_at = now()
        where id = ${id}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const getPostById = async (id) => {
    const sql = getSql();
    const rows = await sql`select * from posts where id = ${id} limit 1`;
    if (!rows[0]) return undefined;
    const r = rows[0];
    return {
        id: String(r.id),
        type: r.type,
        title: r.title,
        description: r.description,
        category: r.category,
        priority: r.priority,
        location: r.location,
        contact_info: r.contact_info,
        ownerId: r.owner_id,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
};

const updatePostFields = async (id, updates) => {
    const sql = getSql();
    const allowed = [
        "title",
        "description",
        "category",
        "priority",
        "location",
        "contact_info",
        "type",
        "status",
    ];
    const sets = [];
    const params = [];
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const col = key; // same column names
            params.push(updates[key]);
            sets.push(`${col} = $${params.length}`);
        }
    }
    if (!sets.length) return undefined;
    params.push(id);
    const query = `
        update posts
        set ${sets.join(", ")}, updated_at = now()
        where id = $${params.length}
        returning id
    `;
    const rows = await sql(query, params);
    return rows.length ? String(rows[0].id) : undefined;
};

const deletePostById = async (id) => {
    const sql = getSql();
    const rows = await sql`delete from posts where id = ${id} returning id`;
    return rows.length > 0;
};

module.exports = {
    createPost,
    listPosts,
    updatePostStatus,
    getPostById,
    updatePostFields,
    deletePostById,
};
