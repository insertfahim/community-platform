const crypto = require("crypto");
const { getSql } = require("../config/db");

const base64UrlEncode = (inputBuffer) =>
    inputBuffer
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

const hashPassword = (password) => {
    if (!password) {
        throw new Error("Password is required for hashing");
    }
    const salt = crypto.randomBytes(16);
    const iterations = 120000;
    const key = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    return `v1$${base64UrlEncode(salt)}$${iterations}$${base64UrlEncode(key)}`;
};

const verifyPassword = (password, stored) => {
    if (!stored || typeof stored !== "string") return false;
    const parts = stored.split("$");
    // Modern hashed format
    if (parts.length === 4 && parts[0] === "v1") {
        const salt = Buffer.from(
            parts[1].replace(/-/g, "+").replace(/_/g, "/"),
            "base64"
        );
        const iterations = parseInt(parts[2], 10);
        const expected = parts[3];
        const key = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
        const computed = base64UrlEncode(key);
        return crypto.timingSafeEqual(
            Buffer.from(computed),
            Buffer.from(expected)
        );
    }
    // Legacy plain-text fallback (for older databases)
    if (typeof password !== "string") return false;
    const a = Buffer.from(password, "utf8");
    const b = Buffer.from(stored, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

function mapUserRow(row) {
    if (!row) return undefined;
    return {
        id: String(row.id),
        name: row.name,
        username: row.username,
        email: row.email,
        password: row.password,
        role: row.role,
        isVolunteer: row.is_volunteer,
        isVolunteerVerified: row.is_volunteer_verified,
        volunteerStatus: row.volunteer_status || "pending", // pending, approved, rejected, hold
        volunteerProfile: row.volunteer_profile || null,
        volunteerRequestedAt: row.volunteer_requested_at || null,
        volunteerVerifiedAt: row.volunteer_verified_at || null,
        volunteerRejectedAt: row.volunteer_rejected_at || null,
        volunteerHeldAt: row.volunteer_held_at || null,
        volunteerRejectionReason: row.volunteer_rejection_reason || null,
        volunteerAdminNotes: row.volunteer_admin_notes || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

const findUserByEmail = async (email) => {
    const sql = getSql();
    const rows = await sql`select * from users where email = ${email} limit 1`;
    return mapUserRow(rows[0]);
};

async function generateUniqueUsername(base) {
    const cleaned = (base || "user")
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_.]+|[-_.]+$/g, "");
    let candidate = cleaned || "user";
    let n = 0;
    // Try with suffixes until unique
    // Limit attempts to avoid infinite loop
    const sql = getSql();
    for (let i = 0; i < 100; i += 1) {
        const probe = n === 0 ? candidate : `${candidate}${n}`;
        // eslint-disable-next-line no-await-in-loop
        const rows =
            await sql`select 1 from users where username = ${probe} limit 1`;
        if (!rows.length) return probe;
        n += 1;
    }
    // Fallback with random suffix
    return `${candidate}${Date.now().toString(36).slice(-4)}`;
}

const createUser = async ({ name, email, password }) => {
    const sql = getSql();
    const hashed = hashPassword(password);
    const baseFromEmail = (email || "").split("@")[0] || name || "user";
    const username = await generateUniqueUsername(baseFromEmail);
    const rows = await sql`
        insert into users (name, email, username, password)
        values (${name}, ${email}, ${username}, ${hashed})
        returning id
    `;
    return String(rows[0].id);
};

const findUserById = async (id) => {
    const sql = getSql();
    const rows = await sql`select * from users where id = ${id} limit 1`;
    return mapUserRow(rows[0]);
};

const requestVolunteer = async (userId) => {
    const sql = getSql();
    const rows = await sql`
        update users
        set is_volunteer = true,
            is_volunteer_verified = false,
            volunteer_status = 'pending',
            volunteer_requested_at = now(),
            volunteer_rejected_at = null,
            volunteer_held_at = null,
            volunteer_rejection_reason = null,
            updated_at = now()
        where id = ${userId}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const verifyVolunteer = async (userId, verified, opts = {}) => {
    const sql = getSql();
    if (verified) {
        const rows = await sql`
            update users
            set is_volunteer = true,
                is_volunteer_verified = true,
                volunteer_status = 'approved',
                volunteer_admin_notes = ${opts.adminNotes || null},
                volunteer_verified_at = now(),
                volunteer_rejected_at = null,
                volunteer_held_at = null,
                volunteer_rejection_reason = null,
                updated_at = now()
            where id = ${userId}
            returning id
        `;
        return rows.length ? String(rows[0].id) : undefined;
    }
    const rows = await sql`
        update users
        set is_volunteer = true,
            is_volunteer_verified = false,
            volunteer_status = 'rejected',
            volunteer_admin_notes = ${opts.adminNotes || null},
            volunteer_verified_at = null,
            volunteer_rejected_at = now(),
            volunteer_held_at = null,
            volunteer_rejection_reason = ${opts.reason || ""},
            updated_at = now()
        where id = ${userId}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const approveVolunteer = async (userId, opts = {}) => {
    const sql = getSql();
    const rows = await sql`
        update users
        set is_volunteer = true,
            is_volunteer_verified = true,
            volunteer_status = 'approved',
            volunteer_admin_notes = ${opts.adminNotes || null},
            volunteer_verified_at = now(),
            volunteer_rejected_at = null,
            volunteer_held_at = null,
            volunteer_rejection_reason = null,
            updated_at = now()
        where id = ${userId}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const rejectVolunteer = async (userId, opts = {}) => {
    const sql = getSql();
    const rows = await sql`
        update users
        set is_volunteer = true,
            is_volunteer_verified = false,
            volunteer_status = 'rejected',
            volunteer_admin_notes = ${opts.adminNotes || null},
            volunteer_verified_at = null,
            volunteer_rejected_at = now(),
            volunteer_held_at = null,
            volunteer_rejection_reason = ${opts.reason || "No reason provided"},
            updated_at = now()
        where id = ${userId}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const holdVolunteer = async (userId, opts = {}) => {
    const sql = getSql();
    const rows = await sql`
        update users
        set is_volunteer = true,
            is_volunteer_verified = false,
            volunteer_status = 'hold',
            volunteer_admin_notes = ${opts.adminNotes || null},
            volunteer_verified_at = null,
            volunteer_rejected_at = null,
            volunteer_held_at = now(),
            volunteer_rejection_reason = null,
            updated_at = now()
        where id = ${userId}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const revokeVolunteer = async (userId, opts = {}) => {
    const sql = getSql();
    const rows = await sql`
        update users
        set is_volunteer = false,
            is_volunteer_verified = false,
            volunteer_status = 'revoked',
            volunteer_admin_notes = ${opts.adminNotes || null},
            volunteer_verified_at = null,
            volunteer_rejected_at = null,
            volunteer_held_at = null,
            volunteer_rejection_reason = ${
                opts.reason || "Volunteer status revoked"
            },
            updated_at = now()
        where id = ${userId}
        returning id
    `;
    return rows.length ? String(rows[0].id) : undefined;
};

const listVolunteers = async (filters = {}) => {
    const sql = getSql();
    const conditions = ["is_volunteer = true"];
    const params = [];
    if (typeof filters.verified === "boolean") {
        params.push(filters.verified);
        conditions.push(`is_volunteer_verified = $${params.length}`);
    }
    if (filters.location) {
        params.push(`%${String(filters.location)}%`);
        conditions.push(
            `coalesce(volunteer_profile->>'location','') ilike $${params.length}`
        );
    }
    if (
        filters.skills &&
        Array.isArray(filters.skills) &&
        filters.skills.length
    ) {
        params.push(filters.skills);
        conditions.push(`exists (
            select 1 from jsonb_array_elements_text(coalesce(volunteer_profile->'skills','[]'::jsonb)) s
            where s = any($${params.length})
        )`);
    }
    if (filters.q) {
        params.push(`%${String(filters.q)}%`);
        const qIndex = params.length;
        conditions.push(`(
            name ilike $${qIndex} or username ilike $${qIndex} or
            coalesce(volunteer_profile->>'bio','') ilike $${qIndex} or
            exists (
               select 1 from jsonb_array_elements_text(coalesce(volunteer_profile->'skills','[]'::jsonb)) s where s ilike $${qIndex}
            ) or
            exists (
               select 1 from jsonb_array_elements_text(coalesce(volunteer_profile->'roles','[]'::jsonb)) r where r ilike $${qIndex}
            )
        )`);
    }
    const whereClause = conditions.length
        ? `where ${conditions.join(" and ")}`
        : "";
    const query = `
        select id, name, username, is_volunteer_verified, created_at, volunteer_profile
        from users
        ${whereClause}
        order by is_volunteer_verified desc, created_at desc
    `;
    const rows = await sql(query, params);
    return rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        username: r.username,
        isVolunteerVerified: r.is_volunteer_verified,
        created_at: r.created_at,
        volunteerProfile: r.volunteer_profile || {},
    }));
};

const upsertVolunteerProfile = async (userId, profile) => {
    const sql = getSql();
    const allowed = [
        "bio",
        "skills",
        "availability",
        "location",
        "languages",
        "phone",
        "hoursPerWeek",
        "experienceYears",
        "roles",
        "certifications",
    ];
    const safe = {};
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(profile || {}, key)) {
            safe[key] = profile[key];
        }
    }
    const json = JSON.stringify(safe);
    const query = `
        update users
        set volunteer_profile = coalesce(volunteer_profile, '{}'::jsonb) || $1::jsonb,
            is_volunteer = true,
            is_volunteer_verified = false,
            volunteer_status = 'pending',
            volunteer_requested_at = $2,
            volunteer_rejected_at = null,
            volunteer_held_at = null,
            volunteer_rejection_reason = null,
            updated_at = now()
        where id = $3
        returning id
    `;
    const rows = await sql(query, [json, new Date(), userId]);
    return rows.length ? String(rows[0].id) : undefined;
};

const listVolunteerRequests = async () => {
    const sql = getSql();
    const rows = await sql`
        select id, name, email, username, volunteer_requested_at, volunteer_profile,
               volunteer_rejection_reason, volunteer_admin_notes, volunteer_status,
               volunteer_verified_at, volunteer_rejected_at, volunteer_held_at
        from users
        where is_volunteer = true and volunteer_status in ('pending', 'hold')
        order by volunteer_requested_at desc nulls last
    `;
    return rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        username: r.username,
        volunteerRequestedAt: r.volunteer_requested_at,
        volunteerProfile: r.volunteer_profile || {},
        volunteerRejectionReason: r.volunteer_rejection_reason || null,
        volunteerAdminNotes: r.volunteer_admin_notes || null,
        volunteerStatus: r.volunteer_status || "pending",
        volunteerVerifiedAt: r.volunteer_verified_at,
        volunteerRejectedAt: r.volunteer_rejected_at,
        volunteerHeldAt: r.volunteer_held_at,
    }));
};

const listVolunteersByStatus = async (status = null) => {
    const sql = getSql();
    let query;
    let params = [];

    if (status) {
        query = `
            select id, name, email, username, volunteer_requested_at, volunteer_profile,
                   volunteer_rejection_reason, volunteer_admin_notes, volunteer_status,
                   volunteer_verified_at, volunteer_rejected_at, volunteer_held_at,
                   is_volunteer_verified, created_at
            from users
            where is_volunteer = true and volunteer_status = $1
            order by 
                case 
                    when volunteer_status = 'approved' then volunteer_verified_at
                    when volunteer_status = 'rejected' then volunteer_rejected_at
                    when volunteer_status = 'hold' then volunteer_held_at
                    else volunteer_requested_at
                end desc nulls last
        `;
        params = [status];
    } else {
        query = `
            select id, name, email, username, volunteer_requested_at, volunteer_profile,
                   volunteer_rejection_reason, volunteer_admin_notes, volunteer_status,
                   volunteer_verified_at, volunteer_rejected_at, volunteer_held_at,
                   is_volunteer_verified, created_at
            from users
            where is_volunteer = true
            order by volunteer_status, volunteer_requested_at desc nulls last
        `;
    }

    const rows = await sql(query, params);
    return rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        username: r.username,
        volunteerRequestedAt: r.volunteer_requested_at,
        volunteerProfile: r.volunteer_profile || {},
        volunteerRejectionReason: r.volunteer_rejection_reason || null,
        volunteerAdminNotes: r.volunteer_admin_notes || null,
        volunteerStatus: r.volunteer_status || "pending",
        volunteerVerifiedAt: r.volunteer_verified_at,
        volunteerRejectedAt: r.volunteer_rejected_at,
        volunteerHeldAt: r.volunteer_held_at,
        isVolunteerVerified: r.is_volunteer_verified,
        createdAt: r.created_at,
    }));
};

module.exports = {
    findUserByEmail,
    createUser,
    findUserById,
    hashPassword,
    verifyPassword,
    requestVolunteer,
    verifyVolunteer,
    approveVolunteer,
    rejectVolunteer,
    holdVolunteer,
    revokeVolunteer,
    listVolunteers,
    upsertVolunteerProfile,
    listVolunteerRequests,
    listVolunteersByStatus,
    generateUniqueUsername,
    // finder by username (kept for potential cross-feature references)
    findUserByUsername: async (username) => {
        const sql = getSql();
        const rows =
            await sql`select * from users where username = ${username} limit 1`;
        return mapUserRow(rows[0]);
    },
};
